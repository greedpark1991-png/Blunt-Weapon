export class DisplaySystem {
  constructor(data){ this.slots=Array.from({length:5},(_,i)=>data?.slots?.[i]||null); }
  firstEmpty(){ return this.slots.findIndex(x=>!x); }
  place(item,slot=this.firstEmpty()){ if(!item||slot<0||slot>=this.slots.length||this.slots[slot])return false; this.slots[slot]=item; return true; }
  take(slot){ if(slot<0||slot>=this.slots.length)return null; const item=this.slots[slot];this.slots[slot]=null;return item; }
  removeByUid(uid){ const i=this.slots.findIndex(x=>x?.uid===uid);return i>=0?this.take(i):null; }
  matching(preferences){ return this.slots.map((item,slot)=>({item,slot})).filter(x=>x.item&&preferences.includes(x.item.itemId)); }
  count(){return this.slots.filter(Boolean).length;}
  toJSON(){ return {slots:this.slots.map(x=>x?{...x}:null)}; }
}
