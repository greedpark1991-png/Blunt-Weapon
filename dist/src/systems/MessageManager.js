export class MessageManager{
  constructor(){this.items=[];this.seq=1;this.location=null;}
  push(text,{type='system',priority=40,duration=2.8}={}){
    if(!text)return null;const item={id:this.seq++,text:String(text),type,priority,duration,remaining:duration};this.items.push(item);if(this.items.length>10)this.items.splice(0,this.items.length-10);return item;
  }
  system(text,seconds=2.8){return this.push(text,{type:'system',priority:40,duration:seconds});}
  important(text,seconds=3.8){return this.push(text,{type:'important',priority:80,duration:seconds});}
  locationText(text,seconds=1.4){this.location={text:String(text),remaining:seconds,duration:seconds};}
  update(dt){for(const m of this.items)m.remaining-=dt;this.items=this.items.filter(m=>m.remaining>0);if(this.location){this.location.remaining-=dt;if(this.location.remaining<=0)this.location=null;}}
  visible(limit=3){const picked=[...this.items].sort((a,b)=>b.priority-a.priority||b.id-a.id).slice(0,limit);return picked.sort((a,b)=>a.id-b.id);}
  clear(){this.items=[];this.location=null;}
}
