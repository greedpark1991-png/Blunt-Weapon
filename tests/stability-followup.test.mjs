import assert from 'node:assert/strict';
import { LOFT_BOUNDS, LOFT_COLLIDERS, LOFT_ZONES, LOFT_INTERACTION_POINTS, LOFT_STATIONS, INTERACTION_POINTS } from '../src/data/GameData.js';
import { WorldSystem } from '../src/systems/WorldSystem.js';
import { Player } from '../src/entities/Player.js';
import { GameScene } from '../src/scenes/GameScene.js';

const loftWorld=new WorldSystem({bounds:LOFT_BOUNDS,colliders:LOFT_COLLIDERS,zones:LOFT_ZONES});
for(const [id,p] of Object.entries(LOFT_INTERACTION_POINTS)) assert.ok(loftWorld.isWalkable(p.x,p.y,null,7),`${id} loft interaction point must be walkable`);
for(const c of LOFT_COLLIDERS) assert.ok(!loftWorld.isWalkable(c.x+c.w/2,c.y+c.h/2,null,7),`${c.id} loft footprint must be solid`);

// Direct movement may approach furniture but never pass through it or the loft walls.
const p=new Player('younger',320,310);
for(let i=0;i<200;i++)loftWorld.moveEntity(p,-2.3,-2.1,null,7);
assert.ok(p.x>=LOFT_BOUNDS.left+7&&p.y>=LOFT_BOUNDS.top+7,'loft world bounds must hold');
assert.ok(loftWorld.isWalkable(p.x,p.y,null,7),'player must remain on walkable loft floor');

// Pathing to each useful loft interaction point remains valid around furniture.
for(const [id,target] of Object.entries(LOFT_INTERACTION_POINTS)){
  const path=loftWorld.findPath({x:320,y:304},target,null,7);
  assert.ok(path.length,`${id} needs a loft path`);
  assert.ok(path.every(pt=>loftWorld.isWalkable(pt.x,pt.y,null,7)),`${id} path must remain walkable`);
}

const input={click:null,hit(){return false;},down(){return false;}};
const sound={coin(){},door(){},fire(){},hammer(){},complete(){},perfect(){},tone(){},ensure(){},setDucked(){},startBGM(){},setBGMVolume(){},setSFXVolume(){},muteBGM(){},muteSFX(){},bgmVolume:.65,sfxVolume:.8,bgmMuted:false,sfxMuted:false};
const game={input,sound,scenes:{set(){}}};
const s=new GameScene(game,{newGame:true});s.init();s.ui.choose(0);s.ui.choose(0);
assert.equal(s.floor,'loft');
assert.ok(s.loftWorld.isWalkable(s.controlledPlayer().x,s.controlledPlayer().y,null,7));
// Up/down landing points are separated from their respective stair interactions.
s.goDownstairs();assert.equal(s.floor,'shop');assert.ok(Math.hypot(s.controlledPlayer().x-INTERACTION_POINTS.stairs.x,s.controlledPlayer().y-INTERACTION_POINTS.stairs.y)>55);
s.stairCooldown=0;s.goUpstairs();assert.equal(s.floor,'loft');assert.ok(s.loftWorld.isWalkable(s.controlledPlayer().x,s.controlledPlayer().y,null,7));assert.ok(Math.hypot(s.controlledPlayer().x-LOFT_INTERACTION_POINTS.stairsDown.x,s.controlledPlayer().y-LOFT_INTERACTION_POINTS.stairsDown.y)>28);

// Loft beds stay on opposite sides and no longer form a center hotel aisle.
assert.ok(LOFT_STATIONS.olderBed.x<120&&LOFT_STATIONS.youngerBed.x>400);
console.log('✓ V0.2.5b loft collision/landing/compact-tracker regression tests passed');
