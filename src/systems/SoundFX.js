const SETTINGS_KEY='blacksmith-brothers-globalSettings-v1';
const SETTINGS_VERSION=2;
const DEFAULT_BGM_VOLUME=0.06;
const DEFAULT_SFX_VOLUME=0.20;

export class SoundFX {
  constructor(){
    this.ctx=null;this.bgm=null;this.ducked=false;
    const raw=this.loadSettings();
    const migrated=this.migrateSettings(raw);
    this.bgmVolume=migrated.bgmVolume;
    this.sfxVolume=migrated.sfxVolume;
    this.bgmMuted=!!migrated.bgmMuted;
    this.sfxMuted=!!migrated.sfxMuted;
    if(migrated._changed)this.saveSettings();
  }
  loadSettings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch{return{}}}
  migrateSettings(s={}){
    const v=Number(s.settingsVersion||0);
    if(v>=SETTINGS_VERSION){
      return{
        bgmVolume:clamp01(s.bgmVolume??DEFAULT_BGM_VOLUME),
        sfxVolume:clamp01(s.sfxVolume??DEFAULT_SFX_VOLUME),
        bgmMuted:!!s.bgmMuted,
        sfxMuted:!!s.sfxMuted,
        _changed:false,
      };
    }
    // V0.2.5f.1 audio rebalance: older builds shipped much louder defaults.
    // Preserve any already-quieter user choice, but cap legacy values to the new baseline.
    return{
      bgmVolume:Math.min(clamp01(s.bgmVolume??DEFAULT_BGM_VOLUME),DEFAULT_BGM_VOLUME),
      sfxVolume:Math.min(clamp01(s.sfxVolume??DEFAULT_SFX_VOLUME),DEFAULT_SFX_VOLUME),
      bgmMuted:!!s.bgmMuted,
      sfxMuted:!!s.sfxMuted,
      _changed:true,
    };
  }
  saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify({settingsVersion:SETTINGS_VERSION,bgmVolume:this.bgmVolume,sfxVolume:this.sfxVolume,bgmMuted:this.bgmMuted,sfxMuted:this.sfxMuted}))}catch{}}
  ensure(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(C)this.ctx=new C();}if(this.ctx?.state==='suspended')this.ctx.resume();}
  startBGM(){this.ensure();if(!this.bgm){this.bgm=new Audio('assets/audio/bgm/midday_at_the_pier.mp3');this.bgm.loop=true;this.bgm.preload='auto';this.bgm.addEventListener('error',()=>console.warn('BGM load failed'));}this.applyBGMVolume();if(this.bgm.paused)this.bgm.play().catch(()=>{});}
  stopBGM(){if(this.bgm){this.bgm.pause();this.bgm.currentTime=0;}}
  applyBGMVolume(){if(!this.bgm)return;const base=this.bgmMuted?0:this.bgmVolume;this.bgm.volume=clamp01(base*(this.ducked?.65:1));}
  setDucked(v){this.ducked=!!v;this.applyBGMVolume();}
  setBGMVolume(v){this.bgmVolume=clamp01(v);this.saveSettings();this.applyBGMVolume();}
  setSFXVolume(v){this.sfxVolume=clamp01(v);this.saveSettings();}
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
function clamp01(v){return Math.max(0,Math.min(1,Number(v)||0));}
