import { Game } from './core/Game.js';
import { TitleScene } from './scenes/TitleScene.js';
const canvas=document.getElementById('game');
const game=new Game(canvas);
game.scenes.set(TitleScene);
window.__BLACKSMITH_GAME__=game;

const fitIntegerScale=()=>{
  const reserveH=window.innerWidth>=1920&&window.innerHeight>=1080?0:30;
  let scale=Math.floor(Math.min(window.innerWidth/640,(window.innerHeight-reserveH)/360));
  scale=Math.max(1,Math.min(3,scale));
  if(window.innerWidth>=1920&&window.innerHeight>=1080)scale=3;
  canvas.style.width=`${640*scale}px`;
  canvas.style.height=`${360*scale}px`;
  document.body.classList.toggle('scale-3',scale>=3);
  document.documentElement.dataset.pixelScale=String(scale);
};
fitIntegerScale();
addEventListener('resize',fitIntegerScale);
