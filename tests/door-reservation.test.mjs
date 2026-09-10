import assert from 'node:assert/strict';
import { DoorReservationSystem } from '../src/systems/DoorReservationSystem.js';
import { CustomerSystem } from '../src/systems/CustomerSystem.js';
import { WorldSystem } from '../src/systems/WorldSystem.js';
import { DOOR_FLOW } from '../src/data/GameData.js';

const door=new DoorReservationSystem();
assert.equal(door.request('customer-1','in'),true);assert.equal(door.request('merchant','in'),false);assert.equal(door.request('customer-2','in'),false);assert.equal(door.holder,'customer-1');assert.notDeepEqual(door.waitPoint('merchant','in'),door.waitPoint('customer-2','in'));
door.release('customer-1');assert.equal(door.request('merchant','in'),true);assert.equal(door.holder,'merchant');door.release('merchant');assert.equal(door.request('customer-2','in'),true);door.release('customer-2');assert.equal(door.holder,null);

// Three visitors serialize through one shared door and all reach the shop.
const q=new DoorReservationSystem(),world=new WorldSystem(),cs=new CustomerSystem(9,{},null);
for(let i=0;i<3;i++)cs.spawn({type:'villager',name:`손님${i}`,customerId:`v${i}`,mode:'direct',itemId:'dagger',preferences:['dagger'],budget:2,patience:999,line:''},700);
const entered=new Set();
for(let frame=0;frame<1800&&entered.size<3;frame++){
  const ev=cs.update(1/60,{minute:700,open:false,world,reputation:0,door:q});for(const e of ev)if(e.type==='entered')entered.add(e.visitor.id);
  const inDoor=cs.visitors.filter(v=>v.doorPhase==='door');assert.ok(inDoor.length<=1,'only one NPC may own door traversal at once');
}
assert.equal(entered.size,3);assert.equal(q.holder,null);assert.ok(cs.visitors.every(v=>v.y<DOOR_FLOW.outsideWait.y));

// Saved transient door phases are sanitized so a fresh reservation cannot be bypassed after load.
const savedCs=new CustomerSystem(9,{}, {visitors:[{id:'saved-in',name:'저장 손님',status:'entering',doorPhase:'door',x:590,y:320,targetX:438,targetY:232,mode:'direct',patience:999},{id:'saved-out',name:'퇴장 손님',status:'leaving',doorPhase:'exitDoor',x:580,y:296,targetX:580,targetY:296,mode:'direct',patience:999}]});
assert.equal(savedCs.visitors[0].doorPhase,'wait');assert.equal(savedCs.visitors[1].doorPhase,'exitWait');

console.log('✓ V0.2.5f door reservation/entry queue tests passed');
