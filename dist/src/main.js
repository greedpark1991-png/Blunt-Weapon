import { Game } from './core/Game.js';
import { TitleScene } from './scenes/TitleScene.js';
const canvas=document.getElementById('game');
const game=new Game(canvas);
game.scenes.set(TitleScene);
window.__BLACKSMITH_GAME__=game;
