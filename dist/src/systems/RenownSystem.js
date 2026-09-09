import { RENOWN_TIERS } from '../data/GameData.js';
export class RenownSystem{
  static tier(rep=0){return RENOWN_TIERS.find(t=>rep>=t.min&&rep<=t.max)||RENOWN_TIERS[RENOWN_TIERS.length-1];}
  static tierIndex(rep=0){return Math.max(0,RENOWN_TIERS.findIndex(t=>rep>=t.min&&rep<=t.max));}
  static next(rep=0){const i=this.tierIndex(rep);return RENOWN_TIERS[i+1]||null;}
  static progress(rep=0){const t=this.tier(rep),n=this.next(rep);return{tier:t,next:n,remaining:n?Math.max(0,n.min-rep):0};}
  static visitMultiplier(rep=0){return 1+Math.min(.15,this.tierIndex(rep)*.03);}
  static regularChance(rep=0){return rep<10?.06:rep<25?.11:rep<50?.17:rep<80?.21:.25;}
  static specialPool(rep=0){const p=[];if(rep>=25)p.push({type:'adventurer',name:'먼 마을 모험가 라우',line:'소문을 듣고 이 대장간까지 찾아왔습니다.'});if(rep>=50)p.push({type:'knight',name:'기사단 병사 알렌',line:'기사단 동료에게 이곳 솜씨가 좋다고 들었습니다.'});if(rep>=80)p.push({type:'guard',name:'귀족 집사 세드릭',line:'주인께서 명성 높은 대장간을 찾으라 하셨습니다.'});if(rep>=120)p.push({type:'knight',name:'방랑 영웅 아델',line:'먼 길에서 이 형제의 이름을 들었습니다.'});return p;}
}
