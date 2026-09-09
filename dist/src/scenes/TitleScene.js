import { SaveSystem } from '../systems/SaveSystem.js';
import { GameScene } from './GameScene.js';
export class TitleScene {
  constructor(game){this.game=game;this.t=0;this.hasSave=SaveSystem.hasSave();this.buttons=[];}
  init(){this.game.sound.ensure?.();}
  update(dt){this.t+=dt;const i=this.game.input;if(i.hit('Digit1','Numpad1','KeyN'))this.startNew();if(this.hasSave&&i.hit('Digit2','Numpad2','KeyC'))this.continue();if(i.click){for(const b of this.buttons){if(i.click.x>=b.x&&i.click.x<=b.x+b.w&&i.click.y>=b.y&&i.click.y<=b.y+b.h&&b.enabled)b.action();}}}
  startNew(){SaveSystem.clear();this.game.sound.coin();this.game.scenes.set(GameScene,{newGame:true});}
  continue(){const data=SaveSystem.load();if(!data)return this.startNew();this.game.sound.coin();this.game.scenes.set(GameScene,{save:data});}
  render(ctx){
    ctx.fillStyle='#3d332a';ctx.fillRect(0,0,640,360);for(let y=0;y<360;y+=24){for(let x=((y/24)%2)*20-20;x<640;x+=40){ctx.fillStyle=((x+y)/8)%2?'#493c30':'#42362c';ctx.fillRect(x,y,38,22);}}
    const glow=.5+.5*Math.sin(this.t*2);ctx.fillStyle=`rgba(235,115,38,${.08+glow*.06})`;ctx.fillRect(0,0,640,360);ctx.fillStyle='#1c120d';ctx.fillRect(78,48,484,142);ctx.fillStyle='#7f5935';ctx.fillRect(84,54,472,130);ctx.fillStyle='#4f321f';ctx.fillRect(92,62,456,114);ctx.fillStyle='#d1a45e';ctx.fillRect(106,75,428,3);ctx.fillRect(106,162,428,3);
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f1d7a2';ctx.font='bold 24px monospace';ctx.fillText('형제 대장간',320,105);ctx.fillStyle='#d8ba84';ctx.font='11px monospace';ctx.fillText('BLACKSMITH BROTHERS · V0.2 LIFE & SHOP UPDATE',320,136);ctx.fillStyle='#bfa378';ctx.font='9px monospace';ctx.fillText('아침 준비 · 직접 OPEN · 랜덤 손님 · 진열 재고 · 밤 작업 · 취침',320,156);
    const opts=[{label:'1. 새 게임',enabled:true,action:()=>this.startNew()},{label:'2. 이어하기',enabled:this.hasSave,action:()=>this.continue()}];this.buttons=[];opts.forEach((o,i)=>{const x=210,y=220+i*48,w=220,h=34;this.buttons.push({...o,x,y,w,h});ctx.fillStyle=o.enabled?'#2a1c13':'#241c17';ctx.fillRect(x,y,w,h);ctx.fillStyle=o.enabled?'#9c7145':'#5e5145';ctx.fillRect(x+2,y+2,w-4,h-4);ctx.fillStyle=o.enabled?'#20150f':'#302923';ctx.fillRect(x+5,y+5,w-10,h-10);ctx.fillStyle=o.enabled?'#f0d9ad':'#796d60';ctx.font='12px monospace';ctx.fillText(o.label,x+w/2,y+h/2);});ctx.fillStyle='#c3a87a';ctx.font='9px monospace';ctx.fillText('현실 1초 = 게임 1분 · 06:00 시작 · 22:00 영업 마감',320,331);ctx.textAlign='left';
  }
}
