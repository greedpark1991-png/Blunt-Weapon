import assert from 'node:assert/strict';
import { GameScene } from '../src/scenes/GameScene.js';

const hits=new Set();const input={click:null,wheel:0,hit(...codes){return codes.some(c=>hits.has(c));},down(){return false;}};
const sound={coin(){},door(){},fire(){},hammer(){},complete(){},perfect(){},tone(){},ensure(){},setDucked(){},startBGM(){},setBGMVolume(){},setSFXVolume(){},muteBGM(){},muteSFX(){},bgmVolume:.65,sfxVolume:.8,bgmMuted:false,sfxMuted:false};
const game={input,sound,scenes:{set(){}}};
const s=new GameScene(game,{newGame:true});s.ui.modal=null;
for(let i=1;i<=30;i++)s.inventory.addItem({uid:`item-${i}`,itemId:'sword',itemName:'철검',basePrice:120,quality:i%3===0?'excellent':'normal',maker:'younger',makerName:'동생',score:60+i,trait:i%5===0?{name:'날카로운',multiplier:1.15}:null});
const pulse=code=>{hits.clear();hits.add(code);s.ui.handleInput(input,sound,s);hits.clear();};

s.openInventory();assert.ok(s.ui.storage);assert.equal(s.ui.storage.getItems().length,30);
pulse('PageDown');pulse('PageDown');pulse('PageDown');for(let i=0;i<5;i++)pulse('ArrowDown');assert.equal(s.ui.storage.focus,29);
const selectedUid=s.ui.storage.getItems()[29].uid;pulse('Enter');assert.equal(s.display.count(),1);assert.ok(!s.inventory.items.some(x=>x.uid===selectedUid));

// Fill the remaining five display slots from arbitrary deep inventory items.
for(let i=0;i<5;i++){const uid=s.ui.storage.getItems()[Math.min(10,s.ui.storage.getItems().length-1)].uid;assert.equal(s.ui.storage.onDisplay(uid),true);}
assert.equal(s.display.count(),6);const before=s.inventory.items.length,uid=s.ui.storage.getItems()[0].uid;assert.equal(s.ui.storage.onDisplay(uid),false);assert.equal(s.inventory.items.length,before);assert.ok(s.inventory.items.some(x=>x.uid===uid));
// Returning one displayed item restores it to storage.
const returned=s.display.take(2);s.inventory.addItem(returned);assert.equal(s.display.count(),5);assert.ok(s.inventory.items.some(x=>x.uid===returned.uid));

console.log('✓ V0.2.5f storage list/scroll/display separation tests passed');
