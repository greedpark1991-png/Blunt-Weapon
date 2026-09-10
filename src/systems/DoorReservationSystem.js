import { DOOR_FLOW } from '../data/GameData.js';
export class DoorReservationSystem{
  constructor(data){this.holder=data?.holder||null;this.direction=data?.direction||null;this.queue=Array.isArray(data?.queue)?data.queue.map(x=>({...x})):[];}
  queued(id){return this.queue.findIndex(q=>q.id===id);}
  enqueue(id,direction='in'){if(this.holder===id)return -1;let i=this.queued(id);if(i<0){this.queue.push({id,direction});i=this.queue.length-1;}return i;}
  request(id,direction='in'){
    if(this.holder===id)return true;
    this.enqueue(id,direction);
    if(!this.holder&&this.queue[0]?.id===id){const q=this.queue.shift();this.holder=id;this.direction=q.direction;return true;}
    return false;
  }
  release(id){if(this.holder===id){this.holder=null;this.direction=null;}this.queue=this.queue.filter(q=>q.id!==id);}
  cancel(id){this.release(id);}
  waitPoint(id,direction='in'){
    const i=Math.max(0,this.enqueue(id,direction));
    if(direction==='out')return{x:DOOR_FLOW.exitWait.x-i*12,y:DOOR_FLOW.exitWait.y};
    return{x:DOOR_FLOW.outsideWait.x+(DOOR_FLOW.outsideWaitStep?.x||12)*Math.min(i,2),y:DOOR_FLOW.outsideWait.y};
  }
  toJSON(){return{holder:this.holder,direction:this.direction,queue:this.queue.map(x=>({...x}))};}
}
