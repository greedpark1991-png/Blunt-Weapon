import { ITEMS, BROTHERS, STATIONS, chooseTrait } from '../data/GameData.js';

const ROLE_STATIONS={
  counter:'counter',
  forge:'forge',
  grind:'grind',
  clean:'broom',
};

function workPoint(stationId,workerId){
  const s=STATIONS[stationId]||STATIONS.bench;
  const side=workerId==='older'?-1:1;
  return {x:s.x+s.w/2+side*10,y:s.y+s.h+18};
}

function makeItem(task){
  const recipe=ITEMS[task.itemId],worker=BROTHERS[task.workerId];
  let avg=task.scores.reduce((a,b)=>a+b,0)/Math.max(1,task.scores.length);
  if(worker.id==='younger'&&recipe.family==='blade')avg+=worker.bladeScore||0;
  if(worker.id==='younger'&&(recipe.family==='bow'||recipe.family==='arrow'))avg+=worker.bowScore||0;
  if(worker.id==='older'&&recipe.family==='shield')avg+=5;
  let quality='crude';if(avg>=92)quality='master';else if(avg>=76)quality='excellent';else if(avg>=55)quality='normal';
  const perfectStages=task.precisionStages||0,trait=chooseTrait(recipe.family,perfectStages,recipe.stages.length,Math.random());
  return {uid:`auto-${Date.now()}-${Math.random().toString(16).slice(2)}`,itemId:recipe.id,itemName:recipe.name,basePrice:recipe.price,quality,maker:worker.id,makerName:worker.name,score:Math.round(avg),bundle:recipe.bundle||1,perfectStages,stageCount:recipe.stages.length,trait};
}

export class BrotherWorkSystem{
  constructor(data){
    this.tasks={older:null,younger:null};
    for(const id of ['older','younger'])if(data?.tasks?.[id])this.tasks[id]=JSON.parse(JSON.stringify(data.tasks[id]));
  }
  task(id){return this.tasks[id]||null;}
  busy(id){return !!this.tasks[id];}
  cancel(id){this.tasks[id]=null;}
  assignRole(workerId,role){
    if(role==='idle'){this.tasks[workerId]=null;return{ok:true};}
    const stationId=ROLE_STATIONS[role]||'counter';
    this.tasks[workerId]={workerId,kind:'role',role,state:'GO_TO_WORKSTATION',stationId,stuckFor:0,lastDistance:null,workRemaining:0};
    return{ok:true};
  }
  assignCraft(workerId,itemId,inventory){
    if(this.busy(workerId))return{ok:false,reason:`${BROTHERS[workerId].name}은(는) 이미 다른 일을 하는 중이다.`};
    const recipe=ITEMS[itemId];if(!recipe)return{ok:false,reason:'알 수 없는 제작법이다.'};
    if(!inventory.consume(recipe))return{ok:false,reason:'재료가 부족하다.'};
    this.tasks[workerId]={workerId,kind:'craft',itemId,stageIndex:0,scores:[],precisionStages:0,state:'GO_TO_WORKSTATION',stationId:recipe.stages[0].station,stuckFor:0,lastDistance:null,workRemaining:0,completedItem:null};
    return{ok:true,stage:recipe.stages[0]};
  }
  status(id){
    const t=this.tasks[id];if(!t)return{state:'IDLE',label:'대기',icon:''};
    if(t.kind==='role'){
      const labels={counter:['카운터 담당','¤'],forge:['화로 관리','♨'],grind:['숫돌 관리','◇'],clean:['청소','⌁']};const [label,icon]=labels[t.role]||['업무 중','•'];
      return{state:t.state,label,icon};
    }
    const item=ITEMS[t.itemId];if(t.state==='DELIVERING')return{state:t.state,label:`${item.name} 운반` ,icon:'▣'};
    return{state:t.state,label:`${item.name} 제작 중`,icon:'⚒'};
  }
  update(dt,players){
    const events=[];
    for(const id of ['older','younger']){
      const task=this.tasks[id];if(!task)continue;const p=players[id];
      if(task.kind==='role')this.updateRole(dt,p,task,events);
      else this.updateCraft(dt,p,task,events);
    }
    return events;
  }
  approach(dt,p,task,target){
    const d=Math.hypot(p.x-target.x,p.y-target.y);
    if(d<7){p.x=target.x;p.y=target.y;p.target=null;task.stuckFor=0;task.lastDistance=0;return true;}
    p.target={...target};
    if(task.lastDistance!=null&&d>=task.lastDistance-0.25)task.stuckFor=(task.stuckFor||0)+dt;else task.stuckFor=0;
    task.lastDistance=d;
    // fail-safe: retry first, then safely re-approach. Never leave a worker frozen forever.
    if(task.stuckFor>3.5){
      const dx=target.x-p.x,dy=target.y-p.y,l=Math.hypot(dx,dy)||1;
      p.x=target.x-dx/l*18;p.y=target.y-dy/l*18;p.target={...target};task.stuckFor=0;task.lastDistance=18;
    }
    return false;
  }
  updateRole(dt,p,task,events){
    const target=workPoint(task.stationId,task.workerId);
    if(task.state==='GO_TO_WORKSTATION'){
      if(this.approach(dt,p,task,target)){task.state='WORKING';events.push({type:'roleStarted',workerId:task.workerId,role:task.role});}
    }else if(task.state==='WORKING'){
      // persistent role; if displaced, recover automatically.
      if(Math.hypot(p.x-target.x,p.y-target.y)>28){task.state='GO_TO_WORKSTATION';task.stuckFor=0;}
    }
  }
  updateCraft(dt,p,task,events){
    const recipe=ITEMS[task.itemId];
    if(task.state==='DELIVERING'){
      const target=workPoint('storage',task.workerId);
      if(this.approach(dt,p,task,target)){
        const item=task.completedItem;this.tasks[task.workerId]=null;events.push({type:'craftDelivered',workerId:task.workerId,item});
      }
      return;
    }
    const stage=recipe.stages[task.stageIndex];if(!stage){this.tasks[task.workerId]=null;return;}
    task.stationId=stage.station;
    const target=workPoint(stage.station,task.workerId);
    if(task.state==='GO_TO_WORKSTATION'){
      if(this.approach(dt,p,task,target)){
        task.state='WORKING';
        const base=1.15+(stage.hits||2)*0.48*(recipe.craftScale||1);
        const heavy=task.workerId==='older'&&recipe.family==='shield'?.82:1;
        task.workRemaining=Math.max(1.15,base*heavy);events.push({type:'stageStarted',workerId:task.workerId,itemId:task.itemId,stage});
      }
      return;
    }
    if(task.state==='WORKING'){
      task.workRemaining-=dt;
      if(task.workRemaining<=0){
        let score=66+Math.random()*20;
        if(task.workerId==='older'&&['hammer','rivet','heat'].includes(stage.kind))score+=6;
        if(task.workerId==='younger'&&['grind','assemble','string','test','wood'].includes(stage.kind))score+=6;
        const finalScore=Math.min(98,Math.round(score));task.scores.push(finalScore);if(finalScore>=94)task.precisionStages=(task.precisionStages||0)+1;task.stageIndex++;
        if(task.stageIndex>=recipe.stages.length){task.completedItem=makeItem(task);task.state='DELIVERING';task.stuckFor=0;p.target=null;events.push({type:'craftFinished',workerId:task.workerId,item:task.completedItem});}
        else{task.state='GO_TO_WORKSTATION';task.stuckFor=0;p.target=null;events.push({type:'stageDone',workerId:task.workerId,itemId:task.itemId,stageIndex:task.stageIndex});}
      }
    }
  }
  toJSON(){return{tasks:{older:this.tasks.older?JSON.parse(JSON.stringify(this.tasks.older)):null,younger:this.tasks.younger?JSON.parse(JSON.stringify(this.tasks.younger)):null}};}
}
