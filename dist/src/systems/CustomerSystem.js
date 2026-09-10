import { CUSTOMER_ARCHETYPES, CUSTOMER_NAMES, ITEMS, RUDE_TYPES, RUDE_TYPE_ORDER, DOOR_FLOW } from '../data/GameData.js';
import { RenownSystem } from './RenownSystem.js';

// Customers stay on the public side of the ㄱ counter.  The staff side is
// below/left of the horizontal plank; customers approach from the north/right.
const COUNTER_POS=[{x:438,y:232},{x:466,y:232},{x:494,y:232},{x:558,y:214}];
const BROWSE_POS=[{x:526,y:166},{x:562,y:170},{x:516,y:198},{x:568,y:202}];
const ENTRY={...DOOR_FLOW.entry};
const typePoolByTime=(minute,rep=0)=>{const m=minute%1440;let p=m<540?['villager','guard']:m<720?['villager','guard','hunter']:m<1020?['adventurer','villager','mercenary','hunter']:m<1260?['adventurer','mercenary','guard','hunter']:['villager','guard'];if(rep>=50)p.push('knight','mercenary');if(rep>=80)p.push('knight');return p;};
function spawnInterval(minute,event,rep){const m=minute%1440;let base=m<540?64:m<720?49:m<1020?40:m<1260?36:62;const mult=(event?.visitMultiplier||1)*RenownSystem.visitMultiplier(rep);return Math.max(22,(base/mult)*(.72+Math.random()*.62));}

export class CustomerSystem{
  constructor(day,state,saved){this.day=day;this.visitors=saved?.visitors?saved.visitors.map(v=>{const c={...v};if(c.status==='entering')c.doorPhase='wait';else if(c.status==='leaving')c.doorPhase='exitWait';return c;}):[];this.nextSpawn=saved?.nextSpawn??22;this.nextId=saved?.nextId??1;this.state=state||{};this.scripted={knight:false,returningKnight:false,rudeGuarantee:false,closingRude:false,special:false,specialChecked:false,...(saved?.scripted||{})};this.wasOpen=saved?.wasOpen??false;this.rudeCount=saved?.rudeCount??0;}
  activeCount(){return this.visitors.filter(v=>v.status!=='gone').length;} waiting(){return this.visitors.filter(v=>['waiting','ordered'].includes(v.status));}
  nearestWaiting(x,y){return this.waiting().sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]||null;} byId(id){return this.visitors.find(v=>v.id===id)||null;}
  update(dt,{minute,open,event,patienceMultiplier=1,world=null,reputation=0,door=null}={}){
    const out=[];if(open&&!this.wasOpen){this.nextSpawn=Math.min(this.nextSpawn,12+Math.random()*12);this.wasOpen=true;}if(!open)this.wasOpen=false;
    if(open&&this.activeCount()<4){
      if(this.day===1&&!this.scripted.knight&&minute>=780){this.scripted.knight=true;out.push({type:'spawn',visitor:this.spawnScripted('knight',minute)});}
      else if(this.day>=2&&this.state.knightPurchase&&!this.scripted.returningKnight&&minute>=960&&(this.day===2||this.day%3===0)){this.scripted.returningKnight=true;out.push({type:'spawn',visitor:this.spawnScripted('returningKnight',minute)});}
      else if(this.day>=2&&!this.state.rudeEver&&this.rudeCount===0&&!this.scripted.rudeGuarantee&&minute>=1040){this.scripted.rudeGuarantee=true;out.push({type:'spawn',visitor:this.spawnRude(minute,true)});}
      else if(minute>=1310&&!this.scripted.closingRude&&this.rudeCount<2&&Math.random()<.012){this.scripted.closingRude=true;out.push({type:'spawn',visitor:this.spawnRude(minute,false,'closing')});}
      else if(!this.scripted.specialChecked&&reputation>=25&&minute>=720){this.scripted.specialChecked=true;const tier=RenownSystem.tierIndex(reputation),chance=Math.min(10,3+tier*1.5),roll=(this.day*41+Math.floor(reputation)*17)%100;if(roll<chance){const pool=RenownSystem.specialPool(reputation);if(pool.length){this.scripted.special=true;const sp=pool[Math.max(0,pool.length-1-Math.floor(((this.day*13)%100)/70))]||pool[pool.length-1];const a=CUSTOMER_ARCHETYPES[sp.type]||CUSTOMER_ARCHETYPES.adventurer;out.push({type:'spawn',visitor:this.spawn({...sp,mode:'direct',itemId:a.preferences[0],preferences:[...a.preferences],budget:(a.budget||1.2)*1.18,patience:(a.patience||100)+25,special:true},minute)});}}}
      else{this.nextSpawn-=dt;if(this.nextSpawn<=0){const v=this.spawnRandom(minute,event,reputation);if(v)out.push({type:'spawn',visitor:v});this.nextSpawn=spawnInterval(minute,event,reputation);}}
    }
    for(const v of this.visitors){
      if(v.status==='entering'){
        if(!door){v.status='walking';v.x=ENTRY.x;v.y=ENTRY.y;continue;}
        v.doorPhase=v.doorPhase||'wait';
        if(v.doorPhase==='wait'){
          const wp=door.waitPoint(v.id,'in');this.moveDirect(v,wp.x,wp.y,dt,58);
          if(Math.hypot(v.x-wp.x,v.y-wp.y)<4&&door.request(v.id,'in'))v.doorPhase='door';
        }else if(v.doorPhase==='door'){
          if(this.moveDirect(v,DOOR_FLOW.entry.x,DOOR_FLOW.entry.y,dt,72))v.doorPhase='inside';
        }else if(v.doorPhase==='inside'){
          const reached=world?world.followPath(v,DOOR_FLOW.inside,dt,64,'CUSTOMER_ZONE',6,'_customerNav'):this.moveDirect(v,DOOR_FLOW.inside.x,DOOR_FLOW.inside.y,dt,64);
          if(reached||Math.hypot(v.x-DOOR_FLOW.inside.x,v.y-DOOR_FLOW.inside.y)<4){door.release(v.id);v.doorPhase=null;delete v._customerNav;v.status='walking';out.push({type:'entered',visitor:v});}
        }
      }else if(v.status==='walking'){
        const reached=world?world.followPath(v,{x:v.targetX,y:v.targetY},dt,62,'CUSTOMER_ZONE',6,'_customerNav'):this.moveDirect(v,v.targetX,v.targetY,dt,62);if(reached||Math.hypot(v.targetX-v.x,v.targetY-v.y)<3){v.x=v.targetX;v.y=v.targetY;v.status=v.mode==='general'?'browsing':'waiting';if(v.status==='browsing')v.browseTimer=4+Math.random()*4;out.push({type:v.status==='browsing'?'browseStart':'waiting',visitor:v});}
      }else if(v.status==='browsing'){v.browseTimer-=dt;if(v.browseTimer<=0){v.browseTimer=999;out.push({type:'browseComplete',visitor:v});}}
      else if(v.status==='waiting'||v.status==='ordered'){v.patience-=dt*patienceMultiplier*(v.isRegular?.82:1);if(v.patience<=0){out.push({type:'impatient',visitor:v});this.leave(v,'기다리다 지쳐 나갔다.');}}
      else if(v.status==='leaving'){
        if(!door){const reached=world?world.followPath(v,ENTRY,dt,v.fleeSpeed||76,'CUSTOMER_ZONE',6,'_customerNav'):this.moveDirect(v,ENTRY.x,ENTRY.y,dt,v.fleeSpeed||76);if(reached||Math.hypot(ENTRY.x-v.x,ENTRY.y-v.y)<5){v.status='gone';out.push({type:'gone',visitor:v});}continue;}
        v.doorPhase=v.doorPhase||'exitWait';
        if(v.doorPhase==='exitWait'){
          const wait=door.waitPoint(v.id,'out'),reached=world?world.followPath(v,wait,dt,v.fleeSpeed||76,'CUSTOMER_ZONE',6,'_customerNav'):this.moveDirect(v,wait.x,wait.y,dt,v.fleeSpeed||76);
          if(reached||Math.hypot(v.x-wait.x,v.y-wait.y)<4){delete v._customerNav;if(door.request(v.id,'out'))v.doorPhase='exitDoor';}
        }else if(v.doorPhase==='exitDoor'){
          if(this.moveDirect(v,DOOR_FLOW.exitDoor.x,DOOR_FLOW.exitDoor.y,dt,v.fleeSpeed||88))v.doorPhase='outside';
        }else if(v.doorPhase==='outside'){
          if(this.moveDirect(v,DOOR_FLOW.outsideExit.x,DOOR_FLOW.outsideExit.y,dt,v.fleeSpeed||96)){door.release(v.id);v.status='gone';out.push({type:'gone',visitor:v});}
        }
      }
    }
    this.visitors=this.visitors.filter(v=>v.status!=='gone');return out;
  }
  moveDirect(v,x,y,dt,sp){const dx=x-v.x,dy=y-v.y,d=Math.hypot(dx,dy);if(d<3)return true;v.x+=dx/d*sp*dt;v.y+=dy/d*sp*dt;return false;}
  shouldSpawnRude(){if(this.day<2||this.rudeCount>=2)return false;const base=this.rudeCount===0?.11:.035;return Math.random()<base;}
  pickRudeType(force=null){if(force)return force;let pool=[...RUDE_TYPE_ORDER];const recent=this.state.recentRudeTypes||[];pool=pool.filter(x=>!recent.slice(0,3).includes(x));const purchases=this.state.customerHistory||[];if(!purchases.length)pool=pool.filter(x=>!['durability','refund'].includes(x));if(!pool.length)pool=['compare','calculator','elf','dwarf'];return pool[Math.floor(Math.random()*pool.length)];}
  spawnRude(minute,guaranteed=false,forcedType=null){const rudeType=this.pickRudeType(forcedType),def=RUDE_TYPES[rudeType]||RUDE_TYPES.compare,purchases=this.state.customerHistory||[];let itemId=['sword','shield','dagger','longsword'][Math.floor(Math.random()*4)],name=def.name,purchaseRef=null;if(['durability','refund'].includes(rudeType)&&purchases.length){purchaseRef=purchases[Math.floor(Math.random()*Math.min(8,purchases.length))];itemId=purchaseRef.itemId;name=purchaseRef.customerName||def.name;}if(rudeType==='credit'){name='허풍쟁이 베른';itemId='sword';}if(rudeType==='closing')itemId='longsword';if(rudeType==='changes')itemId='dagger';this.rudeCount++;return this.spawn({type:'rude',name,customerId:`rude:${rudeType}:${name}`,mode:'direct',itemId,preferences:[itemId],budget:.9,patience:175,rude:true,rudeType,purchaseRef,guaranteed,line:def.line},minute);}
  profileCandidates(type){const profiles=this.state.customerProfiles||{};return Object.values(profiles).filter(p=>p.type===type&&(p.visitCount||0)>0);}
  spawnRandom(minute,event,reputation=0){if(this.shouldSpawnRude())return this.spawnRude(minute);const pool=typePoolByTime(minute,reputation);let type=event?.visitorType&&Math.random()<.34?event.visitorType:pool[Math.floor(Math.random()*pool.length)];const a=CUSTOMER_ARCHETYPES[type]||CUSTOMER_ARCHETYPES.villager;
    const known=this.profileCandidates(type),reuse=known.length&&Math.random()<RenownSystem.regularChance(reputation);let profile=reuse?known[Math.floor(Math.random()*known.length)]:null;let name=profile?.name;if(!name){const names=CUSTOMER_NAMES[type]||[a.name];name=names[Math.floor(Math.random()*names.length)];}
    const customerId=profile?.customerId||`${type}:${name}`,r=Math.random();let mode=r<.68?'general':r<.86?'direct':'commission';const prefs=profile?.preferredItems?.length?[...profile.preferredItems]:[...a.preferences],itemId=prefs[Math.floor(Math.random()*prefs.length)],purpose=mode==='direct'&&type==='adventurer'&&Math.random()<.55,isRegular=!!profile?.isRegular;const line=isRegular?`또 왔소. 지난번 물건이 괜찮아서 말이지. ${a.line}`:a.line;return this.spawn({type,name,customerId,mode,itemId,preferences:prefs,budget:a.budget*(isRegular?1.06:1),patience:a.patience*(isRegular?1.15:1),purpose,line,isRegular},minute);}
  spawnScripted(kind,minute){if(kind==='knight')return this.spawn({type:'knight',name:'기사 로데릭',customerId:'knight:roderick',mode:'direct',itemId:'sword',preferences:['sword','longsword'],budget:1.6,patience:190,knight:true,line:'이번 원정에 들고 갈 철검 한 자루가 필요하오. 오래 버틸 물건이면 좋겠군.'},minute);const prev=this.state.knightPurchase;return this.spawn({type:'knight',name:'기사 로데릭',customerId:'knight:roderick',mode:'direct',itemId:'longsword',preferences:['longsword','shield','sword'],budget:1.7,patience:200,knight:true,returning:true,line:`전에 사 간 ${prev?.itemName||'무기'}이 꽤 쓸 만했소. 이번에는 장검을 하나 보고 싶군.`},minute);}
  spawn(base,minute){const idx=this.activeCount()%4,p=base.mode==='general'?BROWSE_POS[idx]:COUNTER_POS[idx],id=`C${this.nextId++}`,v={id,...base,customerId:base.customerId||`${base.type}:${base.name}`,x:DOOR_FLOW.outsideWait.x,y:DOOR_FLOW.outsideWait.y,targetX:p.x,targetY:p.y,status:'entering',doorPhase:'wait',acceptedItem:null,arrivedMinute:minute,bubble:'',bubbleT:0};this.visitors.push(v);return v;}
  acceptDirect(v,itemId){v.acceptedItem=itemId||v.itemId;v.status='ordered';v.patience=Math.max(v.patience,150);} leave(v,reason=''){v.status='leaving';v.doorPhase='exitWait';v.bubble=reason;v.bubbleT=2.5;v.targetX=DOOR_FLOW.exitWait.x;v.targetY=DOOR_FLOW.exitWait.y;delete v._customerNav;} complete(v){this.leave(v,'거래 완료');}
  toJSON(){return{visitors:this.visitors.map(v=>{const c={...v};delete c._customerNav;return c;}),nextSpawn:this.nextSpawn,nextId:this.nextId,scripted:{...this.scripted},wasOpen:this.wasOpen,rudeCount:this.rudeCount};}
}
