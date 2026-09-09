const SETTINGS_KEY='blacksmith-brothers-globalSettings-v1';
export class SoundFX {
  constructor(){
    this.ctx=null;this.bgm=null;this.ducked=false;
    const s=this.loadSettings();this.bgmVolume=s.bgmVolume??0.65;this.sfxVolume=s.sfxVolume??0.80;this.bgmMuted=!!s.bgmMuted;this.sfxMuted=!!s.sfxMuted;
  }
  loadSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch{return{}}}
  saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify({bgmVolume:this.bgmVolume,sfxVolume:this.sfxVolume,bgmMuted:this.bgmMuted,sfxMuted:this.sfxMuted}))}catch{}}
  ensure(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(C)this.ctx=new C();}if(this.ctx?.state==='suspended')this.ctx.resume();}
  startBGM(){this.ensure();if(!this.bgm){this.bgm=new Audio('assets/audio/bgm/the_artisans_hearth.mp3');this.bgm.loop=true;this.bgm.preload='auto';this.bgm.addEventListener('error',()=>console.warn('BGM load failed'));}this.applyBGMVolume();if(this.bgm.paused)this.bgm.play().catch(()=>{});}
  stopBGM(){if(this.bgm){this.bgm.pause();this.bgm.currentTime=0;}}
  applyBGMVolume(){if(!this.bgm)return;const base=this.bgmMuted?0:this.bgmVolume;this.bgm.volume=Math.max(0,Math.min(1,base*(this.ducked?.65:1)));}
  setDucked(v){this.ducked=!!v;this.applyBGMVolume();}
  setBGMVolume(v){this.bgmVolume=Math.max(0,Math.min(1,v));this.saveSettings();this.applyBGMVolume();}
  setSFXVolume(v){this.sfxVolume=Math.max(0,Math.min(1,v));this.saveSettings();}
  muteBGM(v=!this.bgmMuted){this.bgmMuted=!!v;this.saveSettings();this.applyBGMVolume();}
  muteSFX(v=!this.sfxMuted){this.sfxMuted=!!v;this.saveSettings();}
  tone(freq=220,dur=.08,type='square',vol=.035){this.ensure();if(!this.ctx||this.sfxMuted||this.sfxVolume<=0)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();const actual=vol*this.sfxVolume;o.type=type;o.frequency.value=freq;g.gain.value=actual;o.connect(g);g.connect(this.ctx.destination);const t=this.ctx.currentTime;g.gain.setValueAtTime(actual,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.start(t);o.stop(t+dur);}
  hammer(){this.tone(95,.055,'square',.055);setTimeout(()=>this.tone(62,.05,'triangle',.025),20);}
  coin(){this.tone(760,.08,'square',.03);setTimeout(()=>this.tone(1040,.09,'square',.025),75);}
  door(){this.tone(150,.11,'sawtooth',.025);}
  complete(){[440,660,880].forEach((f,i)=>setTimeout(()=>this.tone(f,.11,'square',.025),i*85));}
  perfect(){this.tone(920,.07,'triangle',.035);setTimeout(()=>this.tone(1240,.11,'triangle',.03),65);}
  fire(){this.tone(72,.05,'sawtooth',.015);}
}
