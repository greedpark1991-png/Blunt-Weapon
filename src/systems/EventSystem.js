import { RANDOM_EVENTS } from '../data/GameData.js';
export class EventSystem {
  constructor(data){const initial=data?.activeEvent===undefined?RANDOM_EVENTS[2]:data.activeEvent;this.activeEvent=initial?{...initial,demand:{...(initial.demand||{})},material:{...(initial.material||{})}}:null;this.nextEvent=data?.nextEvent||null;}
  roll(day){const pick=RANDOM_EVENTS[(day*11+Math.floor(Math.random()*RANDOM_EVENTS.length))%RANDOM_EVENTS.length];this.nextEvent={...pick,demand:{...(pick.demand||{})},material:{...(pick.material||{})}};return this.nextEvent;}
  advance(){this.activeEvent=this.nextEvent;this.nextEvent=null;}
  newsText(){return this.activeEvent?`${this.activeEvent.title} · ${this.activeEvent.text}`:'별다른 소식 없음 · 평소 수요를 예상해보자.';}
  toJSON(){return{activeEvent:this.activeEvent,nextEvent:this.nextEvent};}
}
