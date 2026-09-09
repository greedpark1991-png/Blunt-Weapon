export class SoundFX {
  constructor(){ this.ctx=null; }
  ensure(){ if(!this.ctx){ const C=window.AudioContext||window.webkitAudioContext; if(C) this.ctx=new C(); } if(this.ctx?.state==='suspended') this.ctx.resume(); }
  tone(freq=220,dur=.08,type='square',vol=.035){ this.ensure(); if(!this.ctx)return; const o=this.ctx.createOscillator(),g=this.ctx.createGain(); o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(this.ctx.destination);const t=this.ctx.currentTime;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.start(t);o.stop(t+dur); }
  hammer(){ this.tone(95,.055,'square',.055); setTimeout(()=>this.tone(62,.05,'triangle',.025),20); }
  coin(){ this.tone(760,.08,'square',.03); setTimeout(()=>this.tone(1040,.09,'square',.025),75); }
  door(){ this.tone(150,.11,'sawtooth',.025); }
  complete(){ [440,660,880].forEach((f,i)=>setTimeout(()=>this.tone(f,.11,'square',.025),i*85)); }
  fire(){ this.tone(72,.05,'sawtooth',.015); }
}
