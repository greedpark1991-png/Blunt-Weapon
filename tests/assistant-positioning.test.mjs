import assert from 'node:assert/strict';
import { WorldSystem } from '../src/systems/WorldSystem.js';
import { BrotherWorkSystem } from '../src/systems/BrotherWorkSystem.js';
import { Inventory } from '../src/systems/Inventory.js';
import { Player } from '../src/entities/Player.js';
import { GameScene } from '../src/scenes/GameScene.js';
import { PLAYER_INTERACTION_POINTS, ASSIST_POINTS, STORAGE_DELIVERY_POINT, NPC_PARKING_POINTS, LOFT_PROPS, LOFT_COLLIDERS, LOFT_DEPTHS, LOFT_STATIONS } from '../src/data/GameData.js';

const world=new WorldSystem();
for(const id of ['forge','anvil','water','grind','bench']){
  const p=PLAYER_INTERACTION_POINTS[id],a=ASSIST_POINTS[id];
  assert.ok(p&&a,`${id} needs player and assist points`);
  assert.ok(Math.hypot(p.x-a.x,p.y-a.y)>14,`${id} player/assist points must not overlap`);
  assert.ok(world.isWalkable(p.x,p.y,null,7),`${id} player point walkable`);
  assert.ok(world.isWalkable(a.x,a.y,null,7),`${id} assist point walkable`);
}
assert.ok(world.isWalkable(STORAGE_DELIVERY_POINT.x,STORAGE_DELIVERY_POINT.y,null,7));


// During direct crafting, role assistants follow the current compatible station's ASSIST_POINT.
const noInput={click:null,wheel:0,hit(){return false;},down(){return false;}};
const sound={coin(){},door(){},fire(){},hammer(){},complete(){},perfect(){},tone(){},ensure(){},setDucked(){},startBGM(){},setBGMVolume(){},setSFXVolume(){},muteBGM(){},muteSFX(){},bgmVolume:.65,sfxVolume:.8,bgmMuted:false,sfxMuted:false};
const scene=new GameScene({input:noInput,sound,scenes:{set(){}}},{newGame:true});scene.ui.modal=null;scene.floor='shop';scene.controlled='younger';scene.playerFloors.younger='shop';scene.playerFloors.older='shop';
scene.maintenance.assign('older','forge');scene.brotherWork.assignRole('older','forge');assert.equal(scene.crafting.begin('sword','younger',scene.inventory).ok,true);scene.crafting.active.stageIndex=1;scene.syncAssistantTargets();assert.equal(scene.brotherWork.task('older').stationId,'anvil');scene.crafting.active.stageIndex=2;scene.syncAssistantTargets();assert.equal(scene.brotherWork.task('older').stationId,'water');
scene.crafting.active=null;scene.brotherWork.cancel('older');scene.maintenance.assign('younger','grind');scene.brotherWork.assignRole('younger','grind');scene.controlled='older';scene.crafting.active={itemId:'shield',workerId:'older',stageIndex:3,scores:[],perfectStages:0};scene.syncAssistantTargets();assert.equal(scene.brotherWork.task('younger').stationId,'bench');

// Auto craft: deliver, then immediately vacate storage and park.
const inv=new Inventory({materials:{iron:50,wood:50,leather:20},items:[]});
const workers={older:new Player('older',336,300),younger:new Player('younger',372,300)};
const work=new BrotherWorkSystem();
assert.equal(work.assignCraft('older','shield',inv).ok,true);
let delivered=false,returned=false;
for(let i=0;i<12000&&!returned;i++){
  const ev=work.update(1/60,workers,world);
  if(ev.some(x=>x.type==='craftDelivered'))delivered=true;
  if(ev.some(x=>x.type==='returnedToParking'))returned=true;
}
assert.equal(delivered,true);assert.equal(returned,true);assert.equal(work.busy('older'),false);
assert.ok(Math.hypot(workers.older.x-NPC_PARKING_POINTS.storageOlder.x,workers.older.y-NPC_PARKING_POINTS.storageOlder.y)<8);
assert.ok(Math.hypot(workers.older.x-STORAGE_DELIVERY_POINT.x,workers.older.y-STORAGE_DELIVERY_POINT.y)>120,'worker must vacate storage front');

// 2F chests are floor furniture, not wall decals, and keep space from beds.
assert.ok(LOFT_PROPS.olderChest.y>=160&&LOFT_PROPS.youngerChest.y>=160);
for(const id of ['olderChest','youngerChest']){const c=LOFT_COLLIDERS.find(x=>x.id===id);assert.ok(c);assert.equal(LOFT_DEPTHS[id],c.y+c.h);}
assert.ok(LOFT_PROPS.olderChest.x>LOFT_STATIONS.olderBed.x+LOFT_STATIONS.olderBed.w+10);
assert.ok(LOFT_PROPS.youngerChest.x+LOFT_PROPS.youngerChest.w<LOFT_STATIONS.youngerBed.x-10);

console.log('✓ V0.2.5f assistant positioning/delivery/loft furniture tests passed');
