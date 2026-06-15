export interface TechNode {
  id: string;
  label: string;
  description: string;
  costs: Record<string, number>;
  unlocks: string[];
}

export const TECH_NODES: TechNode[] = [
  {
    id: 'storage_sheds',
    label: '储物棚',
    description: '扩展营地的储物方式，所有可堆叠卡牌的上限提高。',
    costs: {
      wood: 2,
      stone: 1,
      idea_storage: 1,
    },
    unlocks: ['stack_limit_bonus_5'],
  },
  {
    id: 'field_lore',
    label: '田野知识',
    description: '学会辨认肥沃土地，并让农场能依靠土地持续生产食物。',
    costs: {
      berry: 3,
      wood: 1,
      stone: 1,
    },
    unlocks: ['farm', 'fertile_land', 'farm_production'],
  },
  {
    id: 'war_drums',
    label: '战鼓',
    description: '用节奏组织守卫和巡逻，解锁战士训练与战斗预判。',
    costs: {
      wood: 2,
      leather: 1,
      stone: 1,
    },
    unlocks: ['warrior', 'combat_preview'],
  },
  {
    id: 'mist_cartography',
    label: '迷雾制图',
    description: '记录雾中的路线、标记与星象，解锁主线探索配方。',
    costs: {
      stone_tablet: 1,
      wood: 2,
      gold: 1,
    },
    unlocks: ['exploration_party', 'find_sun_card', 'chart_moon', 'chart_stars', 'craft_dawn'],
  },
];

export function getTechNode(id: string): TechNode | undefined {
  return TECH_NODES.find((node) => node.id === id);
}
