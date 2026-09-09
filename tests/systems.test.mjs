import assert from 'node:assert/strict';
import { Inventory } from '../src/systems/Inventory.js';
import { Economy } from '../src/systems/Economy.js';
import { CraftingSystem } from '../src/systems/CraftingSystem.js';
import { CustomerSystem } from '../src/systems/CustomerSystem.js';
import { EventSystem } from '../src/systems/EventSystem.js';
import { TimeSystem } from '../src/systems/TimeSystem.js';
import { DisplaySystem } from '../src/systems/DisplaySystem.js';
import { OrderSystem } from '../src/systems/OrderSystem.js';
import { MaintenanceSystem } from '../src/systems/MaintenanceSystem.js';
import { BrotherWorkSystem } from '../src/systems/BrotherWorkSystem.js';
import { WorldSystem } from '../src/systems/WorldSystem.js';
import { RenownSystem } from '../src/systems/RenownSystem.js';
import { Player } from '../src/entities/Player.js';
import { ITEMS, INTERACTION_POINTS, SHOP_COLLIDERS } from '../src/data/GameData.js';

const inv=new Inventory();
assert.deepEqual(inv.materials,{iron:8,wood:7,leather:3});
assert.equal(inv.canAfford(ITEMS.longsword),true);
assert.notDeepEqual(ITEMS.sword.stages.map(s=>s.id),ITEMS.shield.stages.map(s=>s.id));
assert.ok(ITEMS.bow.stages.every(s=>s.station==='bench'));
assert.ok(!ITEMS.shield.stages.some(s=>s.station==='grind'));
assert.equal(ITEMS.arrows.bundle,10);

const craft=new CraftingSystem();
assert.equal(craft.begin('shield','older',inv).ok,true);
assert.equal(inv.materials.iron,6);
let finished=null;
while(craft.active){const r=craft.stageDone(84,2);if(r?.done)finished=r;}
assert.ok(finished?.item);assert.equal(finished.item.itemId,'shield');assert.ok(['normal','excellent','master'].includes(finished.item.quality));

const time=new TimeSystem();time.update(60);assert.equal(Math.floor(time.minute),420);assert.equal(time.format(),'07:00');
const display=new DisplaySystem();assert.equal(display.place(finished.item),true);assert.equal(display.count(),1);assert.equal(display.take(0).uid,finished.item.uid);
const orders=new OrderSystem();const order=orders.accept({customerName:'테스트',itemId:'sword',day:1,minute:700});assert.equal(order.dueDay,2);assert.equal(orders.failOverdue(2,1000).length,0);assert.equal(orders.failOverdue(2,1100).length,1);

// V0.2.5 dirt zones: activity-driven dirt must stay on walkable floor and vary.
const world=new WorldSystem(),maintenance=new MaintenanceSystem({cleanliness:88,dirtSpots:[]});
const oldRandom=Math.random;let ri=0;const seq=[.03,.18,.37,.56,.74,.91,.25,.63,.42,.82,.11,.49];Math.random=()=>seq[(ri++)%seq.length];
maintenance.noteActivity('forge',4);maintenance.spawnDirt((x,y)=>world.isWalkable(x,y,null,6));maintenance.noteActivity('anvil',4);maintenance.spawnDirt((x,y)=>world.isWalkable(x,y,null,6));maintenance.noteActivity('customers',5);maintenance.spawnDirt((x,y)=>world.isWalkable(x,y,null,6));Math.random=oldRandom;
assert.ok(maintenance.dirtSpots.length>=2);assert.ok(new Set(maintenance.dirtSpots.map(x=>x.zone)).size>=2);assert.ok(maintenance.dirtSpots.every(p=>world.isWalkable(p.x,p.y,null,6)));

const events=new EventSystem({activeEvent:undefined});assert.equal(events.activeEvent.id,'goblins');
const eco=new Economy();const item={...finished.item,itemId:'sword',basePrice:ITEMS.sword.price,quality:'normal'};assert.ok(eco.priceFor(item,events.activeEvent)>ITEMS.sword.price);assert.ok(eco.materialPrice('iron',null,.8)<eco.materialPrice('iron',null));

// Collision and world bounds: furniture footprints and north wall are solid.
for(const ip of Object.values(INTERACTION_POINTS))assert.ok(world.isWalkable(ip.x,ip.y,null,7),`interaction point should be walkable: ${JSON.stringify(ip)}`);
const p=new Player('younger',174,220); // directly below forge interaction point
for(let i=0;i<90;i++)world.moveEntity(p,0,-3,null,7);
assert.ok(p.y>=207,'player must not enter forge footprint from below');
const wallP=new Player('younger',400,180);for(let i=0;i<100;i++)world.moveEntity(wallP,0,-5,null,7);assert.ok(wallP.y>=149,'north wall boundary must stop spider-man movement');
for(const c of SHOP_COLLIDERS)assert.ok(!world.isWalkable(c.x+c.w/2,c.y+c.h/2,null,7),`${c.id} footprint should block movement`);
const path=world.findPath({x:350,y:300},INTERACTION_POINTS.forge,null,7);assert.ok(path.length);assert.ok(path.every(pt=>world.isWalkable(pt.x,pt.y,null,7)));

// Brother jobs use paths and cannot get permanently stuck behind new layout.
const autoInv=new Inventory({materials:{iron:20,wood:20,leather:10},items:[]});
const workers={older:new Player('older',308,300),younger:new Player('younger',350,300)};const work=new BrotherWorkSystem();
for(const [worker,itemId] of [['older','shield'],['younger','sword']]){
  assert.equal(work.assignCraft(worker,itemId,autoInv).ok,true);let delivered=null;
  for(let i=0;i<5000&&!delivered;i++){const out=work.update(1/60,workers,world);delivered=out.find(x=>x.type==='craftDelivered')||null;}
  assert.ok(delivered?.item,`${worker} should complete ${itemId}`);assert.equal(work.busy(worker),false);
}
work.assignRole('younger','counter');for(let i=0;i<1000&&work.task('younger')?.state!=='WORKING';i++)work.update(1/60,workers,world);assert.equal(work.task('younger').state,'WORKING');

// Customer AI remains in customer zone and does not walk through counter furniture.
const cs=new CustomerSystem(1,{},null);const ev=cs.update(.1,{minute:780,open:true,event:events.activeEvent,patienceMultiplier:1,world,reputation:0});assert.ok(ev.some(e=>e.type==='spawn'&&e.visitor.knight));
for(let i=0;i<900;i++)cs.update(1/60,{minute:780,open:true,event:events.activeEvent,patienceMultiplier:1,world,reputation:0});
for(const v of cs.visitors)assert.ok(world.isWalkable(v.x,v.y,'CUSTOMER_ZONE',6),`customer ${v.name} must stay in customer zone`);

assert.equal(RenownSystem.tier(0).name,'무명의 대장간');assert.equal(RenownSystem.tier(10).name,'동네에서 소문난 대장간');assert.equal(RenownSystem.tier(25).name,'마을의 유명 대장간');assert.equal(RenownSystem.tier(120).name,'이름난 형제 대장장이');assert.ok(RenownSystem.specialPool(80).length>=3);

console.log('✓ V0.2.5 systems/collision/pathfinding tests passed');
