import { ITEMS, BROTHERS, PLAYER_INTERACTION_POINTS, ASSIST_POINTS, STORAGE_DELIVERY_POINT, NPC_PARKING_POINTS, SHOP_IDLE_POINTS, chooseTrait } from '../data/GameData.js';

const ROLE_STATIONS={counter:'counter',forge:'forge',grind:'grind',clean:'broom'};
function stationPoint(stationId,workerId,{assist=true}={}){
  const src=assist?ASSIST_POINTS:PLAYER_INTERACTION_POINTS;
  const p=src[stationId]||PLAYER_INTERACTION_POINTS[stationId]||PLAYER_INTERACTION_POINTS.bench;
  if(!p)return SHOP_IDLE_POINTS[workerId]||{x:350,y:300};
  return{x:p.x,y:p.y};
}
function parkingPoint(workerId){return workerId==='older'?NPC_PARKING_POINTS.storageOlder:NPC_PARKING_POINTS.storageYounger;}
function makeItem(task){
  const recipe=ITEMS[task.itemId],worker=BROTHERS[task.workerId];let avg=task.scores.reduce((a,b)=>a+b,0)/Math.max(1,task.scores.length);
  if(worker.id==='younger'&&recipe.family==='blade')avg+=worker.bladeScore||0;if(worker.id==='younger'&&(recipe.family==='bow'||recipe.family==='arrow'))avg+=worker.bowScore||0;if(worker.id==='older'&&recipe.family==='shield')avg+=5;
  let quality='crude';if(avg>=92)quality='master';else if(avg>=76)quality='excellent';else if(avg>=55)quality='normal';const perfectStages=task.precisionStages||0,trait=chooseTrait(recipe.family,perfectStages,recipe.stages.length,Math.random());
  return{uid:`auto-${Date.now()}-${Math.random().toString(16).slice(2)}`,itemId:recipe.id,itemName:recipe.name,basePrice:recipe.price,quality,maker:worker.id,makerName:worker.name,score:Math.round(avg),bundle:recipe.bundle||1,perfectStages,stageCount:recipe.stages.length,trait};
}
export class BrotherWorkSystem{
  constructor(data){this.tasks={older:null,younger:null};for(const id of ['older','younger'])if(data?.tasks?.[id])this.tasks[id]=this.migrateTask(data.tasks[id]);}
  migrateTask(raw){const t=JSON.parse(JSON.stringify(raw));t.repaths=t.repaths||0;t.stuckFor=t.stuckFor||0;if(t.state==='DELIVERING'&&!t.deliveryPhase)t.deliveryPhase='toStorage';return t;}
  task(id){return this.tasks[id]||null;} busy(id){return!!this.tasks[id];}
  cancel(id){this.tasks[id]=null;}
  assignRole(workerId,role){if(role==='idle'){this.tasks[workerId]=null;return{ok:true};}const stationId=ROLE_STATIONS[role]||'counter';this.tasks[workerId]={workerId,kind:'role',role,state:'GO_TO_WORKSTATION',stationId,stuckFor:0,lastDistance:null,workRemaining:0,repaths:0};return{ok:true};}
  assignCraft(workerId,itemId,inventory){if(this.busy(workerId))return{ok:false,reason:`${BROTHERS[workerId].name}은(는) 이미 다른 일을 하는 중이다.`};const recipe=ITEMS[itemId];if(!recipe)return{ok:false,reason:'알 수 없는 제작법이다.'};if(!inventory.consume(recipe))return{ok:false,reason:'재료가 부족하다.'};this.tasks[workerId]={workerId,kind:'craft',itemId,stageIndex:0,scores:[],precisionStages:0,state:'GO_TO_WORKSTATION',stationId:recipe.stages[0].station,stuckFor:0,lastDistance:null,workRemaining:0,completedItem:null,repaths:0,deliveryPhase:null,itemDelivered:false};return{ok:true,stage:recipe.stages[0]};}
  status(id){const t=this.tasks[id];if(!t)return{state:'IDLE',label:'대기',icon:''};if(t.kind==='role'){const labels={counter:['카운터 담당','¤'],forge:['화로 보조','♨'],grind:['연마 보조','◇'],clean:['청소','⌁']};const [label,icon]=labels[t.role]||['업무 중','•'];return{state:t.state,label,icon};}const item=ITEMS[t.itemId];if(t.state==='DELIVERING')return{state:t.state,label:`${item.name} 창고 전달`,icon:'▣'};if(t.state==='RETURNING')return{state:t.state,label:'자리 비우는 중',icon:'↘'};return{state:t.state,label:`${item.name} 제작 중`,icon:'⚒'};}
  update(dt,players,world=null){const events=[];for(const id of ['older','younger']){const task=this.tasks[id];if(!task)continue;const p=players[id];if(task.kind==='role')this.updateRole(dt,p,task,events,world);else this.updateCraft(dt,p,task,events,world);}return events;}
  approach(dt,p,task,target,world,zone=null){const d=Math.hypot(p.x-target.x,p.y-target.y);if(d<7){p.x=target.x;p.y=target.y;p.clearTarget?.();task.stuckFor=0;task.lastDistance=0;return true;}
    const sig=`${Math.round(target.x)},${Math.round(target.y)}`;if(!p.targetSig?.startsWith(sig))p.setTarget?.(target.x,target.y,world,zone);
    if(task.lastDistance!=null&&d>=task.lastDistance-.15)task.stuckFor=(task.stuckFor||0)+dt;else task.stuckFor=Math.max(0,(task.stuckFor||0)-dt*.5);task.lastDistance=d;
    if(task.stuckFor>2.0){p.setTarget?.(target.x,target.y,world,zone);task.stuckFor=0;task.repaths=(task.repaths||0)+1;if(task.repaths>=3&&world){const safe=world.nearestWalkable(target.x,target.y,zone,7);p.x=safe.x;p.y=safe.y;p.clearTarget?.();task.repaths=0;return Math.hypot(p.x-target.x,p.y-target.y)<10;}}
    return false;}
  updateRole(dt,p,task,events,world){const target=stationPoint(task.stationId,task.workerId,{assist:true});if(task.state==='GO_TO_WORKSTATION'){if(this.approach(dt,p,task,target,world)){task.state='WORKING';events.push({type:'roleStarted',workerId:task.workerId,role:task.role,stationId:task.stationId,point:target});}}else if(task.state==='WORKING'&&Math.hypot(p.x-target.x,p.y-target.y)>24){task.state='GO_TO_WORKSTATION';task.stuckFor=0;p.setTarget?.(target.x,target.y,world,null);}}
  updateCraft(dt,p,task,events,world){
    const recipe=ITEMS[task.itemId];
    if(task.state==='DELIVERING'){
      if(this.approach(dt,p,task,STORAGE_DELIVERY_POINT,world)){
        if(!task.itemDelivered){task.itemDelivered=true;events.push({type:'craftDelivered',workerId:task.workerId,item:task.completedItem});}
        task.state='RETURNING';task.deliveryPhase='parking';task.stuckFor=0;task.lastDistance=null;p.clearTarget?.();
      }return;
    }
    if(task.state==='RETURNING'){
      const park=parkingPoint(task.workerId);if(this.approach(dt,p,task,park,world)){const item=task.completedItem;this.tasks[task.workerId]=null;events.push({type:'returnedToParking',workerId:task.workerId,item,point:park});}return;
    }
    const stage=recipe.stages[task.stageIndex];if(!stage){this.tasks[task.workerId]=null;return;}task.stationId=stage.station;const target=stationPoint(stage.station,task.workerId,{assist:true});
    if(task.state==='GO_TO_WORKSTATION'){if(this.approach(dt,p,task,target,world)){task.state='WORKING';const base=1.15+(stage.hits||2)*.48*(recipe.craftScale||1),heavy=task.workerId==='older'&&recipe.family==='shield'?.82:1;task.workRemaining=Math.max(1.15,base*heavy);events.push({type:'stageStarted',workerId:task.workerId,itemId:task.itemId,stage,point:target});}return;}
    if(task.state==='WORKING'){
      task.workRemaining-=dt;if(task.workRemaining<=0){let score=66+Math.random()*20;if(task.workerId==='older'&&['hammer','rivet','heat'].includes(stage.kind))score+=6;if(task.workerId==='younger'&&['grind','assemble','string','test','wood'].includes(stage.kind))score+=6;const finalScore=Math.min(98,Math.round(score));task.scores.push(finalScore);if(finalScore>=94)task.precisionStages=(task.precisionStages||0)+1;task.stageIndex++;
        if(task.stageIndex>=recipe.stages.length){task.completedItem=makeItem(task);task.state='DELIVERING';task.deliveryPhase='toStorage';task.stuckFor=0;task.lastDistance=null;p.clearTarget?.();events.push({type:'craftFinished',workerId:task.workerId,item:task.completedItem});}
        else{task.state='GO_TO_WORKSTATION';task.stuckFor=0;task.lastDistance=null;p.clearTarget?.();events.push({type:'stageDone',workerId:task.workerId,itemId:task.itemId,stageIndex:task.stageIndex});}
      }
    }
  }
  toJSON(){return{tasks:{older:this.tasks.older?JSON.parse(JSON.stringify(this.tasks.older)):null,younger:this.tasks.younger?JSON.parse(JSON.stringify(this.tasks.younger)):null}};}
}
