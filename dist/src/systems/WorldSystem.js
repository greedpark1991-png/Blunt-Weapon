import { SHOP_BOUNDS, SHOP_COLLIDERS, SHOP_ZONES } from '../data/GameData.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const expanded=(r,pad)=>({x:r.x-pad,y:r.y-pad,w:r.w+pad*2,h:r.h+pad*2});
const inside=(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;

export class WorldSystem{
  constructor(config={}){const bounds=config.bounds||SHOP_BOUNDS,colliders=config.colliders||SHOP_COLLIDERS,zones=config.zones||SHOP_ZONES;this.bounds={...bounds};this.colliders=colliders.map(x=>({...x}));this.zones=zones;this.cell=config.cell||12;}
  zoneRect(zone){return typeof zone==='string'?this.zones[zone]||null:zone||null;}
  limits(zone=null,pad=7){const z=this.zoneRect(zone);if(!z)return{left:this.bounds.left+pad,right:this.bounds.right-pad,top:this.bounds.top+pad,bottom:this.bounds.bottom-pad};return{left:Math.max(this.bounds.left+pad,z.x+pad),right:Math.min(this.bounds.right-pad,z.x+z.w-pad),top:Math.max(this.bounds.top+pad,z.y+pad),bottom:Math.min(this.bounds.bottom-pad,z.y+z.h-pad)};}
  collides(x,y,pad=7,ignore=[]){return this.colliders.some(r=>!ignore.includes(r.id)&&inside(x,y,expanded(r,pad)));}
  isWalkable(x,y,zone=null,pad=7,ignore=[]){const l=this.limits(zone,pad);return x>=l.left&&x<=l.right&&y>=l.top&&y<=l.bottom&&!this.collides(x,y,pad,ignore);}
  nearestWalkable(x,y,zone=null,pad=7){if(this.isWalkable(x,y,zone,pad))return{x,y};for(let ring=1;ring<=18;ring++){const d=ring*this.cell;for(let a=0;a<24;a++){const ang=a/24*Math.PI*2,nx=x+Math.cos(ang)*d,ny=y+Math.sin(ang)*d;if(this.isWalkable(nx,ny,zone,pad))return{x:nx,y:ny};}}const l=this.limits(zone,pad);return{x:clamp(x,l.left,l.right),y:clamp(y,l.top,l.bottom)};}
  moveEntity(entity,dx,dy,zone=null,pad=7){const l=this.limits(zone,pad);let nx=clamp(entity.x+dx,l.left,l.right),ny=entity.y;if(!this.collides(nx,ny,pad))entity.x=nx;nx=entity.x;ny=clamp(entity.y+dy,l.top,l.bottom);if(!this.collides(nx,ny,pad))entity.y=ny;return{x:entity.x,y:entity.y};}
  findPath(start,end,zone=null,pad=7){
    const target=this.nearestWalkable(end.x,end.y,zone,pad);if(this.lineClear(start,target,zone,pad))return[target];
    const c=this.cell,l=this.limits(zone,pad),gx=x=>Math.round((x-l.left)/c),gy=y=>Math.round((y-l.top)/c),wx=g=>l.left+g*c,wy=g=>l.top+g*c;
    const sx=gx(start.x),sy=gy(start.y),tx=gx(target.x),ty=gy(target.y),key=(x,y)=>`${x},${y}`;
    const open=[{x:sx,y:sy,g:0,f:0}],came=new Map(),best=new Map([[key(sx,sy),0]]);let found=null,steps=0;
    while(open.length&&steps++<3200){
      open.sort((a,b)=>a.f-b.f);const n=open.shift();if(n.x===tx&&n.y===ty){found=n;break;}
      for(const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const x=n.x+ox,y=n.y+oy,px=wx(x),py=wy(y);if(!this.isWalkable(px,py,zone,pad))continue;
        // Do not cut diagonally through the corner of two furniture footprints.
        if(ox&&oy){if(!this.isWalkable(wx(n.x+ox),wy(n.y),zone,pad)||!this.isWalkable(wx(n.x),wy(n.y+oy),zone,pad))continue;}
        const nk=key(x,y),ng=n.g+(ox&&oy?1.414:1);if(ng>=(best.get(nk)??Infinity))continue;best.set(nk,ng);came.set(nk,{x:n.x,y:n.y});open.push({x,y,g:ng,f:ng+Math.hypot(tx-x,ty-y)});
      }
    }
    if(!found)return[target];const cells=[];let cur={x:tx,y:ty};while(!(cur.x===sx&&cur.y===sy)){cells.push(cur);cur=came.get(key(cur.x,cur.y));if(!cur)break;}cells.reverse();const pts=cells.map(n=>({x:wx(n.x),y:wy(n.y)}));pts.push(target);return this.simplifyPath(start,pts,zone,pad);
  }
  lineClear(a,b,zone=null,pad=7){const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(d/5));for(let i=1;i<=n;i++){const t=i/n;if(!this.isWalkable(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,zone,pad))return false;}return true;}
  simplifyPath(start,pts,zone,pad){const out=[];let anchor=start,i=0;while(i<pts.length){let far=i;for(let j=i;j<pts.length;j++){if(this.lineClear(anchor,pts[j],zone,pad))far=j;else break;}out.push(pts[far]);anchor=pts[far];i=far+1;}return out;}
  followPath(entity,target,dt,speed,zone=null,pad=7,navKey='_nav'){
    if(!this.isWalkable(entity.x,entity.y,zone,pad)){const safeStart=this.nearestWalkable(entity.x,entity.y,zone,pad);entity.x=safeStart.x;entity.y=safeStart.y;delete entity[navKey];}
    const goal=this.nearestWalkable(target.x,target.y,zone,pad),sig=`${Math.round(goal.x)},${Math.round(goal.y)},${zone||''}`;let nav=entity[navKey];
    if(!nav||nav.sig!==sig||!nav.path?.length){nav={sig,path:this.findPath(entity,goal,zone,pad),stuck:0,last:null};entity[navKey]=nav;}
    const wp=nav.path[0]||goal,dx=wp.x-entity.x,dy=wp.y-entity.y,d=Math.hypot(dx,dy);if(d<3){nav.path.shift();if(!nav.path.length){entity.x=goal.x;entity.y=goal.y;return true;}return false;}
    const ox=entity.x,oy=entity.y,l=d||1;this.moveEntity(entity,dx/l*speed*dt,dy/l*speed*dt,zone,pad);const moved=Math.hypot(entity.x-ox,entity.y-oy);nav.stuck=moved<.15?nav.stuck+dt:0;if(nav.stuck>1.0){nav.path=this.findPath(entity,goal,zone,pad);nav.stuck=0;}return false;
  }
}
