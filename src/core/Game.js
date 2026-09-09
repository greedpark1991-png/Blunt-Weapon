import { Input } from './Input.js';
import { SceneManager } from './SceneManager.js';
import { SoundFX } from '../systems/SoundFX.js';
export class Game {
  constructor(canvas){ this.canvas=canvas; this.ctx=canvas.getContext('2d',{alpha:false}); this.ctx.imageSmoothingEnabled=false; this.input=new Input(canvas); this.sound=new SoundFX(); this.scenes=new SceneManager(this); this.last=performance.now(); this.acc=0; this.running=true; requestAnimationFrame(this.loop.bind(this)); }
  loop(now){ if(!this.running)return; const dt=Math.min(.05,(now-this.last)/1000);this.last=now; this.scenes.update(dt); this.scenes.render(this.ctx); this.input.endFrame(); requestAnimationFrame(this.loop.bind(this)); }
}
