import assert from 'node:assert/strict';
import { SaveSystem } from '../src/systems/SaveSystem.js';
import { CalendarSystem } from '../src/systems/CalendarSystem.js';
import { RentSystem } from '../src/systems/RentSystem.js';
import { Economy } from '../src/systems/Economy.js';
import { UIManager } from '../src/ui/UIManager.js';
import { SoundFX } from '../src/systems/SoundFX.js';
import { chooseTrait } from '../src/data/GameData.js';

class LocalStorageMock{constructor(){this.m=new Map();}getItem(k){return this.m.has(k)?this.m.get(k):null;}setItem(k,v){this.m.set(k,String(v));}removeItem(k){this.m.delete(k);}clear(){this.m.clear();}}
globalThis.localStorage=new LocalStorageMock();

// V0.2.4 saveVersion 3 migrates safely into V0.2.5 saveVersion 4.
const old={saveVersion:3,version:3,day:4,calendar:{year:1,month:1,day:4,weekday:3},time:{minute:822,speed:1},gold:456,reputation:27,playTimeSeconds:10,maintenance:{cleanliness:70,dirtSpots:[{x:350,y:300}]}};
localStorage.setItem(SaveSystem.key(1),JSON.stringify({saveVersion:3,meta:{date:'old'},data:old}));
const migrated=SaveSystem.load(1);assert.equal(migrated.saveVersion,4);assert.equal(migrated.gold,456);assert.deepEqual(migrated.customerProfiles,{});assert.deepEqual(migrated.kidFlags,{});assert.ok(Array.isArray(migrated.maintenance.dirtSpots));

// Six manual slots stay independent from auto save.
const base={saveVersion:4,day:1,calendar:{year:1,month:1,day:1,weekday:0},time:{minute:360,speed:1},gold:100,reputation:0,playTimeSeconds:10};
assert.equal(SaveSystem.saveSlot(1,{...base,gold:111}),true);assert.equal(SaveSystem.saveSlot(2,{...base,gold:222,calendar:{year:1,month:1,day:2,weekday:1}}),true);assert.equal(SaveSystem.saveAuto({...base,gold:333}),true);
assert.equal(SaveSystem.load(1).gold,111);assert.equal(SaveSystem.load(2).gold,222);assert.equal(SaveSystem.load('auto').gold,333);assert.equal(SaveSystem.list().length,7);
SaveSystem.delete(2);assert.equal(SaveSystem.load(2),null);assert.equal(SaveSystem.load(1).gold,111);
localStorage.setItem(SaveSystem.key(3),'{broken-json');assert.equal(SaveSystem.load(3),null);assert.equal(SaveSystem.load(1).gold,111);assert.equal(SaveSystem.metadata(3).corrupt,true);

const cal=new CalendarSystem({year:1,month:1,day:31,weekday:2});cal.advance();assert.equal(cal.month,2);assert.equal(cal.day,1);assert.equal(cal.weekday,3);
const dueCal=new CalendarSystem({year:1,month:3,day:25,weekday:0});const rent=new RentSystem({baseRent:750});const eco=new Economy({gold:900,reputation:3});const settlement=rent.settleIfDue(dueCal,eco);assert.equal(settlement.paid,true);assert.equal(eco.gold,150);
const trait=chooseTrait('blade',4,4,.1);assert.ok(trait?.multiplier>1);

// Central keyboard UI navigation: pause menu, options, save slots and merchant are usable without mouse.
const hits=new Set();const downs=new Set();const input={click:null,hit(...codes){return codes.some(c=>hits.has(c));},down(...codes){return codes.some(c=>downs.has(c));}};
const pulse=(code,fn)=>{hits.clear();hits.add(code);const r=fn();hits.clear();return r;};
const soundStub={tone(){},coin(){},bgmVolume:.65,sfxVolume:.8,bgmMuted:false,sfxMuted:false,setBGMVolume(v){this.bgmVolume=Math.max(0,Math.min(1,v));},setSFXVolume(v){this.sfxVolume=Math.max(0,Math.min(1,v));},muteBGM(){this.bgmMuted=!this.bgmMuted;},muteSFX(){this.sfxMuted=!this.sfxMuted;}};
const sceneStub={game:{sound:soundStub},saveManual(){return true;},loadFromSlot(){},returnToTitle(){},economy:{gold:100,reputation:0},inventory:{materials:{iron:1,wood:1,leather:1}},orders:{openOrders(){return[];}},display:{count(){return 0;}},rent:{nextDue(){return{name:'새싹맞이날',days:83,amount:750};}},calendar:{format(){return'1년차 1월 1일 월요일';}},time:{format(){return'06:00';}},shopOpen:false,renownInfo(){return{tier:{name:'무명의 대장간'},next:{min:10},remaining:10};},regularCount(){return 0;}};
const ui=new UIManager();ui.openPause();assert.equal(ui.isWorldPaused(),true);assert.equal(ui.pause.focus,0);pulse('ArrowDown',()=>ui.handleInput(input,soundStub,sceneStub));assert.equal(ui.pause.focus,1);pulse('ArrowDown',()=>ui.handleInput(input,soundStub,sceneStub));assert.equal(ui.pause.focus,2);pulse('ArrowDown',()=>ui.handleInput(input,soundStub,sceneStub));assert.equal(ui.pause.focus,3);pulse('Enter',()=>ui.handleInput(input,soundStub,sceneStub));assert.equal(ui.pause.page,'options');const bgmBefore=soundStub.bgmVolume;pulse('ArrowLeft',()=>ui.handleInput(input,soundStub,sceneStub));assert.ok(soundStub.bgmVolume<bgmBefore);pulse('Escape',()=>ui.handleInput(input,soundStub,sceneStub));assert.equal(ui.pause.page,'main');
ui.pause.focus=1;pulse('Enter',()=>ui.handleInput(input,soundStub,sceneStub));assert.equal(ui.pause.page,'save');pulse('ArrowDown',()=>ui.handleInput(input,soundStub,sceneStub));assert.equal(ui.pause.focus,1);pulse('Escape',()=>ui.handleInput(input,soundStub,sceneStub));assert.equal(ui.pause.page,'main');

let bought=null;ui.closePause();ui.openMaterialShop({saleText:'',unitPrice:()=>8,getGold:()=>200,isSale:()=>false,onBuy:(type,amount)=>{bought={type,amount};return true;}});pulse('ArrowRight',()=>ui.handleInput(input,soundStub,sceneStub));assert.equal(ui.shop.qty.iron,2);downs.add('ShiftLeft');pulse('ArrowRight',()=>ui.handleInput(input,soundStub,sceneStub));downs.clear();assert.equal(ui.shop.qty.iron,7);pulse('Enter',()=>ui.handleInput(input,soundStub,sceneStub));assert.deepEqual(bought,{type:'iron',amount:7});pulse('Escape',()=>ui.handleInput(input,soundStub,sceneStub));assert.equal(ui.shop,null);

// Craft pause resumes from the same state with anti-abuse input grace.
ui.beginCraft({id:'x',kind:'heat',difficulty:1,hits:1,station:'forge',label:'test'},1,()=>{});const phase=ui.craft.phase;ui.openPause();ui.update(.5);assert.equal(ui.craft.phase,phase);ui.closePause();assert.ok(ui.craft.resumeGrace>0);

// Global audio settings are independent and persist; BGM remains singleton/looped.
class AudioMock{constructor(src){this.src=src;this.loop=false;this.preload='';this.volume=1;this.paused=true;this.currentTime=0;this.listeners={};AudioMock.instances.push(this);}addEventListener(t,fn){this.listeners[t]=fn;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
AudioMock.instances=[];globalThis.Audio=AudioMock;globalThis.window={AudioContext:null,webkitAudioContext:null};
const snd=new SoundFX();snd.setBGMVolume(.42);snd.setSFXVolume(.77);snd.startBGM();snd.startBGM();assert.equal(AudioMock.instances.length,1);assert.equal(snd.bgm.loop,true);assert.ok(snd.bgm.src.includes('the_artisans_hearth.mp3'));assert.equal(snd.bgmVolume,.42);assert.equal(snd.sfxVolume,.77);const snd2=new SoundFX();assert.equal(snd2.bgmVolume,.42);assert.equal(snd2.sfxVolume,.77);

console.log('✓ V0.2.5 UX/save/keyboard/audio tests passed');
