import assert from 'node:assert/strict';
import { STATIONS, SHOP_COLLIDERS, INTERACTION_POINTS, LOFT_STATIONS, LOFT_INTERACTION_POINTS, LOFT_BOUNDS, LOFT_COLLIDERS, LOFT_ZONES } from '../src/data/GameData.js';
import { WorldSystem } from '../src/systems/WorldSystem.js';
import { GameScene } from '../src/scenes/GameScene.js';

const input={click:null,hit(){return false;},down(){return false;}};
const sound={coin(){},door(){},fire(){},hammer(){},complete(){},perfect(){},tone(){},ensure(){},setDucked(){},startBGM(){},setBGMVolume(){},setSFXVolume(){},muteBGM(){},muteSFX(){},bgmVolume:.65,sfxVolume:.8,bgmMuted:false,sfxMuted:false};
const game={input,sound,scenes:{set(){}}};

// 1F arrangement: storage clears the central lane and the hot-work line hugs the north side.
assert.ok(STATIONS.storage.y>=265,'storage should be down in the lower-left service corner');
for(const id of ['fuel','forge','anvil','water'])assert.ok(STATIONS[id].y<=150,`${id} should stay near the north-wall work line`);
assert.ok(STATIONS.counter.x+STATIONS.counter.w < STATIONS.door.x,'counter must leave breathing room before the door');
const counterLeg=SHOP_COLLIDERS.find(c=>c.id==='counterLeg');
assert.ok(counterLeg.x >= STATIONS.counter.x+STATIONS.counter.w-40,'L-counter vertical leg must be on the right side');

// Every interaction point used by the new layout must still be reachable.
const world=new WorldSystem();
const loftWorld=new WorldSystem({bounds:LOFT_BOUNDS,colliders:LOFT_COLLIDERS,zones:LOFT_ZONES});
for(const [id,p] of Object.entries(LOFT_INTERACTION_POINTS))assert.ok(loftWorld.isWalkable(p.x,p.y,null,7),`${id} loft interaction point must be walkable`);
for(const id of ['stairs','fuel','forge','anvil','water','bench','storage','grind','display','counter','broom','sign','door']){
  const p=INTERACTION_POINTS[id];
  assert.ok(world.isWalkable(p.x,p.y,null,7),`${id} interaction point must be walkable`);
}

// 2F should read as two personal wall-side zones, with a shared table under the window and right-side landing.
assert.ok(LOFT_STATIONS.olderBed.x<100,'older bed should hug the left side');
assert.ok(LOFT_STATIONS.youngerBed.x>400,'younger bed should hug the right side');
assert.ok(Math.abs((LOFT_STATIONS.table.x+LOFT_STATIONS.table.w/2)-(LOFT_STATIONS.window.x+LOFT_STATIONS.window.w/2))<45,'shared table should sit under the window axis');
assert.ok(LOFT_STATIONS.stairsDown.x>480,'loft landing should be on the right to match the downstairs side-stair logic');

// Stair transfer should never drop the player back onto the interaction point.
const s=new GameScene(game,{newGame:true});
s.init();
s.ui.choose(0); // tutorial
s.ui.choose(0); // morning news
assert.equal(s.floor,'loft');
s.goDownstairs();
assert.equal(s.floor,'shop');
assert.ok(s.stairCooldown>=.3);
assert.ok(world.isWalkable(s.controlledPlayer().x,s.controlledPlayer().y,null,7));
assert.ok(Math.hypot(s.controlledPlayer().x-INTERACTION_POINTS.stairs.x,s.controlledPlayer().y-INTERACTION_POINTS.stairs.y)>55,'downstairs spawn must clear the stair trigger');
s.stairCooldown=0;
s.goUpstairs();
assert.equal(s.floor,'loft');
assert.ok(Math.hypot(s.controlledPlayer().x-LOFT_INTERACTION_POINTS.stairsDown.x,s.controlledPlayer().y-LOFT_INTERACTION_POINTS.stairsDown.y)>55,'upstairs spawn must clear the landing trigger');

// Merchant must visibly cross the door before settling inside.
s.stairCooldown=0;s.goDownstairs();
const visit=s.merchantSchedule()[0];s.time.minute=visit.start+1;s.updateMerchant(0);
assert.equal(s.merchantVisible,true);assert.equal(s.merchant.y,350);assert.equal(s.merchantArrived,false);
for(let i=0;i<300&&!s.merchantArrived;i++)s.updateMerchant(1/60);
assert.equal(s.merchantArrived,true,'merchant should finish walking through the door into the customer zone');
assert.ok(s.merchant.y<320,'merchant should finish inside the shop');

// Task tracker must point at the live craft station and advance with the crafting state.
s.openCraftMenu();s.ui.choose(0);s.ui.choose(1); // dagger / younger
let objective=s.currentObjective();
assert.equal(objective.target,'forge');assert.match(objective.current,/가열/);
while(s.crafting.active?.stageIndex===0)s.finishCraftStage(85,{perfectHits:0,stagePerfect:false});
objective=s.currentObjective();assert.equal(objective.target,'anvil');assert.match(objective.current,/성형/);

console.log('✓ V0.2.5e layout/stair/merchant/tracker tests passed');
