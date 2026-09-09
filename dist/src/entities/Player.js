export class Player{
  constructor(id,x,y){ this.id=id; this.x=x; this.y=y; this.vx=0; this.vy=0; this.facing='down'; this.walkT=0; this.target=null; }
  update(dt,input,controlled=true){
    if(this.target){
      const dx=this.target.x-this.x,dy=this.target.y-this.y,d=Math.hypot(dx,dy);
      if(d<2){this.x=this.target.x;this.y=this.target.y;this.target=null;}
      else{
        const maxSpeed=this.id==='older'?118:132;
        const s=Math.min(maxSpeed,d/Math.max(.001,dt));
        this.x+=dx/d*s*dt;this.y+=dy/d*s*dt;this.walkT+=dt*9;
        if(Math.abs(dx)>Math.abs(dy))this.facing=dx<0?'left':'right';else this.facing=dy<0?'up':'down';
      }
      this.clamp();return;
    }
    if(!controlled)return;
    let dx=0,dy=0;if(input.down('KeyA','ArrowLeft'))dx--;if(input.down('KeyD','ArrowRight'))dx++;if(input.down('KeyW','ArrowUp'))dy--;if(input.down('KeyS','ArrowDown'))dy++;
    if(dx||dy){
      const l=Math.hypot(dx,dy);dx/=l;dy/=l;
      // V0.2.1: roughly twice the original prototype pace so workstation travel feels snappy.
      const speed=this.id==='older'?110:122;
      this.x+=dx*speed*dt;this.y+=dy*speed*dt;this.walkT+=dt*15;
      if(Math.abs(dx)>Math.abs(dy))this.facing=dx<0?'left':'right';else this.facing=dy<0?'up':'down';
    }
    this.clamp();
  }
  clamp(){this.x=Math.max(34,Math.min(606,this.x));this.y=Math.max(70,Math.min(326,this.y));}
}
