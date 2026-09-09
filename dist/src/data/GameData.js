export const QUALITY = {
  crude: { id:'crude', name:'조악', multiplier:0.70, rep:0 },
  normal: { id:'normal', name:'평범', multiplier:1.00, rep:1 },
  excellent: { id:'excellent', name:'우수', multiplier:1.25, rep:2 },
  master: { id:'master', name:'명품', multiplier:1.60, rep:3 },
};

const bladeStages = (size='normal') => {
  const long=size==='long', short=size==='short';
  return [
    { id:'forge', station:'forge', kind:'heat', label:'가열', hits:short?2:long?4:3, difficulty:long?1.15:1 },
    { id:'shape', station:'anvil', kind:'hammer', label:'성형', hits:short?3:long?5:4, difficulty:long?1.12:1 },
    { id:'quench', station:'water', kind:'quench', label:'담금질', hits:2, difficulty:1 },
    { id:'grind', station:'grind', kind:'grind', label:'연마', hits:short?2:long?4:3, difficulty:long?1.08:1 },
    { id:'handle', station:'bench', kind:'assemble', label:'손잡이 조립', hits:2, difficulty:1 },
  ];
};

export const ITEMS = {
  dagger: {
    id:'dagger', name:'단검', family:'blade', specialty:'blade', bundle:1,
    iron:1, wood:1, leather:0, price:60, craftScale:.82,
    stages:bladeStages('short'), tags:['light','cheap','adventure'],
  },
  sword: {
    id:'sword', name:'철검', family:'blade', specialty:'blade', bundle:1,
    iron:2, wood:1, leather:0, price:120, craftScale:1,
    stages:bladeStages('normal'), tags:['blade','guard','adventure'],
  },
  longsword: {
    id:'longsword', name:'장검', family:'blade', specialty:'blade', bundle:1,
    iron:3, wood:1, leather:1, price:210, craftScale:1.18,
    stages:bladeStages('long'), tags:['blade','knight','premium'],
  },
  shield: {
    id:'shield', name:'방패', family:'shield', specialty:'heavy', bundle:1,
    iron:2, wood:1, leather:1, price:165, craftScale:1.08,
    stages:[
      {id:'frame',station:'bench',kind:'wood',label:'목재 프레임',hits:3,difficulty:1},
      {id:'forge',station:'forge',kind:'heat',label:'철판 가열',hits:3,difficulty:1},
      {id:'shape',station:'anvil',kind:'hammer',label:'철판 성형',hits:5,difficulty:1.08},
      {id:'assembly',station:'bench',kind:'assemble',label:'프레임 조립',hits:3,difficulty:1},
      {id:'rivet',station:'anvil',kind:'rivet',label:'리벳 고정',hits:4,difficulty:1.05},
      {id:'strap',station:'bench',kind:'leather',label:'가죽 손잡이',hits:2,difficulty:1},
    ], tags:['heavy','guard','adventure'],
  },
  bow: {
    id:'bow', name:'활', family:'bow', specialty:'precision', bundle:1,
    iron:0, wood:3, leather:1, price:150, craftScale:1.02,
    stages:[
      {id:'wood',station:'bench',kind:'wood',label:'목재 가공',hits:3,difficulty:1},
      {id:'bend',station:'bench',kind:'bend',label:'휘어잡기',hits:4,difficulty:1.06},
      {id:'string',station:'bench',kind:'string',label:'시위 연결',hits:3,difficulty:1.04},
      {id:'test',station:'bench',kind:'test',label:'시험 당기기',hits:2,difficulty:1.08},
    ], tags:['ranged','adventure','hunter'],
  },
  arrows: {
    id:'arrows', name:'화살 10개', family:'arrow', specialty:'precision', bundle:10,
    iron:1, wood:3, leather:0, price:92, craftScale:.78,
    stages:[
      {id:'shaft',station:'bench',kind:'wood',label:'화살 축 묶음',hits:2,difficulty:.95},
      {id:'head',station:'anvil',kind:'rivet',label:'화살촉 준비',hits:3,difficulty:1},
      {id:'join',station:'bench',kind:'assemble',label:'화살촉 연결',hits:2,difficulty:1},
      {id:'finish',station:'bench',kind:'leather',label:'가죽깃 마감',hits:2,difficulty:1},
    ], tags:['ranged','cheap','hunter'],
  },
};

export const ITEM_ORDER = ['dagger','sword','longsword','shield','bow','arrows'];

export const BROTHERS = {
  older: {
    id:'older', name:'형', specialty:'heavy',
    description:'힘·제련·중량 작업 특화',
    heavySpeed:.82, hammerScore:7, rudeBonus:1,
  },
  younger: {
    id:'younger', name:'동생', specialty:'precision',
    description:'정밀·연마·응대 특화',
    bladeScore:7, bowScore:6, customerPatience:.82,
  },
};

export const MATERIAL_PRICES = { iron:18, wood:12, leather:10 };
export const MATERIAL_NAMES = { iron:'철', wood:'목재', leather:'가죽' };

export const STATIONS = {
  forge:   { x:66,  y:82,  w:96, h:62, label:'화로' },
  display: { x:500, y:80,  w:82, h:62, label:'판매 진열대' },
  anvil:   { x:178, y:184, w:58, h:38, label:'모루' },
  bench:   { x:302, y:118, w:98, h:46, label:'작업대' },
  grind:   { x:434, y:184, w:62, h:48, label:'숫돌' },
  water:   { x:258, y:196, w:48, h:34, label:'담금질 통' },
  storage: { x:74,  y:244, w:86, h:54, label:'창고' },
  counter: { x:432, y:263, w:122,h:38, label:'카운터' },
  stairs:  { x:238, y:282, w:86, h:46, label:'2층 계단' },
  broom:   { x:369, y:286, w:34, h:42, label:'빗자루' },
  sign:    { x:565, y:286, w:38, h:38, label:'영업 표지판' },
  door:    { x:558, y:326, w:58, h:28, label:'출입구' },
};

export const LOFT_STATIONS = {
  olderBed:   { x:82,  y:176, w:112, h:52, label:'형의 침대' },
  youngerBed: { x:224, y:176, w:112, h:52, label:'동생의 침대' },
  table:      { x:366, y:170, w:74, h:50, label:'작은 테이블' },
  wardrobe:   { x:66,  y:76,  w:66, h:72, label:'수납장' },
  window:     { x:266, y:58,  w:90, h:56, label:'창문' },
  lamp:       { x:438, y:82,  w:34, h:54, label:'등불' },
  stairsDown: { x:520, y:258, w:84, h:64, label:'1층 계단' },
};

export const RANDOM_EVENTS = [
  { id:'mine', title:'광산 사고', text:'광산 갱도가 일부 무너졌다. 철 매입가가 30% 오른다.', material:{iron:1.30}, demand:{} },
  { id:'expedition', title:'기사단 원정 준비', text:'기사단이 원정을 준비한다. 장검과 방패 수요가 크게 오른다.', demand:{longsword:1.32,shield:1.25,sword:1.15}, visitorType:'knight' },
  { id:'goblins', title:'고블린 증가', text:'북쪽 숲에 고블린이 늘었다. 모험가가 많아지고 검·방패 수요가 오른다.', demand:{dagger:1.12,sword:1.25,shield:1.22}, visitMultiplier:1.16, visitorType:'adventurer' },
  { id:'festival', title:'시장 축제', text:'작은 시장 축제가 열린다. 주민 손님이 늘고 저가 상품이 잘 팔린다.', demand:{dagger:1.14,arrows:1.10}, visitMultiplier:1.20, visitorType:'villager' },
  { id:'rain', title:'폭우', text:'하루 종일 비가 온다. 전체 방문객이 줄어든다.', demand:{}, visitMultiplier:.72 },
];

export const CUSTOMER_ARCHETYPES = {
  villager: { name:'마을 주민', preferences:['dagger','arrows','shield'], budget:1.0, patience:88, line:'집에서 쓸 만한 물건이 있나 좀 보러 왔네.' },
  adventurer: { name:'모험가', preferences:['dagger','sword','shield','bow','arrows'], budget:1.25, patience:105, line:'곧 길을 떠나야 해서 장비를 좀 보려고요.' },
  mercenary: { name:'용병', preferences:['sword','shield','longsword'], budget:1.35, patience:100, line:'튼튼하고 바로 쓸 수 있는 걸 찾는다.' },
  hunter: { name:'사냥꾼', preferences:['bow','arrows','dagger'], budget:1.15, patience:112, line:'숲에 들어갈 준비를 하고 있소.' },
  guard: { name:'마을 경비', preferences:['sword','shield'], budget:1.28, patience:115, line:'순찰에 쓸 장비가 필요하오.' },
  knight: { name:'기사', preferences:['longsword','shield','sword'], budget:1.55, patience:130, line:'기사단에서 쓸 장비를 살펴보러 왔소.' },
};

export const CHILD_LINES = [
  '오늘은 뭐 만들어?',
  '불 엄청 뜨겁다!',
  '나도 망치 한번 들면 안 돼?',
  '형 아저씨 배에도 갑옷 만들 수 있어?',
  '나도 대장장이 하면 돈 많이 벌어?',
];

export function demandMultiplier(itemId, activeEvent){
  return activeEvent?.demand?.[itemId] || 1;
}

export function stationName(id){ return STATIONS[id]?.label || LOFT_STATIONS[id]?.label || id; }
