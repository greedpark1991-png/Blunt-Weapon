import assert from 'node:assert/strict';
import { GameScene } from '../src/scenes/GameScene.js';

const ctx=new Proxy({measureText(t){return{width:String(t).length*6};},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){},strokeRect(){},fillText(){},save(){},translate(){},restore(){}},{set(o,p,v){o[p]=v;return true;},get(o,p){if(p in o)return o[p];return()=>{};}});
const input={click:null,hit(){return false;},down(){return false;}};
const sound={coin(){},door(){},fire(){},hammer(){},complete(){},tone(){},ensure(){}};
const game={input,sound,scenes:{set(){}}};
const s=new GameScene(game,{newGame:true});s.init();assert.ok(s.ui.modal);s.ui.choose(0);assert.ok(s.ui.modal);s.ui.choose(0);assert.equal(s.shopOpen,false);assert.equal(Math.floor(s.time.minute),360);

s.openCraftMenu();assert.ok(s.ui.modal);s.ui.choose(0);assert.ok(s.ui.modal);s.ui.choose(1);assert.equal(s.crafting.active.itemId,'dagger');
while(s.crafting.active)s.finishCraftStage(76);
assert.equal(s.inventory.items.length,1);s.ui.closeModal();
s.chooseInventoryForDisplay();assert.ok(s.ui.modal);s.ui.choose(0);assert.equal(s.display.count(),1);assert.equal(s.inventory.items.length,0);

const buyer=s.customer.spawn({type:'villager',name:'테스트 주민',mode:'general',itemId:'dagger',preferences:['dagger'],budget:1.1,patience:100,line:'구경'},700);buyer.status='browsing';buyer.x=520;buyer.y=150;const goldBefore=s.economy.gold;s.resolveGeneralBuyer(buyer);assert.ok(s.economy.gold>goldBefore);assert.equal(s.display.count(),0);

s.toggleShop();assert.equal(s.shopOpen,true);s.toggleShop();assert.equal(s.shopOpen,false);
s.customer.visitors=[];s.time.minute=1320;s.useBed();assert.ok(s.ui.modal);s.ui.choose(0);assert.equal(s.day,2);assert.equal(Math.floor(s.time.minute),360);assert.equal(s.shopOpen,false);assert.ok(s.ui.modal);s.render(ctx);
console.log('✓ V0.2 scene integration smoke test passed');
