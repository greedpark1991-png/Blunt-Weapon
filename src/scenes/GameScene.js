import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { Inventory } from '../systems/Inventory.js';
import { Economy } from '../systems/Economy.js';
import { EventSystem } from '../systems/EventSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { CraftingSystem } from '../systems/CraftingSystem.js';
import { CustomerSystem } from '../systems/CustomerSystem.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { DisplaySystem } from '../systems/DisplaySystem.js';
import { OrderSystem } from '../systems/OrderSystem.js';
import { MaintenanceSystem } from '../systems/MaintenanceSystem.js';
import { BrotherWorkSystem } from '../systems/BrotherWorkSystem.js';
import { UIManager } from '../ui/UIManager.js';
import { ITEMS, ITEM_ORDER, QUALITY, BROTHERS, CHILD_LINES, STATIONS, LOFT_STATIONS, MATERIAL_NAMES, demandMultiplier, stationName } from '../data/GameData.js';
import { renderShop, renderLoft, renderLighting, drawDirt, drawCharacter } from '../utils/render.js';
import { TitleScene } from './TitleScene.js';

export class GameScene {
  constructor(game,payload={}){
    this.game=game;this.t=0;const s=payload.save||{};
    this.day=s.day??1;this.time=new TimeSystem(s.time);this.shopOpen=s.shopOpen??false;
    this.inventory=new Inventory(s.inventory);this.display=new DisplaySystem(s.display);this.orders=new OrderSystem(s.orders);this.maintenance=new MaintenanceSystem(s.maintenance);
    this.economy=new Economy({gold:s.gold,reputation:s.reputation,dayStats:s.dayStats});this.events=new EventSystem({activeEvent:s.activeEvent,nextEvent:s.nextEvent});this.crafting=new CraftingSystem({active:s.crafting?.active});this.brotherWork=new BrotherWorkSystem(s.brotherWork);
    this.weaponHistory=s.weaponHistory?[...s.weaponHistory]:[];this.knightPurchase=s.knightPurchase||null;this.flags={knightSeen:false,rudeSeen:false,...(s.flags||{})};this.controlled=s.controlled||'younger';
    const newGame=!!payload.newGame,defaultFloor=newGame?'loft':'shop';this.floor=s.floor||defaultFloor;this.playerFloors={older:s.playerFloors?.older||defaultFloor,younger:s.playerFloors?.younger||defaultFloor};
    const olderDefault=this.playerFloors.older==='loft'?{x:144,y:250}:{x:248,y:258},youngerDefault=this.playerFloors.younger==='loft'?{x:286,y:250}:{x:330,y:258};
    this.players={older:new Player('older',s.players?.older?.x??olderDefault.x,s.players?.older?.y??olderDefault.y),younger:new Player('younger',s.players?.younger?.x??youngerDefault.x,s.players?.younger?.y??youngerDefault.y)};
    this.customer=new CustomerSystem(this.day,this.stateForData(),s.customer);this.merchant=new NPC('merchant','재료 상인',152,310);this.merchantVisible=false;this.merchantActiveVisit=null;this.merchantSeenVisits=new Set(s.merchantSeenVisits||[]);
    this.child=new NPC('child','후드 꼬마',602,318);this.child.visible=s.child?.visible??false;this.child.x=s.child?.x??602;this.child.y=s.child?.y??318;this.childSpawned=s.child?.spawned??false;this.childLeaveAt=s.child?.leaveAt??0;
    this.broomEquipped=s.broomEquipped??false;this.ui=new UIManager();this.cutscene=null;this.closingNotified=s.closingNotified??false;this.morningShown=s.morningShown??false;this.autoSaveT=0;this.pendingForcedSleep=false;this.showTutorial=newGame||!s.tutorialSeen;
  }
  init(){
    if(this.showTutorial){
      this.ui.openModal('V0.2.1 · 플레이감 핫픽스','06:00에는 2층 생활공간에서 하루가 시작된다. 계단으로 1층에 내려가 재고를 만들고 직접 OPEN한다. 이동이 빨라졌고 다른 형제에게 제작을 맡기면 알아서 끝까지 작업한다. 빗자루는 청소와 진상 퇴치에만 사용된다.',[{label:'아침 시작'}],()=>{this.showTutorial=false;this.save(true);this.showMorningNews();});
    }else if(!this.morningShown)this.showMorningNews();
  }
  stateForData(){return{knightPurchase:this.knightPurchase,activeEvent:this.events.activeEvent};}
  showMorningNews(){
    this.morningShown=true;const cond=this.maintenance.condition==='rested'?'일찍 자서 몸이 가볍다. 제작 품질에 작은 보너스가 있다.':this.maintenance.condition==='tired'?'늦게까지 버텨서 피곤하다. 오늘 제작 정밀도가 조금 떨어진다.':'컨디션은 평범하다.';
    this.ui.openModal(`DAY ${this.day} · 오늘의 소식`,`${this.events.newsText()} ${cond} 지금은 ${this.time.format()}. 아침 06:00~08:00 사이에는 재료 상인이 반드시 한 번 찾아온다. 2층에서 내려가 오늘 운영을 시작하자.`,[{label:'확인'}],()=>this.save());
  }
  update(dt){
    this.t+=dt;this.ui.update(dt);const input=this.game.input;
    const clockPaused=!!this.ui.modal;
    if(!clockPaused){
      const before=this.time.minute;this.time.update(dt);this.maintenance.update(this.time.minute-before);this.updateShopTime();this.updateMerchant();this.updateChild(dt);this.updateCustomers(dt);this.updateCutscene(dt);
      const workEvents=this.brotherWork.update(dt,this.players);this.handleBrotherWorkEvents(workEvents);
      for(const v of this.customer.visitors){if(v.bubbleT>0){v.bubbleT-=dt;if(v.bubbleT<=0)v.bubble='';}if(v.hitStarT>0)v.hitStarT-=dt;}
      this.autoSaveT+=dt;if(this.autoSaveT>=10){this.autoSaveT=0;this.save();}
    }
    if(this.time.isForceSleep())this.pendingForcedSleep=true;
    if(input.hit('Escape')&&!this.ui.modal&&!this.ui.craft){this.ui.openModal('메뉴','현재 진행은 자동 저장된다. 타이틀로 돌아갈 수 있다.',[{label:'계속하기'},{label:'저장 후 타이틀'}],i=>{if(i===1){this.save();this.game.scenes.set(TitleScene);}});}
    if(this.ui.handleInput(input,this.game.sound))return;
    if(this.pendingForcedSleep&&!this.ui.modal&&!this.ui.craft){this.pendingForcedSleep=false;this.forceSleep();return;}
    if(this.cutscene)return;
    if(input.hit('KeyI')){this.openInventory();return;}
    if(input.hit('KeyQ')){this.switchBrother();return;}
    this.players.older.update(dt,input,this.controlled==='older'&&this.playerFloors.older===this.floor);this.players.younger.update(dt,input,this.controlled==='younger'&&this.playerFloors.younger===this.floor);
    if(input.hit('KeyE','Enter'))this.interact();
  }
  handleBrotherWorkEvents(events){
    for(const e of events){
      if(e.type==='craftDelivered'&&e.item){this.inventory.addItem(e.item);this.economy.markCraft();this.game.sound.complete();this.ui.showToast(`${BROTHERS[e.workerId].name}이(가) ${e.item.itemName} 제작을 끝내 창고에 넣었다. 품질 ${QUALITY[e.item.quality].name}`);this.maintenance.assign(e.workerId,'idle');this.save();}
      else if(e.type==='roleStarted')this.ui.showToast(`${BROTHERS[e.workerId].name}이(가) ${this.roleName(e.role)} 업무를 시작했다.`);
    }
  }
  switchBrother(){
    const next=this.controlled==='older'?'younger':'older',task=this.brotherWork.task(next);
    if(task?.kind==='craft'){this.ui.showToast(`${BROTHERS[next].name}이(가) 지금 제작 중이다. 끝나면 직접 조작할 수 있다.`);return;}
    this.controlled=next;if(task?.kind==='role'){this.brotherWork.cancel(next);this.maintenance.assign(next,'idle');this.players[next].target=null;}
    this.floor=this.playerFloors[next];this.broomEquipped=false;this.ui.showToast(`${next==='older'?'형':'동생'}을 직접 조작한다.`);this.save();
  }
  updateShopTime(){
    if(this.time.isAfterClose()&&!this.closingNotified){this.closingNotified=true;if(this.shopOpen){this.shopOpen=false;this.ui.showToast('22:00 · 영업 종료. 신규 손님은 더 들어오지 않는다.');}else this.ui.showToast('22:00 · 마감 시간이다. 밤 작업 후 침대에서 잘 수 있다.');this.save();}
  }
  merchantSale(period){
    if(this.day===1&&period==='morning')return{type:'iron',discount:.80,label:'철 -20%'};
    const seed=(this.day*73+(period==='morning'?17:41))%100;if(seed>=62)return null;
    const pick=(this.day*29+(period==='morning'?1:2))%3;
    if(pick===0)return{type:'iron',discount:.80,label:'철 -20%'};
    if(pick===1)return{type:'wood',discount:.82,label:'목재 묶음 할인'};
    return{type:'leather',discount:.85,label:'가죽 -15%'};
  }
  merchantSchedule(){
    // V0.2.1 hotfix: one guaranteed morning visit between 06:00~08:00,
    // plus an optional afternoon visit. Each visit stays long enough to be usable.
    const morningStart=360+((this.day*37+11)%116);
    const morning={id:`${this.day}-morning`,period:'morning',start:morningStart,end:morningStart+150,sale:this.merchantSale('morning')};
    const afternoonEnabled=((this.day*53+7)%100)<58;
    const afternoonStart=720+((this.day*61+23)%211);
    const afternoon=afternoonEnabled?{id:`${this.day}-afternoon`,period:'afternoon',start:afternoonStart,end:Math.min(1080,afternoonStart+135),sale:this.merchantSale('afternoon')}:null;
    return afternoon?[morning,afternoon]:[morning];
  }
  updateMerchant(){
    const visit=this.merchantSchedule().find(v=>this.time.minute>=v.start&&this.time.minute<=v.end)||null;
    this.merchantActiveVisit=visit;this.merchantVisible=!!visit;
    if(visit&&!this.merchantSeenVisits.has(visit.id)){
      this.merchantSeenVisits.add(visit.id);this.game.sound.door();const sale=visit.sale?` · SALE ${visit.sale.label}`:'';
      this.ui.showToast(`재료 상인이 왔다. ${this.time.format(visit.end)}쯤까지 머문다${sale}`);this.save();
    }
  }
  childWindow(){const start=620+(this.day*31)%115;return{start,end:start+165};}
  updateChild(dt){
    const w=this.childWindow();if(!this.childSpawned&&this.time.minute>=w.start){this.childSpawned=true;this.child.visible=true;this.child.x=602;this.child.y=318;this.childLeaveAt=w.end;this.game.sound.door();this.ui.showToast('후드 꼬마가 대장간 안을 기웃거리며 들어왔다.');}
    if(this.child.visible){if(this.time.minute>=this.childLeaveAt){this.child.visible=false;return;}if(this.child.x>386){this.child.x-=30*dt;this.child.y-=10*dt;}}
  }
  updateCustomers(dt){
    const events=this.customer.update(dt,{minute:this.time.minute,open:this.shopOpen,event:this.events.activeEvent,patienceMultiplier:this.maintenance.counterPatienceMultiplier()});
    for(const e of events){
      const v=e.visitor;if(e.type==='spawn'){this.economy.markVisitor();this.game.sound.door();this.ui.showToast(v.mode==='general'?`${v.name}이(가) 진열대를 보러 들어왔다.`:`${v.name}이(가) 카운터로 온다.`);}
      else if(e.type==='waiting'){this.ui.showToast(v.knight?'기사 로데릭이 주문을 기다린다.':v.rude?'왠지 까다로워 보이는 손님이 기다린다.':`${v.name}이(가) 주문 상담을 기다린다.`);}
      else if(e.type==='browseComplete')this.resolveGeneralBuyer(v);
      else if(e.type==='impatient'){if(v.status!=='leaving')this.customer.leave(v);this.economy.adjustRep(-1);this.ui.showToast(`${v.name}이(가) 오래 기다리다 나갔다. 평판 -1`);}
    }
  }
  resolveGeneralBuyer(v){
    if(v.status!=='browsing')return;const matches=this.display.matching(v.preferences);
    if(!matches.length){v.bubble='찾는 게 없네...';v.bubbleT=2.5;this.customer.leave(v,'찾는 물건 없음');return;}
    matches.sort((a,b)=>v.preferences.indexOf(a.item.itemId)-v.preferences.indexOf(b.item.itemId)||b.item.score-a.item.score);const pick=matches[0],estimate=this.economy.priceFor(pick.item,this.events.activeEvent);const comfort=ITEMS[pick.item.itemId].price*(v.budget||1.1)*1.28;
    if(estimate>comfort&&Math.random()>.28){v.bubble='조금 비싼데...';v.bubbleT=2.5;this.customer.leave(v,'가격 고민');return;}
    const item=this.display.take(pick.slot),cleanRep=this.maintenance.cleanliness>=82&&Math.random()<.22?1:0,result=this.economy.sell(item,this.events.activeEvent,{extraRep:cleanRep,channel:'display'});this.recordWeaponSale(item,v.name);this.game.sound.coin();v.bubble=`${result.price}G 구매`;v.bubbleT=2.8;this.customer.complete(v);this.ui.showToast(`${v.name}이(가) 진열된 ${item.itemName}을 ${result.price}G에 샀다. 진열 슬롯이 비었다.`);this.save();
  }
  updateCutscene(dt){
    if(!this.cutscene)return;const c=this.cutscene;c.timer-=dt;
    if(c.kind==='rudeOlder'){
      const older=this.players.older;older.update(dt,this.game.input,false);if(c.timer<=0){older.target=null;this.cutscene=null;const v=this.customer.byId(c.visitorId);if(v)this.ui.openModal('형의 해결법','형이 아무 말 없이 카운터 옆에 섰다. 손님은 형의 체격과 방패를 번갈아 보더니 가격표를 다시 읽고 조용히 고개를 끄덕였다.',[{label:'정가로 산다'}],()=>this.finishDirectSale(v,1,1));}return;
    }
    if(c.kind==='broomRude'){
      const v=this.customer.byId(c.visitorId);if(!v){this.cutscene=null;this.broomEquipped=false;return;}
      if(!c.hit&&c.timer<=.62){c.hit=true;const strong=c.actor==='older';v.x+=strong?26:16;v.y-=strong?5:2;v.hitStarT=.8;v.bubble=strong?'으아악!':'으악!';v.bubbleT=1.35;v.fleeSpeed=strong?150:128;this.customer.leave(v,v.bubble);v.bubble=strong?'으아악!':'으악!';v.bubbleT=1.35;this.game.sound.hammer();this.ui.showToast(strong?'퍽! 진상이 펄쩍 뛰더니 전력으로 도망간다.':'퍽! 진상이 놀라 문 쪽으로 달아난다.');}
      if(c.timer<=0){this.cutscene=null;this.broomEquipped=false;this.save();}return;
    }
  }
  controlledPlayer(){return this.players[this.controlled];}
  dist(x,y){const p=this.controlledPlayer();return Math.hypot(p.x-x,p.y-y);}
  nearestOtherBrother(){const id=this.controlled==='older'?'younger':'older',p=this.players[id];if(this.playerFloors[id]!==this.floor)return{id,p,d:999};return{ id,p,d:this.dist(p.x,p.y) };}
  nearestDirt(){if(this.floor!=='shop')return null;return this.maintenance.dirtSpots.map((p,i)=>({p,i,d:this.dist(p.x,p.y)})).sort((a,b)=>a.d-b.d)[0]||null;}
  nearestRude(){if(this.floor!=='shop')return null;const p=this.controlledPlayer();return this.customer.visitors.filter(v=>v.rude&&v.status!=='gone'&&v.status!=='leaving').map(v=>({v,d:Math.hypot(p.x-v.x,p.y-v.y)})).sort((a,b)=>a.d-b.d)[0]||null;}
  nearestProtectedNPC(){
    if(this.floor!=='shop')return null;const p=this.controlledPlayer(),all=[];
    if(this.child.visible)all.push({name:'꼬마',d:Math.hypot(p.x-this.child.x,p.y-this.child.y)});
    if(this.merchantVisible)all.push({name:'재료 상인',d:Math.hypot(p.x-this.merchant.x,p.y-this.merchant.y)});
    for(const v of this.customer.visitors)if(!v.rude&&v.status!=='gone')all.push({name:v.name,d:Math.hypot(p.x-v.x,p.y-v.y)});
    const other=this.nearestOtherBrother();if(other.d<999)all.push({name:BROTHERS[other.id].name,d:other.d});
    return all.sort((a,b)=>a.d-b.d)[0]||null;
  }
  interact(){
    if(this.floor==='loft'){this.interactLoft();return;}
    const p=this.controlledPlayer();
    if(this.broomEquipped){
      const rude=this.nearestRude();if(rude&&rude.d<68){this.startBroomAttack(rude.v);return;}
      const dirt=this.nearestDirt();if(dirt&&dirt.d<34){this.cleanShop();this.broomEquipped=false;return;}
      const protectedNpc=this.nearestProtectedNPC();if(protectedNpc&&protectedNpc.d<50){this.ui.showToast(`${protectedNpc.name}에게 휘두를 필요는 없잖아. 빗자루는 진상 퇴치나 청소에만 쓴다.`);return;}
    }
    const waiting=this.customer.nearestWaiting(p.x,p.y);if(waiting&&Math.hypot(p.x-waiting.x,p.y-waiting.y)<58){this.interactCustomer(waiting);return;}
    if(this.child.visible&&this.dist(this.child.x,this.child.y)<46){this.ui.openModal('후드 꼬마',CHILD_LINES[Math.floor(Math.random()*CHILD_LINES.length)],[{label:'구경만 해'}]);return;}
    if(this.merchantVisible&&this.dist(this.merchant.x,this.merchant.y)<50){this.openMerchant();return;}
    const other=this.nearestOtherBrother();if(other.d<38){this.openBrotherRole(other.id);return;}
    const dirt=this.nearestDirt();if(dirt&&dirt.d<30){this.ui.showToast('바닥이 지저분하다. 빗자루를 집어 들고 이곳에서 E를 누르면 청소한다.');return;}
    const near=Object.entries(STATIONS).map(([id,s])=>({id,s,d:this.dist(s.x+s.w/2,s.y+s.h/2)})).sort((a,b)=>a.d-b.d)[0];if(!near||near.d>60){this.ui.showToast(this.broomEquipped?'빗자루를 들고 있다. 진상이나 먼지 가까이에서 E를 누르자.':'상호작용할 대상이 가까이 없다.');return;}this.useStation(near.id);
  }
  interactLoft(){
    const near=Object.entries(LOFT_STATIONS).map(([id,s])=>({id,s,d:this.dist(s.x+s.w/2,s.y+s.h/2)})).sort((a,b)=>a.d-b.d)[0];if(!near||near.d>62){this.ui.showToast('2층 생활공간이다. 침대나 계단 가까이에서 E를 누르자.');return;}this.useLoftStation(near.id);
  }
  startBroomAttack(v){
    if(!v?.rude){this.ui.showToast('진상 상태의 손님에게만 빗자루 퇴치가 가능하다.');return;}
    this.cutscene={kind:'broomRude',visitorId:v.id,actor:this.controlled,timer:1.12,hit:false};v.patience=Math.max(v.patience,999);v.bubble='뭐, 뭐요?';v.bubbleT=.55;this.ui.showToast(`${BROTHERS[this.controlled].name}이(가) 빗자루를 고쳐 잡는다...`);
  }
  interactCustomer(v){
    if(v.status==='ordered'){this.tryDirectSale(v);return;}
    if(v.mode==='commission'){this.openCommission(v);return;}
    if(v.mode==='direct')this.openDirectOrder(v);
  }
  openDirectOrder(v){
    let line=v.line;if(v.knight&&this.knightPurchase)line+=` 전에 사 간 ${this.knightPurchase.itemName}도 아직 잘 쓰고 있소.`;
    if(v.purpose){this.ui.openModal(v.name,`${line} 가볍게 쓸 무기를 추천해 달라고 한다.`,[{label:'단검 추천'},{label:'철검 추천'}],i=>{const id=i===0?'dagger':'sword';this.customer.acceptDirect(v,id);this.ui.showToast(`${ITEMS[id].name} 즉석 주문을 받았다. 작업대에서 제작할 수 있다.`);this.save();});return;}
    this.ui.openModal(v.name,`${line} · 원하는 물건: ${ITEMS[v.itemId].name}`,[{label:'주문 받기'},{label:'지금은 어렵다'}],i=>{if(i===0){this.customer.acceptDirect(v,v.itemId);if(v.knight)this.flags.knightSeen=true;if(v.rude)this.flags.rudeSeen=true;this.ui.showToast(`${ITEMS[v.itemId].name} 즉석 주문 접수. 손님은 기다려 준다.`);}else{this.customer.leave(v,'주문 거절');}this.save();});
  }
  openCommission(v){
    const item=ITEMS[v.itemId];this.ui.openModal(v.name,`${item.name}을(를) 내일 18:00까지 만들어 달라고 한다. 완성 후 카운터의 주문장에서 납품하면 된다. 주문 보너스가 붙는다.`,[{label:'주문 수락'},{label:'거절'}],i=>{if(i===0){const o=this.orders.accept({customerName:v.name,itemId:v.itemId,day:this.day,minute:this.time.minute});this.ui.showToast(`${o.id} 수락 · ${item.name} · Day ${o.dueDay} 18:00까지`);}this.customer.leave(v,i===0?'주문 접수':'주문 거절');this.save();});
  }
  tryDirectSale(v){const item=this.inventory.bestItem(v.acceptedItem);if(!item){this.ui.showToast(`${ITEMS[v.acceptedItem].name} 완성품이 창고에 없다.`);return;}if(v.rude&&!v.rudeResolved){this.openRude(v,item);return;}this.finishDirectSale(v,1,0,item);}
  openRude(v,item){
    const estimated=this.economy.priceFor(item,this.events.activeEvent);this.ui.openModal('진상 손님',`완성된 ${item.itemName}의 가격 ${estimated}G를 보고 손님이 비싸다며 깎아 달라고 한다.`,[{label:'15% 할인'},{label:'거절'},{label:'동생이 설득'},{label:'형을 부른다'},{label:'직접 내보낸다'}],i=>{
      if(i===0){v.rudeResolved=true;this.finishDirectSale(v,.85,1,item);}
      else if(i===1){v.rudeResolved=true;this.economy.adjustRep(-1);this.customer.leave(v,'투덜거리며 퇴장');this.ui.showToast('손님은 떠났고 완성품은 창고에 남았다. 평판 -1');this.save();}
      else if(i===2){v.rudeResolved=true;this.ui.openModal('동생의 설득','동생이 재료값과 마감 상태를 차분하게 설명한다. 손님은 괜히 아는 척하다가 정가를 내기로 했다.',[{label:'정가 판매'}],()=>this.finishDirectSale(v,1,1,item));}
      else if(i===3){v.rudeResolved=true;this.playerFloors.older='shop';this.players.older.target={x:446,y:244};this.cutscene={kind:'rudeOlder',timer:1.35,visitorId:v.id};this.ui.showToast('형이 말없이 카운터 앞으로 걸어간다...');}
      else{v.rudeResolved=false;v.bubble='안 나갈 건데?';v.bubbleT=3;this.ui.showToast('진상이 버틴다. 빗자루를 집어 들고 가까이 가서 E를 누르면 직접 쫓아낼 수 있다.');this.save();}
    });
  }
  finishDirectSale(v,discount=1,extraRep=0,itemOverride=null){
    const item=itemOverride||this.inventory.bestItem(v.acceptedItem);if(!item)return;this.inventory.removeItem(item.uid);const result=this.economy.sell(item,this.events.activeEvent,{discount,extraRep,channel:'order'});this.recordWeaponSale(item,v.name);if(v.knight)this.knightPurchase={buyer:v.name,itemName:item.itemName,itemId:item.itemId,quality:item.quality,qualityName:QUALITY[item.quality].name,maker:item.maker,makerName:item.makerName,day:this.day};this.customer.complete(v);this.game.sound.coin();this.ui.openModal('판매 완료',`${v.name}에게 ${item.itemName}을(를) ${result.price}G에 판매했다. 품질 ${QUALITY[item.quality].name} · 평판 +${result.rep}`, [{label:'좋아'}]);this.save();
  }
  recordWeaponSale(item,buyer){if(item.quality==='excellent'||item.quality==='master'){this.weaponHistory.unshift({itemName:item.itemName,itemId:item.itemId,makerName:item.makerName,qualityName:QUALITY[item.quality].name,buyer,day:this.day});this.weaponHistory=this.weaponHistory.slice(0,16);}}
  useStation(id){
    if(id==='sign'){this.toggleShop();return;}if(id==='stairs'){this.goUpstairs();return;}if(id==='broom'){this.toggleBroom();return;}if(id==='storage'){this.openInventory();return;}if(id==='display'){this.openDisplay();return;}if(id==='counter'){this.openCounter();return;}
    if(['bench','forge','anvil','grind','water'].includes(id)){this.useCraftStation(id);return;}
  }
  useLoftStation(id){
    if(id==='stairsDown'){this.goDownstairs();return;}if(id==='olderBed'||id==='youngerBed'){this.useBed();return;}
    if(id==='wardrobe'){this.ui.showToast('형제의 작업복과 낡은 외투가 걸려 있다.');return;}
    if(id==='table'){this.ui.showToast('작은 식탁 위에 빵 부스러기와 작업 메모가 남아 있다.');return;}
    if(id==='window'){this.ui.showToast('창 아래로 대장간 입구와 지나가는 사람들이 보인다.');return;}
    if(id==='lamp'){this.ui.showToast('조용한 등불이 2층 생활공간을 따뜻하게 밝힌다.');return;}
  }
  goUpstairs(){
    this.playerFloors[this.controlled]='loft';this.floor='loft';const p=this.controlledPlayer();p.x=532;p.y=276;p.target=null;this.broomEquipped=false;this.ui.showToast('계단을 올라 2층 생활공간으로 왔다. 1층 영업과 시간은 계속 흐른다.');this.save();
  }
  goDownstairs(){
    this.playerFloors[this.controlled]='shop';this.floor='shop';const p=this.controlledPlayer();p.x=286;p.y=302;p.target=null;this.ui.showToast('1층 대장간으로 내려왔다.');this.save();
  }
  toggleBroom(){
    this.broomEquipped=!this.broomEquipped;this.ui.showToast(this.broomEquipped?'빗자루를 들었다. 먼지나 진상 가까이에서 E를 누르자.':'빗자루를 제자리에 세워뒀다.');this.save();
  }
  toggleShop(){if(this.time.minute>=1320){this.ui.showToast('22:00 이후에는 다시 문을 열 수 없다.');return;}this.shopOpen=!this.shopOpen;this.game.sound.door();this.ui.showToast(this.shopOpen?`${this.time.format()} · OPEN. 이제 손님이 랜덤하게 찾아온다.`:`${this.time.format()} · CLOSED. 안에 있는 손님은 마지막 거래를 할 수 있다.`);this.save();}
  useBed(){if(this.time.minute<1320){this.ui.openModal('2층 침대',`현재 ${this.time.format()}. 아직 영업 마감 전이다. 22:00 이후부터 잠들 수 있다.`,[{label:'조금 더 일한다'}]);return;}if(this.customer.activeCount()>0){this.ui.showToast('아직 1층 대장간 안에 손님이 남아 있다. 마지막 거래를 마치거나 기다리자.');return;}const working=['older','younger'].find(id=>this.brotherWork.task(id)?.kind==='craft');if(working){this.ui.showToast(`${BROTHERS[working].name}이(가) 아직 1층에서 제작 중이다. 작업이 끝나면 자자.`);return;}const m=this.time.minute%1440,condition=(this.time.minute<1440||m===0)?'rested':'normal';this.beginSleep(condition,false);}
  forceSleep(){
    if(this.customer.activeCount()){for(const v of [...this.customer.visitors])this.customer.leave(v,'주인이 쓰러졌다');this.economy.adjustRep(-1);}this.shopOpen=false;this.beginSleep('tired',true);
  }
  beginSleep(condition,forced){
    this.shopOpen=false;const st=this.economy.dayStats,net=st.revenue-st.materialCost,next=this.events.roll(this.day);const failed=this.orders.failOverdue(this.day,this.time.minute);if(failed.length)this.economy.adjustRep(-failed.length);
    this.ui.openModal(forced?`DAY ${this.day} · 강제 기절`:`DAY ${this.day} · 취침`,`${forced?'02:00를 넘겨 작업하다 결국 쓰러졌다. ':''}매출 ${st.revenue}G · 재료비 ${st.materialCost}G · 순이익 ${net}G · 제작 ${st.crafted}개 · 방문 ${st.visitors}명 · 판매 ${st.sales}건. ${failed.length?`미납 주문 ${failed.length}건 실패. `:''}내일 소식: ${next.title} — ${next.text}`,[{label:'다음 날 06:00'}],()=>this.nextDay(condition));this.save();
  }
  nextDay(condition){
    this.day++;this.events.advance();this.time=new TimeSystem({minute:360,speed:1});this.shopOpen=false;this.closingNotified=false;this.economy.resetDay();this.customer=new CustomerSystem(this.day,this.stateForData(),null);this.maintenance.condition=condition;
    for(const id of ['older','younger']){
      const task=this.brotherWork.task(id);if(task?.kind==='role')this.brotherWork.cancel(id);this.maintenance.assign(id,'idle');this.players[id].target=null;
      if(task?.kind==='craft'){this.playerFloors[id]='shop';}
      else{this.playerFloors[id]='loft';if(id==='older'){this.players[id].x=144;this.players[id].y=250;}else{this.players[id].x=286;this.players[id].y=250;}}
    }
    this.floor=this.playerFloors[this.controlled];this.merchantSeenVisits=new Set();this.merchantActiveVisit=null;this.merchantVisible=false;this.child.visible=false;this.childSpawned=false;this.childLeaveAt=0;this.morningShown=false;this.broomEquipped=false;this.orders.failOverdue(this.day,this.time.minute);this.save();this.showMorningNews();
  }
  cleanShop(){if(!this.maintenance.dirtSpots.length&&this.maintenance.cleanliness>94){this.ui.showToast('바닥은 이미 꽤 깨끗하다.');return;}const n=this.maintenance.clean();this.time.minute+=8;this.ui.showToast(`대장간을 한 번에 쓸어냈다. 먼지 ${n}곳 정리 · 게임 시간 8분 사용`);this.save();}
  useCraftStation(id){
    if(!this.crafting.active){if(id==='bench'){this.openCraftMenu();return;}if(id==='forge'){this.openForgeActions();return;}if(id==='grind'){this.openGrindActions();return;}this.ui.showToast('작업대에서 먼저 무엇을 만들지 정하자.');return;}
    const stage=this.crafting.currentStage();if(!stage){return;}if(stage.station!==id){this.ui.showToast(`다음 공정은 ${stationName(stage.station)} · ${stage.label}`);return;}const a=this.crafting.active,worker=BROTHERS[a.workerId];this.ui.beginCraft(stage,this.crafting.speedMultiplier(),score=>this.finishCraftStage(score),{itemName:ITEMS[a.itemId].name,workerName:worker.name});
  }
  openForgeActions(){this.ui.openModal('화로','제작 중인 물건이 없다. 영업 전에 화로를 정비하면 다음 3번의 가열 공정 품질이 조금 좋아진다.',[{label:'화로 준비 · 6분'},{label:'닫기'}],i=>{if(i===0){this.maintenance.prepForge();this.time.minute+=6;this.ui.showToast('화로 준비 완료 · 다음 가열 3회 품질 보너스');this.save();}});}
  openGrindActions(){this.ui.openModal('숫돌','숫돌을 손보면 다음 3번의 연마 공정 품질이 조금 좋아진다.',[{label:'숫돌 관리 · 5분'},{label:'닫기'}],i=>{if(i===0){this.maintenance.tuneGrind();this.time.minute+=5;this.ui.showToast('숫돌 관리 완료 · 다음 연마 3회 품질 보너스');this.save();}});}
  openCraftMenu(){
    const opts=ITEM_ORDER.map(id=>{const r=ITEMS[id],ok=this.inventory.canAfford(r);return{label:`${r.name}${ok?'':' · 재료부족'}`,id};});this.ui.openModal('오늘 무엇을 만들까','손님 주문이 없어도 자유롭게 재고를 만들 수 있다. 단검·검은 금속 공정, 방패는 프레임/리벳, 활·화살은 목재 중심으로 공정이 달라진다.',opts,(i,opt)=>this.chooseCraftWorker(opt.id));
  }
  chooseCraftWorker(itemId){
    const recipe=ITEMS[itemId];if(!this.inventory.canAfford(recipe)){const m=this.inventory.materials;this.ui.openModal('재료 부족',`${recipe.name} 필요: 철 ${recipe.iron} · 목재 ${recipe.wood} · 가죽 ${recipe.leather}. 현재 철 ${m.iron} · 목재 ${m.wood} · 가죽 ${m.leather}.`,[{label:'확인'}]);return;}
    this.ui.openModal('누가 작업할까',`${recipe.name} 제작. 직접 조작 중인 형제에게 맡기면 기존 미니게임으로 직접 만들고, 다른 형제에게 맡기면 실제 작업대로 이동해 자동으로 끝까지 제작한다.`,[{label:'형'},{label:'동생'}],i=>{
      const worker=i===0?'older':'younger';this.maintenance.assign(worker,'idle');this.players[worker].target=null;
      if(worker===this.controlled){
        if(this.brotherWork.busy(worker)){this.ui.showToast(`${BROTHERS[worker].name}은(는) 자동 업무 중이다. 먼저 업무를 끝내거나 해제하자.`);return;}
        const r=this.crafting.begin(itemId,worker,this.inventory);if(!r.ok){this.ui.showToast(r.reason);return;}this.ui.showToast(`${BROTHERS[worker].name} 직접 제작 시작 · 첫 공정 ${stationName(r.stage.station)} / ${r.stage.label}`);this.save();return;
      }
      const currentTask=this.brotherWork.task(worker);if(currentTask?.kind==='craft'){this.ui.showToast(`${BROTHERS[worker].name}은(는) 이미 다른 제작을 하는 중이다.`);return;}if(currentTask?.kind==='role')this.brotherWork.cancel(worker);
      const wasFloor=this.playerFloors[worker];this.playerFloors[worker]='shop';if(wasFloor!=='shop'){this.players[worker].x=292;this.players[worker].y=304;}
      const r=this.brotherWork.assignCraft(worker,itemId,this.inventory);if(!r.ok){this.ui.showToast(r.reason);return;}
      this.ui.showToast(`${BROTHERS[worker].name}에게 ${recipe.name} 제작을 맡겼다. 알아서 작업대를 돌며 완성한다.`);this.save();
    });
  }
  finishCraftStage(score){
    const stage=this.crafting.currentStage(),workerId=this.crafting.active?.workerId;let bonus=this.maintenance.qualityConditionBonus();if(stage?.station==='forge')bonus+=this.maintenance.useForgeBoost();if(stage?.station==='grind')bonus+=this.maintenance.useGrindBoost();if(workerId==='older'&&['hammer','rivet'].includes(stage?.kind))bonus+=4;if(workerId==='younger'&&['grind','assemble','string','test'].includes(stage?.kind))bonus+=3;if(this.maintenance.roles.older==='forge'&&workerId!=='older'&&['forge','anvil'].includes(stage?.station))bonus+=3;if(this.maintenance.roles.younger==='grind'&&workerId!=='younger'&&['grind','bench'].includes(stage?.station))bonus+=2;
    const r=this.crafting.stageDone(score,bonus);if(!r)return;if(!r.done){this.ui.showToast(`공정 점수 ${r.score} · 다음 ${stationName(r.stage.station)} / ${r.stage.label}`);this.save();return;}this.inventory.addItem(r.item);this.economy.markCraft();this.game.sound.complete();this.ui.openModal('완성!',`${r.item.itemName} 완성 · 품질 ${QUALITY[r.item.quality].name} · 제작자 ${r.item.makerName} · 점수 ${r.item.score}. 바로 주문에 쓰거나 진열대에 올려 판매할 수 있다.`,[{label:'좋아'}]);this.save();
  }
  openDisplay(){
    const slots=this.display.slots.map((x,i)=>`${i+1}:${x?`${x.itemName}/${QUALITY[x.quality].name}`:'빈칸'}`).join(' · ');this.ui.openModal('판매 진열대',`진열 ${this.display.count()}/5 · ${slots}. 일반 손님은 이곳의 상품을 직접 보고 구매한다.`,[{label:'완성품 진열'},{label:'진열품 회수'},{label:'무기의 역사'},{label:'닫기'}],i=>{if(i===0)this.chooseInventoryForDisplay();else if(i===1)this.chooseDisplayToTake();else if(i===2)this.openHistory();});
  }
  chooseInventoryForDisplay(){
    if(!this.inventory.items.length){this.ui.showToast('창고에 진열할 완성품이 없다.');return;}if(this.display.firstEmpty()<0){this.ui.showToast('진열대 5칸이 모두 찼다.');return;}const list=this.inventory.items.slice(0,6);this.ui.openModal('어떤 물건을 진열할까','완성품을 진열대로 옮긴다. 일반 손님이 취향과 가격을 보고 구매할 수 있다.',list.map(x=>({label:`${x.itemName}/${QUALITY[x.quality].name}`,uid:x.uid})),(i,opt)=>{const item=this.inventory.removeItem(opt.uid);if(item&&this.display.place(item)){this.ui.showToast(`${item.itemName}을(를) 진열했다.`);this.save();}});
  }
  chooseDisplayToTake(){const list=this.display.slots.map((x,i)=>x?{item:x,slot:i}:null).filter(Boolean);if(!list.length){this.ui.showToast('회수할 진열품이 없다.');return;}this.ui.openModal('진열품 회수','선택한 물건을 다시 창고 완성품 재고로 옮긴다.',list.map(x=>({label:`${x.slot+1}번 ${x.item.itemName}`,slot:x.slot})),(i,opt)=>{const item=this.display.take(opt.slot);if(item){this.inventory.addItem(item);this.ui.showToast(`${item.itemName}을(를) 창고로 회수했다.`);this.save();}});}
  openCounter(){
    const open=this.orders.openOrders();const fulfillable=open.map(o=>({o,item:this.inventory.bestItem(o.itemId)})).filter(x=>x.item);if(fulfillable.length){const top=fulfillable.slice(0,6);this.ui.openModal('주문 납품',`완성된 주문품 ${top.length}건을 납품할 수 있다. 주문 납품은 일반 판매보다 보너스가 붙는다.`,top.map(x=>({label:`${x.o.id} ${ITEMS[x.o.itemId].name}`,id:x.o.id})),(i,opt)=>this.fulfillCommission(opt.id));return;}
    const text=open.length?open.slice(0,4).map(o=>`${o.id} ${ITEMS[o.itemId].name} · Day ${o.dueDay} 18:00`).join(' · '):'현재 미납 주문이 없다.';this.ui.openModal('카운터 주문장',text,[{label:'닫기'}]);
  }
  fulfillCommission(id){const o=this.orders.openOrders().find(x=>x.id===id);if(!o)return;const item=this.inventory.bestItem(o.itemId);if(!item){this.ui.showToast('맞는 완성품이 없다.');return;}this.inventory.removeItem(item.uid);this.orders.markDone(id,item);const result=this.economy.sell(item,this.events.activeEvent,{extraMultiplier:1+(o.rewardBonus||.15),extraRep:1,channel:'order'});this.recordWeaponSale(item,o.customerName);this.game.sound.coin();this.ui.openModal('주문 납품 완료',`${o.customerName}의 ${ITEMS[o.itemId].name} 주문을 납품했다. ${result.price}G · 평판 +${result.rep}`, [{label:'확인'}]);this.save();}
  openMerchant(){
    const visit=this.merchantActiveVisit||this.merchantSchedule().find(v=>this.time.minute>=v.start&&this.time.minute<=v.end);if(!visit){this.ui.showToast('상인은 지금 자리를 비웠다.');return;}
    const sale=visit.sale;const discount=t=>sale?.type===t?sale.discount:1;const p=t=>this.economy.materialPrice(t,this.events.activeEvent,discount(t));
    const tag=t=>sale?.type===t?' · SALE':'';const opts=[{label:`철 +1 · ${p('iron')}G${tag('iron')}`,type:'iron',amount:1},{label:`목재 +1 · ${p('wood')}G${tag('wood')}`,type:'wood',amount:1},{label:`가죽 +1 · ${p('leather')}G${tag('leather')}`,type:'leather',amount:1}];
    if(sale?.type==='wood')opts.push({label:`목재 +5 묶음 · ${p('wood')*5}G SALE`,type:'wood',amount:5});opts.push({label:'그만 산다',close:true});
    const saleText=sale?`오늘 세일: ${sale.label}. `:'오늘은 정가 판매 중. ';
    this.ui.openModal('재료 상인',`${saleText}철 ${p('iron')}G / 목재 ${p('wood')}G / 가죽 ${p('leather')}G · 보유 ${this.economy.gold}G. ${this.time.format(visit.end)} 전후까지 천천히 머문다.`,opts,(i,opt)=>{
      if(opt.close)return;const d=discount(opt.type),r=this.economy.buyMaterial(opt.type,this.events.activeEvent,{discount:d,amount:opt.amount});if(!r.ok){this.ui.showToast('돈이 부족하다.');return;}this.inventory.addMaterial(opt.type,opt.amount);this.game.sound.coin();this.ui.showToast(`${MATERIAL_NAMES[opt.type]} +${opt.amount} · ${r.price}G 지불${d<1?' · SALE 적용':''}`);this.save();
    });
  }
  openInventory(){const m=this.inventory.materials,items=this.inventory.items.length?this.inventory.items.slice(0,7).map(x=>`${x.itemName}(${QUALITY[x.quality].name})`).join(' · '):'완성품 없음';this.ui.openModal('창고 / 인벤토리',`철 ${m.iron} · 목재 ${m.wood} · 가죽 ${m.leather} · 완성품: ${items} · 진열대 ${this.display.count()}/5`,[{label:'닫기'}]);}
  openHistory(){const text=this.weaponHistory.length?this.weaponHistory.slice(0,5).map(h=>`Day ${h.day} ${h.itemName}/${h.qualityName}/${h.makerName} → ${h.buyer}`).join(' · '):'아직 우수 이상 품질로 판매된 무기의 기록이 없다.';this.ui.openModal('무기의 역사',text,[{label:'닫기'}]);}
  openBrotherRole(id){
    const name=BROTHERS[id].name,role=this.maintenance.roles[id];const specific=id==='older'?{label:'화로·중량 보조',role:'forge'}:{label:'연마·정밀 보조',role:'grind'};this.ui.openModal(`${name}에게 일 맡기기`,`현재 역할: ${this.roleName(role)}. 카운터를 맡기면 손님 인내심이 더 천천히 줄고, 전문 보조를 맡기면 관련 제작 공정에 작은 보너스가 생긴다.`,[{label:'카운터 맡기기',role:'counter'},specific,{label:'대기',role:'idle'}],(i,opt)=>{this.assignRole(id,opt.role);});
  }
  roleName(role){return role==='counter'?'카운터':role==='forge'?'화로·중량 보조':role==='grind'?'연마·정밀 보조':'대기';}
  assignRole(id,role){
    const current=this.brotherWork.task(id);if(current?.kind==='craft'){this.ui.showToast(`${BROTHERS[id].name}은(는) 지금 제작 중이다. 끝난 뒤 다른 업무를 맡길 수 있다.`);return;}
    this.maintenance.assign(id,role);const wasFloor=this.playerFloors[id];this.playerFloors[id]='shop';if(wasFloor!=='shop'){this.players[id].x=292;this.players[id].y=304;}
    this.brotherWork.assignRole(id,role);if(role==='idle'){this.players[id].target={x:id==='older'?250:330,y:260};}
    this.ui.showToast(`${BROTHERS[id].name}에게 ${this.roleName(role)} 업무를 맡겼다. 목적지까지 이동해 계속 수행한다.`);this.save();
  }
  timeLabel(){return `${this.time.format()} · ${this.time.dayPart()}`;}
  save(tutorialSeen=true){SaveSystem.save({version:2.1,day:this.day,gold:this.economy.gold,reputation:this.economy.reputation,dayStats:this.economy.dayStats,time:this.time.toJSON(),shopOpen:this.shopOpen,inventory:this.inventory.toJSON(),display:this.display.toJSON(),orders:this.orders.toJSON(),maintenance:this.maintenance.toJSON(),brotherWork:this.brotherWork.toJSON(),activeEvent:this.events.activeEvent,nextEvent:this.events.nextEvent,crafting:this.crafting.toJSON(),customer:this.customer.toJSON(),weaponHistory:this.weaponHistory,knightPurchase:this.knightPurchase,flags:this.flags,controlled:this.controlled,floor:this.floor,playerFloors:{...this.playerFloors},players:{older:{x:this.players.older.x,y:this.players.older.y},younger:{x:this.players.younger.x,y:this.players.younger.y}},child:{visible:this.child.visible,x:this.child.x,y:this.child.y,spawned:this.childSpawned,leaveAt:this.childLeaveAt},merchantSeenVisits:[...this.merchantSeenVisits],broomEquipped:this.broomEquipped,closingNotified:this.closingNotified,morningShown:this.morningShown,tutorialSeen});}
  render(ctx){
    if(this.floor==='shop'){
      renderShop(ctx,this.t,{display:this.display,shopOpen:this.shopOpen,cleanliness:this.maintenance.cleanliness});drawDirt(ctx,this.maintenance.dirtSpots);
      for(const id of ['older','younger'])if(this.playerFloors[id]==='shop'){drawCharacter(ctx,id,this.players[id].x,this.players[id].y,this.players[id].walkT,this.controlled===id);this.renderWorkerStatus(ctx,id);}
      if(this.merchantVisible){drawCharacter(ctx,'merchant',this.merchant.x,this.merchant.y,0,false);ctx.fillStyle='#edd7ad';ctx.font='8px monospace';ctx.fillText('재료 상인',126,336);if(this.merchantActiveVisit?.sale){ctx.fillStyle='#f2c66f';ctx.font='bold 8px monospace';ctx.fillText(`SALE ${this.merchantActiveVisit.sale.label}`,112,346);}}
      if(this.child.visible)drawCharacter(ctx,'child',this.child.x,this.child.y,this.t*3,false);
      for(const v of this.customer.visitors){drawCharacter(ctx,v.knight?'knight':v.type,v.x,v.y,this.t*4,false);this.renderVisitorStatus(ctx,v);if(v.hitStarT>0)this.renderHitStars(ctx,v);}
      if(this.broomEquipped&&this.playerFloors[this.controlled]==='shop')this.renderHeldBroom(ctx);
    }else{
      renderLoft(ctx,this.t);for(const id of ['older','younger'])if(this.playerFloors[id]==='loft')drawCharacter(ctx,id,this.players[id].x,this.players[id].y,this.players[id].walkT,this.controlled===id);
    }
    renderLighting(ctx,this.time.minute);this.renderPrompts(ctx);this.ui.render(ctx,this);
  }
  renderWorkerStatus(ctx,id){
    if(this.controlled===id)return;const st=this.brotherWork.status(id);if(st.state==='IDLE')return;const p=this.players[id];ctx.fillStyle='#1b120de5';ctx.fillRect(p.x-30,p.y-52,60,12);ctx.fillStyle='#f1d28b';ctx.font='7px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`${st.icon} ${st.label}`,p.x,p.y-46);ctx.textAlign='left';
  }
  renderHeldBroom(ctx){
    const p=this.controlledPlayer(),swing=this.cutscene?.kind==='broomRude'?Math.max(0,1-this.cutscene.timer/1.12):0;ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));ctx.rotate(-.55+swing*1.25);ctx.fillStyle='#9c7448';ctx.fillRect(12,-27,3,37);ctx.fillStyle='#b49154';for(let i=0;i<4;i++)ctx.fillRect(7+i*5,7,4,12);ctx.restore();
  }
  renderHitStars(ctx,v){ctx.fillStyle='#f6d257';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('✦  ✦',v.x,v.y-54);ctx.textAlign='left';}
  renderVisitorStatus(ctx,v){if(v.status==='leaving'&&!v.bubble)return;let text=v.bubble;if(!text){if(v.status==='waiting')text=v.mode==='commission'?'주문 상담':'!';else if(v.status==='ordered')text=`${ITEMS[v.acceptedItem]?.name||'주문'} 기다림`;else if(v.status==='browsing')text='구경 중';}if(!text)return;ctx.font='7px monospace';const w=Math.min(90,ctx.measureText(text).width+10);ctx.fillStyle='#f4e3c9';ctx.fillRect(v.x-w/2,v.y-48,w,14);ctx.fillStyle='#3a291e';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,v.x,v.y-41);ctx.textAlign='left';}
  renderPrompts(ctx){
    if(this.ui.modal||this.ui.craft)return;const p=this.controlledPlayer();let prompt='';
    if(this.floor==='loft'){
      const near=Object.entries(LOFT_STATIONS).map(([id,s])=>({id,s,d:this.dist(s.x+s.w/2,s.y+s.h/2)})).sort((a,b)=>a.d-b.d)[0];if(near?.d<62)prompt=`E ${near.s.label}`;
    }else{
      if(this.broomEquipped){const rude=this.nearestRude(),dirt=this.nearestDirt();if(rude&&rude.d<68)prompt='E 빗자루로 진상 쫓아내기';else if(dirt&&dirt.d<34)prompt='E 빗자루 청소';}
      if(!prompt){const waiting=this.customer.nearestWaiting(p.x,p.y);if(waiting&&Math.hypot(p.x-waiting.x,p.y-waiting.y)<58)prompt=waiting.status==='ordered'?'E 주문품 판매':'E 손님 응대';else if(this.child.visible&&this.dist(this.child.x,this.child.y)<46)prompt='E 꼬마와 대화';else if(this.merchantVisible&&this.dist(this.merchant.x,this.merchant.y)<50)prompt='E 재료 구매';else{const other=this.nearestOtherBrother();if(other.d<38)prompt=`E ${BROTHERS[other.id].name}에게 업무 맡기기`;else{const near=Object.entries(STATIONS).map(([id,s])=>({id,s,d:this.dist(s.x+s.w/2,s.y+s.h/2)})).sort((a,b)=>a.d-b.d)[0];if(near?.d<60)prompt=`E ${near.s.label}`;}}}
    }
    if(prompt){ctx.fillStyle='#17100de0';ctx.fillRect(197,327,246,21);ctx.fillStyle='#f3d9a5';ctx.font='9px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(prompt,320,338);ctx.textAlign='left';}
  }

}