const DUES=[
  {month:3,day:25,name:'새싹맞이날'},
  {month:6,day:24,name:'태양절'},
  {month:9,day:29,name:'황금수확제'},
  {month:12,day:25,name:'겨울불꽃제'},
];
export class RentSystem{
  constructor(data){this.baseRent=data?.baseRent??750;this.arrears=data?.arrears??0;this.missed=data?.missed??0;this.lastSettlement=data?.lastSettlement||null;this.lastWarningKey=data?.lastWarningKey||null;}
  nextDue(calendar){let best=null;for(const due of DUES){const days=calendar.daysUntil(due.month,due.day);if(best===null||days<best.days)best={...due,days};}return{...best,amount:this.amountDue()};}
  amountDue(){return Math.round(this.baseRent+this.arrears);}
  warning(calendar){const n=this.nextDue(calendar);if(![7,3,1,0].includes(n.days))return null;const key=`${calendar.year}-${n.month}-${n.day}-${n.days}`;if(this.lastWarningKey===key)return null;this.lastWarningKey=key;return n.days===0?`오늘은 ${n.name}. 임대료 ${n.amount}G 정산일이다.`:n.days===1?`내일은 ${n.name}. 임대료 ${n.amount}G를 준비하자.`:`대장간 임대료 정산까지 ${n.days}일 남았다. ${n.amount}G 필요.`;}
  settleIfDue(calendar,economy){const due=DUES.find(x=>x.month===calendar.month&&x.day===calendar.day);if(!due)return null;const amount=this.amountDue(),key=`${calendar.year}-${calendar.month}-${calendar.day}`;if(this.lastSettlement===key)return null;this.lastSettlement=key;if(economy.gold>=amount){economy.gold-=amount;this.arrears=0;this.missed=0;return{paid:true,amount,name:due.name};}this.missed++;const shortage=amount-economy.gold;this.arrears=Math.round(shortage+(this.missed>1?80*this.missed:40));if(this.missed>=2)economy.adjustRep(-1);return{paid:false,amount,name:due.name,shortage,arrears:this.arrears,missed:this.missed};}
  toJSON(){return{baseRent:this.baseRent,arrears:this.arrears,missed:this.missed,lastSettlement:this.lastSettlement,lastWarningKey:this.lastWarningKey};}
}
export {DUES as RENT_DUES};
