import { ITEMS, BROTHERS } from '../data/GameData.js';
export class CraftingSystem {
  constructor(data){this.active=data?.active||null;}
  begin(itemId,workerId,inventory){
    if(this.active)return{ok:false,reason:'이미 제작 중인 물건이 있다.'};const recipe=ITEMS[itemId];if(!recipe)return{ok:false,reason:'알 수 없는 제작법이다.'};if(!inventory.consume(recipe))return{ok:false,reason:'재료가 부족하다.'};
    this.active={itemId,workerId,stageIndex:0,scores:[],startedAt:Date.now()};return{ok:true,stage:this.currentStage()};
  }
  currentItem(){return this.active?ITEMS[this.active.itemId]:null;}
  currentStage(){const item=this.currentItem();return item?.stages?.[this.active.stageIndex]||null;}
  stageDone(score,bonus=0){
    if(!this.active)return null;const s=Math.max(0,Math.min(100,Math.round(score+bonus)));this.active.scores.push(s);this.active.stageIndex++;
    if(this.active.stageIndex>=this.currentItem().stages.length)return this.finish();return{done:false,stage:this.currentStage(),score:s};
  }
  finish(){
    const a=this.active;if(!a)return null;const recipe=ITEMS[a.itemId],worker=BROTHERS[a.workerId];let avg=a.scores.reduce((x,y)=>x+y,0)/Math.max(1,a.scores.length);
    if(worker.id==='younger'&&recipe.family==='blade')avg+=worker.bladeScore||0;if(worker.id==='younger'&&(recipe.family==='bow'||recipe.family==='arrow'))avg+=worker.bowScore||0;if(worker.id==='older'&&recipe.family==='shield')avg+=5;
    let quality='crude';if(avg>=92)quality='master';else if(avg>=76)quality='excellent';else if(avg>=55)quality='normal';
    const item={uid:`${Date.now()}-${Math.random().toString(16).slice(2)}`,itemId:recipe.id,itemName:recipe.name,basePrice:recipe.price,quality,maker:worker.id,makerName:worker.name,score:Math.round(avg),bundle:recipe.bundle||1};this.active=null;return{done:true,item};
  }
  speedMultiplier(){if(!this.active)return 1;const item=this.currentItem(),worker=BROTHERS[this.active.workerId];let pace=item.craftScale||1;if(worker.id==='older'&&item.family==='shield')pace*=worker.heavySpeed||1;return pace;}
  toJSON(){return{active:this.active?JSON.parse(JSON.stringify(this.active)):null};}
}
