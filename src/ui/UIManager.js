import { MATERIAL_NAMES, QUALITY, stationName } from '../data/GameData.js';
import { SaveSystem } from '../systems/SaveSystem.js';

const TARGETS={heat:.68,quench:.40,grind:.52,bend:.64,string:.48,test:.72,wood:.36,assemble:.56,leather:.44};
const RING_KINDS=new Set(['hammer','rivet']);
const MAT_TYPES=['iron','wood','leather'];
const fmtPlay=s=>{s=Math.max(0,Math.floor(s||0));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;};
const fmtSaved=iso=>{if(!iso)return'';try{const d=new Date(iso);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}catch{return'';}};

export class UIManager {
  constructor(){this.modal=null;this.toast=null;this.toastT=0;this.craft=null;this.pause=null;this.shop=null;this.perfectFlash=0;}
  showToast(text,seconds=2.4){this.toast=text;this.toastT=seconds;}
  openModal(title,text,options=[{label:'확인'}],onSelect=()=>{},config={}){this.modal={title,text,options,onSelect,pauseClock:config.pauseClock!==false};}
  closeModal(){this.modal=null;}
  beginCraft(stage,speed,onDone,meta={}){this.craft={stage:{...stage},speed,onDone,meta,t:0,attempts:0,scores:[],phase:0,radius:44,perfectHits:0,resumeGrace:0};}
  openPause(){if(!this.pause)this.pause={page:'main',slide:0,confirm:null};}
  closePause(){if(this.craft)this.craft.resumeGrace=.38;this.pause=null;}
  isPauseOpen(){return!!this.pause;}
  isWorldPaused(){return!!(this.pause||this.modal||this.shop);}
  openMaterialShop(config){this.shop={...config,qty:{iron:1,wood:1,leather:1}};}
  closeShop(){this.shop=null;}
  update(dt){
    if(this.toastT>0){this.toastT-=dt;if(this.toastT<=0)this.toast=null;}
    if(this.perfectFlash>0)this.perfectFlash-=dt;
    if(this.pause){this.pause.slide=Math.min(1,this.pause.slide+dt*7);return;}
    const c=this.craft;if(!c)return;if(c.resumeGrace>0){c.resumeGrace-=dt;return;}c.t+=dt;const diff=c.stage.difficulty||1;c.phase+=dt*(1.05+.22*diff)*c.speed;
    if(RING_KINDS.has(c.stage.kind)){c.radius-=dt*15*(.95+.12*diff)*c.speed;if(c.radius<6)c.radius=44;}
  }
  handleInput(input,sound,scene){
    if(this.pause)return this.handlePauseInput(input,sound,scene);
    if(this.shop)return this.handleShopInput(input,sound,scene);
    if(this.craft){if(input.hit('KeyE','Space','Enter')){if(this.craft.resumeGrace<=0)this.hitCraft(sound);return true;}return true;}
    if(!this.modal)return false;
    if(input.hit('Escape')){this.modal=null;return true;}
    for(let i=0;i<this.modal.options.length&&i<9;i++){if(input.hit(`Digit${i+1}`,`Numpad${i+1}`)){this.choose(i);return true;}}
    if(input.hit('KeyE','Enter')&&this.modal.options.length===1){this.choose(0);return true;}
    if(input.click){const rects=this.optionRects(this.modal.options.length);for(let i=0;i<rects.length;i++){const r=rects[i];if(this.inRect(input.click,r)){this.choose(i);return true;}}}
    return true;
  }
  inRect(p,r){return p&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;}
  choose(index){const m=this.modal;if(!m||!m.options[index]||m.options[index].disabled)return;const cb=m.onSelect,opt=m.options[index];this.modal=null;cb(index,opt);}
  optionRects(n){
    if(n<=4){const total=420,gap=6,w=(total-(n-1)*gap)/Math.max(1,n),start=320-total/2;return Array.from({length:n},(_,i)=>({x:start+i*(w+gap),y:289,w,h:28}));}
    const cols=3,rows=Math.ceil(n/cols),gap=6,total=420,w=(total-(cols-1)*gap)/cols,start=320-total/2,startY=rows===2?254:222;
    return Array.from({length:n},(_,i)=>({x:start+(i%cols)*(w+gap),y:startY+Math.floor(i/cols)*34,w,h:28}));
  }
  hitCraft(sound){
    const c=this.craft;if(!c)return;let score=0,perfect=false;const kind=c.stage.kind,diff=c.stage.difficulty||1;
    if(RING_KINDS.has(kind)){const delta=Math.abs(c.radius-14);score=100-delta*4.4*diff;perfect=delta<=1.7/diff;sound.hammer();c.radius=44;}
    else{const v=(Math.sin(c.phase*2.2)+1)/2,target=TARGETS[kind]??.5,delta=Math.abs(v-target);score=100-delta*185*diff;perfect=delta<=.012/diff;if(kind==='heat')sound.fire();else sound.tone(kind==='quench'?180:kind==='grind'?290:240,.06,'triangle',.028);}
    c.scores.push(Math.max(0,Math.min(100,score)));c.attempts++;if(perfect){c.perfectHits++;this.perfectFlash=.75;sound.perfect?.();this.showToast('PERFECT!',.75);}
    const need=c.stage.hits||3;if(c.attempts>=need){const avg=c.scores.reduce((a,b)=>a+b,0)/c.scores.length,done=c.onDone,precision={perfectHits:c.perfectHits,hitCount:need,stagePerfect:c.perfectHits>0&&avg>=82};this.craft=null;done(avg,precision);}
  }
  handleShopInput(input,sound){
    if(input.hit('Escape')){this.closeShop();return true;}if(!input.click)return true;const p=input.click,s=this.shop;if(this.inRect(p,{x:548,y:66,w:26,h:22})){this.closeShop();return true;}
    MAT_TYPES.forEach((type,row)=>{const y=126+row*62,unit=s.unitPrice(type),max=Math.max(0,Math.floor(s.getGold()/Math.max(1,unit))),q=s.qty[type];
      const buttons=[{x:245,y:y+17,w:38,h:20,d:-10},{x:286,y:y+17,w:30,h:20,d:-1},{x:365,y:y+17,w:30,h:20,d:1},{x:398,y:y+17,w:38,h:20,d:10}];
      for(const b of buttons)if(this.inRect(p,b)){s.qty[type]=Math.max(1,Math.min(99,q+b.d));sound.tone(310,.04,'square',.015);return;}
      if(this.inRect(p,{x:439,y:y+17,w:42,h:20})){s.qty[type]=Math.max(1,Math.min(99,max||1));sound.tone(370,.04,'square',.015);return;}
      if(this.inRect(p,{x:488,y:y+13,w:70,h:28})){const amount=s.qty[type],cost=unit*amount;if(amount>max){this.showToast('보유 Gold가 부족하다.');return;}const ok=s.onBuy(type,amount);if(ok){sound.coin();s.qty[type]=1;}return;}
    });return true;
  }
  pauseMainRects(){return['continue','save','load','options','title'].map((id,i)=>({id,x:404,y:178+i*31,w:196,h:25}));}
  slotRects(mode){const slots=mode==='save'?SaveSystem.list().slice(1):SaveSystem.list();return slots.map((s,i)=>({slot:s,x:372,y:62+i*35,w:244,h:30,del:s.id!=='auto'?{x:574,y:66+i*35,w:37,h:21}:null}));}
  handlePauseInput(input,sound,scene){
    const p=this.pause;if(input.hit('Escape')){if(p.page==='main')this.closePause();else{p.page='main';p.confirm=null;}return true;}if(!input.click)return true;const c=input.click;
    if(p.page==='main'){
      for(const r of this.pauseMainRects())if(this.inRect(c,r)){sound.tone(330,.045,'square',.018);if(r.id==='continue')this.closePause();else if(r.id==='save')p.page='save';else if(r.id==='load')p.page='load';else if(r.id==='options')p.page='options';else if(r.id==='title')p.page='titleConfirm';return true;}
    }else if(p.page==='save'||p.page==='load'){
      for(const r of this.slotRects(p.page)){if(r.del&&this.inRect(c,r.del)&&r.slot.meta){const back=p.page;p.page='confirmDelete';p.confirm={slot:r.slot.id,back};return true;}if(this.inRect(c,r)){if(p.page==='load'){if(!r.slot.meta){this.showToast('비어 있는 슬롯이다.');return true;}scene.loadFromSlot(r.slot.id);return true;}if(r.slot.meta){p.page='confirmOverwrite';p.confirm={slot:r.slot.id};return true;}scene.saveManual(r.slot.id);this.showToast(`SAVE ${r.slot.id} 저장 완료`);return true;}}
      if(this.inRect(c,{x:382,y:318,w:82,h:22})){p.page='main';return true;}
    }else if(p.page==='options'){
      const sx=426,sw=148;if(this.inRect(c,{x:sx,y:142,w:sw,h:16})){scene.game.sound.setBGMVolume((c.x-sx)/sw);return true;}if(this.inRect(c,{x:sx,y:206,w:sw,h:16})){scene.game.sound.setSFXVolume((c.x-sx)/sw);scene.game.sound.tone(500,.05,'square',.03);return true;}
      if(this.inRect(c,{x:470,y:165,w:92,h:22})){scene.game.sound.muteBGM();return true;}if(this.inRect(c,{x:470,y:229,w:92,h:22})){scene.game.sound.muteSFX();return true;}if(this.inRect(c,{x:382,y:300,w:82,h:22})){p.page='main';return true;}
    }else if(p.page==='confirmOverwrite'){
      if(this.inRect(c,{x:390,y:244,w:88,h:28})){p.page='save';p.confirm=null;return true;}if(this.inRect(c,{x:493,y:244,w:98,h:28})){scene.saveManual(p.confirm.slot);this.showToast(`SAVE ${p.confirm.slot} 덮어쓰기 완료`);p.page='save';p.confirm=null;return true;}
    }else if(p.page==='confirmDelete'){
      if(this.inRect(c,{x:390,y:244,w:88,h:28})){p.page=p.confirm.back;p.confirm=null;return true;}if(this.inRect(c,{x:493,y:244,w:98,h:28})){SaveSystem.delete(p.confirm.slot);this.showToast(`SAVE ${p.confirm.slot} 삭제`);p.page=p.confirm.back;p.confirm=null;return true;}
    }else if(p.page==='titleConfirm'){
      if(this.inRect(c,{x:390,y:244,w:88,h:28})){p.page='main';return true;}if(this.inRect(c,{x:493,y:244,w:98,h:28})){scene.returnToTitle();return true;}
    }return true;
  }
  render(ctx,scene){this.renderHUD(ctx,scene);if(this.toast)this.renderToast(ctx,this.toast);if(this.modal)this.renderModal(ctx,this.modal);if(this.craft)this.renderCraft(ctx,this.craft);if(this.shop)this.renderShopUI(ctx,scene);if(this.pause)this.renderPause(ctx,scene);if(this.perfectFlash>0)this.renderPerfectFlash(ctx);}
  renderHUD(ctx,s){
    ctx.fillStyle='#21160f';ctx.fillRect(0,0,640,31);ctx.fillStyle='#6f4d2f';ctx.fillRect(0,28,640,3);ctx.textBaseline='middle';
    ctx.font='bold 9px monospace';ctx.fillStyle='#f2d9a6';ctx.fillText(s.calendar?.format(true)||`DAY ${s.day}`,8,10);ctx.font='bold 14px monospace';ctx.fillStyle='#fff0c6';ctx.fillText(s.time.format(),8,22);
    ctx.font='bold 10px monospace';ctx.fillStyle=s.shopOpen?'#a8d18f':'#d7a17b';ctx.fillText(s.shopOpen?'OPEN':'CLOSED',78,21);ctx.fillStyle='#f2d9a6';ctx.fillText(`G ${s.economy.gold}`,148,14);ctx.fillText(`평판 ${s.economy.reputation}`,218,14);ctx.fillText(`진열 ${s.display.count()}/5`,298,14);ctx.fillText(`청결 ${Math.round(s.maintenance.cleanliness)}`,371,14);ctx.fillStyle='#e8bd72';ctx.fillText(`조작 ${s.controlled==='older'?'형':'동생'} · ${s.floor==='loft'?'2층':'1층'} [Q]`,455,14);
    ctx.fillStyle='#2f2016';ctx.fillRect(6,35,365,18);ctx.fillStyle='#d9bd8b';ctx.font='9px monospace';ctx.fillText(`소식 · ${s.events.activeEvent?.title||'평온한 하루'}`,12,44);if(s.broomEquipped){ctx.fillStyle='#f0c56e';ctx.fillText('빗자루 장착',378,44);}if(s.orders.openOrders().length){ctx.fillStyle='#3a2417';ctx.fillRect(486,35,146,18);ctx.fillStyle='#e8c285';ctx.fillText(`미납 주문 ${s.orders.openOrders().length}건`,494,44);}
  }
  panel(ctx,x,y,w,h){ctx.fillStyle='#281a12';ctx.fillRect(x-3,y-3,w+6,h+6);ctx.fillStyle='#8c653d';ctx.fillRect(x,y,w,h);ctx.fillStyle='#ead3a4';ctx.fillRect(x+3,y+3,w-6,h-6);ctx.fillStyle='#563922';ctx.fillRect(x+6,y+6,w-12,h-12);}
  wrap(ctx,text,x,y,maxW,lineH=14,maxLines=6){const words=String(text).split(/\s+/);let line='',lines=[];for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxW&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(l,x,y+i*lineH));}
  renderModal(ctx,m){
    ctx.fillStyle='#0009';ctx.fillRect(0,0,640,360);this.panel(ctx,82,118,476,214);ctx.fillStyle='#f4dba6';ctx.font='bold 13px monospace';ctx.textBaseline='top';ctx.fillText(m.title,104,140);ctx.fillStyle='#eee1c5';ctx.font='10px monospace';this.wrap(ctx,m.text,104,160,432,14,6);
    const rects=this.optionRects(m.options.length);m.options.forEach((o,i)=>{const r=rects[i];ctx.fillStyle='#2b1c13';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#b8864c';ctx.fillRect(r.x+2,r.y+2,r.w-4,r.h-4);ctx.fillStyle=o.disabled?'#3b3129':'#24170f';ctx.fillRect(r.x+4,r.y+4,r.w-8,r.h-8);ctx.fillStyle=o.disabled?'#756a5d':'#f4ddb0';ctx.font='9px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`${i+1}. ${o.label}`,r.x+r.w/2,r.y+r.h/2);ctx.textAlign='left';});ctx.fillStyle='#bfa57d';ctx.font='8px monospace';ctx.fillText('숫자키 또는 클릭 · ESC 닫기',104,321);
  }
  renderToast(ctx,text){ctx.font='10px monospace';const w=Math.min(590,ctx.measureText(text).width+28),x=(640-w)/2;ctx.fillStyle='#17100de8';ctx.fillRect(x,329,w,23);ctx.fillStyle='#c99755';ctx.fillRect(x,329,w,2);ctx.fillStyle='#f2deba';ctx.textBaseline='middle';ctx.fillText(text,x+13,341);}
  renderCraft(ctx,c){
    ctx.fillStyle='#000b';ctx.fillRect(0,0,640,360);this.panel(ctx,96,83,448,208);ctx.fillStyle='#f4dba6';ctx.font='bold 14px monospace';ctx.textBaseline='middle';ctx.fillText(`${c.meta.itemName||'제작'} · ${c.stage.label}`,118,108);ctx.fillStyle='#cdb78e';ctx.font='9px monospace';ctx.fillText(`${c.meta.workerName||''} · 작업대: ${stationName(c.stage.station)} · E 타이밍 입력`,118,128);const kind=c.stage.kind,diff=c.stage.difficulty||1;
    if(RING_KINDS.has(kind)){const cx=320,cy=190;ctx.strokeStyle='#d7a75a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,14,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#fff1a1';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,15.7/diff,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#f0e1c5';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,c.radius,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#847165';ctx.fillRect(cx-34,cy+37,68,12);ctx.fillStyle='#c99a5a';ctx.fillRect(cx-18,cy+26,36,14);
    }else{const x=126,y=178,w=388,v=(Math.sin(c.phase*2.2)+1)/2,target=TARGETS[kind]??.5,zone=Math.max(.07,.12/diff),perfect=.012/diff;ctx.fillStyle='#211a16';ctx.fillRect(x,y,w,24);ctx.fillStyle=kind==='heat'?'#c55c29':kind==='quench'?'#4f7680':kind==='grind'?'#677966':'#7f704f';ctx.fillRect(x+(target-zone)*w,y+2,zone*2*w,20);ctx.fillStyle='#ffe26a';ctx.fillRect(x+(target-perfect)*w,y,Math.max(2,perfect*2*w),24);ctx.fillStyle='#fff0bd';ctx.fillRect(x+v*w-2,y-5,4,34);}
    ctx.fillStyle='#f0d7aa';ctx.font='10px monospace';ctx.fillText(`입력 ${c.attempts}/${c.stage.hits||3} · PERFECT ${c.perfectHits}`,118,244);ctx.fillStyle='#baa27c';ctx.font='9px monospace';ctx.fillText('금빛의 아주 얇은 구간을 정확히 노리면 특성 확률이 오른다.',118,265);
  }
  renderPerfectFlash(ctx){const a=Math.min(1,this.perfectFlash*2);ctx.fillStyle=`rgba(255,226,106,${a*.12})`;ctx.fillRect(0,0,640,360);ctx.fillStyle=`rgba(255,238,160,${a})`;ctx.font='bold 18px monospace';ctx.textAlign='center';ctx.fillText('PERFECT',320,70);ctx.textAlign='left';}
  renderShopUI(ctx,scene){
    const s=this.shop;ctx.fillStyle='#0009';ctx.fillRect(0,0,640,360);this.panel(ctx,64,60,512,258);ctx.fillStyle='#f5dca7';ctx.font='bold 14px monospace';ctx.fillText('재료 상인 · 한꺼번에 구매',86,82);ctx.fillStyle='#cdb58c';ctx.font='9px monospace';ctx.fillText(`${s.saleText} 보유 ${s.getGold()}G · ESC/X로 닫기`,86,101);ctx.fillStyle='#291b13';ctx.fillRect(548,66,26,22);ctx.fillStyle='#f1d4a0';ctx.fillText('X',557,78);
    MAT_TYPES.forEach((type,row)=>{const y=126+row*62,unit=s.unitPrice(type),q=s.qty[type],total=unit*q,max=Math.floor(s.getGold()/Math.max(1,unit));ctx.fillStyle='#ead8b4';ctx.font='bold 11px monospace';ctx.fillText(`${MATERIAL_NAMES[type]}  개당 ${unit}G${s.isSale(type)?'  SALE':''}`,88,y);ctx.fillStyle='#bfa47b';ctx.font='8px monospace';ctx.fillText(`보유 ${scene.inventory.materials[type]||0} · 총 ${total}G`,88,y+21);
      const defs=[['-10',245,38],['-1',286,30],[String(q),320,42],['+1',365,30],['+10',398,38],['MAX',439,42],['구매',488,70]];defs.forEach(([lab,x,w])=>{ctx.fillStyle=lab===String(q)?'#4b3525':'#241811';ctx.fillRect(x,y+17,w,20);ctx.strokeStyle='#a87942';ctx.strokeRect(x+.5,y+17.5,w-1,19);ctx.fillStyle=total>s.getGold()&&lab==='구매'?'#74675a':'#f2dcb2';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(lab,x+w/2,y+28);ctx.textAlign='left';});if(max<=0){ctx.fillStyle='#b96b5f';ctx.fillText('구매 불가',488,y+45);}
    });
  }
  renderPause(ctx,scene){
    const p=this.pause,slide=p.slide,x=640-282*slide;ctx.fillStyle=`rgba(0,0,0,${.38*slide})`;ctx.fillRect(0,0,640,360);ctx.fillStyle='#1e130e';ctx.fillRect(x,0,282,360);ctx.fillStyle='#795334';ctx.fillRect(x+4,0,4,360);ctx.fillStyle='#3b281b';ctx.fillRect(x+8,0,274,360);ctx.fillStyle='#d1a15c';ctx.fillRect(x+18,16,244,2);ctx.fillStyle='#f0d8aa';ctx.font='bold 13px monospace';ctx.fillText(p.page==='main'?'일시정지':p.page==='save'?'저장하기':p.page==='load'?'불러오기':p.page==='options'?'옵션':'확인',x+24,37);
    if(p.page==='main')this.renderPauseMain(ctx,scene,x);else if(p.page==='save'||p.page==='load')this.renderSlotPage(ctx,p.page,x);else if(p.page==='options')this.renderOptions(ctx,scene,x);else this.renderConfirm(ctx,p,x);
  }
  renderPauseMain(ctx,s,x){const rent=s.rent.nextDue(s.calendar),m=s.inventory.materials;ctx.fillStyle='#d8c29c';ctx.font='9px monospace';ctx.fillText(s.calendar.format(),x+24,61);ctx.fillStyle='#fff0c7';ctx.font='bold 17px monospace';ctx.fillText(s.time.format(),x+24,82);ctx.font='bold 10px monospace';ctx.fillStyle=s.shopOpen?'#a5d091':'#d9a083';ctx.fillText(s.shopOpen?'대장간 OPEN':'대장간 CLOSED',x+24,102);ctx.fillStyle='#d8c29c';ctx.font='9px monospace';ctx.fillText(`Gold ${s.economy.gold}G · 평판 ${s.economy.reputation}`,x+24,123);ctx.fillText(`철 ${m.iron} · 목재 ${m.wood} · 가죽 ${m.leather}`,x+24,140);ctx.fillText(`주문 ${s.orders.openOrders().length} · 진열 ${s.display.count()}/5`,x+24,154);ctx.fillStyle='#e4bd72';ctx.fillText(`다음 임대료 ${rent.name} · ${rent.days}일 후 · ${rent.amount}G`,x+24,169);for(const r of this.pauseMainRects()){ctx.fillStyle='#24170f';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#a8753f';ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);ctx.fillStyle='#f2dcb1';ctx.font='9px monospace';ctx.textAlign='center';const labels={continue:'게임 계속하기',save:'저장하기',load:'불러오기',options:'옵션',title:'메인 메뉴로'};ctx.fillText(labels[r.id],r.x+r.w/2,r.y+14);ctx.textAlign='left';}ctx.fillStyle='#a99270';ctx.font='8px monospace';ctx.fillText('ESC 다시 누르면 게임으로 복귀',x+24,344);}
  renderSlotPage(ctx,mode,x){const rows=this.slotRects(mode);for(const r of rows){const m=r.slot.meta;ctx.fillStyle='#241811';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle=m?'#a87742':'#5d4737';ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);ctx.fillStyle=m?'#f0d5a6':'#8d7a64';ctx.font='bold 8px monospace';ctx.fillText(r.slot.label,r.x+7,r.y+9);ctx.font='7px monospace';if(m&&!m.corrupt){ctx.fillText(`${m.date} ${m.time} · ${m.gold}G · 평판 ${m.reputation}`,r.x+7,r.y+18);ctx.fillStyle='#a99372';ctx.fillText(`${fmtPlay(m.playTimeSeconds)} · ${fmtSaved(m.savedAt)}`,r.x+7,r.y+27);}else ctx.fillText(m?.corrupt?'손상된 저장':'비어 있음',r.x+7,r.y+21);if(r.del&&m){ctx.fillStyle='#4a2921';ctx.fillRect(r.del.x,r.del.y,r.del.w,r.del.h);ctx.fillStyle='#e0b29c';ctx.textAlign='center';ctx.fillText('삭제',r.del.x+r.del.w/2,r.del.y+13);ctx.textAlign='left';}}
    ctx.fillStyle='#2a1b12';ctx.fillRect(382,318,82,22);ctx.fillStyle='#eed6aa';ctx.fillText('← 뒤로',402,332);
  }
  renderOptions(ctx,scene,x){const a=scene.game.sound;ctx.fillStyle='#d8c29c';ctx.font='9px monospace';ctx.fillText(`BGM  ${Math.round(a.bgmVolume*100)}%`,x+28,127);this.renderSlider(ctx,426,142,148,a.bgmVolume);ctx.fillStyle='#2b1b13';ctx.fillRect(470,165,92,22);ctx.fillStyle='#eed8ae';ctx.fillText(a.bgmMuted?'BGM 음소거 해제':'BGM 음소거',479,179);ctx.fillStyle='#d8c29c';ctx.fillText(`효과음  ${Math.round(a.sfxVolume*100)}%`,x+28,191);this.renderSlider(ctx,426,206,148,a.sfxVolume);ctx.fillStyle='#2b1b13';ctx.fillRect(470,229,92,22);ctx.fillStyle='#eed8ae';ctx.fillText(a.sfxMuted?'SFX 음소거 해제':'SFX 음소거',479,243);ctx.fillStyle='#a89371';ctx.font='8px monospace';ctx.fillText('설정은 모든 세이브에 공통으로 저장됩니다.',x+24,274);ctx.fillStyle='#2a1b12';ctx.fillRect(382,300,82,22);ctx.fillStyle='#eed6aa';ctx.fillText('← 뒤로',402,314);}
  renderSlider(ctx,x,y,w,v){ctx.fillStyle='#241812';ctx.fillRect(x,y,w,16);ctx.fillStyle='#8c6337';ctx.fillRect(x+4,y+6,w-8,4);ctx.fillStyle='#d9b15e';ctx.fillRect(x+4,y+6,(w-8)*v,4);ctx.fillStyle='#f2dca8';ctx.fillRect(x+Math.round((w-10)*v),y+2,6,12);}
  renderConfirm(ctx,p,x){let text='';if(p.page==='confirmOverwrite')text=`SAVE ${p.confirm.slot}을 덮어쓰시겠습니까?`;else if(p.page==='confirmDelete')text=`정말 SAVE ${p.confirm.slot}을 삭제하시겠습니까?`;else text='저장하지 않은 진행은 사라질 수 있습니다. 메인 메뉴로 돌아갈까요?';ctx.fillStyle='#e6cfaa';ctx.font='9px monospace';this.wrap(ctx,text,x+24,86,230,16,5);ctx.fillStyle='#2b1b13';ctx.fillRect(390,244,88,28);ctx.fillRect(493,244,98,28);ctx.strokeStyle='#9c6c3b';ctx.strokeRect(390.5,244.5,87,27);ctx.strokeRect(493.5,244.5,97,27);ctx.fillStyle='#f0d7aa';ctx.textAlign='center';ctx.fillText('취소',434,260);ctx.fillText(p.page==='confirmDelete'?'삭제':p.page==='titleConfirm'?'메인 메뉴':'저장',542,260);ctx.textAlign='left';}
}
