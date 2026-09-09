export class Inventory {
  constructor(data){ this.materials={...(data?.materials||{iron:8,wood:7,leather:3})}; this.items=data?.items?[...data.items]:[]; }
  canAfford(recipe){return this.materials.iron>=recipe.iron&&this.materials.wood>=recipe.wood&&this.materials.leather>=recipe.leather;}
  consume(recipe){if(!this.canAfford(recipe))return false;this.materials.iron-=recipe.iron;this.materials.wood-=recipe.wood;this.materials.leather-=recipe.leather;return true;}
  addMaterial(type,amount=1){this.materials[type]=(this.materials[type]||0)+amount;}
  addItem(item){this.items.push(item);}
  removeItem(uid){const i=this.items.findIndex(x=>x.uid===uid);if(i<0)return null;return this.items.splice(i,1)[0];}
  bestItem(itemId){return this.items.filter(x=>x.itemId===itemId).sort((a,b)=>b.score-a.score)[0]||null;}
  toJSON(){return {materials:{...this.materials},items:this.items.map(x=>({...x}))};}
}
