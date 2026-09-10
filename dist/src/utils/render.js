import { STATIONS, SHOP_DEPTHS, SHOP_LABELS, LOFT_STATIONS, LOFT_DEPTHS, LOFT_PROPS } from '../data/GameData.js';
export function pxRect(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
const FONT='"Malgun Gothic", system-ui, sans-serif';
function textLabel(ctx,text,x,y){ctx.save();ctx.fillStyle='#f3e5c4';ctx.font=`8px ${FONT}`;ctx.textBaseline='top';ctx.shadowColor='#24160f';ctx.shadowBlur=0;ctx.fillText(text,Math.round(x),Math.round(y));ctx.restore();}
export function renderShopLabels(ctx){for(const [id,p] of Object.entries(SHOP_LABELS)){const s=STATIONS[id];if(s?.showLabel!==false)textLabel(ctx,s.label,p.x,p.y);}}

export function renderShopBase(ctx,t,{shopOpen=false,cleanliness=100,minute=720}={}){
  pxRect(ctx,0,0,640,360,'#17110d');pxRect(ctx,0,30,640,96,'#584a3b');
  for(let y=34;y<126;y+=16){for(let x=((y/16)%2)*14-14;x<640;x+=28)pxRect(ctx,x,y,26,14,(x/28+y/16)%2?'#625242':'#504437');}
  pxRect(ctx,0,118,640,8,'#2f2015');pxRect(ctx,22,30,10,96,'#3b2819');pxRect(ctx,610,30,10,96,'#3b2819');
  pxRect(ctx,0,126,640,234,'#785536');ctx.strokeStyle='#604126';ctx.lineWidth=2;for(let y=140;y<370;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(640,y-8);ctx.stroke();}ctx.strokeStyle='#68472b';for(let x=-100;x<740;x+=80){ctx.beginPath();ctx.moveTo(x,126);ctx.lineTo(x+120,360);ctx.stroke();}
  // Work area is visually denser, customer area intentionally calmer.
  ctx.fillStyle='#5d412b44';ctx.fillRect(34,132,370,190);ctx.strokeStyle='#8c654033';ctx.strokeRect(34.5,132.5,369,189);ctx.fillStyle='#8a6a4630';ctx.fillRect(410,132,196,194);
  // North-wall window.
  pxRect(ctx,266,48,76,47,'#2b2119');const wm=((minute%1440)+1440)%1440;let sky=wm<420?'#263a58':wm<540?'#6f8d9a':wm<1020?'#9fbfd0':wm<1140?'#d69b68':wm<1260?'#76627c':'#1d2944';pxRect(ctx,271,53,66,37,sky);pxRect(ctx,302,53,4,37,'#43301f');pxRect(ctx,271,69,66,4,'#43301f');if(wm>=420&&wm<1140){const a=wm<540?.10:wm<1020?.16:.07;ctx.fillStyle=`rgba(239,211,145,${a})`;ctx.beginPath();ctx.moveTo(271,90);ctx.lineTo(392,243);ctx.lineTo(326,243);ctx.lineTo(289,90);ctx.fill();}
  drawToolWall(ctx);
  if(cleanliness<55){ctx.fillStyle='#4d332055';ctx.fillRect(416,294,150,3);}
}

export function getShopDrawables(ctx,t,{display=null,shopOpen=false}={}){
  return[
    {id:'display',baseY:SHOP_DEPTHS.display,draw:()=>drawDisplay(ctx,STATIONS.display,display)},
    {id:'fuel',baseY:SHOP_DEPTHS.fuel,draw:()=>drawFuel(ctx,STATIONS.fuel)},
    {id:'anvil',baseY:SHOP_DEPTHS.anvil,draw:()=>drawAnvil(ctx,STATIONS.anvil)},
    {id:'water',baseY:SHOP_DEPTHS.water,draw:()=>drawWater(ctx,STATIONS.water)},
    {id:'forge',baseY:SHOP_DEPTHS.forge,draw:()=>drawForge(ctx,STATIONS.forge,t)},
    {id:'stairs',baseY:SHOP_DEPTHS.stairs,draw:()=>drawStairs(ctx,STATIONS.stairs,'up')},
    {id:'bench',baseY:SHOP_DEPTHS.bench,draw:()=>drawBench(ctx,STATIONS.bench)},
    {id:'grind',baseY:SHOP_DEPTHS.grind,draw:()=>drawGrind(ctx,STATIONS.grind)},
    {id:'counter-top',baseY:SHOP_DEPTHS.counterTop,draw:()=>drawCounterTop(ctx,STATIONS.counter)},
    {id:'storage',baseY:SHOP_DEPTHS.storage,draw:()=>drawStorage(ctx,STATIONS.storage)},
    {id:'counter-leg',baseY:SHOP_DEPTHS.counterLeg,draw:()=>drawCounterLeg(ctx,STATIONS.counter)},
    {id:'sign',baseY:SHOP_DEPTHS.sign,draw:()=>drawSign(ctx,STATIONS.sign,shopOpen)},
    {id:'broom',baseY:SHOP_DEPTHS.broom,draw:()=>drawBroom(ctx,STATIONS.broom)},
    {id:'door',baseY:SHOP_DEPTHS.door,draw:()=>drawDoor(ctx,STATIONS.door)},
  ];
}
export function renderShop(ctx,t,state={}){renderShopBase(ctx,t,state);for(const d of getShopDrawables(ctx,t,state).sort((a,b)=>a.baseY-b.baseY))d.draw();renderShopLabels(ctx);}

// ---------------------------------------------------------------------------
// 2F: wall layer -> floor rug -> floor-fixed furniture sorted by footprint
// baseY -> characters.  Static bed labels are intentionally omitted; proximity
// prompts are clearer and stop chests/boots from covering text.
// ---------------------------------------------------------------------------
export function renderLoftBase(ctx,t,minute=720){
  pxRect(ctx,0,0,640,360,'#17110d');pxRect(ctx,0,30,640,106,'#4b392c');
  for(let y=34;y<136;y+=18){for(let x=((y/18)%2)*28-28;x<640;x+=56)pxRect(ctx,x,y,53,16,(x/56+y/18)%2?'#574231':'#49382c');}
  pxRect(ctx,0,136,640,224,'#6b4b32');ctx.strokeStyle='#553821';ctx.lineWidth=2;for(let y=150;y<370;y+=26){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(640,y-5);ctx.stroke();}for(let x=-80;x<720;x+=92){ctx.strokeStyle='#5d3f28';ctx.beginPath();ctx.moveTo(x,136);ctx.lineTo(x+110,360);ctx.stroke();}
  pxRect(ctx,34,44,572,8,'#2f2118');pxRect(ctx,44,48,8,88,'#332318');pxRect(ctx,588,48,8,88,'#332318');
  drawLoftWindow(ctx,LOFT_STATIONS.window,t,minute);drawWardrobe(ctx,LOFT_STATIONS.wardrobe);drawLamp(ctx,LOFT_STATIONS.lamp,t);
  drawWardrobeLife(ctx);
  // Shared rug is flat floor art, never a collision obstacle.
  const r=LOFT_PROPS.rug;pxRect(ctx,r.x,r.y,r.w,r.h,'#55352d');pxRect(ctx,r.x+7,r.y+6,r.w-14,r.h-12,'#775044');for(let i=0;i<5;i++)pxRect(ctx,r.x+18+i*30,r.y+r.h-10,16,3,'#9a6950');
}
export function getLoftDrawables(ctx,t){return[
  {id:'table',baseY:LOFT_DEPTHS.table,draw:()=>drawSmallTable(ctx,LOFT_STATIONS.table)},
  {id:'older-chest',baseY:LOFT_DEPTHS.olderChest,draw:()=>drawOlderChest(ctx,LOFT_PROPS.olderChest)},
  {id:'younger-chest',baseY:LOFT_DEPTHS.youngerChest,draw:()=>drawYoungerChest(ctx,LOFT_PROPS.youngerChest)},
  {id:'older-bed',baseY:LOFT_DEPTHS.olderBed,draw:()=>drawBed(ctx,LOFT_STATIONS.olderBed,'#75483c')},
  {id:'younger-bed',baseY:LOFT_DEPTHS.youngerBed,draw:()=>drawBed(ctx,LOFT_STATIONS.youngerBed,'#425f7e')},
  {id:'stairs-down',baseY:LOFT_DEPTHS.stairsDown,draw:()=>drawStairs(ctx,LOFT_STATIONS.stairsDown,'down')},
];}
export function renderLoft(ctx,t,minute=720){renderLoftBase(ctx,t,minute);for(const d of getLoftDrawables(ctx,t).sort((a,b)=>a.baseY-b.baseY))d.draw();}

function drawLoftWindow(ctx,s,t,minute=720){const m=((minute%1440)+1440)%1440;const sky=m<420?'#20304c':m<540?'#6d8790':m<1020?'#91b0b6':m<1140?'#c98b63':m<1260?'#665a79':'#17223b';pxRect(ctx,s.x,s.y,s.w,s.h,'#2a2019');pxRect(ctx,s.x+6,s.y+6,s.w-12,s.h-12,sky);pxRect(ctx,s.x+s.w/2-2,s.y+6,4,s.h-12,'#3f3024');pxRect(ctx,s.x+6,s.y+s.h/2-2,s.w-12,4,'#3f3024');if(m>=420&&m<1140){ctx.fillStyle=`rgba(238,196,118,${m<540?.06:m<1020?.11:.04})`;ctx.beginPath();ctx.moveTo(s.x+8,s.y+s.h-8);ctx.lineTo(s.x+130,250);ctx.lineTo(s.x+60,250);ctx.fill();}}
function drawWardrobe(ctx,s){pxRect(ctx,s.x,s.y,s.w,s.h,'#3b281c');pxRect(ctx,s.x+5,s.y+5,s.w-10,s.h-10,'#67462c');pxRect(ctx,s.x+s.w/2-2,s.y+7,4,s.h-14,'#3b281c');pxRect(ctx,s.x+s.w/2-9,s.y+36,4,4,'#c49a52');pxRect(ctx,s.x+s.w/2+5,s.y+36,4,4,'#c49a52');}
function drawWardrobeLife(ctx){pxRect(ctx,132,76,5,42,'#6c4b34');pxRect(ctx,126,82,17,20,'#875d3b');pxRect(ctx,143,112,8,5,'#8f6d4f');pxRect(ctx,153,112,8,5,'#8f6d4f');}
function drawSmallTable(ctx,s){pxRect(ctx,s.x,s.y+8,s.w,s.h-22,'#65442b');pxRect(ctx,s.x+5,s.y,s.w-10,14,'#89603a');pxRect(ctx,s.x+9,s.y+28,7,22,'#3b281b');pxRect(ctx,s.x+s.w-16,s.y+28,7,22,'#3b281b');
  // Tabletop plane: every small prop is anchored inside the top rectangle.
  pxRect(ctx,s.x+12,s.y+3,7,8,'#6a574a');pxRect(ctx,s.x+24,s.y+3,7,8,'#6a574a');pxRect(ctx,s.x+39,s.y+5,17,6,'#c49b59');pxRect(ctx,s.x+62,s.y+1,3,10,'#e2d4a6');pxRect(ctx,s.x+61,s.y-2,5,4,'#f2b64a');pxRect(ctx,s.x+9,s.y+11,4,4,'#d8c594');pxRect(ctx,s.x+17,s.y+12,4,4,'#d8c594');pxRect(ctx,s.x+69,s.y+8,7,5,'#5e4533');}
function drawLamp(ctx,s,t){pxRect(ctx,s.x+15,s.y,4,22,'#4b3423');pxRect(ctx,s.x+7,s.y+18,20,20,'#77552d');const flick=2+Math.round(Math.sin(t*9));pxRect(ctx,s.x+12,s.y+21+flick,10,12-flick,'#f2b443');ctx.fillStyle='#f5be4b18';ctx.beginPath();ctx.arc(s.x+17,s.y+28,34,0,Math.PI*2);ctx.fill();}

function drawForge(ctx,s,t){pxRect(ctx,s.x,s.y,s.w,s.h,'#382a20');pxRect(ctx,s.x+8,s.y+13,52,45,'#211714');pxRect(ctx,s.x+13,s.y+20,42,31,'#7a2a18');const flick=3+Math.round(Math.sin(t*8)*2);pxRect(ctx,s.x+18,s.y+27,32,20,'#d45b20');pxRect(ctx,s.x+25,s.y+22+flick,18,22-flick,'#ffb53e');pxRect(ctx,s.x+65,s.y+5,9,55,'#211714');pxRect(ctx,s.x+61,s.y+2,17,7,'#604430');}
function drawDisplay(ctx,s,display){pxRect(ctx,s.x,s.y,s.w,s.h,'#382519');pxRect(ctx,s.x+3,s.y+5,s.w-6,6,'#7a5536');pxRect(ctx,s.x+4,s.y+38,s.w-8,6,'#7a5536');pxRect(ctx,s.x+6,s.y+58,s.w-12,5,'#5d3c27');if(display){display.slots.forEach((item,i)=>{if(!item)return;const x=s.x+11+(i%3)*24,y=s.y+16+Math.floor(i/3)*25;drawTinyItem(ctx,item.itemId,x,y);});}}
function drawTinyItem(ctx,id,x,y){if(['dagger','sword','longsword'].includes(id)){pxRect(ctx,x,y,3,id==='longsword'?22:id==='sword'?18:13,'#bdc5c2');pxRect(ctx,x-3,y+10,9,3,'#9b6b39');pxRect(ctx,x,y+13,3,7,'#5d3c25');}else if(id==='shield'){pxRect(ctx,x-6,y,14,16,'#8c704e');pxRect(ctx,x-4,y+2,10,12,'#8fa0a1');}else if(id==='bow'){ctx.strokeStyle='#b88a52';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y+9,8,-1.1,1.1);ctx.stroke();ctx.strokeStyle='#ddd0b6';ctx.beginPath();ctx.moveTo(x+4,y+2);ctx.lineTo(x+4,y+16);ctx.stroke();}else{for(let k=0;k<3;k++){pxRect(ctx,x+k*3,y,1,18,'#b6a36e');pxRect(ctx,x+k*3-1,y,3,3,'#a4a9a7');}}}
function drawAnvil(ctx,s){pxRect(ctx,s.x+7,s.y+22,39,11,'#23282a');pxRect(ctx,s.x+14,s.y+12,29,12,'#555e60');pxRect(ctx,s.x+7,s.y+8,40,7,'#7f8887');pxRect(ctx,s.x+18,s.y+32,18,5,'#1c1c1c');}
function drawBench(ctx,s){pxRect(ctx,s.x,s.y+12,s.w,23,'#4b2f1c');pxRect(ctx,s.x+5,s.y+6,s.w-10,12,'#815b37');pxRect(ctx,s.x+8,s.y+35,7,13,'#3a2619');pxRect(ctx,s.x+s.w-15,s.y+35,7,13,'#3a2619');
  // Workbench props are constrained to the tabletop plane.
  pxRect(ctx,s.x+12,s.y+8,19,5,'#68645c');pxRect(ctx,s.x+38,s.y+9,12,4,'#b08b4d');pxRect(ctx,s.x+58,s.y+7,18,7,'#d3bd87');pxRect(ctx,s.x+81,s.y+9,10,5,'#6f5440');for(let i=0;i<4;i++)pxRect(ctx,s.x+20+i*19,s.y+16,5,3,i%2?'#73675c':'#a78a5c');}
function drawGrind(ctx,s){pxRect(ctx,s.x+4,s.y+29,52,13,'#4c3423');ctx.fillStyle='#6f7774';ctx.beginPath();ctx.arc(s.x+30,s.y+22,17,0,Math.PI*2);ctx.fill();ctx.fillStyle='#a0a39d';ctx.beginPath();ctx.arc(s.x+30,s.y+22,10,0,Math.PI*2);ctx.fill();pxRect(ctx,s.x+29,s.y+5,3,34,'#31251d');pxRect(ctx,s.x+50,s.y+7,5,22,'#8b5d31');}
function drawWater(ctx,s){pxRect(ctx,s.x+3,s.y+10,s.w-6,s.h-10,'#4b3828');pxRect(ctx,s.x+6,s.y+13,s.w-12,s.h-17,'#496d72');pxRect(ctx,s.x+2,s.y+8,s.w-4,5,'#7b5a3d');}
function drawStorage(ctx,s){pxRect(ctx,s.x-2,s.y+19,s.w+4,4,'#33241866');pxRect(ctx,s.x,s.y+14,s.w,s.h-14,'#5b3b22');pxRect(ctx,s.x+5,s.y+8,36,28,'#825632');pxRect(ctx,s.x+45,s.y+20,34,24,'#47301f');pxRect(ctx,s.x+8,s.y+13,30,4,'#9c754e');for(let i=0;i<3;i++)pxRect(ctx,s.x+50+i*8,s.y+8,6,18,'#77736b');}
function drawFuel(ctx,s){pxRect(ctx,s.x+2,s.y+25,38,20,'#4b321f');for(let i=0;i<5;i++){pxRect(ctx,s.x+5+i*7,s.y+12+(i%2)*4,5,23,'#765034');pxRect(ctx,s.x+4+i*7,s.y+13+(i%2)*4,7,4,'#9a6b42');}pxRect(ctx,s.x+27,s.y+30,14,15,'#25211f');pxRect(ctx,s.x+30,s.y+26,9,6,'#37322f');}
function drawToolWall(ctx){
  // True wall layer: racks share the window's vertical grammar, not floor furniture's.
  const y=57;pxRect(ctx,86,y-4,144,4,'#3d2a1c');for(let i=0;i<6;i++){pxRect(ctx,100+i*21,y,3,19+(i%2)*4,'#4b3423');pxRect(ctx,95+i*21,y+2,13,4,'#77756f');}
  pxRect(ctx,374,61,105,5,'#3d2a1c');for(let i=0;i<7;i++)pxRect(ctx,382+i*13,67,5,8+(i%3)*5,i%2?'#7b6752':'#555a58');
}
function drawCounterTop(ctx,s){pxRect(ctx,s.x,s.y+8,s.w,s.h-8,'#3c281b');pxRect(ctx,s.x-4,s.y,s.w+8,12,'#7d5838');pxRect(ctx,s.x+8,s.y+15,s.w-16,13,'#593a24');
  // Ledger / coins / wrapping cloth are all on the top plane, never floating in base render.
  pxRect(ctx,s.x+20,s.y+3,20,6,'#d0b57e');pxRect(ctx,s.x+49,s.y+3,14,7,'#6d3c2a');pxRect(ctx,s.x+77,s.y+4,18,5,'#a17a43');pxRect(ctx,s.x+101,s.y+5,11,4,'#c59c52');}
function drawCounterLeg(ctx,s){const lx=s.x+s.w-30;pxRect(ctx,lx,s.y+28,30,44,'#3c281b');pxRect(ctx,lx-4,s.y+27,38,10,'#7d5838');pxRect(ctx,lx+7,s.y+39,16,27,'#593a24');}
function drawBed(ctx,s,blanket='#6d4a62'){
  if(s.orientation==='vertical'){
    pxRect(ctx,s.x,s.y,s.w,s.h,'#4b2f20');pxRect(ctx,s.x+5,s.y+5,s.w-10,s.h-10,'#8d5d4b');pxRect(ctx,s.x+8,s.y+8,s.w-16,22,'#d3c29f');pxRect(ctx,s.x+9,s.y+32,s.w-18,s.h-42,blanket);pxRect(ctx,s.x+3,s.y+s.h-8,s.w-6,6,'#3f291c');
  }else{pxRect(ctx,s.x,s.y+9,s.w,s.h-9,'#4b2f20');pxRect(ctx,s.x+5,s.y+5,s.w-10,32,'#8d5d4b');pxRect(ctx,s.x+8,s.y+7,26,12,'#d3c29f');pxRect(ctx,s.x+35,s.y+8,s.w-42,24,blanket);}
}
function drawOlderChest(ctx,s){pxRect(ctx,s.x,s.y+5,s.w,s.h-5,'#4b2f20');pxRect(ctx,s.x+4,s.y+2,s.w-8,21,'#725037');pxRect(ctx,s.x+23,s.y,8,4,'#c08c45');pxRect(ctx,s.x-18,s.y+13,12,8,'#35291f');pxRect(ctx,s.x-4,s.y+18,11,7,'#35291f');pxRect(ctx,s.x+35,s.y-7,24,3,'#77736b');pxRect(ctx,s.x+55,s.y-11,5,12,'#67452b');}
function drawYoungerChest(ctx,s){pxRect(ctx,s.x,s.y+5,s.w,s.h-5,'#493528');pxRect(ctx,s.x+4,s.y+2,s.w-8,20,'#6a4b35');pxRect(ctx,s.x+20,s.y,7,4,'#c6a05c');pxRect(ctx,s.x-2,s.y-9,25,6,'#7a6c5c');pxRect(ctx,s.x,s.y-15,23,5,'#967a62');pxRect(ctx,s.x+30,s.y-10,15,4,'#5b4938');}
function drawStairs(ctx,s,dir='up'){if(dir==='up'){
  // Side stair is part of the left wall, with a dark pocket that explains where it rises.
  pxRect(ctx,s.x-3,s.y+2,10,s.h-2,'#2d2018');pxRect(ctx,s.x+5,s.y+2,7,s.h-10,'#38261a');pxRect(ctx,s.x+s.w-8,s.y+4,6,s.h-8,'#38261a');pxRect(ctx,s.x+9,s.y+4,s.w-20,24,'#211914');
  ctx.strokeStyle='#4b321f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(s.x+10,s.y+s.h-8);ctx.lineTo(s.x+s.w-10,s.y+12);ctx.stroke();
  for(let i=0;i<8;i++){const y=s.y+s.h-14-i*10,x=s.x+8+i*5;pxRect(ctx,x,y,Math.max(18,s.w-16-i*4),6,'#8a633d');pxRect(ctx,x,y+5,Math.max(18,s.w-16-i*4),2,'#51351f');}
  pxRect(ctx,s.x+s.w-12,s.y+4,6,18,'#725033');pxRect(ctx,s.x+s.w-14,s.y+3,12,4,'#a77a4a');
}else{pxRect(ctx,s.x,s.y+4,s.w,s.h-4,'#3c2a1e');pxRect(ctx,s.x+4,s.y+4,s.w-8,12,'#211914');for(let i=0;i<5;i++){const w=s.w-10-i*10,x=s.x+i*5,y=s.y+s.h-8-i*8;pxRect(ctx,x,y,w,6,'#84603e');}pxRect(ctx,s.x+4,s.y,s.w-8,4,'#2e2018');}}
function drawBroom(ctx,s){pxRect(ctx,s.x+13,s.y,3,29,'#9c7448');for(let i=0;i<4;i++)pxRect(ctx,s.x+5+i*5,s.y+26,4,13,'#b49154');}
function drawSign(ctx,s,open){pxRect(ctx,s.x+8,s.y,2,8,'#6d4a2c');pxRect(ctx,s.x+1,s.y+7,16,11,'#3c291b');pxRect(ctx,s.x+3,s.y+9,12,7,open?'#49633e':'#704437');ctx.fillStyle='#f0d7a9';ctx.font='4px "Malgun Gothic", system-ui, sans-serif';ctx.textAlign='center';ctx.fillText(open?'OPEN':'CLOSE',s.x+9,s.y+14);ctx.textAlign='left';}
function drawDoor(ctx,s){pxRect(ctx,s.x-3,s.y-22,s.w+6,s.h+22,'#2a1b13');pxRect(ctx,s.x+2,s.y-17,s.w-4,s.h+17,'#72472a');pxRect(ctx,s.x+6,s.y-12,s.w-12,s.h+10,'#55351f');pxRect(ctx,s.x+s.w-12,s.y+4,3,3,'#d3aa59');pxRect(ctx,s.x-5,s.y-24,s.w+10,5,'#47301f');}

export function renderLighting(ctx,minute,floor='shop',t=0){const m=((minute%1440)+1440)%1440;let alpha=0,color='20,26,38';if(m<420){alpha=.09;color='28,39,62';}else if(m<540){alpha=.035;color='235,196,145';}else if(m<1020){alpha=0;}else if(m<1140){alpha=.035;color='220,117,69';}else if(m<1260){alpha=.055;color='94,68,92';}else{alpha=.075;color='24,30,48';}if(alpha){ctx.fillStyle=`rgba(${color},${alpha})`;ctx.fillRect(0,30,640,330);}if(m>=1140||m<420){const flick=.85+.15*Math.sin(t*9);const glows=floor==='shop'?[[165,150,82,'236,120,45'],[250,170,36,'239,177,83'],[594,286,32,'229,166,82']]:[[405,108,58,'242,176,75'],[320,190,34,'229,166,82']];ctx.save();ctx.globalCompositeOperation='screen';for(const [x,y,r,c] of glows){const g=ctx.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,`rgba(${c},${.17*flick})`);g.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}ctx.restore();}}

export function drawDirt(ctx,spots){for(const p of spots||[]){const type=p.type||'먼지';let c='#4c3426',c2='#5a3a27';if(type.includes('재')||type.includes('검댕')||type.includes('석탄')){c='#302c2a';c2='#49423d';}else if(type.includes('철')||type.includes('금속')){c='#66645f';c2='#8a8276';}else if(type.includes('나무')){c='#835c34';c2='#a97945';}else if(type.includes('가죽')){c='#684234';c2='#88584a';}else if(type.includes('물자국')){c='#49666b';c2='#6f8887';}else if(type.includes('숫돌')||type.includes('금속 가루')){c='#62605b';c2='#817b71';}else if(type.includes('진흙')||type.includes('흙')||type.includes('발자국')){c='#4b3625';c2='#61452d';}pxRect(ctx,p.x-6,p.y,12,3,c);pxRect(ctx,p.x+3,p.y-3,5,2,c2);pxRect(ctx,p.x-8,p.y+4,4,2,c2);if(type==='발자국'){pxRect(ctx,p.x-5,p.y-5,4,6,c);pxRect(ctx,p.x+4,p.y+3,4,6,c);}}}

export function drawCharacter(ctx,type,x,y,walk=0,selected=false){x=Math.round(x);y=Math.round(y);const bob=Math.floor(Math.sin(walk)*1);ctx.save();ctx.translate(x,y+bob);pxRect(ctx,-13,16,26,5,'#241a1466');if(type==='older')drawOlder(ctx);else if(type==='younger')drawYounger(ctx);else if(type==='child')drawChild(ctx);else if(type==='knight')drawKnight(ctx);else if(type==='merchant')drawMerchant(ctx);else drawCustomer(ctx,type);if(selected){ctx.strokeStyle='#f4cd6c';ctx.lineWidth=1;ctx.strokeRect(-17,-35,34,56);pxRect(ctx,-2,-40,4,4,'#f4cd6c');}ctx.restore();}
function drawOlder(ctx){pxRect(ctx,-9,-30,18,8,'#e6b395');pxRect(ctx,-12,-24,24,10,'#e6b395');pxRect(ctx,-11,-20,22,9,'#3a2531');pxRect(ctx,-18,-13,36,27,'#7f2b25');pxRect(ctx,-22,-8,44,16,'#7f2b25');pxRect(ctx,-9,14,7,7,'#3b312a');pxRect(ctx,3,14,7,7,'#3b312a');pxRect(ctx,-22,-5,5,13,'#8ba4b6');pxRect(ctx,18,-5,5,13,'#8ba4b6');pxRect(ctx,-7,-3,14,5,'#a56c32');}
function drawYounger(ctx){pxRect(ctx,-7,-34,14,7,'#263f68');pxRect(ctx,-8,-29,16,11,'#e9b79f');pxRect(ctx,-7,-21,14,9,'#263f68');pxRect(ctx,-11,-13,22,28,'#315f93');pxRect(ctx,-13,-9,4,18,'#8d5b44');pxRect(ctx,10,-9,4,18,'#8d5b44');pxRect(ctx,-7,15,5,8,'#2b2625');pxRect(ctx,3,15,5,8,'#2b2625');pxRect(ctx,-10,-2,20,3,'#c59743');}
function drawChild(ctx){pxRect(ctx,-10,-27,20,9,'#dbe2d9');pxRect(ctx,-13,-22,26,21,'#a8b9ad');pxRect(ctx,-8,-17,16,12,'#efb298');pxRect(ctx,-10,-2,20,18,'#849b4e');pxRect(ctx,-7,16,5,6,'#d39a39');pxRect(ctx,3,16,5,6,'#d39a39');pxRect(ctx,-4,-19,8,3,'#d8633e');}
function drawKnight(ctx){pxRect(ctx,-10,-31,20,11,'#94a9c4');pxRect(ctx,-12,-23,24,8,'#8298b5');pxRect(ctx,-15,-15,30,23,'#879dbb');pxRect(ctx,-20,-13,8,14,'#879dbb');pxRect(ctx,13,-13,8,14,'#879dbb');pxRect(ctx,-9,8,7,14,'#788faa');pxRect(ctx,3,8,7,14,'#788faa');pxRect(ctx,-7,-25,14,2,'#2e3946');pxRect(ctx,-16,5,32,3,'#7a392c');}
function drawMerchant(ctx){pxRect(ctx,-8,-28,16,11,'#d5aa91');pxRect(ctx,-10,-18,20,27,'#376596');pxRect(ctx,-7,-22,14,8,'#263f68');pxRect(ctx,-9,-16,18,7,'#263f68');pxRect(ctx,-12,-9,4,17,'#6b2e28');pxRect(ctx,9,-9,4,17,'#6b2e28');pxRect(ctx,-7,9,5,12,'#3b302a');pxRect(ctx,3,9,5,12,'#3b302a');}
function drawCustomer(ctx,type){const c=type==='rude'?'#7b4a31':type==='adventurer'?'#59683e':type==='guard'?'#5f566f':type==='mercenary'?'#6f4b4b':type==='hunter'?'#4f644c':'#8a6847';pxRect(ctx,-8,-27,16,11,'#d6a78e');pxRect(ctx,-11,-17,22,25,c);pxRect(ctx,-13,-12,4,16,'#c39a82');pxRect(ctx,10,-12,4,16,'#c39a82');pxRect(ctx,-7,8,5,13,'#3a302a');pxRect(ctx,3,8,5,13,'#3a302a');if(type==='adventurer'||type==='hunter')pxRect(ctx,-10,-30,20,6,'#49372c');if(type==='guard'||type==='mercenary')pxRect(ctx,-9,-23,18,4,'#9a9b95');}
