const ZONES={
  FORGE_DIRT_ZONE:{x:126,y:190,w:92,h:30,types:['재','검댕','석탄 부스러기']},
  ANVIL_DIRT_ZONE:{x:220,y:188,w:72,h:32,types:['철가루','금속 조각']},
  WATER_DIRT_ZONE:{x:290,y:190,w:64,h:28,types:['물자국','철 부스러기']},
  GRIND_DIRT_ZONE:{x:326,y:272,w:76,h:36,types:['숫돌 가루','금속 가루']},
  ENTRANCE_DIRT_ZONE:{x:538,y:294,w:58,h:24,types:['흙','진흙','발자국']},
  WORKBENCH_DIRT_ZONE:{x:176,y:268,w:138,h:38,types:['나무 부스러기','가죽 조각']},
  COUNTER_DIRT_ZONE:{x:414,y:292,w:92,h:26,types:['종이 조각','먼지']},
  STAIR_DIRT_ZONE:{x:80,y:254,w:48,h:42,types:['먼지']},
  GENERAL_FLOOR_ZONE:{x:286,y:286,w:112,h:34,types:['먼지']},
};
const ACTIVITY_ZONE={forge:'FORGE_DIRT_ZONE',anvil:'ANVIL_DIRT_ZONE',water:'WATER_DIRT_ZONE',grind:'GRIND_DIRT_ZONE',bench:'WORKBENCH_DIRT_ZONE',customers:'ENTRANCE_DIRT_ZONE',counter:'COUNTER_DIRT_ZONE',stairs:'STAIR_DIRT_ZONE'};
export class MaintenanceSystem{
  constructor(data){this.cleanliness=data?.cleanliness??88;this.dirtSpots=(data?.dirtSpots||[]).map(x=>({...x,type:x.type||'먼지',zone:x.zone||'GENERAL_FLOOR_ZONE'}));this.dirtClock=data?.dirtClock??0;this.forgeBoost=data?.forgeBoost??0;this.grindBoost=data?.grindBoost??0;this.roles={older:'idle',younger:'idle',...(data?.roles||{})};this.condition=data?.condition||'normal';this.activity={forge:0,anvil:0,water:0,grind:0,bench:0,customers:0,counter:0,stairs:0,...(data?.activity||{})};this.recentZones=[...(data?.recentZones||[])];}
  noteActivity(kind,amount=1){if(kind in this.activity)this.activity[kind]+=amount;}
  weightedZone(){const weighted=[];for(const [kind,count] of Object.entries(this.activity)){const z=ACTIVITY_ZONE[kind];for(let i=0;i<Math.min(5,Math.floor(count));i++)weighted.push(z);}for(const z of Object.keys(ZONES))weighted.push(z);const filtered=weighted.filter(z=>!this.recentZones.slice(0,2).includes(z));return (filtered.length?filtered:weighted)[Math.floor(Math.random()*(filtered.length?filtered.length:weighted.length))]||'GENERAL_FLOOR_ZONE';}
  spawnDirt(validator=()=>true){if(this.dirtSpots.length>=7)return false;for(let tries=0;tries<24;tries++){const zone=this.weightedZone(),r=ZONES[zone],x=Math.round(r.x+Math.random()*r.w),y=Math.round(r.y+Math.random()*r.h);if(!validator(x,y))continue;if(this.dirtSpots.some(p=>Math.hypot(p.x-x,p.y-y)<18))continue;const type=r.types[Math.floor(Math.random()*r.types.length)];this.dirtSpots.push({x,y,type,zone});this.recentZones.unshift(zone);this.recentZones=this.recentZones.slice(0,4);this.cleanliness=Math.max(30,this.cleanliness-8);for(const k of Object.keys(this.activity))this.activity[k]*=.55;return true;}return false;}
  update(gameMinutes,validator){this.dirtClock+=Math.max(0,gameMinutes||0);while(this.dirtClock>=150){this.dirtClock-=150;this.spawnDirt(validator);}}
  clean(index=null){if(index==null){const n=this.dirtSpots.length;this.dirtSpots=[];this.cleanliness=Math.min(100,this.cleanliness+12+n*6);return n;}if(index<0||index>=this.dirtSpots.length)return 0;this.dirtSpots.splice(index,1);this.cleanliness=Math.min(100,this.cleanliness+10);return 1;}
  prepForge(){this.forgeBoost=3;} tuneGrind(){this.grindBoost=3;} useForgeBoost(){if(this.forgeBoost>0){this.forgeBoost--;return 5;}return 0;} useGrindBoost(){if(this.grindBoost>0){this.grindBoost--;return 5;}return 0;} assign(id,role){this.roles[id]=role;}
  counterPatienceMultiplier(){let m=1;if(this.roles.younger==='counter')m*=.72;if(this.roles.older==='counter')m*=.82;if(this.cleanliness<55)m*=1.16;return m;}
  qualityConditionBonus(){return this.condition==='rested'?4:this.condition==='tired'?-5:0;}
  toJSON(){return{cleanliness:this.cleanliness,dirtSpots:this.dirtSpots.map(x=>({...x})),dirtClock:this.dirtClock,forgeBoost:this.forgeBoost,grindBoost:this.grindBoost,roles:{...this.roles},condition:this.condition,activity:{...this.activity},recentZones:[...this.recentZones]};}
}
export { ZONES as DIRT_ZONES };
