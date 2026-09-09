import { STATIONS, LOFT_STATIONS } from '../data/GameData.js';
export function pxRect(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
const FONT='\"Malgun Gothic\", system-ui, sans-serif';
function label(ctx,s){ctx.fillStyle='#f3e5c4';ctx.font=`8px ${FONT}`;ctx.textBaseline='top';ctx.fillText(s.label,Math.round(s.x+2),Math.round(s.y+s.h+3));}

export function renderShopBase(ctx,t,{shopOpen=false,cleanliness=100,minute=720}={}){
  pxRect(ctx,0,0,640,360,'#17110d');pxRect(ctx,0,30,640,96,'#584a3b');
  for(let y=34;y<126;y+=16){for(let x=((y/16)%2)*14-14;x<640;x+=28)pxRect(ctx,x,y,26,14,(x/28+y/16)%2?'#625242':'#504437');}
  pxRect(ctx,0,118,640,8,'#2f2015');pxRect(ctx,22,30,10,96,'#3b2819');pxRect(ctx,610,30,10,96,'#3b2819');
  pxRect(ctx,0,126,640,234,'#785536');ctx.strokeStyle='#604126';ctx.lineWidth=2;for(let y=140;y<370;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(640,y-8);ctx.stroke();}ctx.strokeStyle='#68472b';for(let x=-100;x<740;x+=80){ctx.beginPath();ctx.moveTo(x,126);ctx.lineTo(x+120,360);ctx.stroke();}
  ctx.fillStyle='#5d412b44';ctx.fillRect(34,132,370,190);ctx.strokeStyle='#8c654033';ctx.strokeRect(34.5,132.5,369,189);ctx.fillStyle='#8a6a4630';ctx.fillRect(410,132,196,194);
  pxRect(ctx,266,48,76,47,'#2b2119');const wm=((minute%1440)+1440)%1440;let sky=wm<420?'#263a58':wm<540?'#6f8d9a':wm<1020?'#9fbfd0':wm<1140?'#d69b68':wm<1260?'#76627c':'#1d2944';pxRect(ctx,271,53,66,37,sky);pxRect(ctx,302,53,4,37,'#43301f');pxRect(ctx,271,69,66,4,'#43301f');if(wm>=420&&wm<1140){const a=wm<540?.10:wm<1020?.16:.07;ctx.fillStyle=`rgba(239,211,145,${a})`;ctx.beginPath();ctx.moveTo(271,90);ctx.lineTo(392,243);ctx.lineTo(326,243);ctx.lineTo(289,90);ctx.fill();}
  drawToolWall(ctx);drawCounterBackDetails(ctx);if(cleanliness<55){ctx.fillStyle='#4d332055';ctx.fillRect(416,294,150,3);}
}
export function getShopDrawables(ctx,t,{display=null,shopOpen=false}={}){
  return[
    {id:'display',baseY:144,draw:()=>drawDisplay(ctx,STATIONS.display,display)},
    {id:'fuel',baseY:192,draw:()=>drawFuel(ctx,STATIONS.fuel)},
    {id:'anvil',baseY:196,draw:()=>drawAnvil(ctx,STATIONS.anvil)},
    {id:'water',baseY:198,draw:()=>drawWater(ctx,STATIONS.water)},
    {id:'forge',baseY:200,draw:()=>drawForge(ctx,STATIONS.forge,t)},
    {id:'stairs',baseY:252,draw:()=>drawStairs(ctx,STATIONS.stairs,'up')},
    {id:'bench',baseY:266,draw:()=>drawBench(ctx,STATIONS.bench)},
    {id:'grind',baseY:274,draw:()=>drawGrind(ctx,STATIONS.grind)},
    {id:'storage',baseY:306,draw:()=>drawStorage(ctx,STATIONS.storage)},
    {id:'counter',baseY:326,draw:()=>drawCounter(ctx,STATIONS.counter)},
    {id:'broom',baseY:332,draw:()=>drawBroom(ctx,STATIONS.broom)},
    {id:'sign',baseY:334,draw:()=>drawSign(ctx,STATIONS.sign,shopOpen)},
    {id:'door',baseY:354,draw:()=>drawDoor(ctx,STATIONS.door)},
  ];
}
export function renderShop(ctx,t,state={}){renderShopBase(ctx,t,state);for(const d of getShopDrawables(ctx,t,state).sort((a,b)=>a.baseY-b.baseY))d.draw();}

export function renderLoft(ctx,t,minute=720){
  pxRect(ctx,0,0,640,360,'#17110d');
  pxRect(ctx,0,30,640,106,'#4b392c');
  for(let y=34;y<136;y+=18){for(let x=((y/18)%2)*28-28;x<640;x+=56)pxRect(ctx,x,y,53,16,(x/56+y/18)%2?'#574231':'#49382c');}
  pxRect(ctx,0,136,640,224,'#6b4b32');
  ctx.strokeStyle='#553821';ctx.lineWidth=2;for(let y=150;y<370;y+=26){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(640,y-5);ctx.stroke();}
  for(let x=-80;x<720;x+=92){ctx.strokeStyle='#5d3f28';ctx.beginPath();ctx.moveTo(x,136);ctx.lineTo(x+110,360);ctx.stroke();}
  // Beams and a warm shared home, intentionally asymmetric rather than a hotel room.
  pxRect(ctx,34,44,572,8,'#2f2118');pxRect(ctx,44,48,8,88,'#332318');pxRect(ctx,588,48,8,88,'#332318');
  drawLoftWindow(ctx,LOFT_STATIONS.window,t,minute);drawWardrobe(ctx,LOFT_STATIONS.wardrobe);
  drawBed(ctx,LOFT_STATIONS.olderBed,'#75483c');drawBed(ctx,LOFT_STATIONS.youngerBed,'#425f7e');
  drawSmallTable(ctx,LOFT_STATIONS.table);drawLamp(ctx,LOFT_STATIONS.lamp,t);drawStairs(ctx,LOFT_STATIONS.stairsDown,'down');
  // Shared rug and little central traces of life.
  pxRect(ctx,238,244,150,54,'#55352d');pxRect(ctx,245,250,136,42,'#775044');for(let i=0;i<5;i++)pxRect(ctx,250+i*28,286,15,3,'#9a6950');
  // Older brother: large worn chest, boots, cup and a carelessly left hammer.
  pxRect(ctx,54,246,62,34,'#4b2f20');pxRect(ctx,58,250,54,25,'#725037');pxRect(ctx,80,248,8,4,'#c08c45');
  pxRect(ctx,124,254,13,9,'#35291f');pxRect(ctx,140,258,11,7,'#35291f');pxRect(ctx,77,163,10,10,'#73503a');pxRect(ctx,80,160,5,3,'#b99258');
  pxRect(ctx,152,248,25,3,'#77736b');pxRect(ctx,172,244,5,12,'#67452b');
  // Younger brother: smaller tidy chest, book and folded cloth.
  pxRect(ctx,470,246,48,30,'#493528');pxRect(ctx,474,250,40,21,'#6a4b35');pxRect(ctx,488,248,7,4,'#c6a05c');
  pxRect(ctx,518,244,25,6,'#7a6c5c');pxRect(ctx,518,238,23,5,'#967a62');pxRect(ctx,452,158,22,4,'#d1b47f');pxRect(ctx,454,153,18,5,'#5b4938');
  // Wardrobe-side apron and gloves.
  pxRect(ctx,132,82,5,35,'#6c4b34');pxRect(ctx,126,86,17,19,'#875d3b');pxRect(ctx,141,114,8,5,'#8f6d4f');pxRect(ctx,151,114,8,5,'#8f6d4f');
  // Two cups, bread, candle and dice on the common table under the window.
  const tb=LOFT_STATIONS.table;pxRect(ctx,tb.x+12,tb.y-5,7,9,'#6a574a');pxRect(ctx,tb.x+24,tb.y-5,7,9,'#6a574a');pxRect(ctx,tb.x+39,tb.y-4,17,6,'#c49b59');pxRect(ctx,tb.x+60,tb.y-9,3,10,'#e2d4a6');pxRect(ctx,tb.x+59,tb.y-12,5,4,'#f2b64a');pxRect(ctx,tb.x+9,tb.y+9,4,4,'#d8c594');pxRect(ctx,tb.x+17,tb.y+13,4,4,'#d8c594');
}
function drawLoftWindow(ctx,s,t,minute=720){const m=((minute%1440)+1440)%1440;const sky=m<420?'#20304c':m<540?'#6d8790':m<1020?'#91b0b6':m<1140?'#c98b63':m<1260?'#665a79':'#17223b';pxRect(ctx,s.x,s.y,s.w,s.h,'#2a2019');pxRect(ctx,s.x+6,s.y+6,s.w-12,s.h-12,sky);pxRect(ctx,s.x+s.w/2-2,s.y+6,4,s.h-12,'#3f3024');pxRect(ctx,s.x+6,s.y+s.h/2-2,s.w-12,4,'#3f3024');if(m>=420&&m<1140){ctx.fillStyle=`rgba(238,196,118,${m<540?.06:m<1020?.11:.04})`;ctx.beginPath();ctx.moveTo(s.x+8,s.y+s.h-8);ctx.lineTo(s.x+130,250);ctx.lineTo(s.x+60,250);ctx.fill();}label(ctx,s);}
function drawWardrobe(ctx,s){pxRect(ctx,s.x,s.y,s.w,s.h,'#3b281c');pxRect(ctx,s.x+5,s.y+5,s.w-10,s.h-10,'#67462c');pxRect(ctx,s.x+s.w/2-2,s.y+7,4,s.h-14,'#3b281c');pxRect(ctx,s.x+s.w/2-9,s.y+36,4,4,'#c49a52');pxRect(ctx,s.x+s.w/2+5,s.y+36,4,4,'#c49a52');label(ctx,s);}
function drawSmallTable(ctx,s){pxRect(ctx,s.x,s.y+8,s.w,s.h-22,'#65442b');pxRect(ctx,s.x+5,s.y,s.w-10,14,'#89603a');pxRect(ctx,s.x+9,s.y+28,7,22,'#3b281b');pxRect(ctx,s.x+s.w-16,s.y+28,7,22,'#3b281b');pxRect(ctx,s.x+23,s.y-4,18,7,'#c7b17e');pxRect(ctx,s.x+45,s.y-2,6,9,'#65564c');label(ctx,s);}
function drawLamp(ctx,s,t){pxRect(ctx,s.x+15,s.y,4,22,'#4b3423');pxRect(ctx,s.x+7,s.y+18,20,20,'#77552d');const flick=2+Math.round(Math.sin(t*9));pxRect(ctx,s.x+12,s.y+21+flick,10,12-flick,'#f2b443');ctx.fillStyle='#f5be4b18';ctx.beginPath();ctx.arc(s.x+17,s.y+28,34,0,Math.PI*2);ctx.fill();label(ctx,s);}

function drawForge(ctx,s,t){pxRect(ctx,s.x,s.y,s.w,s.h,'#382a20');pxRect(ctx,s.x+8,s.y+11,54,42,'#211714');pxRect(ctx,s.x+13,s.y+18,44,30,'#7a2a18');const flick=3+Math.round(Math.sin(t*8)*2);pxRect(ctx,s.x+18,s.y+25,34,20,'#d45b20');pxRect(ctx,s.x+26,s.y+20+flick,18,22-flick,'#ffb53e');pxRect(ctx,s.x+69,s.y+5,10,50,'#211714');pxRect(ctx,s.x+65,s.y+2,18,7,'#604430');label(ctx,s);}
function drawDisplay(ctx,s,display){pxRect(ctx,s.x,s.y,s.w,s.h,'#382519');pxRect(ctx,s.x+3,s.y+5,s.w-6,6,'#7a5536');pxRect(ctx,s.x+4,s.y+36,s.w-8,6,'#7a5536');pxRect(ctx,s.x+6,s.y+55,s.w-12,5,'#5d3c27');if(display){display.slots.forEach((item,i)=>{if(!item)return;const x=s.x+11+(i%3)*23,y=s.y+15+Math.floor(i/3)*25;drawTinyItem(ctx,item.itemId,x,y);});}label(ctx,s);}
function drawTinyItem(ctx,id,x,y){if(['dagger','sword','longsword'].includes(id)){pxRect(ctx,x,y,3,id==='longsword'?22:id==='sword'?18:13,'#bdc5c2');pxRect(ctx,x-3,y+10,9,3,'#9b6b39');pxRect(ctx,x,y+13,3,7,'#5d3c25');}else if(id==='shield'){pxRect(ctx,x-6,y,14,16,'#8c704e');pxRect(ctx,x-4,y+2,10,12,'#8fa0a1');}else if(id==='bow'){ctx.strokeStyle='#b88a52';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y+9,8,-1.1,1.1);ctx.stroke();ctx.strokeStyle='#ddd0b6';ctx.beginPath();ctx.moveTo(x+4,y+2);ctx.lineTo(x+4,y+16);ctx.stroke();}else{for(let k=0;k<3;k++){pxRect(ctx,x+k*3,y,1,18,'#b6a36e');pxRect(ctx,x+k*3-1,y,3,3,'#a4a9a7');}}}
function drawAnvil(ctx,s){pxRect(ctx,s.x+7,s.y+22,39,11,'#23282a');pxRect(ctx,s.x+14,s.y+12,29,12,'#555e60');pxRect(ctx,s.x+7,s.y+8,40,7,'#7f8887');pxRect(ctx,s.x+18,s.y+32,18,5,'#1c1c1c');label(ctx,s);}
function drawBench(ctx,s){pxRect(ctx,s.x,s.y+12,s.w,23,'#4b2f1c');pxRect(ctx,s.x+5,s.y+6,s.w-10,12,'#815b37');pxRect(ctx,s.x+8,s.y+35,7,13,'#3a2619');pxRect(ctx,s.x+s.w-15,s.y+35,7,13,'#3a2619');pxRect(ctx,s.x+12,s.y+1,19,5,'#68645c');pxRect(ctx,s.x+38,s.y+2,12,4,'#b08b4d');pxRect(ctx,s.x+58,s.y+1,18,7,'#d3bd87');pxRect(ctx,s.x+81,s.y+2,10,5,'#6f5440');for(let i=0;i<4;i++)pxRect(ctx,s.x+22+i*17,s.y+21,5,3,i%2?'#73675c':'#a78a5c');label(ctx,s);}
function drawGrind(ctx,s){pxRect(ctx,s.x+4,s.y+29,52,13,'#4c3423');ctx.fillStyle='#6f7774';ctx.beginPath();ctx.arc(s.x+30,s.y+22,17,0,Math.PI*2);ctx.fill();ctx.fillStyle='#a0a39d';ctx.beginPath();ctx.arc(s.x+30,s.y+22,10,0,Math.PI*2);ctx.fill();pxRect(ctx,s.x+29,s.y+5,3,34,'#31251d');pxRect(ctx,s.x+50,s.y+7,5,22,'#8b5d31');label(ctx,s);}
function drawWater(ctx,s){pxRect(ctx,s.x+3,s.y+10,s.w-6,s.h-10,'#4b3828');pxRect(ctx,s.x+6,s.y+13,s.w-12,s.h-17,'#496d72');pxRect(ctx,s.x+2,s.y+8,s.w-4,5,'#7b5a3d');label(ctx,s);}
function drawStorage(ctx,s){pxRect(ctx,s.x,s.y+15,s.w,s.h-15,'#5b3b22');pxRect(ctx,s.x+5,s.y+8,34,27,'#825632');pxRect(ctx,s.x+43,s.y+20,34,26,'#47301f');pxRect(ctx,s.x+8,s.y+13,28,4,'#9c754e');for(let i=0;i<3;i++)pxRect(ctx,s.x+48+i*8,s.y+7,6,18,'#77736b');label(ctx,s);}
function drawFuel(ctx,s){pxRect(ctx,s.x+2,s.y+18,38,22,'#4b321f');for(let i=0;i<5;i++){pxRect(ctx,s.x+5+i*7,s.y+7+(i%2)*5,5,23,'#765034');pxRect(ctx,s.x+4+i*7,s.y+8+(i%2)*5,7,4,'#9a6b42');}pxRect(ctx,s.x+28,s.y+25,14,15,'#25211f');pxRect(ctx,s.x+31,s.y+21,9,6,'#37322f');label(ctx,s);}
function drawToolWall(ctx){const y=82;pxRect(ctx,88,y-4,145,4,'#3d2a1c');for(let i=0;i<6;i++){pxRect(ctx,102+i*21,y,3,18+(i%2)*4,'#4b3423');pxRect(ctx,97+i*21,y+2,13,4,'#77756f');}pxRect(ctx,372,86,104,5,'#3d2a1c');for(let i=0;i<7;i++)pxRect(ctx,380+i*13,92,5,8+(i%3)*5,i%2?'#7b6752':'#555a58');}
function drawCounterBackDetails(ctx){pxRect(ctx,422,235,22,10,'#39271b');pxRect(ctx,426,231,14,6,'#a17a43');pxRect(ctx,450,237,21,6,'#d0b57e');pxRect(ctx,478,234,12,9,'#6d3c2a');}
function drawCounter(ctx,s){
  // Correct ㄱ orientation: long customer face + right vertical leg. Left side remains the staff entrance.
  pxRect(ctx,s.x,s.y+8,s.w,s.h-8,'#3c281b');pxRect(ctx,s.x-4,s.y,s.w+8,12,'#7d5838');pxRect(ctx,s.x+8,s.y+15,s.w-16,13,'#593a24');
  const lx=s.x+s.w-30;pxRect(ctx,lx,s.y+28,30,44,'#3c281b');pxRect(ctx,lx-4,s.y+27,38,10,'#7d5838');pxRect(ctx,lx+7,s.y+39,16,27,'#593a24');
  // Ledger, coin plate and wrapping cloth sit on the actual counter surface.
  pxRect(ctx,s.x+20,s.y-3,20,6,'#d0b57e');pxRect(ctx,s.x+49,s.y-2,14,7,'#6d3c2a');pxRect(ctx,s.x+77,s.y-2,18,5,'#a17a43');pxRect(ctx,s.x+101,s.y-1,11,4,'#c59c52');
  label(ctx,s);
}
function drawBed(ctx,s,blanket='#6d4a62'){pxRect(ctx,s.x,s.y+9,s.w,s.h-9,'#4b2f20');pxRect(ctx,s.x+5,s.y+5,s.w-10,32,'#8d5d4b');pxRect(ctx,s.x+8,s.y+7,26,12,'#d3c29f');pxRect(ctx,s.x+35,s.y+8,s.w-42,24,blanket);label(ctx,s);}
function drawStairs(ctx,s,dir='up'){if(dir==='up'){
  // Side stair with a dark wall pocket and visible upward direction.
  pxRect(ctx,s.x-3,s.y+2,10,s.h-2,'#2d2018');pxRect(ctx,s.x+5,s.y+2,7,s.h-10,'#38261a');pxRect(ctx,s.x+s.w-8,s.y+4,6,s.h-8,'#38261a');
  ctx.strokeStyle='#4b321f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(s.x+10,s.y+s.h-8);ctx.lineTo(s.x+s.w-10,s.y+12);ctx.stroke();
  for(let i=0;i<8;i++){const y=s.y+s.h-14-i*10,x=s.x+8+i*5;pxRect(ctx,x,y,Math.max(18,s.w-16-i*4),6,'#8a633d');pxRect(ctx,x,y+5,Math.max(18,s.w-16-i*4),2,'#51351f');}
  pxRect(ctx,s.x+s.w-12,s.y+4,6,18,'#725033');pxRect(ctx,s.x+s.w-14,s.y+3,12,4,'#a77a4a');
}else{pxRect(ctx,s.x,s.y+4,s.w,s.h-4,'#3c2a1e');for(let i=0;i<5;i++){const w=s.w-10-i*10,x=s.x+i*5,y=s.y+s.h-8-i*8;pxRect(ctx,x,y,w,6,'#84603e');}pxRect(ctx,s.x+4,s.y,s.w-8,4,'#2e2018');}label(ctx,s);}
function drawBroom(ctx,s){pxRect(ctx,s.x+17,s.y,3,30,'#9c7448');for(let i=0;i<4;i++)pxRect(ctx,s.x+9+i*5,s.y+27,4,13,'#b49154');label(ctx,s);}
function drawSign(ctx,s,open){pxRect(ctx,s.x+13,s.y,3,12,'#6d4a2c');pxRect(ctx,s.x+2,s.y+10,26,14,'#3c291b');pxRect(ctx,s.x+4,s.y+12,22,10,open?'#49633e':'#704437');ctx.fillStyle='#f0d7a9';ctx.font='6px "Malgun Gothic", system-ui, sans-serif';ctx.textAlign='center';ctx.fillText(open?'OPEN':'CLOSED',s.x+15,s.y+18);ctx.textAlign='left';}
function drawDoor(ctx,s){pxRect(ctx,s.x-3,s.y-20,s.w+6,s.h+20,'#2a1b13');pxRect(ctx,s.x+2,s.y-15,s.w-4,s.h+15,'#72472a');pxRect(ctx,s.x+7,s.y-10,s.w-14,s.h+8,'#55351f');pxRect(ctx,s.x+s.w-13,s.y+5,3,3,'#d3aa59');pxRect(ctx,s.x-5,s.y-22,s.w+10,5,'#47301f');}

export function renderLighting(ctx,minute,floor='shop',t=0){const m=((minute%1440)+1440)%1440;let alpha=0,color='20,26,38';if(m<420){alpha=.09;color='28,39,62';}else if(m<540){alpha=.035;color='235,196,145';}else if(m<1020){alpha=0;}else if(m<1140){alpha=.035;color='220,117,69';}else if(m<1260){alpha=.055;color='94,68,92';}else{alpha=.075;color='24,30,48';}if(alpha){ctx.fillStyle=`rgba(${color},${alpha})`;ctx.fillRect(0,30,640,330);}if(m>=1140||m<420){const flick=.85+.15*Math.sin(t*9);const glows=floor==='shop'?[[174,176,82,'236,120,45'],[264,190,36,'239,177,83'],[594,286,32,'229,166,82']]:[[455,111,58,'242,176,75'],[412,184,34,'229,166,82']];ctx.save();ctx.globalCompositeOperation='screen';for(const [x,y,r,c] of glows){const g=ctx.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,`rgba(${c},${.17*flick})`);g.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}ctx.restore();}}

export function drawDirt(ctx,spots){for(const p of spots||[]){const type=p.type||'먼지';let c='#4c3426',c2='#5a3a27';if(type.includes('재')||type.includes('검댕')||type.includes('석탄')){c='#302c2a';c2='#49423d';}else if(type.includes('철')||type.includes('금속')){c='#66645f';c2='#8a8276';}else if(type.includes('나무')){c='#835c34';c2='#a97945';}else if(type.includes('가죽')){c='#684234';c2='#88584a';}else if(type.includes('물자국')){c='#49666b';c2='#6f8887';}else if(type.includes('숫돌')||type.includes('금속 가루')){c='#62605b';c2='#817b71';}else if(type.includes('진흙')||type.includes('흙')||type.includes('발자국')){c='#4b3625';c2='#61452d';}pxRect(ctx,p.x-6,p.y,12,3,c);pxRect(ctx,p.x+3,p.y-3,5,2,c2);pxRect(ctx,p.x-8,p.y+4,4,2,c2);if(type==='발자국'){pxRect(ctx,p.x-5,p.y-5,4,6,c);pxRect(ctx,p.x+4,p.y+3,4,6,c);}}}

export function drawCharacter(ctx,type,x,y,walk=0,selected=false){x=Math.round(x);y=Math.round(y);const bob=Math.floor(Math.sin(walk)*1);ctx.save();ctx.translate(x,y+bob);pxRect(ctx,-13,16,26,5,'#241a1466');if(type==='older')drawOlder(ctx);else if(type==='younger')drawYounger(ctx);else if(type==='child')drawChild(ctx);else if(type==='knight')drawKnight(ctx);else if(type==='merchant')drawMerchant(ctx);else drawCustomer(ctx,type);if(selected){ctx.strokeStyle='#f4cd6c';ctx.lineWidth=1;ctx.strokeRect(-17,-35,34,56);pxRect(ctx,-2,-40,4,4,'#f4cd6c');}ctx.restore();}
function drawOlder(ctx){pxRect(ctx,-9,-30,18,8,'#e6b395');pxRect(ctx,-12,-24,24,10,'#e6b395');pxRect(ctx,-11,-20,22,9,'#3a2531');pxRect(ctx,-18,-13,36,27,'#7f2b25');pxRect(ctx,-22,-8,44,16,'#7f2b25');pxRect(ctx,-9,14,7,7,'#3b312a');pxRect(ctx,3,14,7,7,'#3b312a');pxRect(ctx,-22,-5,5,13,'#8ba4b6');pxRect(ctx,18,-5,5,13,'#8ba4b6');pxRect(ctx,-7,-3,14,5,'#a56c32');}
function drawYounger(ctx){pxRect(ctx,-7,-34,14,7,'#263f68');pxRect(ctx,-8,-29,16,11,'#e9b79f');pxRect(ctx,-7,-21,14,9,'#263f68');pxRect(ctx,-11,-13,22,28,'#315f93');pxRect(ctx,-13,-9,4,18,'#8d5b44');pxRect(ctx,10,-9,4,18,'#8d5b44');pxRect(ctx,-7,15,5,8,'#2b2625');pxRect(ctx,3,15,5,8,'#2b2625');pxRect(ctx,-10,-2,20,3,'#c59743');}
function drawChild(ctx){pxRect(ctx,-10,-27,20,9,'#dbe2d9');pxRect(ctx,-13,-22,26,21,'#a8b9ad');pxRect(ctx,-8,-17,16,12,'#efb298');pxRect(ctx,-10,-2,20,18,'#849b4e');pxRect(ctx,-7,16,5,6,'#d39a39');pxRect(ctx,3,16,5,6,'#d39a39');pxRect(ctx,-4,-19,8,3,'#d8633e');}
function drawKnight(ctx){pxRect(ctx,-10,-31,20,11,'#94a9c4');pxRect(ctx,-12,-23,24,8,'#8298b5');pxRect(ctx,-15,-15,30,23,'#879dbb');pxRect(ctx,-20,-13,8,14,'#879dbb');pxRect(ctx,13,-13,8,14,'#879dbb');pxRect(ctx,-9,8,7,14,'#788faa');pxRect(ctx,3,8,7,14,'#788faa');pxRect(ctx,-7,-25,14,2,'#2e3946');pxRect(ctx,-16,5,32,3,'#7a392c');}
function drawMerchant(ctx){pxRect(ctx,-8,-28,16,11,'#d5aa91');pxRect(ctx,-10,-18,20,27,'#376596');pxRect(ctx,-7,-22,14,8,'#263f68');pxRect(ctx,-9,-16,18,7,'#263f68');pxRect(ctx,-12,-9,4,17,'#6b2e28');pxRect(ctx,9,-9,4,17,'#6b2e28');pxRect(ctx,-7,9,5,12,'#3b302a');pxRect(ctx,3,9,5,12,'#3b302a');}
function drawCustomer(ctx,type){const c=type==='rude'?'#7b4a31':type==='adventurer'?'#59683e':type==='guard'?'#5f566f':type==='mercenary'?'#6f4b4b':type==='hunter'?'#4f644c':'#8a6847';pxRect(ctx,-8,-27,16,11,'#d6a78e');pxRect(ctx,-11,-17,22,25,c);pxRect(ctx,-13,-12,4,16,'#c39a82');pxRect(ctx,10,-12,4,16,'#c39a82');pxRect(ctx,-7,8,5,13,'#3a302a');pxRect(ctx,3,8,5,13,'#3a302a');if(type==='adventurer'||type==='hunter')pxRect(ctx,-10,-30,20,6,'#49372c');if(type==='guard'||type==='mercenary')pxRect(ctx,-9,-23,18,4,'#9a9b95');}
