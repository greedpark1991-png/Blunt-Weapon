import { Game } from './core/Game.js';
import { TitleScene } from './scenes/TitleScene.js';
const canvas=document.getElementById('game');
const game=new Game(canvas);
game.scenes.set(TitleScene);
window.__BLACKSMITH_GAME__=game;

const fitIntegerScale=()=>{
  const tracker=document.getElementById('tracker');
  const trackerVisible=tracker&&!tracker.classList.contains('hidden')&&window.innerWidth>=1490;
  const trackerW=trackerVisible?220:0;
  const reserveH=30;
  // Reserve real CSS room for the task panel so the map itself never gets covered.
  let scale=Math.floor(Math.min((window.innerWidth-trackerW-18)/640,(window.innerHeight-reserveH)/360));
  scale=Math.max(1,Math.min(3,scale));
  canvas.style.width=`${640*scale}px`;canvas.style.height=`${360*scale}px`;
  if(tracker){tracker.style.height=`${360*scale}px`;tracker.style.minHeight=`${360*scale}px`;}
  document.body.classList.toggle('scale-3',scale>=3);document.documentElement.dataset.pixelScale=String(scale);
};
window.__fitGameScale=fitIntegerScale;
fitIntegerScale();
addEventListener('resize',fitIntegerScale);
