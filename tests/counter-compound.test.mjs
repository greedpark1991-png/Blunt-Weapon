import assert from 'node:assert/strict';
import { COUNTER_GROUP, SHOP_COLLIDERS, INTERACTION_POINTS } from '../src/data/GameData.js';
import { GameScene } from '../src/scenes/GameScene.js';

assert.equal(COUNTER_GROUP.id,'counter_main');assert.deepEqual(COUNTER_GROUP.parts,['counterTop','counterLeg']);
for(const id of COUNTER_GROUP.parts){const c=SHOP_COLLIDERS.find(x=>x.id===id);assert.ok(c);assert.equal(c.counterId,'counter_main');assert.equal(c.interactionGroup,COUNTER_GROUP.interactionGroup);}
const input={click:null,wheel:0,hit(){return false;},down(){return false;}};const sound={coin(){},door(){},fire(){},hammer(){},complete(){},perfect(){},tone(){},ensure(){},setDucked(){},startBGM(){},setBGMVolume(){},setSFXVolume(){},muteBGM(){},muteSFX(){},bgmVolume:.65,sfxVolume:.8,bgmMuted:false,sfxMuted:false};const game={input,sound,scenes:{set(){}}};
const s=new GameScene(game,{newGame:true});s.ui.modal=null;s.floor='shop';s.controlled='younger';s.playerFloors.younger='shop';s.playerFloors.older='loft';s.players.younger.x=INTERACTION_POINTS.counter.x;s.players.younger.y=INTERACTION_POINTS.counter.y;s.customer.visitors=[];s.shopOpen=true;s.currentObjective=()=>({title:'카운터',current:'',next:'',target:'counter'});
let strokes=0,fills=0;const ctx={save(){},restore(){},strokeRect(){strokes++;},fillRect(){fills++;},set strokeStyle(v){},set fillStyle(v){},set lineWidth(v){}};
s.renderObjectiveGlow(ctx);assert.ok(strokes>=2&&fills>=2,'compound counter glow must cover horizontal and vertical parts');
const r=s.interactionResolution();assert.equal(r.selected.targetId,'counter');assert.equal(r.selected.group,'counter_main');
console.log('✓ V0.2.5f compound counter group/highlight tests passed');
