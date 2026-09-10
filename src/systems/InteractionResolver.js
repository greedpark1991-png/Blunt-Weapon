export const INTERACTION_PRIORITY={
  CURRENT_CRAFT:120,
  TOOL_TARGET:100,
  MAJOR_FACILITY:80,
  EVENT_NPC:72,
  GENERAL_NPC:55,
  PROP:30,
  INACTIVE:0,
};

const norm=c=>{
  const radius=Math.max(1,c.radius??34),distance=Math.max(0,c.distance??0);
  return{...c,radius,distance,enabled:c.enabled!==false,priority:c.priority??0,contextBonus:c.contextBonus??0};
};

export class InteractionResolver{
  constructor({ambiguityGap=2.5}={}){this.ambiguityGap=ambiguityGap;this.last=[];}
  rank(candidates=[]){
    const ranked=candidates.map(norm).filter(c=>c.enabled&&c.distance<=c.radius).map(c=>{
      const proximity=Math.max(0,1-c.distance/c.radius)*8;
      const score=c.priority+c.contextBonus+proximity;
      return{...c,score};
    }).sort((a,b)=>b.score-a.score||b.priority-a.priority||a.distance-b.distance||String(a.id).localeCompare(String(b.id)));
    this.last=ranked;return ranked;
  }
  resolve(candidates=[]){
    const ranked=this.rank(candidates),top=ranked[0]||null,second=ranked[1]||null;
    if(!top)return{selected:null,candidates:[],ambiguous:false,alternatives:[]};
    const ambiguous=!!(second&&top.allowChoice!==false&&second.allowChoice!==false&&Math.abs(top.score-second.score)<=this.ambiguityGap&&top.group!==second.group);
    return{selected:top,candidates:ranked,ambiguous,alternatives:ambiguous?ranked.slice(0,Math.min(3,ranked.length)):[]};
  }
  debug(){return this.last.map((c,i)=>({rank:i+1,id:c.id,type:c.type,priority:c.priority,score:Number(c.score.toFixed(2)),distance:Number(c.distance.toFixed(1)),enabled:c.enabled,context:c.context||''}));}
}
