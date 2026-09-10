import assert from 'node:assert/strict';
import { GameScene } from '../src/scenes/GameScene.js';

const ctx=new Proxy({measureText(t){return{width:String(t).length*6};},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){},strokeRect(){},fillText(){},save(){},translate(){},rotate(){},restore(){},createRadialGradient(){return{addColorStop(){}};}},{set(o,p,v){o[p]=v;return true;},get(o,p){if(p in o)return o[p];return()=>{};}});
const input={click:null,hit(){return false;},down(){return false;}};
const sound={coin(){},door(){},fire(){},hammer(){},complete(){},perfect(){},tone(){},ensure(){},setDucked(){},startBGM(){},setBGMVolume(){},setSFXVolume(){},muteBGM(){},muteSFX(){},bgmVolume:.65,sfxVolume:.8,bgmMuted:false,sfxMuted:false};
const game={input,sound,scenes:{set(){}}};
const s=new GameScene(game,{newGame:true});s.init();assert.ok(s.ui.modal);s.ui.choose(0);assert.ok(s.ui.modal);s.ui.choose(0);assert.equal(s.shopOpen,false);assert.equal(Math.floor(s.time.minute),360);assert.equal(s.floor,'loft');
s.goDownstairs();assert.equal(s.floor,'shop');assert.ok(s.world.isWalkable(s.players.younger.x,s.players.younger.y));

// Merchant: guaranteed 06~08 visit and 2+ hour dwell.
const schedule=s.merchantSchedule();assert.ok(schedule.length>=1);assert.ok(schedule[0].start>=360&&schedule[0].start<=480);assert.ok(schedule[0].end-schedule[0].start>=120);s.time.minute=schedule[0].start+1;s.updateMerchant();assert.equal(s.merchantVisible,true);

// Manual craft and display sale survive the layout rewrite.
s.openCraftMenu();assert.ok(s.ui.modal);s.ui.choose(0);assert.ok(s.ui.modal);s.ui.choose(1);assert.equal(s.crafting.active.itemId,'dagger');while(s.crafting.active)s.finishCraftStage(90,{perfectHits:1,stagePerfect:true});assert.equal(s.inventory.items.length,1);s.ui.closeModal();s.chooseInventoryForDisplay();assert.ok(s.ui.modal);s.ui.choose(0);assert.equal(s.display.count(),1);assert.equal(s.inventory.items.length,0);
const buyer=s.customer.spawn({type:'villager',name:'테스트 주민',customerId:'villager:test',mode:'general',itemId:'dagger',preferences:['dagger'],budget:3,patience:100,line:'구경'},700);buyer.status='browsing';buyer.x=520;buyer.y=174;const goldBefore=s.economy.gold;s.resolveGeneralBuyer(buyer);assert.ok(s.economy.gold>goldBefore);assert.equal(s.display.count(),0);assert.ok(s.customerProfiles['villager:test']);

// Broom ejects only rude NPC; child persists.
s.customer.visitors=[];s.child.visible=true;s.child.x=414;s.child.y=218;const rude=s.customer.spawn({type:'rude',name:'진상 테스트',mode:'direct',itemId:'shield',preferences:['shield'],budget:.9,patience:200,rude:true,line:'비싸다'},700);rude.status='ordered';rude.acceptedItem='shield';rude.x=s.players.younger.x+30;rude.y=s.players.younger.y;s.broomEquipped=true;s.startBroomAttack(rude);s.updateCutscene(.6);assert.equal(rude.status,'leaving');assert.equal(s.child.visible,true);assert.ok(rude.fleeSpeed>100);

// CLOSED shop may end the day early; OPEN shop may not.
s.customer.visitors=[];s.cutscene=null;s.broomEquipped=false;s.stairCooldown=0;s.goUpstairs();assert.equal(s.floor,'loft');s.time.minute=795;s.shopOpen=true;s.useBed();assert.ok(s.ui.modal);assert.ok(s.ui.modal.text.includes('영업 중'));s.ui.closeModal();s.shopOpen=false;s.useBed();assert.ok(s.ui.modal);assert.ok(s.ui.modal.text.includes('13:15'));s.ui.choose(0);assert.ok(s.ui.modal); // day summary
s.ui.choose(0);assert.equal(s.day,2);assert.equal(Math.floor(s.time.minute),360);assert.equal(s.shopOpen,false);assert.equal(s.floor,'loft');assert.ok(s.ui.modal); // morning news

// Renown promotion and regular data are actual world progression, not a detached number.
s.ui.closeModal();s.economy.reputation=9;s.renownTier=0;s.economy.adjustRep(2);s.checkRenownPromotion();assert.equal(s.renownTier,1);assert.ok(s.ui.modal?.title.includes('명성'));s.ui.closeModal();for(let i=0;i<3;i++)s.recordCustomerVisit({customerId:'adventurer:bern',name:'모험가 베른',type:'adventurer',preferences:['dagger']});s.recordCustomerPurchase({customerId:'adventurer:bern',name:'모험가 베른',type:'adventurer'},60,'dagger');s.recordCustomerPurchase({customerId:'adventurer:bern',name:'모험가 베른',type:'adventurer'},70,'dagger');assert.equal(s.customerProfiles['adventurer:bern'].isRegular,true);assert.ok(s.regularCount()>=1);

// V0.2.5 snapshot restores added data and old gameplay state.
s.shopOpen=true;s.economy.gold=777;s.economy.reputation=27;s.inventory.materials.iron=19;s.floor='shop';s.playerFloors.younger='shop';s.players.younger.x=411;s.players.younger.y=222;s.maintenance.dirtSpots=[{x:350,y:300,type:'먼지',zone:'GENERAL_FLOOR_ZONE'}];const snap=s.snapshot(true);assert.equal(snap.saveVersion,4);const restored=new GameScene(game,{save:snap});assert.equal(restored.economy.gold,777);assert.equal(restored.economy.reputation,27);assert.equal(restored.inventory.materials.iron,19);assert.equal(restored.shopOpen,true);assert.equal(restored.floor,'shop');assert.equal(restored.players.younger.x,411);assert.equal(restored.players.younger.y,222);assert.equal(restored.customerProfiles['adventurer:bern'].isRegular,true);assert.equal(restored.maintenance.dirtSpots.length,1);

// New depth-sorted renderer must render without runtime errors.
restored.render(ctx);
console.log('✓ V0.2.5e scene integration/early-sleep/renown tests passed');
