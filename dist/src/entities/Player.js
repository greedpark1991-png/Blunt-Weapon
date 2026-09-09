export class Player{
  constructor(id,x,y){this.id=id;this.x=x;this.y=y;this.vx=0;this.vy=0;this.facing='down';this.walkT=0;this.target=null;this.path=[];this.targetSig='';}
  setTarget(x,y,world,zone=null){const goal=world?world.nearestWalkable(x,y,zone,7):{x,y};this.target={x:goal.x,y:goal.y};this.targetSig=`${Math.round(goal.x)},${Math.round(goal.y)},${zone||''}`;this.path=world?world.findPath(this,goal,zone,7):[goal];}
  clearTarget(){this.target=null;this.path=[];this.targetSig='';}
  update(dt,input,controlled=true,world=null,zone=null){
    if(this.target){
      const wp=this.path?.[0]||this.target,dx=wp.x-this.x,dy=wp.y-this.y,d=Math.hypot(dx,dy);
      if(d<3){if(this.path?.length)this.path.shift();if(!this.path?.length){this.x=this.target.x;this.y=this.target.y;this.clearTarget();return;}}
      else{
        const maxSpeed=this.id==='older'?146:158,s=Math.min(maxSpeed,d/Math.max(.001,dt)),mx=dx/d*s*dt,my=dy/d*s*dt;
        if(world)world.moveEntity(this,mx,my,zone,7);else{this.x+=mx;this.y+=my;}
        this.walkT+=dt*13;if(Math.abs(dx)>Math.abs(dy))this.facing=dx<0?'left':'right';else this.facing=dy<0?'up':'down';
      }
      if(!world)this.clamp();return;
    }
    if(!controlled)return;
    let dx=0,dy=0;if(input.down('KeyA','ArrowLeft'))dx--;if(input.down('KeyD','ArrowRight'))dx++;if(input.down('KeyW','ArrowUp'))dy--;if(input.down('KeyS','ArrowDown'))dy++;
    if(dx||dy){
      const l=Math.hypot(dx,dy);dx/=l;dy/=l;
      // V0.2.5: +20% over V0.2.4, with normalized diagonals.
      const speed=this.id==='older'?132:146;
      if(world)world.moveEntity(this,dx*speed*dt,dy*speed*dt,zone,7);else{this.x+=dx*speed*dt;this.y+=dy*speed*dt;}
      this.walkT+=dt*19;if(Math.abs(dx)>Math.abs(dy))this.facing=dx<0?'left':'right';else this.facing=dy<0?'up':'down';
    }
    if(!world)this.clamp();
  }
  clamp(){this.x=Math.max(34,Math.min(606,this.x));this.y=Math.max(142,Math.min(326,this.y));}
}
