export class SceneManager {
  constructor(game){this.game=game;this.scene=null;}
  set(SceneClass,payload){ if(this.scene?.destroy)this.scene.destroy(); this.scene=new SceneClass(this.game,payload); if(this.scene.init)this.scene.init(); }
  update(dt){this.scene?.update?.(dt);}
  render(ctx){this.scene?.render?.(ctx);}
}
