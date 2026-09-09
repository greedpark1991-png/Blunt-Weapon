import { CUSTOMER_ARCHETYPES, ITEMS } from '../data/GameData.js';

const COUNTER_POS=[{x:522,y:270},{x:494,y:286},{x:548,y:244},{x:500,y:244}];
const BROWSE_POS=[{x:520,y:150},{x:548,y:154},{x:490,y:158},{x:535,y:182}];
const typePoolByTime = minute => {
  const m=minute%1440;
  if(m<540)return ['villager','guard'];
  if(m<720)return ['villager','guard','hunter'];
  if(m<1020)return ['adventurer','villager','mercenary','hunter'];
  if(m<1260)return ['adventurer','mercenary','guard','hunter'];
  return ['villager','guard'];
};
function spawnInterval(minute,event){const m=minute%1440;let base=m<540?64:m<720?49:m<1020?40:m<1260?36:62;const mult=event?.visitMultiplier||1;return Math.max(22,(base/mult)*(.72+Math.random()*.62));}

export class CustomerSystem {
  constructor(day,state,saved){
    this.day=day;this.visitors=saved?.visitors?[...saved.visitors]:[];this.nextSpawn=saved?.nextSpawn??22;this.nextId=saved?.nextId??1;this.state=state||{};this.scripted={knight:false,rude:false,returningKnight:false,...(saved?.scripted||{})};this.wasOpen=saved?.wasOpen??false;
  }
  activeCount(){return this.visitors.filter(v=>v.status!=='gone').length;}
  waiting(){return this.visitors.filter(v=>['waiting','ordered'].includes(v.status));}
  nearestWaiting(x,y){return this.waiting().sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]||null;}
  byId(id){return this.visitors.find(v=>v.id===id)||null;}
  update(dt,{minute,open,event,patienceMultiplier=1}={}){
    const out=[];
    if(open&&!this.wasOpen){this.nextSpawn=Math.min(this.nextSpawn,12+Math.random()*12);this.wasOpen=true;}
    if(!open)this.wasOpen=false;
    if(open&&this.activeCount()<4){
      if(this.day===1&&!this.scripted.knight&&minute>=780){this.scripted.knight=true;out.push({type:'spawn',visitor:this.spawnScripted('knight',minute)});}
      else if(this.day===1&&!this.scripted.rude&&minute>=1090){this.scripted.rude=true;out.push({type:'spawn',visitor:this.spawnScripted('rude',minute)});}
      else if(this.day>=2&&this.state.knightPurchase&&!this.scripted.returningKnight&&minute>=960&&(this.day===2||this.day%3===0)){this.scripted.returningKnight=true;out.push({type:'spawn',visitor:this.spawnScripted('returningKnight',minute)});}
      else{this.nextSpawn-=dt;if(this.nextSpawn<=0){const v=this.spawnRandom(minute,event);if(v)out.push({type:'spawn',visitor:v});this.nextSpawn=spawnInterval(minute,event);}}
    }
    for(const v of this.visitors){
      if(v.status==='walking'){const dx=v.targetX-v.x,dy=v.targetY-v.y,d=Math.hypot(dx,dy);if(d<2){v.x=v.targetX;v.y=v.targetY;v.status=v.mode==='general'?'browsing':'waiting';if(v.status==='browsing')v.browseTimer=4+Math.random()*4;out.push({type:v.status==='browsing'?'browseStart':'waiting',visitor:v});}else{const sp=54;v.x+=dx/d*sp*dt;v.y+=dy/d*sp*dt;}}
      else if(v.status==='browsing'){v.browseTimer-=dt;if(v.browseTimer<=0){v.browseTimer=999;out.push({type:'browseComplete',visitor:v});}}
      else if(v.status==='waiting'||v.status==='ordered'){v.patience-=dt*patienceMultiplier;if(v.patience<=0){out.push({type:'impatient',visitor:v});this.leave(v,'기다리다 지쳐 나갔다.');}}
      else if(v.status==='leaving'){const dx=598-v.x,dy=326-v.y,d=Math.hypot(dx,dy);if(d<4){v.status='gone';out.push({type:'gone',visitor:v});}else{const sp=62;v.x+=dx/d*sp*dt;v.y+=dy/d*sp*dt;}}
    }
    this.visitors=this.visitors.filter(v=>v.status!=='gone');return out;
  }
  spawnRandom(minute,event){
    const pool=typePoolByTime(minute);let type=event?.visitorType&&Math.random()<.34?event.visitorType:pool[Math.floor(Math.random()*pool.length)];
    const a=CUSTOMER_ARCHETYPES[type]||CUSTOMER_ARCHETYPES.villager;const r=Math.random();let mode=r<.68?'general':r<.86?'direct':'commission';const prefs=[...a.preferences];const itemId=prefs[Math.floor(Math.random()*prefs.length)];
    if(mode==='direct'&&Math.random()<.09)return this.spawn({type:'rude',name:'까다로운 손님',mode:'direct',itemId,preferences:[itemId],budget:.95,patience:145,rude:true,line:'물건은 필요한데 가격은 아주 합리적이어야 할 거요.'},minute);
    const purpose=mode==='direct'&&type==='adventurer'&&Math.random()<.55;
    return this.spawn({type,name:a.name,mode,itemId,preferences:prefs,budget:a.budget,patience:a.patience,purpose,line:a.line},minute);
  }
  spawnScripted(kind,minute){
    if(kind==='knight')return this.spawn({type:'knight',name:'기사 로데릭',mode:'direct',itemId:'sword',preferences:['sword','longsword'],budget:1.6,patience:190,knight:true,line:'이번 원정에 들고 갈 철검 한 자루가 필요하오. 오래 버틸 물건이면 좋겠군.'},minute);
    if(kind==='returningKnight'){const prev=this.state.knightPurchase;return this.spawn({type:'knight',name:'기사 로데릭',mode:'direct',itemId:'longsword',preferences:['longsword','shield','sword'],budget:1.7,patience:200,knight:true,returning:true,line:`전에 사 간 ${prev?.itemName||'무기'}이 꽤 쓸 만했소. 이번에는 장검을 하나 보고 싶군.`},minute);}
    return this.spawn({type:'rude',name:'까다로운 손님',mode:'direct',itemId:'shield',preferences:['shield'],budget:.92,patience:150,rude:true,line:'방패 하나 필요하긴 한데, 터무니없이 비싸면 안 살 거요.'},minute);
  }
  spawn(base,minute){
    const idx=this.activeCount()%4;const p=base.mode==='general'?BROWSE_POS[idx]:COUNTER_POS[idx];const v={id:`C${this.nextId++}`,...base,x:598,y:326,targetX:p.x,targetY:p.y,status:'walking',acceptedItem:null,arrivedMinute:minute,bubble:'',bubbleT:0};this.visitors.push(v);return v;
  }
  acceptDirect(v,itemId){v.acceptedItem=itemId||v.itemId;v.status='ordered';v.patience=Math.max(v.patience,150);}
  leave(v,reason=''){v.status='leaving';v.bubble=reason;v.bubbleT=2.5;v.targetX=598;v.targetY=326;}
  complete(v){this.leave(v,'거래 완료');}
  toJSON(){return{visitors:this.visitors.map(v=>({...v})),nextSpawn:this.nextSpawn,nextId:this.nextId,scripted:{...this.scripted},wasOpen:this.wasOpen};}
}
