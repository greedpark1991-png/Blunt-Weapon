export class Input {
  constructor(canvas){
    this.keys=new Set(); this.pressed=new Set(); this.click=null; this.canvas=canvas;
    addEventListener('keydown',e=>{ if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault(); if(!this.keys.has(e.code))this.pressed.add(e.code); this.keys.add(e.code); });
    addEventListener('keyup',e=>this.keys.delete(e.code));
    canvas.addEventListener('pointerdown',e=>{ const r=canvas.getBoundingClientRect(); this.click={x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}; });
  }
  down(...codes){return codes.some(c=>this.keys.has(c));}
  hit(...codes){return codes.some(c=>this.pressed.has(c));}
  endFrame(){this.pressed.clear();this.click=null;}
}
