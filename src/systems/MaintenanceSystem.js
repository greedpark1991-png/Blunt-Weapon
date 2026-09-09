const DIRT_PRESETS=[{x:208,y:246},{x:420,y:236},{x:345,y:260},{x:120,y:320},{x:525,y:320}];
export class MaintenanceSystem {
  constructor(data){
    this.cleanliness=data?.cleanliness ?? 88;
    this.dirtSpots=data?.dirtSpots?[...data.dirtSpots]:[{...DIRT_PRESETS[0]}];
    this.dirtClock=data?.dirtClock ?? 0;
    this.forgeBoost=data?.forgeBoost ?? 0;
    this.grindBoost=data?.grindBoost ?? 0;
    this.roles={older:'idle',younger:'idle',...(data?.roles||{})};
    this.condition=data?.condition || 'normal';
  }
  update(gameMinutes){
    this.dirtClock+=gameMinutes;
    if(this.dirtClock>=165&&this.dirtSpots.length<5){this.dirtClock-=165;const p=DIRT_PRESETS[this.dirtSpots.length%DIRT_PRESETS.length];this.dirtSpots.push({...p});this.cleanliness=Math.max(35,this.cleanliness-11);}
  }
  clean(){const n=this.dirtSpots.length;this.dirtSpots=[];this.cleanliness=Math.min(100,this.cleanliness+18+n*8);return n;}
  prepForge(){this.forgeBoost=3;}
  tuneGrind(){this.grindBoost=3;}
  useForgeBoost(){if(this.forgeBoost>0){this.forgeBoost--;return 5;}return 0;}
  useGrindBoost(){if(this.grindBoost>0){this.grindBoost--;return 5;}return 0;}
  assign(id,role){this.roles[id]=role;}
  counterPatienceMultiplier(){
    let m=1;if(this.roles.younger==='counter')m*=.72;if(this.roles.older==='counter')m*=.82;if(this.cleanliness<55)m*=1.16;return m;
  }
  qualityConditionBonus(){return this.condition==='rested'?4:this.condition==='tired'?-5:0;}
  toJSON(){return {cleanliness:this.cleanliness,dirtSpots:this.dirtSpots.map(x=>({...x})),dirtClock:this.dirtClock,forgeBoost:this.forgeBoost,grindBoost:this.grindBoost,roles:{...this.roles},condition:this.condition};}
}
