import assert from 'node:assert/strict';
import { SaveSystem } from '../src/systems/SaveSystem.js';
import { CalendarSystem } from '../src/systems/CalendarSystem.js';
import { RentSystem } from '../src/systems/RentSystem.js';
import { Economy } from '../src/systems/Economy.js';
import { UIManager } from '../src/ui/UIManager.js';
import { SoundFX } from '../src/systems/SoundFX.js';
import { chooseTrait } from '../src/data/GameData.js';

class LocalStorageMock{
  constructor(){this.m=new Map();}
  getItem(k){return this.m.has(k)?this.m.get(k):null;}
  setItem(k,v){this.m.set(k,String(v));}
  removeItem(k){this.m.delete(k);}
  clear(){this.m.clear();}
}
globalThis.localStorage=new LocalStorageMock();

// Six manual slots stay independent from auto save.
const base={saveVersion:3,day:1,calendar:{year:1,month:1,day:1,weekday:0},time:{minute:360,speed:1},gold:100,reputation:0,playTimeSeconds:10};
assert.equal(SaveSystem.saveSlot(1,{...base,gold:111}),true);
assert.equal(SaveSystem.saveSlot(2,{...base,gold:222,calendar:{year:1,month:1,day:2,weekday:1}}),true);
assert.equal(SaveSystem.saveAuto({...base,gold:333}),true);
assert.equal(SaveSystem.load(1).gold,111);
assert.equal(SaveSystem.load(2).gold,222);
assert.equal(SaveSystem.load('auto').gold,333);
assert.equal(SaveSystem.list().length,7);
SaveSystem.delete(2);assert.equal(SaveSystem.load(2),null);assert.equal(SaveSystem.load(1).gold,111);
// A corrupted slot must not break the remaining slots.
localStorage.setItem(SaveSystem.key(3),'{broken-json');assert.equal(SaveSystem.load(3),null);assert.equal(SaveSystem.load(1).gold,111);assert.equal(SaveSystem.metadata(3).corrupt,true);

// Calendar rollover and quarterly rent.
const cal=new CalendarSystem({year:1,month:1,day:31,weekday:2});cal.advance();assert.equal(cal.month,2);assert.equal(cal.day,1);assert.equal(cal.weekday,3);
const dueCal=new CalendarSystem({year:1,month:3,day:25,weekday:0});const rent=new RentSystem({baseRent:750});const eco=new Economy({gold:900,reputation:3});const settlement=rent.settleIfDue(dueCal,eco);assert.equal(settlement.paid,true);assert.equal(eco.gold,150);

// Precision crafting can deterministically produce an item-family trait.
const trait=chooseTrait('blade',4,4,.1);assert.ok(trait);assert.ok(trait.multiplier>1);

// ESC panel owns a true pause state and craft gets an input grace period after closing.
const ui=new UIManager();ui.beginCraft({id:'x',kind:'heat',difficulty:1,hits:1,station:'forge',label:'test'},1,()=>{});ui.openPause();assert.equal(ui.isWorldPaused(),true);ui.closePause();assert.ok(ui.craft.resumeGrace>0);

// Global audio settings are independent and persist, and BGM object is singleton/looped.
class AudioMock{
  constructor(src){this.src=src;this.loop=false;this.preload='';this.volume=1;this.paused=true;this.currentTime=0;this.listeners={};AudioMock.instances.push(this);}
  addEventListener(t,fn){this.listeners[t]=fn;}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
}
AudioMock.instances=[];
globalThis.Audio=AudioMock;
globalThis.window={AudioContext:null,webkitAudioContext:null};
const snd=new SoundFX();snd.setBGMVolume(.42);snd.setSFXVolume(.77);snd.startBGM();snd.startBGM();assert.equal(AudioMock.instances.length,1);assert.equal(snd.bgm.loop,true);assert.ok(snd.bgm.src.includes('the_artisans_hearth.mp3'));assert.equal(snd.bgmVolume,.42);assert.equal(snd.sfxVolume,.77);
const snd2=new SoundFX();assert.equal(snd2.bgmVolume,.42);assert.equal(snd2.sfxVolume,.77);

console.log('✓ V0.2.4 UX/save/audio tests passed');
