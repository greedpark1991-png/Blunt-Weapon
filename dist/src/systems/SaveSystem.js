const PREFIX='blacksmith-brothers-v3-slot-';
const AUTO='blacksmith-brothers-v3-auto';
const OLD_KEYS=['blacksmith-brothers-v02-save','blacksmith-brothers-v01-save'];
export class SaveSystem{
  static SLOT_COUNT=6;
  static key(id){return id==='auto'?AUTO:`${PREFIX}${Number(id)}`;}
  static hasSave(){return this.hasAnySave();}
  static hasAnySave(){try{if(localStorage.getItem(AUTO))return true;for(let i=1;i<=this.SLOT_COUNT;i++)if(localStorage.getItem(this.key(i)))return true;return OLD_KEYS.some(k=>!!localStorage.getItem(k));}catch{return false;}}
  static migrate(s){
    if(!s)return null;if((s.saveVersion||0)>=3)return s;
    const version=s.version||0;
    if(version>=2)return{...s,saveVersion:3,version:3,playTimeSeconds:s.playTimeSeconds||0,calendar:s.calendar||null,rent:s.rent||null,customerHistory:s.customerHistory||[],debts:s.debts||{},recentRudeTypes:s.recentRudeTypes||[]};
    return{saveVersion:3,version:3,day:s.day||1,gold:s.gold??100,reputation:s.reputation??0,inventory:s.inventory,weaponHistory:s.weaponHistory||[],knightPurchase:s.knightPurchase||null,flags:s.flags||{},controlled:s.controlled||'younger',players:s.players,time:{minute:360,speed:1},shopOpen:false,display:{slots:[null,null,null,null,null]},orders:{orders:[],nextId:1},maintenance:{cleanliness:88,dirtSpots:[{x:208,y:246}],roles:{older:'idle',younger:'idle'},condition:'normal'},activeEvent:s.activeEvent||null,nextEvent:s.nextEvent||null,tutorialSeen:s.tutorialSeen||false,playTimeSeconds:0,customerHistory:[],debts:{},recentRudeTypes:[]};
  }
  static loadLegacy(){try{for(const k of OLD_KEYS){const raw=localStorage.getItem(k);if(raw)return this.migrate(JSON.parse(raw));}}catch{}return null;}
  static load(id='auto'){try{const raw=localStorage.getItem(this.key(id));if(raw)return this.migrate(JSON.parse(raw).data??JSON.parse(raw));if(id==='auto')return this.loadLegacy();return null;}catch{return null;}}
  static saveSlot(id,data){try{const payload={saveVersion:3,meta:this.makeMeta(data),data:{...data,saveVersion:3,version:3}};localStorage.setItem(this.key(id),JSON.stringify(payload));return true;}catch{return false;}}
  static saveAuto(data){return this.saveSlot('auto',data);}
  static save(data){return this.saveAuto(data);}
  static metadata(id){try{const raw=localStorage.getItem(this.key(id));if(!raw)return null;const parsed=JSON.parse(raw);return parsed.meta||this.makeMeta(parsed.data||parsed);}catch{return{corrupt:true,label:'손상된 저장'};}}
  static list(){const arr=[{id:'auto',label:'AUTO SAVE',meta:this.metadata('auto')}];for(let i=1;i<=this.SLOT_COUNT;i++)arr.push({id:i,label:`SAVE ${i}`,meta:this.metadata(i)});if(!arr[0].meta){const legacy=this.loadLegacy();if(legacy)arr[0].meta=this.makeMeta(legacy);}return arr;}
  static delete(id){try{localStorage.removeItem(this.key(id));return true;}catch{return false;}}
  static clear(){try{localStorage.removeItem(AUTO);for(let i=1;i<=this.SLOT_COUNT;i++)localStorage.removeItem(this.key(i));for(const k of OLD_KEYS)localStorage.removeItem(k);}catch{}}
  static makeMeta(d){const cal=d?.calendar||{};const date=cal.year?`${cal.year}년차 ${cal.month}월 ${cal.day}일`:`DAY ${d?.day||1}`;const m=Math.floor(d?.time?.minute??360)%1440;const time=`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;return{date,time,gold:d?.gold??0,reputation:d?.reputation??0,playTimeSeconds:d?.playTimeSeconds||0,savedAt:new Date().toISOString()};}
}
