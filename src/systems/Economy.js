import { MATERIAL_PRICES, QUALITY, demandMultiplier } from '../data/GameData.js';
export class Economy {
  constructor(data){this.gold=data?.gold??100;this.reputation=data?.reputation??0;this.resetDay(data?.dayStats);}
  resetDay(stats){this.dayStats={revenue:0,materialCost:0,crafted:0,visitors:0,sales:0,displaySales:0,orderSales:0,repGain:0,...(stats||{})};}
  materialPrice(type,event,discount=1){const base=MATERIAL_PRICES[type];const mult=event?.material?.[type]||1;return Math.max(1,Math.round(base*mult*discount));}
  buyMaterial(type,event,{discount=1,amount=1}={}){const unit=this.materialPrice(type,event,discount),price=unit*amount;if(this.gold<price)return{ok:false,price,unit,amount};this.gold-=price;this.dayStats.materialCost+=price;return{ok:true,price,unit,amount};}
  priceFor(item,event,extraMultiplier=1){const q=QUALITY[item.quality]||QUALITY.normal;return Math.max(1,Math.round(item.basePrice*q.multiplier*demandMultiplier(item.itemId,event)*extraMultiplier));}
  sell(item,event,{discount=1,extraRep=0,extraMultiplier=1,channel='display'}={}){
    const price=this.priceFor(item,event,extraMultiplier)*discount;const final=Math.max(1,Math.round(price));const q=QUALITY[item.quality]||QUALITY.normal;const rep=Math.max(0,q.rep+extraRep);
    this.gold+=final;this.reputation+=rep;this.dayStats.revenue+=final;this.dayStats.sales+=1;this.dayStats.repGain+=rep;if(channel==='display')this.dayStats.displaySales++;if(channel==='order')this.dayStats.orderSales++;
    return{price:final,rep};
  }
  markCraft(){this.dayStats.crafted++;}
  markVisitor(){this.dayStats.visitors++;}
  adjustRep(amount){this.reputation=Math.max(0,this.reputation+amount);this.dayStats.repGain+=amount;}
  toJSON(){return{gold:this.gold,reputation:this.reputation,dayStats:{...this.dayStats}};}
}
