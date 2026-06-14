/**
 * Card definitions for Stacklands.
 * Each card has an id, name, category, tier, etc.
 */
import type { CardDef } from '../../../src/protocol/messages';
import { CardCategory } from '../../../src/protocol/messages';

export const CARD_DEFS: Record<string, CardDef> = {
  // === Basic Resources ===
  wood: {
    id: 'wood',
    name: '木材',
    category: CardCategory.Resource,
    tier: 0,
    stackable: true,
    maxStack: 10,
    sellValue: 1,
    icon: '🪵',
    description: '一块结实的木材，可用于建造和合成。',
    color: '#8B7355',
  },
  stone: {
    id: 'stone',
    name: '石头',
    category: CardCategory.Resource,
    tier: 0,
    stackable: true,
    maxStack: 10,
    sellValue: 1,
    icon: '🪨',
    description: '一块坚硬的石头，适合制作工具和建造。',
    color: '#808080',
  },
  flint: {
    id: 'flint',
    name: '燧石',
    category: CardCategory.Resource,
    tier: 0,
    stackable: true,
    maxStack: 5,
    sellValue: 2,
    icon: '💎',
    description: '一块锋利的燧石，可以打出火花。',
    color: '#4A4A5A',
  },
  iron_ore: {
    id: 'iron_ore',
    name: '铁矿石',
    category: CardCategory.Resource,
    tier: 1,
    stackable: true,
    maxStack: 8,
    sellValue: 3,
    icon: '⛰️',
    description: '未经冶炼的铁矿石。',
    color: '#8B4513',
  },
  iron_bar: {
    id: 'iron_bar',
    name: '铁锭',
    category: CardCategory.Resource,
    tier: 2,
    stackable: true,
    maxStack: 6,
    sellValue: 6,
    icon: '🔩',
    description: '精炼过的铁锭，用于高级工具。',
    color: '#A0A0A0',
  },
  gold: {
    id: 'gold',
    name: '黄金',
    category: CardCategory.Resource,
    tier: 2,
    stackable: true,
    maxStack: 5,
    sellValue: 10,
    icon: '🪙',
    description: '闪亮的黄金！非常值钱。',
    color: '#FFD700',
  },

  // === Food ===
  berry: {
    id: 'berry',
    name: '浆果',
    category: CardCategory.Food,
    tier: 0,
    stackable: true,
    maxStack: 10,
    sellValue: 2,
    icon: '🫐',
    description: '一把浆果，能恢复一些饥饿度。',
    color: '#8B2252',
  },
  apple: {
    id: 'apple',
    name: '苹果',
    category: CardCategory.Food,
    tier: 0,
    stackable: true,
    maxStack: 10,
    sellValue: 2,
    icon: '🍎',
    description: '一个新鲜的苹果，能恢复饥饿度。',
    color: '#FF4444',
  },
  cooked_meat: {
    id: 'cooked_meat',
    name: '熟肉',
    category: CardCategory.Food,
    tier: 1,
    stackable: true,
    maxStack: 5,
    sellValue: 5,
    icon: '🍖',
    description: '烤熟的肉，非常饱腹。',
    color: '#8B4513',
  },
  bread: {
    id: 'bread',
    name: '面包',
    category: CardCategory.Food,
    tier: 1,
    stackable: true,
    maxStack: 5,
    sellValue: 4,
    icon: '🍞',
    description: '新鲜出炉的面包。',
    color: '#DEB887',
  },

  // === Villagers ===
  villager: {
    id: 'villager',
    name: '村民',
    category: CardCategory.Villager,
    tier: 1,
    stackable: false,
    maxStack: 1,
    sellValue: 5,
    icon: '👤',
    description: '勤劳的村民，需要定期进食。',
    color: '#4A90D9',
  },

  // === Buildings ===
  campfire: {
    id: 'campfire',
    name: '篝火',
    category: CardCategory.Building,
    tier: 1,
    stackable: false,
    maxStack: 1,
    sellValue: 3,
    icon: '🔥',
    description: '温暖的篝火，用于烹饪食物。',
    color: '#FF6600',
  },
  house: {
    id: 'house',
    name: '房屋',
    category: CardCategory.Building,
    tier: 2,
    stackable: false,
    maxStack: 1,
    sellValue: 8,
    icon: '🏠',
    description: '舒适的小屋，村民可以在这里休息。',
    color: '#8B6F47',
  },
  farm: {
    id: 'farm',
    name: '农场',
    category: CardCategory.Building,
    tier: 2,
    stackable: false,
    maxStack: 1,
    sellValue: 10,
    icon: '🌾',
    description: '一个小农场，随着时间生长食物。',
    color: '#6B8E23',
  },
  furnace: {
    id: 'furnace',
    name: '熔炉',
    category: CardCategory.Building,
    tier: 2,
    stackable: false,
    maxStack: 1,
    sellValue: 8,
    icon: '♨️',
    description: '炽热的熔炉，能把矿石冶炼成锭。',
    color: '#CC4400',
  },

  // === Tools ===
  axe: {
    id: 'axe',
    name: '斧头',
    category: CardCategory.Tool,
    tier: 1,
    stackable: false,
    maxStack: 1,
    sellValue: 4,
    icon: '🪓',
    description: '锋利的斧头，能更快地砍伐木材。',
    color: '#8B4513',
  },
  pickaxe: {
    id: 'pickaxe',
    name: '镐子',
    category: CardCategory.Tool,
    tier: 1,
    stackable: false,
    maxStack: 1,
    sellValue: 4,
    icon: '⛏️',
    description: '结实的镐子，能更快地开采石头。',
    color: '#696969',
  },
  sword: {
    id: 'sword',
    name: '长剑',
    category: CardCategory.Tool,
    tier: 2,
    stackable: false,
    maxStack: 1,
    sellValue: 8,
    icon: '⚔️',
    description: '锋利的长剑，用于抵御敌人。',
    color: '#C0C0C0',
  },

  // === Resource Nodes (generate resources) ===
  tree: {
    id: 'tree',
    name: '树木',
    category: CardCategory.Resource,
    tier: 0,
    stackable: false,
    maxStack: 1,
    sellValue: 2,
    icon: '🌳',
    description: '一棵树，村民可以砍伐以获得木材。',
    color: '#228B22',
    timerTemplate: {
      duration: 15,
      label: '再生中',
    },
  },
  berry_bush: {
    id: 'berry_bush',
    name: '浆果丛',
    category: CardCategory.Resource,
    tier: 0,
    stackable: false,
    maxStack: 1,
    sellValue: 2,
    icon: '🪴',
    description: '一丛浆果，能产出浆果。',
    color: '#8B2252',
    timerTemplate: {
      duration: 20,
      label: '再生中',
    },
  },
  rock: {
    id: 'rock',
    name: '岩石',
    category: CardCategory.Resource,
    tier: 0,
    stackable: false,
    maxStack: 1,
    sellValue: 2,
    icon: '🪨',
    description: '一块大岩石，可以开采获得石头。',
    color: '#696969',
    timerTemplate: {
      duration: 18,
      label: '重生中',
    },
  },
  iron_deposit: {
    id: 'iron_deposit',
    name: '铁矿脉',
    category: CardCategory.Resource,
    tier: 1,
    stackable: false,
    maxStack: 1,
    sellValue: 5,
    icon: '⛰️',
    description: '一处铁矿脉，开采可获得铁矿石。',
    color: '#8B4513',
    timerTemplate: {
      duration: 30,
      label: '重生中',
    },
  },

  // === Specialized Villagers ===
  builder: {
    id: 'builder',
    name: '建造者',
    category: CardCategory.Villager,
    tier: 2,
    stackable: false,
    maxStack: 1,
    sellValue: 10,
    icon: '\u{1F477}',
    description: '建造速度更快，建造类配方时间减半。',
    color: '#D2691E',
  },
  farmer: {
    id: 'farmer',
    name: '农夫',
    category: CardCategory.Villager,
    tier: 2,
    stackable: false,
    maxStack: 1,
    sellValue: 10,
    icon: '\u{1F469}‍\u{1F33E}',
    description: '采集食物产量+1，农场工作效率翻倍。',
    color: '#6B8E23',
  },
  hunter: {
    id: 'hunter',
    name: '猎人',
    category: CardCategory.Villager,
    tier: 2,
    stackable: false,
    maxStack: 1,
    sellValue: 10,
    icon: '\u{1F3F9}',
    description: '战斗时间减半，攻击力翻倍。',
    color: '#8B4513',
  },

  // === Enemies ===
  goblin: {
    id: 'goblin',
    name: '哥布林',
    category: CardCategory.Enemy,
    tier: 1,
    stackable: false,
    maxStack: 1,
    sellValue: 0,
    icon: '👺',
    description: '一只讨厌的哥布林！会攻击村民。',
    color: '#556B2F',
  },
  wolf: {
    id: 'wolf',
    name: '野狼',
    category: CardCategory.Enemy,
    tier: 2,
    stackable: false,
    maxStack: 1,
    sellValue: 0,
    icon: '🐺',
    description: '一只饥饿的野狼，对村民很危险。',
    color: '#696969',
  },

  // === Crafted items ===
  plank: {
    id: 'plank',
    name: '木板',
    category: CardCategory.Resource,
    tier: 1,
    stackable: true,
    maxStack: 8,
    sellValue: 3,
    icon: '🪵',
    description: '加工过的木板，比原木更好用。',
    color: '#CD853F',
  },
  stick: {
    id: 'stick',
    name: '木棍',
    category: CardCategory.Resource,
    tier: 0,
    stackable: true,
    maxStack: 15,
    sellValue: 1,
    icon: '🥢',
    description: '一根简单的木棍，建筑材料。',
    color: '#8B7355',
  },
  rope: {
    id: 'rope',
    name: '绳索',
    category: CardCategory.Resource,
    tier: 1,
    stackable: true,
    maxStack: 5,
    sellValue: 3,
    icon: '🪢',
    description: '一根结实的绳索，用于合成。',
    color: '#CD853F',
  },

  // === 高级食物链 ===
  raw_meat: {
    id: 'raw_meat', name: '生肉', category: CardCategory.Food, tier: 0,
    stackable: true, maxStack: 5, sellValue: 3, icon: '🥩',
    description: '一块生肉，需要烤熟才能安全食用。', color: '#CD5C5C',
  },
  fish: {
    id: 'fish', name: '鱼', category: CardCategory.Food, tier: 0,
    stackable: true, maxStack: 5, sellValue: 3, icon: '🐟',
    description: '一条新鲜的鱼，可以烤来吃。', color: '#4682B4',
  },
  wheat: {
    id: 'wheat', name: '小麦', category: CardCategory.Resource, tier: 0,
    stackable: true, maxStack: 10, sellValue: 2, icon: '🌾',
    description: '一束小麦，可以磨成面粉。', color: '#DAA520',
  },
  flour: {
    id: 'flour', name: '面粉', category: CardCategory.Food, tier: 1,
    stackable: true, maxStack: 8, sellValue: 4, icon: '🍚',
    description: '精细的面粉，可以烤制面包。', color: '#FFF8DC',
  },

  // === 动物 ===
  cow: {
    id: 'cow', name: '奶牛', category: CardCategory.Resource, tier: 2,
    stackable: false, maxStack: 1, sellValue: 10, icon: '🐄',
    description: '一头温顺的奶牛，可以挤奶。',
    color: '#8B4513', timerTemplate: { duration: 25, label: '产奶中' },
  },
  milk: {
    id: 'milk', name: '牛奶', category: CardCategory.Food, tier: 1,
    stackable: true, maxStack: 5, sellValue: 3, icon: '🥛',
    description: '新鲜的牛奶，可以做成奶酪。', color: '#FFFFFF',
  },
  cheese: {
    id: 'cheese', name: '奶酪', category: CardCategory.Food, tier: 2,
    stackable: true, maxStack: 5, sellValue: 7, icon: '🧀',
    description: '发酵好的奶酪，非常美味。', color: '#FFD700',
  },
  leather: {
    id: 'leather', name: '皮革', category: CardCategory.Resource, tier: 1,
    stackable: true, maxStack: 5, sellValue: 4, icon: '🏿',
    description: '一块皮革，可以制作护甲。', color: '#8B4513',
  },

  // === 高级武器 ===
  iron_sword: {
    id: 'iron_sword', name: '铁剑', category: CardCategory.Tool, tier: 3,
    stackable: false, maxStack: 1, sellValue: 15, icon: '🗡️',
    description: '用铁锭锻造的利剑，攻击力很强。', color: '#C0C0C0',
  },
  bow: {
    id: 'bow', name: '弓', category: CardCategory.Tool, tier: 2,
    stackable: false, maxStack: 1, sellValue: 8, icon: '🏹',
    description: '一把木弓，可以远程攻击敌人。', color: '#8B4513',
  },
  fishing_rod: {
    id: 'fishing_rod', name: '渔竿', category: CardCategory.Tool, tier: 1,
    stackable: false, maxStack: 1, sellValue: 5, icon: '🎣',
    description: '一根渔竿，可以钓鱼。', color: '#8B7355',
  },
  shield: {
    id: 'shield', name: '盾牌', category: CardCategory.Tool, tier: 2,
    stackable: false, maxStack: 1, sellValue: 10, icon: '🛡️',
    description: '坚固的盾牌，可以保护村民免受伤害。', color: '#696969',
  },
  leather_armor: {
    id: 'leather_armor', name: '皮甲', category: CardCategory.Tool, tier: 2,
    stackable: false, maxStack: 1, sellValue: 8, icon: '🥋',
    description: '皮革制成的护甲，提供基础防护。', color: '#8B4513',
  },
  spear: {
    id: 'spear', name: '长矛', category: CardCategory.Tool, tier: 1,
    stackable: false, maxStack: 1, sellValue: 5, icon: '🔱',
    description: '一根简易长矛，比木棍好用。', color: '#8B7355',
  },
  torch: {
    id: 'torch', name: '火把', category: CardCategory.Tool, tier: 1,
    stackable: true, maxStack: 5, sellValue: 3, icon: '🔦',
    description: '照亮黑暗，还能驱赶一些野兽。', color: '#FF8C00',
  },

  // === 特殊物品 ===
  herb: {
    id: 'herb', name: '草药', category: CardCategory.Resource, tier: 0,
    stackable: true, maxStack: 10, sellValue: 2, icon: '🌿',
    description: '有治疗效果的草药。', color: '#228B22',
  },
  healing_potion: {
    id: 'healing_potion', name: '治疗药水', category: CardCategory.Special, tier: 2,
    stackable: true, maxStack: 3, sellValue: 8, icon: '🧪',
    description: '恢复生命的神奇药水。', color: '#FF69B4',
  },
  treasure_map: {
    id: 'treasure_map', name: '藏宝图', category: CardCategory.Special, tier: 2,
    stackable: false, maxStack: 1, sellValue: 5, icon: '🗺️',
    description: '据说能找到埋藏的宝藏。', color: '#DEB887',
  },
  cat: {
    id: 'cat', name: '猫', category: CardCategory.Special, tier: 1,
    stackable: false, maxStack: 1, sellValue: 3, icon: '🐱',
    description: '一只可爱的猫，能驱赶小型敌人。', color: '#FF8C00',
  },
  gem: {
    id: 'gem', name: '宝石', category: CardCategory.Resource, tier: 3,
    stackable: true, maxStack: 5, sellValue: 25, icon: '💎',
    description: '珍贵的宝石，价值连城。', color: '#FF1493',
  },
  market: {
    id: 'market', name: '集市', category: CardCategory.Building, tier: 3,
    stackable: false, maxStack: 1, sellValue: 15, icon: '🏪',
    description: '可以高价出售物品。', color: '#B8860B',
  },

  // === 新建筑 ===
  well: {
    id: 'well', name: '水井', category: CardCategory.Building, tier: 2,
    stackable: false, maxStack: 1, sellValue: 8, icon: '🪣',
    description: '提供水源，是制作食物的重要设施。', color: '#4682B4',
  },
  mill: {
    id: 'mill', name: '磨坊', category: CardCategory.Building, tier: 2,
    stackable: false, maxStack: 1, sellValue: 8, icon: '🏭',
    description: '将小麦磨成面粉。', color: '#8B7355',
  },
  bakery: {
    id: 'bakery', name: '面包房', category: CardCategory.Building, tier: 3,
    stackable: false, maxStack: 1, sellValue: 12, icon: '🥖',
    description: '烤制面包的地方。', color: '#D2691E',
  },

  // === 新资源节点 ===
  fishing_spot: {
    id: 'fishing_spot', name: '钓鱼点', category: CardCategory.Resource, tier: 0,
    stackable: false, maxStack: 1, sellValue: 3, icon: '🌊',
    description: '一片水域，可以在这里钓鱼。', color: '#4682B4',
    timerTemplate: { duration: 15, label: '鱼群恢复中' },
  },
  wheat_field: {
    id: 'wheat_field', name: '麦田', category: CardCategory.Resource, tier: 1,
    stackable: false, maxStack: 1, sellValue: 5, icon: '🌾',
    description: '一片麦田，可以收获小麦。', color: '#DAA520',
    timerTemplate: { duration: 22, label: '生长中' },
  },

  // === 新敌人 ===
  boss_troll: {
    id: 'boss_troll', name: '巨魔', category: CardCategory.Enemy, tier: 3,
    stackable: false, maxStack: 1, sellValue: 0, icon: '👹',
    description: '强大的巨魔！需要高级武器才能击败。', color: '#8B0000',
  },

  // === 更多灵感 ===
  idea_mill: {
    id: 'idea_mill', name: '灵感：磨坊', category: CardCategory.Idea, tier: 1,
    stackable: false, maxStack: 1, sellValue: 3, icon: '💡',
    description: '教会如何建造磨坊。', color: '#FFFF00',
  },
  idea_bakery: {
    id: 'idea_bakery', name: '灵感：面包房', category: CardCategory.Idea, tier: 2,
    stackable: false, maxStack: 1, sellValue: 4, icon: '💡',
    description: '教会如何建造面包房。', color: '#FFFF00',
  },
  idea_well: {
    id: 'idea_well', name: '灵感：水井', category: CardCategory.Idea, tier: 1,
    stackable: false, maxStack: 1, sellValue: 3, icon: '💡',
    description: '教会如何建造水井。', color: '#FFFF00',
  },
  idea_iron_sword: {
    id: 'idea_iron_sword', name: '灵感：铁剑', category: CardCategory.Idea, tier: 2,
    stackable: false, maxStack: 1, sellValue: 4, icon: '💡',
    description: '教会如何锻造铁剑。', color: '#FFFF00',
  },

  // === Ideas ===
  idea_plank: {
    id: 'idea_plank',
    name: '灵感：木板',
    category: CardCategory.Idea,
    tier: 0,
    stackable: false,
    maxStack: 1,
    sellValue: 2,
    icon: '💡',
    description: '教会如何将木材制作成木板。',
    color: '#FFFF00',
  },
  idea_campfire: {
    id: 'idea_campfire',
    name: '灵感：篝火',
    category: CardCategory.Idea,
    tier: 0,
    stackable: false,
    maxStack: 1,
    sellValue: 2,
    icon: '💡',
    description: '教会如何建造篝火。',
    color: '#FFFF00',
  },
  idea_house: {
    id: 'idea_house',
    name: '灵感：房屋',
    category: CardCategory.Idea,
    tier: 1,
    stackable: false,
    maxStack: 1,
    sellValue: 3,
    icon: '💡',
    description: '教会如何建造房屋。',
    color: '#FFFF00',
  },
  idea_furnace: {
    id: 'idea_furnace',
    name: '灵感：熔炉',
    category: CardCategory.Idea,
    tier: 1,
    stackable: false,
    maxStack: 1,
    sellValue: 3,
    icon: '💡',
    description: '教会如何建造熔炉。',
    color: '#FFFF00',
  },
};

/** Get a card definition by ID */
export function getCardDef(id: string): CardDef | undefined {
  return CARD_DEFS[id];
}

/** All card defs as an array */
export function getAllCardDefs(): CardDef[] {
  return Object.values(CARD_DEFS);
}

/** Get starter cards for a new game */
export function getStarterCards(): string[] {
  return ['villager', 'cat', 'berry_bush', 'tree', 'rock', 'wood', 'wood', 'stone', 'berry', 'berry'];
}
