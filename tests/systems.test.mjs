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
import { Player } from '../src/entities/Player.js';
import { ITEMS } from '../src/data/GameData.js';

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
assert.ok(finished?.item);
assert.equal(finished.item.itemId,'shield');
assert.ok(['normal','excellent','master'].includes(finished.item.quality));

const time=new TimeSystem();time.update(60);assert.equal(Math.floor(time.minute),420);assert.equal(time.format(),'07:00');
const display=new DisplaySystem();assert.equal(display.place(finished.item),true);assert.equal(display.count(),1);assert.equal(display.take(0).uid,finished.item.uid);
const orders=new OrderSystem();const order=orders.accept({customerName:'테스트',itemId:'sword',day:1,minute:700});assert.equal(order.dueDay,2);assert.equal(orders.openOrders().length,1);assert.equal(orders.failOverdue(2,1000).length,0);assert.equal(orders.failOverdue(2,1100).length,1);
const maintenance=new MaintenanceSystem();maintenance.prepForge();assert.equal(maintenance.useForgeBoost(),5);maintenance.tuneGrind();assert.equal(maintenance.useGrindBoost(),5);const beforeClean=maintenance.cleanliness;maintenance.update(170);assert.ok(maintenance.cleanliness<=beforeClean);maintenance.clean();assert.equal(maintenance.dirtSpots.length,0);

const events=new EventSystem({activeEvent:undefined});assert.equal(events.activeEvent.id,'goblins');
const eco=new Economy();const item={...finished.item,itemId:'sword',basePrice:ITEMS.sword.price,quality:'normal'};assert.ok(eco.priceFor(item,events.activeEvent)>ITEMS.sword.price);
const fullIron=eco.materialPrice('iron',null);const saleIron=eco.materialPrice('iron',null,.8);assert.ok(saleIron<fullIron);

const cs=new CustomerSystem(1,{},null);const ev=cs.update(.1,{minute:780,open:true,event:events.activeEvent,patienceMultiplier:1});assert.ok(ev.some(e=>e.type==='spawn'&&e.visitor.knight));assert.ok(cs.activeCount()>=1);

// V0.2.1 brother task state machine: assigned craft must walk, work, deliver, and finish.
const autoInv=new Inventory({materials:{iron:8,wood:7,leather:3},items:[]});
const workers={older:new Player('older',300,300),younger:new Player('younger',340,300)};
const input={down(){return false;}};const work=new BrotherWorkSystem();
assert.equal(work.assignCraft('older','shield',autoInv).ok,true);
assert.equal(work.task('older').state,'GO_TO_WORKSTATION');
let delivered=null;
for(let i=0;i<1600&&!delivered;i++){
  const out=work.update(1/30,workers);workers.older.update(1/30,input,false);
  delivered=out.find(x=>x.type==='craftDelivered')||null;
}
assert.ok(delivered?.item,'auto worker should always complete and deliver');
assert.equal(delivered.item.itemId,'shield');
assert.equal(work.busy('older'),false);
work.assignRole('younger','counter');
for(let i=0;i<240;i++){work.update(1/30,workers);workers.younger.update(1/30,input,false);}
assert.equal(work.task('younger').state,'WORKING');

console.log('✓ V0.2.4 systems tests passed');
