/**
 * Shop pack definitions — what's available to buy each month.
 */
export interface ShopPack {
  name: string;
  cost: number;
  cards: { defId: string; count: number }[];
}

export interface MonthlyShop {
  month: number;
  packs: ShopPack[];
}

export const MONTHLY_SHOP: MonthlyShop[] = [
  {
    month: 1,
    packs: [
      {
        name: '新手包',
        cost: 5,
        cards: [
          { defId: 'wood', count: 3 },
          { defId: 'stone', count: 2 },
          { defId: 'berry', count: 2 },
        ],
      },
      {
        name: '探索者包',
        cost: 8,
        cards: [
          { defId: 'flint', count: 2 },
          { defId: 'wood', count: 2 },
          { defId: 'apple', count: 1 },
        ],
      },
      {
        name: '招募村民',
        cost: 10,
        cards: [{ defId: 'villager', count: 1 }],
      },
    ],
  },
  {
    month: 2,
    packs: [
      {
        name: '建造者包',
        cost: 8,
        cards: [
          { defId: 'wood', count: 2 },
          { defId: 'stone', count: 2 },
          { defId: 'plank', count: 1 },
        ],
      },
      {
        name: '灵感卷轴',
        cost: 5,
        cards: [
          { defId: 'idea_plank', count: 1 },
          { defId: 'idea_campfire', count: 1 },
        ],
      },
      {
        name: '招募村民',
        cost: 10,
        cards: [{ defId: 'villager', count: 1 }],
      },
    ],
  },
  {
    month: 3,
    packs: [
      {
        name: '高级建造者包',
        cost: 12,
        cards: [
          { defId: 'plank', count: 2 },
          { defId: 'iron_ore', count: 1 },
          { defId: 'stone', count: 2 },
        ],
      },
      {
        name: '灵感卷轴 II',
        cost: 8,
        cards: [
          { defId: 'idea_house', count: 1 },
          { defId: 'idea_furnace', count: 1 },
        ],
      },
      {
        name: '食物箱',
        cost: 6,
        cards: [
          { defId: 'berry_bush', count: 1 },
          { defId: 'apple', count: 2 },
        ],
      },
    ],
  },
  {
    month: 4,
    packs: [
      { name: '铁匠包', cost: 15, cards: [{ defId: 'iron_bar', count: 2 }, { defId: 'flint', count: 2 }, { defId: 'stick', count: 3 }] },
      { name: '灵感卷轴 III', cost: 10, cards: [{ defId: 'idea_well', count: 1 }, { defId: 'idea_mill', count: 1 }] },
      { name: '畜牧入门', cost: 12, cards: [{ defId: 'cow', count: 1 }, { defId: 'wheat_field', count: 1 }] },
    ],
  },
  {
    month: 5,
    packs: [
      { name: '武器大师包', cost: 18, cards: [{ defId: 'iron_sword', count: 1 }, { defId: 'shield', count: 1 }] },
      { name: '灵感卷轴 IV', cost: 12, cards: [{ defId: 'idea_bakery', count: 1 }, { defId: 'idea_iron_sword', count: 1 }] },
      { name: '食物补给', cost: 10, cards: [{ defId: 'cheese', count: 2 }, { defId: 'bread', count: 2 }, { defId: 'apple', count: 2 }] },
    ],
  },
  {
    month: 6,
    packs: [
      { name: '战斗大师包', cost: 22, cards: [{ defId: 'iron_sword', count: 1 }, { defId: 'bow', count: 1 }, { defId: 'leather_armor', count: 1 }] },
      { name: '灵感卷轴 V', cost: 15, cards: [{ defId: 'idea_house', count: 1 }, { defId: 'idea_furnace', count: 1 }, { defId: 'idea_mill', count: 1 }] },
      { name: '招募村民 x2', cost: 18, cards: [{ defId: 'villager', count: 2 }] },
    ],
  },
  {
    month: 7,
    packs: [
      { name: '丰收大礼包', cost: 20, cards: [{ defId: 'wheat_field', count: 2 }, { defId: 'berry_bush', count: 2 }, { defId: 'apple', count: 3 }] },
      { name: '高级建造者包 II', cost: 18, cards: [{ defId: 'plank', count: 3 }, { defId: 'iron_bar', count: 2 }, { defId: 'stone', count: 3 }] },
      { name: '渔夫套装', cost: 12, cards: [{ defId: 'fishing_rod', count: 1 }, { defId: 'fishing_spot', count: 1 }] },
    ],
  },
  {
    month: 8,
    packs: [
      { name: '生存专家包', cost: 25, cards: [{ defId: 'leather_armor', count: 1 }, { defId: 'spear', count: 1 }, { defId: 'torch', count: 3 }, { defId: 'healing_potion', count: 1 }] },
      { name: '灵感卷轴 VI', cost: 18, cards: [{ defId: 'idea_iron_sword', count: 1 }, { defId: 'idea_bakery', count: 1 }, { defId: 'idea_well', count: 1 }] },
      { name: '药水材料包', cost: 10, cards: [{ defId: 'herb', count: 5 }, { defId: 'gold', count: 2 }] },
    ],
  },
  {
    month: 9,
    packs: [
      { name: '终极建造者包', cost: 30, cards: [{ defId: 'plank', count: 5 }, { defId: 'iron_bar', count: 3 }, { defId: 'stone', count: 5 }, { defId: 'gold', count: 2 }] },
      { name: '畜牧扩展包', cost: 20, cards: [{ defId: 'cow', count: 2 }, { defId: 'wheat_field', count: 2 }, { defId: 'leather', count: 2 }] },
    ],
  },
  {
    month: 10,
    packs: [
      { name: '寒冬储备包', cost: 22, cards: [{ defId: 'bread', count: 3 }, { defId: 'cheese', count: 3 }, { defId: 'cooked_meat', count: 3 }, { defId: 'torch', count: 2 }] },
      { name: '高级武器包', cost: 28, cards: [{ defId: 'iron_sword', count: 1 }, { defId: 'bow', count: 1 }, { defId: 'shield', count: 1 }] },
    ],
  },
  {
    month: 11,
    packs: [
      { name: '传奇武器包', cost: 35, cards: [{ defId: 'iron_sword', count: 2 }, { defId: 'bow', count: 1 }, { defId: 'healing_potion', count: 2 }] },
      { name: '招募村民 x3', cost: 25, cards: [{ defId: 'villager', count: 3 }] },
    ],
  },
  {
    month: 12,
    packs: [
      { name: '年终庆典包', cost: 40, cards: [{ defId: 'gold', count: 5 }, { defId: 'iron_bar', count: 3 }, { defId: 'healing_potion', count: 2 }, { defId: 'cheese', count: 3 }] },
      { name: '终极战士包', cost: 45, cards: [{ defId: 'iron_sword', count: 2 }, { defId: 'shield', count: 1 }, { defId: 'leather_armor', count: 1 }, { defId: 'bow', count: 1 }] },
    ],
  },
];

/** Get shop packs for a given month */
export function getShopForMonth(month: number): ShopPack[] {
  const shop = MONTHLY_SHOP.find((s) => s.month === month);
  if (shop) return shop.packs;

  // For months beyond the defined ones, use the last shop with scaled costs
  const lastShop = MONTHLY_SHOP[MONTHLY_SHOP.length - 1];
  return lastShop.packs.map((p) => ({
    ...p,
    cost: Math.floor(p.cost * (1 + (month - lastShop.month) * 0.2)),
    cards: [...p.cards],
  }));
}
