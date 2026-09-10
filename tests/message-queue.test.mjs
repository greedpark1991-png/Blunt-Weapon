import assert from 'node:assert/strict';
import { MessageManager } from '../src/systems/MessageManager.js';

const m=new MessageManager();
m.system('계단 이동',4);m.important('재료 상인이 도착했습니다.',4);m.system('철검 완성',4);m.system('Gold +120',4);m.important('기사 손님이 찾아왔습니다.',4);
const visible=m.visible(3);assert.equal(visible.length,3);assert.ok(visible.some(x=>x.text.includes('재료 상인')));assert.ok(visible.some(x=>x.text.includes('기사 손님')),'important notification must survive minor spam');
m.locationText('2층 생활공간',1);assert.equal(m.location.text,'2층 생활공간');assert.equal(m.visible(3).length,3,'location label stays separate from system notification stack');
m.update(1.1);assert.equal(m.location,null);m.update(3);assert.equal(m.items.length,0);
console.log('✓ V0.2.5f message queue priority/stack tests passed');
