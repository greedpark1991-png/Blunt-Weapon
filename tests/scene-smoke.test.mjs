import assert from 'node:assert/strict';
import { GameScene } from '../src/scenes/GameScene.js';

const ctx=new Proxy({measureText(t){return{width:String(t).length*6};},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){},strokeRect(){},fillText(){},save(){},translate(){},rotate(){},restore(){}},{set(o,p,v){o[p]=v;return true;},get(o,p){if(p in o)return o[p];return()=>{};}});
const input={click:null,hit(){return false;},down(){return false;}};
const sound={coin(){},door(){},fire(){},hammer(){},complete(){},tone(){},ensure(){}};
const game={input,sound,scenes:{set(){}}};
const s=new GameScene(game,{newGame:true});s.init();assert.ok(s.ui.modal);s.ui.choose(0);assert.ok(s.ui.modal);s.ui.choose(0);assert.equal(s.shopOpen,false);assert.equal(Math.floor(s.time.minute),360);
assert.equal(s.floor,'loft');assert.equal(s.playerFloors.younger,'loft');
s.goDownstairs();assert.equal(s.floor,'shop');

// Guaranteed merchant visit must start inside 06:00~08:00, and stay 2+ game hours.
const schedule=s.merchantSchedule();assert.ok(schedule.length>=1);assert.ok(schedule[0].start>=360&&schedule[0].start<=480);assert.ok(schedule[0].end-schedule[0].start>=120);
s.time.minute=schedule[0].start+1;s.updateMerchant();assert.equal(s.merchantVisible,true);

// Manual craft still works for controlled brother.
s.openCraftMenu();assert.ok(s.ui.modal);s.ui.choose(0);assert.ok(s.ui.modal);s.ui.choose(1);assert.equal(s.crafting.active.itemId,'dagger');
while(s.crafting.active)s.finishCraftStage(76);
assert.equal(s.inventory.items.length,1);s.ui.closeModal();
s.chooseInventoryForDisplay();assert.ok(s.ui.modal);s.ui.choose(0);assert.equal(s.display.count(),1);assert.equal(s.inventory.items.length,0);

const buyer=s.customer.spawn({type:'villager',name:'테스트 주민',mode:'general',itemId:'dagger',preferences:['dagger'],budget:1.1,patience:100,line:'구경'},700);buyer.status='browsing';buyer.x=520;buyer.y=150;const goldBefore=s.economy.gold;s.resolveGeneralBuyer(buyer);assert.ok(s.economy.gold>goldBefore);assert.equal(s.display.count(),0);

// Broom action only ejects rude visitor, not child/merchant/normal NPCs.
s.customer.visitors=[];s.child.visible=true;s.child.x=400;s.child.y=250;
const rude=s.customer.spawn({type:'rude',name:'진상 테스트',mode:'direct',itemId:'shield',preferences:['shield'],budget:.9,patience:200,rude:true,line:'비싸다'},700);rude.status='ordered';rude.acceptedItem='shield';rude.x=s.players.younger.x+30;rude.y=s.players.younger.y;
s.broomEquipped=true;s.startBroomAttack(rude);s.updateCutscene(.6);assert.equal(rude.status,'leaving');assert.equal(s.child.visible,true);assert.ok(rude.fleeSpeed>100);

// Upstairs sleep advances day and returns to 06:00 upstairs.
s.customer.visitors=[];s.cutscene=null;s.broomEquipped=false;s.goUpstairs();s.time.minute=1320;s.useBed();assert.ok(s.ui.modal);s.ui.choose(0);assert.equal(s.day,2);assert.equal(Math.floor(s.time.minute),360);assert.equal(s.shopOpen,false);assert.equal(s.floor,'loft');assert.ok(s.ui.modal);s.render(ctx);
console.log('✓ V0.2.1 scene integration smoke test passed');
