/**
 * Event templates for random game events.
 */
export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  minMonth: number;
  weight: number;
  /** Cards to spawn on the board */
  spawnCards?: { defId: string; count: number }[];
  /** Card packs added to shop */
  shopPacks?: {
    name: string;
    cost: number;
    cards: { defId: string; count: number }[];
  }[];
  /** Special effect key for events that need custom logic */
  specialEffect?: string;
  /** Number of months this event's effects last (default 1) */
  effectDuration?: number;
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'goblin_raid',
    name: '哥布林袭击！',
    description: '一只哥布林出现了！',
    minMonth: 2,
    weight: 30,
    spawnCards: [{ defId: 'goblin', count: 1 }],
  },
  {
    id: 'wolf_attack',
    name: '野狼袭击！',
    description: '一只饥饿的野狼正在靠近！',
    minMonth: 5,
    weight: 20,
    spawnCards: [{ defId: 'wolf', count: 1 }],
  },
  {
    id: 'wandering_trader',
    name: '流浪商人',
    description: '一位商人路过，带来了特价商品。',
    minMonth: 1,
    weight: 25,
    shopPacks: [
      {
        name: '商人包裹',
        cost: 8,
        cards: [
          { defId: 'iron_ore', count: 2 },
          { defId: 'gold', count: 1 },
          { defId: 'apple', count: 3 },
        ],
      },
    ],
  },
  {
    id: 'bountiful_harvest',
    name: '丰收季节',
    description: '这个月浆果丛额外长出了一些浆果！',
    minMonth: 3,
    weight: 20,
    spawnCards: [
      { defId: 'berry', count: 3 },
      { defId: 'berry_bush', count: 1 },
    ],
  },
  {
    id: 'iron_discovery',
    name: '铁矿发现',
    description: '发现了一处铁矿脉！',
    minMonth: 4,
    weight: 15,
    spawnCards: [{ defId: 'iron_deposit', count: 1 }],
  },
  {
    id: 'storm',
    name: '暴风雨来袭！',
    description: '一场猛烈的暴风雨席卷了村庄！',
    minMonth: 3,
    weight: 20,
    spawnCards: [],
  },
  {
    id: 'wolf_pack',
    name: '狼群袭击！',
    description: '一群野狼包围了村庄！',
    minMonth: 6,
    weight: 15,
    spawnCards: [
      { defId: 'wolf', count: 3 },
    ],
  },
  {
    id: 'treasure_hunt',
    name: '藏宝图',
    description: '一张古老的藏宝图指引着宝藏的位置。',
    minMonth: 2,
    weight: 15,
    spawnCards: [
      { defId: 'treasure_map', count: 1 },
      { defId: 'gold', count: 2 },
    ],
  },
  {
    id: 'merchant_caravan',
    name: '商队抵达',
    description: '一支大型商队抵达，带来了丰富的商品。',
    minMonth: 4,
    weight: 20,
    shopPacks: [
      {
        name: '商队特供',
        cost: 15,
        cards: [
          { defId: 'iron_bar', count: 2 },
          { defId: 'gold', count: 3 },
          { defId: 'leather', count: 2 },
          { defId: 'herb', count: 3 },
        ],
      },
    ],
  },
  {
    id: 'herb_bloom',
    name: '草药盛开',
    description: '野外长满了草药，赶紧采摘！',
    minMonth: 2,
    weight: 20,
    spawnCards: [
      { defId: 'herb', count: 5 },
    ],
  },
  {
    id: 'lost_cow',
    name: '走失的奶牛',
    description: '一头走失的奶牛跑进了村庄！',
    minMonth: 4,
    weight: 15,
    spawnCards: [
      { defId: 'cow', count: 1 },
    ],
  },
  {
    id: 'spring_festival',
    name: '春节庆典',
    description: '村民们庆祝节日，获得了礼物。',
    minMonth: 1,
    weight: 25,
    spawnCards: [
      { defId: 'apple', count: 3 },
      { defId: 'gold', count: 3 },
    ],
  },
  {
    id: 'troll_attack',
    name: '巨魔来袭！',
    description: '一只巨大的巨魔正在靠近村庄！',
    minMonth: 8,
    weight: 10,
    spawnCards: [
      { defId: 'boss_troll', count: 1 },
    ],
  },
  {
    id: 'spring_bloom',
    name: '春暖花开',
    description: '春天来了！野外长出了额外的浆果丛和花朵。',
    minMonth: 1,
    weight: 25,
    spawnCards: [
      { defId: 'berry_bush', count: 2 },
      { defId: 'herb', count: 3 },
      { defId: 'berry', count: 2 },
    ],
  },
  {
    id: 'heatwave',
    name: '酷暑难耐',
    description: '热浪来袭！村民们更容易饥饿了。',
    minMonth: 4,
    weight: 25,
    spawnCards: [
      { defId: 'apple', count: 2 },
    ],
    specialEffect: 'heatwave',
    effectDuration: 0,
  },
  {
    id: 'autumn_harvest',
    name: '秋收大典',
    description: '丰收庆典！所有资源节点都恢复了生机。',
    minMonth: 7,
    weight: 30,
    spawnCards: [
      { defId: 'wheat', count: 3 },
      { defId: 'apple', count: 2 },
    ],
    specialEffect: 'autumn_harvest',
  },
  {
    id: 'blizzard',
    name: '暴风雪',
    description: '一场猛烈的暴风雪席卷了村庄！野狼出没，饥饿加剧。',
    minMonth: 10,
    weight: 30,
    spawnCards: [
      { defId: 'wolf', count: 2 },
    ],
    specialEffect: 'blizzard',
    effectDuration: 0,
  },
  {
    id: 'stray_cat',
    name: '流浪猫',
    description: '一只可爱的流浪猫跑进了村庄！',
    minMonth: 1,
    weight: 20,
    spawnCards: [
      { defId: 'cat', count: 1 },
    ],
  },
  {
    id: 'cave_in',
    name: '矿脉塌方',
    description: '一声巨响！一处矿脉塌方了。',
    minMonth: 5,
    weight: 15,
    specialEffect: 'cave_in',
  },
];

/** Pick a random event based on weights and current month */
export function pickRandomEvent(
  currentMonth: number,
  recentEventIds: string[]
): EventTemplate | null {
  const eligible = EVENT_TEMPLATES.filter(
    (e) =>
      e.minMonth <= currentMonth && !recentEventIds.includes(e.id)
  );

  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const event of eligible) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }

  return eligible[eligible.length - 1];
}
