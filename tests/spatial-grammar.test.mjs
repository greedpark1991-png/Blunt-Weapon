import assert from 'node:assert/strict';
import { STATIONS, SHOP_COLLIDERS, SHOP_DEPTHS, SHOP_LABELS, INTERACTIONS, INTERACTION_POINTS, SHOP_BOUNDS, SHOP_ZONES, LOFT_STATIONS, LOFT_COLLIDERS, LOFT_INTERACTIONS, LOFT_INTERACTION_POINTS, LOFT_BOUNDS, LOFT_ZONES, LOFT_DEPTHS } from '../src/data/GameData.js';
import { WorldSystem } from '../src/systems/WorldSystem.js';
import { GameScene } from '../src/scenes/GameScene.js';
import { getShopDrawables, getLoftDrawables } from '../src/utils/render.js';

const world=new WorldSystem({bounds:SHOP_BOUNDS,colliders:SHOP_COLLIDERS,zones:SHOP_ZONES});
const loftWorld=new WorldSystem({bounds:LOFT_BOUNDS,colliders:LOFT_COLLIDERS,zones:LOFT_ZONES});

// Spatial grammar: fixed floor footprints block, but dedicated use points remain walkable.
for(const c of SHOP_COLLIDERS)assert.equal(world.isWalkable(c.x+c.w/2,c.y+c.h/2,null,7),false,`${c.id} footprint must be solid`);
for(const [id,p] of Object.entries(INTERACTION_POINTS))assert.ok(world.isWalkable(p.x,p.y,null,7),`${id} use point must stay outside collider`);
for(const c of LOFT_COLLIDERS)assert.equal(loftWorld.isWalkable(c.x+c.w/2,c.y+c.h/2,null,7),false,`${c.id} loft footprint must be solid`);
for(const [id,p] of Object.entries(LOFT_INTERACTION_POINTS))assert.ok(loftWorld.isWalkable(p.x,p.y,null,7),`${id} loft use point must stay walkable`);

// Hot-work line must read as one wall-hugging line, not isolated island furniture.
for(const id of ['fuel','forge','anvil','water'])assert.ok(STATIONS[id].y<=126,`${id} sprite should visually touch the north-wall seam`);
const hotBottoms=['fuel','forge','anvil','water'].map(id=>{const c=SHOP_COLLIDERS.find(x=>x.id===id);return c.y+c.h;});
assert.ok(Math.max(...hotBottoms)-Math.min(...hotBottoms)<=8,'hot-work footprints must share a consistent floor line');

// Grindstone/counter lane must have real circulation and distinct use points.
const grind=SHOP_COLLIDERS.find(c=>c.id==='grind'), top=SHOP_COLLIDERS.find(c=>c.id==='counterTop');
assert.ok(grind.x+grind.w+18<top.x,'grindstone and counter require a clear passage gap');
assert.ok(world.findPath(INTERACTION_POINTS.grind,INTERACTION_POINTS.counter,null,7).length>0,'grind→counter lane must be navigable');
assert.ok(Math.hypot(INTERACTION_POINTS.broom.x-INTERACTION_POINTS.grind.x,INTERACTION_POINTS.broom.y-INTERACTION_POINTS.grind.y)>INTERACTIONS.broom.radius+INTERACTIONS.grind.radius,'broom pickup radius must not steal grindstone E');
assert.ok(Math.hypot(INTERACTION_POINTS.broom.x-INTERACTION_POINTS.counter.x,INTERACTION_POINTS.broom.y-INTERACTION_POINTS.counter.y)>INTERACTIONS.broom.radius+INTERACTIONS.counter.radius,'broom pickup radius must not steal counter E');

// Counter has one staff-side gap and cannot be crossed through its boards.
assert.ok(world.findPath({x:388,y:304},INTERACTION_POINTS.counter,null,7).length>0,'staff side must have an entry route to the counter use point');
const leg=SHOP_COLLIDERS.find(c=>c.id==='counterLeg');assert.ok(!world.isWalkable(leg.x+leg.w/2,leg.y+leg.h/2,null,7));
assert.ok(world.findPath({x:590,y:318},{x:438,y:232},'CUSTOMER_ZONE',6).length>0,'customer door→counter public route must work');

// Interaction resolver must return the local object, not a distant high-priority prop.
const noInput={click:null,hit(){return false;},down(){return false;}};
const sound={coin(){},door(){},fire(){},hammer(){},complete(){},perfect(){},tone(){},ensure(){},setDucked(){},startBGM(){},setBGMVolume(){},setSFXVolume(){},muteBGM(){},muteSFX(){},bgmVolume:.65,sfxVolume:.8,bgmMuted:false,sfxMuted:false};
const scene=new GameScene({input:noInput,sound,scenes:{set(){}}},{newGame:true});
scene.players.younger.x=INTERACTION_POINTS.grind.x;scene.players.younger.y=INTERACTION_POINTS.grind.y;scene.controlled='younger';scene.floor='shop';assert.equal(scene.nearestInteraction(INTERACTIONS,STATIONS)?.id,'grind');
scene.players.younger.x=INTERACTION_POINTS.broom.x;scene.players.younger.y=INTERACTION_POINTS.broom.y;assert.equal(scene.nearestInteraction(INTERACTIONS,STATIONS)?.id,'broom');
scene.players.younger.x=INTERACTION_POINTS.counter.x;scene.players.younger.y=INTERACTION_POINTS.counter.y;assert.equal(scene.nearestInteraction(INTERACTIONS,STATIONS)?.id,'counter');

// BaseY depth contract: sprite centers never drive occlusion order.
const dummy={fillRect(){},beginPath(){},arc(){},fill(){},stroke(){},moveTo(){},lineTo(){},save(){},restore(){},translate(){},rotate(){},fillText(){},strokeRect(){},createRadialGradient(){return{addColorStop(){}}}};
const shopDraw=Object.fromEntries(getShopDrawables(dummy,0,{shopOpen:false}).map(d=>[d.id,d.baseY]));
assert.equal(shopDraw.forge,SHOP_DEPTHS.forge);assert.equal(shopDraw.forge,SHOP_COLLIDERS.find(c=>c.id==='forge').y+SHOP_COLLIDERS.find(c=>c.id==='forge').h);assert.equal(shopDraw.grind,SHOP_DEPTHS.grind);assert.equal(shopDraw['counter-top'],SHOP_DEPTHS.counterTop);
const actorBehind=SHOP_DEPTHS.anvil-1,actorFront=SHOP_DEPTHS.anvil+1;assert.ok(actorBehind<SHOP_DEPTHS.anvil&&actorFront>SHOP_DEPTHS.anvil,'foot-Y naturally sorts actor behind/front around object baseY');
const loftDraw=Object.fromEntries(getLoftDrawables(dummy,0).map(d=>[d.id,d.baseY]));assert.equal(loftDraw['older-bed'],LOFT_DEPTHS.olderBed);assert.equal(loftDraw.table,LOFT_DEPTHS.table);

// 2F: vertical wall-side personal beds + shared center, without inn-room symmetry.
assert.ok(LOFT_STATIONS.olderBed.h>LOFT_STATIONS.olderBed.w&&LOFT_STATIONS.youngerBed.h>LOFT_STATIONS.youngerBed.w,'beds should use wall-hugging vertical grammar');
assert.ok(LOFT_STATIONS.olderBed.x<90&&LOFT_STATIONS.youngerBed.x>500,'beds must live on opposite walls');
assert.ok(world.isWalkable(INTERACTION_POINTS.storage.x,INTERACTION_POINTS.storage.y,null,7));

// Label policy: small floor props and lower congestion objects rely on proximity prompt.
for(const id of ['sign','door','storage','counter'])assert.equal(SHOP_LABELS[id],undefined,`${id} should not add a permanent collision-prone label`);

// Alert marker is a real 16px plate with an outlined !, not a tiny bare glyph.
let boxes=0,bang=false;const markerCtx={save(){},restore(){},fillRect(x,y,w,h){if(w>=12&&h>=12)boxes++;},fillText(t){if(t==='!')bang=true;},set fillStyle(v){},set font(v){},set textAlign(v){},set textBaseline(v){}};
scene.renderAlertMarker(markerCtx,{x:300,y:220});assert.ok(boxes>=2&&bang,'alert marker should render a visible pixel plate plus !');

console.log('✓ V0.2.5e spatial grammar/depth/interaction tests passed');
