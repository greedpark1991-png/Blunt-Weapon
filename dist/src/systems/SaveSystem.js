const KEY='blacksmith-brothers-v02-save';
const OLD_KEY='blacksmith-brothers-v01-save';
export class SaveSystem {
  static hasSave(){try{return!!(localStorage.getItem(KEY)||localStorage.getItem(OLD_KEY));}catch{return false;}}
  static load(){
    try{const current=localStorage.getItem(KEY);if(current)return JSON.parse(current);const old=localStorage.getItem(OLD_KEY);if(!old)return null;return this.migrate(JSON.parse(old));}catch{return null;}
  }
  static migrate(s){
    if(!s)return null;if((s.version||0)>=2)return s;
    return{version:2,day:s.day||1,gold:s.gold??100,reputation:s.reputation??0,inventory:s.inventory,weaponHistory:s.weaponHistory||[],knightPurchase:s.knightPurchase||null,flags:s.flags||{},controlled:s.controlled||'younger',players:s.players,time:{minute:360,speed:1},shopOpen:false,display:{slots:[null,null,null,null,null]},orders:{orders:[],nextId:1},maintenance:{cleanliness:88,dirtSpots:[{x:208,y:246}],roles:{older:'idle',younger:'idle'},condition:'normal'},activeEvent:s.activeEvent||null,nextEvent:s.nextEvent||null,tutorialSeen:s.tutorialSeen||false};
  }
  static save(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
  static clear(){try{localStorage.removeItem(KEY);localStorage.removeItem(OLD_KEY);}catch{}}
}
