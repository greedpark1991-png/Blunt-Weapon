export class OrderSystem {
  constructor(data){ this.orders=data?.orders?[...data.orders]:[];this.nextId=data?.nextId||1; }
  accept({customerName,itemId,day,minute,rewardBonus=.15}){
    const order={id:`O${this.nextId++}`,customerName,itemId,createdDay:day,createdMinute:minute,dueDay:day+1,dueMinute:1080,status:'open',rewardBonus};
    this.orders.push(order);return order;
  }
  openOrders(){return this.orders.filter(o=>o.status==='open');}
  markDone(id,item){const o=this.orders.find(x=>x.id===id);if(!o)return null;o.status='done';o.completedItem=item;o.completedAt=Date.now();return o;}
  failOverdue(day,minute){const failed=[];for(const o of this.orders){if(o.status==='open'&&(day>o.dueDay||(day===o.dueDay&&minute>o.dueMinute))){o.status='failed';failed.push(o);}}return failed;}
  toJSON(){return {orders:this.orders.map(o=>({...o})),nextId:this.nextId};}
}
