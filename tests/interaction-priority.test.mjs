import assert from 'node:assert/strict';
import { GameScene } from '../src/scenes/GameScene.js';
import { INTERACTION_POINTS, ASSIST_POINTS } from '../src/data/GameData.js';

const input={click:null,wheel:0,hit(){return false;},down(){return false;}};
const sound={coin(){},door(){},fire(){},hammer(){},complete(){},perfect(){},tone(){},ensure(){},setDucked(){},startBGM(){},setBGMVolume(){},setSFXVolume(){},muteBGM(){},muteSFX(){},bgmVolume:.65,sfxVolume:.8,bgmMuted:false,sfxMuted:false};
const game={input,sound,scenes:{set(){}}};
const s=new GameScene(game,{newGame:true});
s.floor='shop';s.controlled='younger';s.playerFloors.older='shop';s.playerFloors.younger='shop';s.ui.modal=null;s.customer.visitors=[];

// Current crafting station must beat a nearby brother.
assert.equal(s.crafting.begin('sword','younger',s.inventory).ok,true);
s.crafting.active.stageIndex=3; // grind
s.players.younger.x=INTERACTION_POINTS.grind.x;s.players.younger.y=INTERACTION_POINTS.grind.y;
s.players.older.x=ASSIST_POINTS.grind.x;s.players.older.y=ASSIST_POINTS.grind.y;
let r=s.interactionResolution();
assert.equal(r.selected.targetId,'grind');
assert.equal(r.selected.context,'currentCraft');

// Without the broom, dirt is disabled as an E candidate and broom pickup wins.
s.crafting.active=null;s.broomEquipped=false;s.players.younger.x=INTERACTION_POINTS.broom.x;s.players.younger.y=INTERACTION_POINTS.broom.y;
s.maintenance.dirtSpots=[{x:INTERACTION_POINTS.broom.x+2,y:INTERACTION_POINTS.broom.y,type:'먼지',zone:'GENERAL_FLOOR_ZONE'}];
r=s.interactionResolution();assert.equal(r.selected.targetId,'broom');assert.ok(!r.candidates.some(x=>x.targetId==='dirt'));

// With the broom equipped, nearby dirt becomes the intended tool target.
s.broomEquipped=true;s.players.younger.x+=2;
r=s.interactionResolution();assert.equal(r.selected.targetId,'dirt');

// Storage must beat a brother occupying the same visual area.
s.broomEquipped=false;s.maintenance.dirtSpots=[];s.players.younger.x=160;s.players.younger.y=308;s.players.older.x=160;s.players.older.y=308;
r=s.interactionResolution();assert.equal(r.selected.targetId,'storage');assert.ok(r.candidates.some(x=>x.id==='brother:older'));

console.log('✓ V0.2.5f interaction priority tests passed');
