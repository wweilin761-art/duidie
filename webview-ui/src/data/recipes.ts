/**
 * Recipe definitions for card combinations.
 */
export interface RecipeInput {
  defId: string;
  count: number;
  consumed: boolean;
}

export interface RecipeOutput {
  defId: string;
  count: number;
  spawnTimer?: {
    duration: number;
    label: string;
  };
}

export interface Recipe {
  id: string;
  inputs: RecipeInput[];
  output: RecipeOutput;
  duration?: number;
  station?: string;
  consumesInputs: boolean;
  ideaRequired?: string;
}

export const RECIPES: Recipe[] = [
  // === Basic Crafting ===
  {
    id: 'craft_plank',
    inputs: [{ defId: 'wood', count: 1, consumed: true }],
    output: { defId: 'plank', count: 1 },
    duration: 3,
    consumesInputs: true,
  },
  {
    id: 'craft_stick',
    inputs: [{ defId: 'wood', count: 1, consumed: true }],
    output: { defId: 'stick', count: 2 },
    duration: 2,
    consumesInputs: true,
  },

  // === Tools ===
  {
    id: 'craft_axe',
    inputs: [
      { defId: 'stick', count: 1, consumed: true },
      { defId: 'wood', count: 1, consumed: true },
      { defId: 'flint', count: 1, consumed: true },
    ],
    output: { defId: 'axe', count: 1 },
    duration: 6,
    consumesInputs: true,
  },
  {
    id: 'craft_pickaxe',
    inputs: [
      { defId: 'stick', count: 1, consumed: true },
      { defId: 'wood', count: 1, consumed: true },
      { defId: 'stone', count: 1, consumed: true },
    ],
    output: { defId: 'pickaxe', count: 1 },
    duration: 6,
    consumesInputs: true,
  },
  {
    id: 'craft_sword',
    inputs: [
      { defId: 'iron_bar', count: 1, consumed: true },
      { defId: 'stick', count: 1, consumed: true },
    ],
    output: { defId: 'sword', count: 1 },
    duration: 8,
    consumesInputs: true,
  },

  // === Buildings ===
  {
    id: 'build_camp',
    inputs: [
      { defId: 'plank', count: 2, consumed: true },
      { defId: 'stone', count: 2, consumed: true },
    ],
    output: { defId: 'camp', count: 1 },
    duration: 12,
    consumesInputs: true,
  },
  {
    id: 'build_research_table',
    inputs: [
      { defId: 'plank', count: 1, consumed: true },
      { defId: 'stone', count: 1, consumed: true },
    ],
    output: { defId: 'research_table', count: 1 },
    duration: 6,
    consumesInputs: true,
  },
  {
    id: 'research_storage',
    inputs: [
      { defId: 'research_table', count: 1, consumed: false },
      { defId: 'wood', count: 1, consumed: true },
      { defId: 'stone', count: 1, consumed: true },
    ],
    output: { defId: 'idea_storage', count: 1 },
    duration: 8,
    consumesInputs: true,
  },
  {
    id: 'research_field_lore',
    inputs: [
      { defId: 'research_table', count: 1, consumed: false },
      { defId: 'berry', count: 2, consumed: true },
      { defId: 'wood', count: 1, consumed: true },
    ],
    output: { defId: 'idea_field_lore', count: 1 },
    duration: 8,
    consumesInputs: true,
  },
  {
    id: 'research_war_drums',
    inputs: [
      { defId: 'research_table', count: 1, consumed: false },
      { defId: 'wood', count: 2, consumed: true },
      { defId: 'leather', count: 1, consumed: true },
    ],
    output: { defId: 'idea_war_drums', count: 1 },
    duration: 8,
    consumesInputs: true,
  },
  {
    id: 'research_mist_cartography',
    inputs: [
      { defId: 'research_table', count: 1, consumed: false },
      { defId: 'stone_tablet', count: 1, consumed: false },
      { defId: 'gold', count: 1, consumed: true },
      { defId: 'wood', count: 1, consumed: true },
    ],
    output: { defId: 'idea_mist_cartography', count: 1 },
    duration: 10,
    consumesInputs: true,
  },
  {
    id: 'build_lumber_camp',
    inputs: [
      { defId: 'wood', count: 2, consumed: true },
      { defId: 'plank', count: 1, consumed: true },
      { defId: 'forest_land', count: 1, consumed: false },
    ],
    output: { defId: 'lumber_camp', count: 1 },
    duration: 10,
    consumesInputs: true,
  },
  {
    id: 'build_quarry',
    inputs: [
      { defId: 'stone', count: 2, consumed: true },
      { defId: 'plank', count: 1, consumed: true },
      { defId: 'rocky_land', count: 1, consumed: false },
    ],
    output: { defId: 'quarry', count: 1 },
    duration: 10,
    consumesInputs: true,
  },
  {
    id: 'build_campfire',
    inputs: [
      { defId: 'wood', count: 1, consumed: true },
      { defId: 'stone', count: 1, consumed: true },
    ],
    output: { defId: 'campfire', count: 1 },
    duration: 5,
    consumesInputs: true,
  },
  {
    id: 'build_house',
    inputs: [
      { defId: 'plank', count: 2, consumed: true },
      { defId: 'wood', count: 1, consumed: true },
    ],
    output: { defId: 'house', count: 1 },
    duration: 10,
    consumesInputs: true,
  },
  {
    id: 'build_furnace',
    inputs: [
      { defId: 'stone', count: 2, consumed: true },
      { defId: 'iron_ore', count: 1, consumed: true },
    ],
    output: { defId: 'furnace', count: 1 },
    duration: 8,
    consumesInputs: true,
  },
  {
    id: 'build_farm',
    inputs: [
      { defId: 'wood', count: 2, consumed: true },
      { defId: 'plank', count: 1, consumed: true },
    ],
    output: { defId: 'farm', count: 1 },
    duration: 8,
    consumesInputs: true,
  },

  // === Cooking (requires campfire as station) ===
  {
    id: 'cook_meat',
    inputs: [{ defId: 'raw_meat', count: 1, consumed: true }],
    output: { defId: 'cooked_meat', count: 1 },
    duration: 5,
    station: 'campfire',
    consumesInputs: true,
  },

  // === Smelting (requires furnace) ===
  {
    id: 'smelt_iron',
    inputs: [{ defId: 'iron_ore', count: 1, consumed: true }],
    output: { defId: 'iron_bar', count: 1 },
    duration: 12,
    station: 'furnace',
    consumesInputs: true,
  },

  // === Resource Gathering (villager + resource node) ===
  {
    id: 'chop_tree',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'tree', count: 1, consumed: false },
    ],
    output: { defId: 'wood', count: 2 },
    duration: 5,
    consumesInputs: false,
  },
  {
    id: 'mine_rock',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'rock', count: 1, consumed: false },
    ],
    output: { defId: 'stone', count: 2 },
    duration: 6,
    consumesInputs: false,
  },
  {
    id: 'harvest_berry',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'berry_bush', count: 1, consumed: false },
    ],
    output: { defId: 'berry', count: 2 },
    duration: 4,
    consumesInputs: false,
  },
  {
    id: 'mine_iron',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'iron_deposit', count: 1, consumed: false },
    ],
    output: { defId: 'iron_ore', count: 1 },
    duration: 10,
    consumesInputs: false,
  },

  // === Eating (restore villager hunger) ===
  {
    id: 'eat_berry',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'berry', count: 1, consumed: true },
    ],
    output: { defId: 'villager', count: 1 },
    duration: 1,
    consumesInputs: false,
  },
  {
    id: 'eat_apple',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'apple', count: 1, consumed: true },
    ],
    output: { defId: 'villager', count: 1 },
    duration: 1,
    consumesInputs: false,
  },
  {
    id: 'eat_cooked_meat',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'cooked_meat', count: 1, consumed: true },
    ],
    output: { defId: 'villager', count: 1 },
    duration: 1,
    consumesInputs: false,
  },
  {
    id: 'eat_bread',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'bread', count: 1, consumed: true },
    ],
    output: { defId: 'villager', count: 1 },
    duration: 1,
    consumesInputs: false,
  },

  // === Advanced: Enhanced gathering with tools ===
  {
    id: 'chop_tree_axe',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'axe', count: 1, consumed: false },
      { defId: 'tree', count: 1, consumed: false },
    ],
    output: { defId: 'wood', count: 3 },
    duration: 3,
    consumesInputs: false,
  },
  {
    id: 'mine_rock_pickaxe',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'pickaxe', count: 1, consumed: false },
      { defId: 'rock', count: 1, consumed: false },
    ],
    output: { defId: 'stone', count: 3 },
    duration: 4,
    consumesInputs: false,
  },

  // === Exploration ===
  {
    id: 'build_exploration_party',
    inputs: [
      { defId: 'villager', count: 3, consumed: true },
      { defId: 'berry', count: 3, consumed: true },
    ],
    output: { defId: 'exploration_party', count: 1 },
    duration: 10,
    consumesInputs: true,
  },
  {
    id: 'read_memory_fragment',
    inputs: [
      { defId: 'memory_fragment', count: 1, consumed: true },
      { defId: 'camp', count: 1, consumed: false },
    ],
    output: { defId: 'stone_tablet', count: 1 },
    duration: 6,
    consumesInputs: true,
  },
  {
    id: 'find_sun_card',
    inputs: [
      { defId: 'exploration_party', count: 1, consumed: true },
      { defId: 'forest_land', count: 1, consumed: false },
    ],
    output: { defId: 'sun_card', count: 1 },
    duration: 12,
    consumesInputs: true,
  },
  {
    id: 'chart_moon',
    inputs: [
      { defId: 'sun_card', count: 1, consumed: false },
      { defId: 'old_sage', count: 1, consumed: false },
    ],
    output: { defId: 'moon_card', count: 1 },
    duration: 8,
    consumesInputs: false,
  },
  {
    id: 'chart_stars',
    inputs: [
      { defId: 'moon_card', count: 1, consumed: false },
      { defId: 'stone_tablet', count: 1, consumed: false },
    ],
    output: { defId: 'star_chart', count: 1 },
    duration: 8,
    consumesInputs: false,
  },
  {
    id: 'craft_dawn',
    inputs: [
      { defId: 'sun_card', count: 1, consumed: true },
      { defId: 'moon_card', count: 1, consumed: true },
      { defId: 'star_chart', count: 1, consumed: true },
    ],
    output: { defId: 'dawn_card', count: 1 },
    duration: 12,
    consumesInputs: true,
  },
  // === 完整食物链 ===
  {
    id: 'cook_fish',
    inputs: [{ defId: 'fish', count: 1, consumed: true }],
    output: { defId: 'cooked_meat', count: 1 },
    duration: 4, station: 'campfire', consumesInputs: true,
  },
  {
    id: 'fish_at_spot',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'fishing_spot', count: 1, consumed: false },
    ],
    output: { defId: 'fish', count: 1 },
    duration: 6, consumesInputs: false,
  },
  {
    id: 'fish_with_rod',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'fishing_rod', count: 1, consumed: false },
      { defId: 'fishing_spot', count: 1, consumed: false },
    ],
    output: { defId: 'fish', count: 3 },
    duration: 6, consumesInputs: false,
  },
  {
    id: 'milk_cow',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'cow', count: 1, consumed: false },
    ],
    output: { defId: 'milk', count: 1 },
    duration: 5, consumesInputs: false,
  },
  {
    id: 'make_cheese',
    inputs: [{ defId: 'milk', count: 1, consumed: true }],
    output: { defId: 'cheese', count: 1 },
    duration: 12, consumesInputs: true,
  },
  {
    id: 'mill_wheat',
    inputs: [{ defId: 'wheat', count: 1, consumed: true }],
    output: { defId: 'flour', count: 1 },
    duration: 6, station: 'mill', consumesInputs: true,
  },
  {
    id: 'bake_bread_mill',
    inputs: [{ defId: 'flour', count: 1, consumed: true }],
    output: { defId: 'bread', count: 1 },
    duration: 8, station: 'bakery', consumesInputs: true,
  },
  {
    id: 'eat_cheese',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'cheese', count: 1, consumed: true },
    ],
    output: { defId: 'villager', count: 1 },
    duration: 1, consumesInputs: false,
  },
  {
    id: 'eat_milk',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'milk', count: 1, consumed: true },
    ],
    output: { defId: 'villager', count: 1 },
    duration: 1, consumesInputs: false,
  },

  // === 新武器合成 ===
  {
    id: 'craft_iron_sword',
    inputs: [
      { defId: 'iron_bar', count: 2, consumed: true },
      { defId: 'stick', count: 1, consumed: true },
    ],
    output: { defId: 'iron_sword', count: 1 },
    duration: 10, consumesInputs: true,
  },
  {
    id: 'craft_bow',
    inputs: [
      { defId: 'wood', count: 1, consumed: true },
      { defId: 'stick', count: 2, consumed: true },
      { defId: 'rope', count: 1, consumed: true },
    ],
    output: { defId: 'bow', count: 1 },
    duration: 8, consumesInputs: true,
  },
  {
    id: 'craft_fishing_rod',
    inputs: [
      { defId: 'stick', count: 1, consumed: true },
      { defId: 'rope', count: 1, consumed: true },
    ],
    output: { defId: 'fishing_rod', count: 1 },
    duration: 4, consumesInputs: true,
  },
  {
    id: 'craft_shield',
    inputs: [
      { defId: 'plank', count: 2, consumed: true },
      { defId: 'iron_bar', count: 1, consumed: true },
    ],
    output: { defId: 'shield', count: 1 },
    duration: 8, consumesInputs: true,
  },
  {
    id: 'craft_spear',
    inputs: [
      { defId: 'stick', count: 1, consumed: true },
      { defId: 'flint', count: 1, consumed: true },
    ],
    output: { defId: 'spear', count: 1 },
    duration: 3, consumesInputs: true,
  },
  {
    id: 'craft_torch',
    inputs: [
      { defId: 'wood', count: 1, consumed: true },
      { defId: 'flint', count: 1, consumed: true },
    ],
    output: { defId: 'torch', count: 2 },
    duration: 2, consumesInputs: true,
  },
  {
    id: 'craft_leather_armor',
    inputs: [
      { defId: 'leather', count: 2, consumed: true },
      { defId: 'rope', count: 1, consumed: true },
    ],
    output: { defId: 'leather_armor', count: 1 },
    duration: 6, consumesInputs: true,
  },

  // === 新建筑 ===
  {
    id: 'build_well',
    inputs: [
      { defId: 'stone', count: 4, consumed: true },
    ],
    output: { defId: 'well', count: 1 },
    duration: 10, consumesInputs: true,
  },
  {
    id: 'build_mill',
    inputs: [
      { defId: 'plank', count: 2, consumed: true },
      { defId: 'stone', count: 2, consumed: true },
    ],
    output: { defId: 'mill', count: 1 },
    duration: 8, consumesInputs: true,
  },
  {
    id: 'build_bakery',
    inputs: [
      { defId: 'plank', count: 2, consumed: true },
      { defId: 'stone', count: 1, consumed: true },
      { defId: 'iron_bar', count: 1, consumed: true },
    ],
    output: { defId: 'bakery', count: 1 },
    duration: 10, consumesInputs: true,
  },

  // === 特殊合成 ===
  {
    id: 'craft_potion',
    inputs: [
      { defId: 'herb', count: 3, consumed: true },
    ],
    output: { defId: 'healing_potion', count: 1 },
    duration: 8, station: 'campfire', consumesInputs: true,
  },
  {
    id: 'butcher_cow',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'sword', count: 1, consumed: false },
      { defId: 'cow', count: 1, consumed: true },
    ],
    output: { defId: 'raw_meat', count: 3 },
    duration: 5, consumesInputs: false,
  },

  // === 高级采集 (带工具) ===
  {
    id: 'harvest_wheat_field',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'wheat_field', count: 1, consumed: false },
    ],
    output: { defId: 'wheat', count: 2 },
    duration: 8, consumesInputs: false,
  },

  // === 村民晋升 (Specialized Villager Upgrades) ===
  {
    id: 'upgrade_builder',
    inputs: [
      { defId: 'villager', count: 1, consumed: true },
      { defId: 'axe', count: 1, consumed: true },
      { defId: 'plank', count: 1, consumed: true },
    ],
    output: { defId: 'builder', count: 1 },
    duration: 8, consumesInputs: true,
  },
  {
    id: 'upgrade_farmer',
    inputs: [
      { defId: 'villager', count: 1, consumed: true },
      { defId: 'wheat_field', count: 1, consumed: true },
    ],
    output: { defId: 'farmer', count: 1 },
    duration: 8, consumesInputs: true,
  },
  {
    id: 'upgrade_hunter',
    inputs: [
      { defId: 'villager', count: 1, consumed: true },
      { defId: 'bow', count: 1, consumed: true },
    ],
    output: { defId: 'hunter', count: 1 },
    duration: 8, consumesInputs: true,
  },

  // === 集市 (Market) ===
  {
    id: 'build_market',
    inputs: [
      { defId: 'stone', count: 4, consumed: true },
    ],
    output: { defId: 'market', count: 1 },
    duration: 12, consumesInputs: true,
  },

  // === 猫驱赶哥布林 ===
  {
    id: 'cat_scare_goblin',
    inputs: [
      { defId: 'villager', count: 1, consumed: false },
      { defId: 'cat', count: 1, consumed: false },
      { defId: 'goblin', count: 1, consumed: true },
    ],
    output: { defId: 'cat', count: 1 },
    duration: 2, consumesInputs: false,
  },
];

/** DefIds of specialized villagers that can act as regular villagers. */
const VILLAGER_SPECIALIZATIONS = new Set(['builder', 'farmer', 'hunter']);

/**
 * Find recipes that match the given input card IDs.
 * Returns recipes sorted by specificity (more inputs = higher priority).
 */
export function findMatchingRecipes(
  inputDefIds: string[],
  availableStationDefIds: string[],
  unlockedRecipeIds: Set<string>
): Recipe[] {
  const inputCounts = new Map<string, number>();
  for (const id of inputDefIds) {
    inputCounts.set(id, (inputCounts.get(id) || 0) + 1);
  }

  // Specialized villagers can also act as regular villagers for recipes
  // that need a villager (eating, gathering, combat).
  // Do NOT add the reverse — a regular villager cannot serve as a builder.
  let extraVillager = 0;
  for (const spec of VILLAGER_SPECIALIZATIONS) {
    extraVillager += inputCounts.get(spec) || 0;
  }
  if (extraVillager > 0) {
    inputCounts.set('villager', (inputCounts.get('villager') || 0) + extraVillager);
  }

  const matches: Recipe[] = [];

  for (const recipe of RECIPES) {
    // Check if recipe requires an idea that hasn't been unlocked
    if (recipe.ideaRequired && !unlockedRecipeIds.has(recipe.ideaRequired)) {
      continue;
    }

    // Check if recipe needs a station and one is available nearby
    if (recipe.station && !availableStationDefIds.includes(recipe.station)) {
      continue;
    }

    // Check if all recipe inputs are present
    let allInputsPresent = true;
    const recipeInputCounts = new Map<string, number>();
    for (const input of recipe.inputs) {
      recipeInputCounts.set(
        input.defId,
        (recipeInputCounts.get(input.defId) || 0) + input.count
      );
    }

    for (const [defId, requiredCount] of recipeInputCounts) {
      const available = inputCounts.get(defId) || 0;
      if (available < requiredCount) {
        allInputsPresent = false;
        break;
      }
    }

    if (allInputsPresent) {
      matches.push(recipe);
    }
  }

  // Sort by total input count (descending) — more specific recipes first
  matches.sort((a, b) => {
    const aTotalInputs = a.inputs.reduce((sum, i) => sum + i.count, 0);
    const bTotalInputs = b.inputs.reduce((sum, i) => sum + i.count, 0);
    return bTotalInputs - aTotalInputs;
  });

  return matches;
}

/**
 * Get the best matching recipe (most specific).
 */
export function findBestRecipe(
  inputDefIds: string[],
  availableStationDefIds: string[],
  unlockedRecipeIds: Set<string>
): Recipe | undefined {
  return findMatchingRecipes(inputDefIds, availableStationDefIds, unlockedRecipeIds)[0];
}

/**
 * Look up a recipe by its unique id. Used when restoring active timed
 * recipes from a save file.
 */
export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}
