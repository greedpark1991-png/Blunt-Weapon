import { MATERIAL_NAMES, QUALITY, stationName } from '../data/GameData.js';

const TARGETS={heat:.68,quench:.40,grind:.52,bend:.64,string:.48,test:.72,wood:.36,assemble:.56,leather:.44};
const RING_KINDS=new Set(['hammer','rivet']);

export class UIManager {
  constructor(){this.modal=null;this.toast=null;this.toastT=0;this.craft=null;}
  showToast(text,seconds=2.4){this.toast=text;this.toastT=seconds;}
  openModal(title,text,options=[{label:'확인'}],onSelect=()=>{},config={}){this.modal={title,text,options,onSelect,pauseClock:config.pauseClock!==false};}
  closeModal(){this.modal=null;}
  beginCraft(stage,speed,onDone,meta={}){this.craft={stage:{...stage},speed,onDone,meta,t:0,attempts:0,scores:[],phase:0,radius:44};}
  update(dt){
    if(this.toastT>0){this.toastT-=dt;if(this.toastT<=0)this.toast=null;}
    const c=this.craft;if(!c)return;c.t+=dt;const diff=c.stage.difficulty||1;c.phase+=dt*(1.05+.22*diff)*c.speed;
    if(RING_KINDS.has(c.stage.kind)){c.radius-=dt*15*(.95+.12*diff)*c.speed;if(c.radius<6)c.radius=44;}
  }
  handleInput(input,sound){
    if(this.craft){if(input.hit('Escape')){this.showToast('제작 단계는 넘길 수 없다. E로 타이밍을 맞추자.');return true;}if(input.hit('KeyE','Space','Enter')){this.hitCraft(sound);return true;}return true;}
    if(!this.modal)return false;
    if(input.hit('Escape')){this.modal=null;return true;}
    for(let i=0;i<this.modal.options.length&&i<9;i++){if(input.hit(`Digit${i+1}`,`Numpad${i+1}`)){this.choose(i);return true;}}
    if(input.hit('KeyE','Enter')&&this.modal.options.length===1){this.choose(0);return true;}
    if(input.click){const rects=this.optionRects(this.modal.options.length);for(let i=0;i<rects.length;i++){const r=rects[i];if(input.click.x>=r.x&&input.click.x<=r.x+r.w&&input.click.y>=r.y&&input.click.y<=r.y+r.h){this.choose(i);return true;}}}
    return true;
  }
  choose(index){const m=this.modal;if(!m||!m.options[index])return;const cb=m.onSelect;const opt=m.options[index];this.modal=null;cb(index,opt);}
  optionRects(n){
    if(n<=4){const total=420,gap=6,w=(total-(n-1)*gap)/Math.max(1,n),start=320-total/2;return Array.from({length:n},(_,i)=>({x:start+i*(w+gap),y:289,w,h:28}));}
    const cols=3,rows=Math.ceil(n/cols),gap=6,total=420,w=(total-(cols-1)*gap)/cols,start=320-total/2,startY=rows===2?254:222;
    return Array.from({length:n},(_,i)=>({x:start+(i%cols)*(w+gap),y:startY+Math.floor(i/cols)*34,w,h:28}));
  }
  hitCraft(sound){
    const c=this.craft;if(!c)return;let score=0;const kind=c.stage.kind,diff=c.stage.difficulty||1;
    if(RING_KINDS.has(kind)){score=100-Math.abs(c.radius-14)*4.4*diff;sound.hammer();c.radius=44;}
    else{const v=(Math.sin(c.phase*2.2)+1)/2,target=TARGETS[kind]??.5;score=100-Math.abs(v-target)*185*diff;if(kind==='heat')sound.fire();else sound.tone(kind==='quench'?180:kind==='grind'?290:240,.06,'triangle',.028);}
    c.scores.push(Math.max(0,Math.min(100,score)));c.attempts++;
    const need=c.stage.hits||3;if(c.attempts>=need){const avg=c.scores.reduce((a,b)=>a+b,0)/c.scores.length,done=c.onDone;this.craft=null;done(avg);}
  }
  render(ctx,scene){this.renderHUD(ctx,scene);if(this.toast)this.renderToast(ctx,this.toast);if(this.modal)this.renderModal(ctx,this.modal);if(this.craft)this.renderCraft(ctx,this.craft);}
  renderHUD(ctx,s){
    ctx.fillStyle='#21160f';ctx.fillRect(0,0,640,31);ctx.fillStyle='#6f4d2f';ctx.fillRect(0,28,640,3);
    ctx.textBaseline='middle';ctx.font='bold 11px monospace';ctx.fillStyle='#f2d9a6';ctx.fillText(`DAY ${s.day}`,10,14);
    ctx.font='bold 15px monospace';ctx.fillStyle='#fff0c6';ctx.fillText(s.time.format(),78,14);
    ctx.font='bold 10px monospace';ctx.fillStyle=s.shopOpen?'#a8d18f':'#d7a17b';ctx.fillText(s.shopOpen?'OPEN':'CLOSED',145,14);
    ctx.fillStyle='#f2d9a6';ctx.fillText(`G ${s.economy.gold}`,215,14);ctx.fillText(`평판 ${s.economy.reputation}`,282,14);ctx.fillText(`진열 ${s.display.count()}/5`,365,14);ctx.fillText(`청결 ${Math.round(s.maintenance.cleanliness)}`,440,14);
    ctx.fillStyle='#e8bd72';ctx.fillText(`조작 ${s.controlled==='older'?'형':'동생'} · ${s.floor==='loft'?'2층':'1층'} [Q]`,505,14);
    ctx.fillStyle='#2f2016';ctx.fillRect(6,35,340,18);ctx.fillStyle='#d9bd8b';ctx.font='9px monospace';ctx.fillText(`소식 · ${s.events.activeEvent?.title||'평온한 하루'}`,12,44);if(s.broomEquipped){ctx.fillStyle='#f0c56e';ctx.fillText('빗자루 장착',354,44);}
    if(s.orders.openOrders().length){ctx.fillStyle='#3a2417';ctx.fillRect(486,35,146,18);ctx.fillStyle='#e8c285';ctx.fillText(`미납 주문 ${s.orders.openOrders().length}건`,494,44);}
  }
  panel(ctx,x,y,w,h){ctx.fillStyle='#281a12';ctx.fillRect(x-3,y-3,w+6,h+6);ctx.fillStyle='#8c653d';ctx.fillRect(x,y,w,h);ctx.fillStyle='#ead3a4';ctx.fillRect(x+3,y+3,w-6,h-6);ctx.fillStyle='#563922';ctx.fillRect(x+6,y+6,w-12,h-12);}
  wrap(ctx,text,x,y,maxW,lineH=14,maxLines=6){const words=String(text).split(/\s+/);let line='',lines=[];for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxW&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(l,x,y+i*lineH));}
  renderModal(ctx,m){
    ctx.fillStyle='#0009';ctx.fillRect(0,0,640,360);this.panel(ctx,82,118,476,214);ctx.fillStyle='#f4dba6';ctx.font='bold 13px monospace';ctx.textBaseline='top';ctx.fillText(m.title,104,140);ctx.fillStyle='#eee1c5';ctx.font='10px monospace';this.wrap(ctx,m.text,104,160,432,14,6);
    const rects=this.optionRects(m.options.length);m.options.forEach((o,i)=>{const r=rects[i];ctx.fillStyle='#2b1c13';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#b8864c';ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);ctx.fillStyle=o.disabled?'#3b3129':'#24170f';ctx.fillRect(r.x+4,r.y+4,r.w-8,r.h-8);ctx.fillStyle=o.disabled?'#756a5d':'#f4ddb0';ctx.font='9px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`${i+1}. ${o.label}`,r.x+r.w/2,r.y+r.h/2);ctx.textAlign='left';});
    ctx.fillStyle='#bfa57d';ctx.font='8px monospace';ctx.textBaseline='middle';ctx.fillText('숫자키 또는 클릭 · ESC 닫기',104,321);
  }
  renderToast(ctx,text){ctx.font='10px monospace';const w=Math.min(590,ctx.measureText(text).width+28),x=(640-w)/2;ctx.fillStyle='#17100de8';ctx.fillRect(x,329,w,23);ctx.fillStyle='#c99755';ctx.fillRect(x,329,w,2);ctx.fillStyle='#f2deba';ctx.textBaseline='middle';ctx.fillText(text,x+13,341);}
  renderCraft(ctx,c){
    ctx.fillStyle='#000b';ctx.fillRect(0,0,640,360);this.panel(ctx,96,83,448,208);ctx.fillStyle='#f4dba6';ctx.font='bold 14px monospace';ctx.textBaseline='middle';ctx.fillText(`${c.meta.itemName||'제작'} · ${c.stage.label}`,118,108);ctx.fillStyle='#cdb78e';ctx.font='9px monospace';ctx.fillText(`${c.meta.workerName||''} · 작업대: ${stationName(c.stage.station)} · E 타이밍 입력`,118,128);
    const kind=c.stage.kind,diff=c.stage.difficulty||1;
    if(RING_KINDS.has(kind)){
      const cx=320,cy=190;ctx.strokeStyle='#d7a75a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,14,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#f0e1c5';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,c.radius,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#847165';ctx.fillRect(cx-34,cy+37,68,12);ctx.fillStyle='#c99a5a';ctx.fillRect(cx-18,cy+26,36,14);
    }else{
      const x=126,y=178,w=388,v=(Math.sin(c.phase*2.2)+1)/2,target=TARGETS[kind]??.5,zone=Math.max(.07,.12/diff);ctx.fillStyle='#211a16';ctx.fillRect(x,y,w,24);ctx.fillStyle=kind==='heat'?'#c55c29':kind==='quench'?'#4f7680':kind==='grind'?'#677966':'#7f704f';ctx.fillRect(x+(target-zone)*w,y+2,zone*2*w,20);ctx.fillStyle='#fff0bd';ctx.fillRect(x+v*w-2,y-5,4,34);
    }
    ctx.fillStyle='#f0d7aa';ctx.font='10px monospace';ctx.fillText(`입력 ${c.attempts}/${c.stage.hits||3}`,118,244);ctx.fillStyle='#baa27c';ctx.font='9px monospace';const tips={heat:'주황빛 중심 온도를 노린다.',hammer:'원이 모루 중심에 겹칠 때 친다.',quench:'너무 뜨겁지도 차갑지도 않은 순간에 담근다.',grind:'숫돌 압력을 일정하게 맞춘다.',wood:'목재 결이 맞는 구간에서 가공한다.',bend:'활 몸체가 적당히 휘어진 순간을 잡는다.',string:'시위 장력이 맞는 순간을 고른다.',test:'과하게 당기기 전 적정 장력을 찾는다.',assemble:'부품 정렬이 맞는 순간을 고정한다.',leather:'가죽 장력이 균일한 구간을 맞춘다.',rivet:'원이 중심에 들어올 때 리벳을 박는다.'};ctx.fillText(tips[kind]||'좋은 타이밍에 E를 누른다.',118,265);
  }
}
