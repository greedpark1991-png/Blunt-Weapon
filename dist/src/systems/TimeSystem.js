export class TimeSystem {
  constructor(data){
    this.minute=data?.minute ?? 360;
    this.speed=data?.speed ?? 1; // 현실 1초 = 게임 1분
  }
  update(dt){ this.minute += dt*this.speed; }
  format(minute=this.minute){
    const m=((Math.floor(minute)%1440)+1440)%1440;
    return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  }
  dayPart(){ const m=this.minute%1440; if(m<540)return '아침'; if(m<1020)return '낮'; if(m<1260)return '저녁'; return '밤'; }
  isAfterClose(){ return this.minute>=1320; }
  isForceSleep(){ return this.minute>=1560; }
  toJSON(){ return {minute:this.minute,speed:this.speed}; }
}
