import type { CardInstance } from '../../../src/protocol/messages';

const FOOD_DEF_IDS = new Set([
  'berry',
  'apple',
  'cooked_meat',
  'bread',
  'cheese',
  'milk',
  'fish',
  'wheat',
]);

const POPULATION_DEF_IDS = new Set([
  'villager',
  'builder',
  'farmer',
  'hunter',
  'warrior',
]);

type IdCollection = readonly string[] | ReadonlySet<string>;

export interface ResourceSummaryInput {
  cards: Pick<CardInstance, 'defId' | 'stackCount'>[];
  coins?: number;
  unlockedTechs?: IdCollection;
}

export interface ResourceSummary {
  wood: number;
  stone: number;
  food: number;
  coins: number;
  population: number;
  stackLimitBonus: number;
}

export function summarizeResources(input: ResourceSummaryInput): ResourceSummary {
  const summary: ResourceSummary = {
    wood: 0,
    stone: 0,
    food: 0,
    coins: input.coins ?? 0,
    population: 0,
    stackLimitBonus: hasId(input.unlockedTechs, 'storage_sheds') ? 5 : 0,
  };

  for (const card of input.cards) {
    const count = card.stackCount;

    if (card.defId === 'wood') {
      summary.wood += count;
    }

    if (card.defId === 'stone') {
      summary.stone += count;
    }

    if (FOOD_DEF_IDS.has(card.defId)) {
      summary.food += count;
    }

    if (POPULATION_DEF_IDS.has(card.defId)) {
      summary.population += count;
    }
  }

  return summary;
}

function hasId(ids: IdCollection | undefined, id: string): boolean {
  if (!ids) {
    return false;
  }

  return Array.isArray(ids)
    ? (ids as readonly string[]).includes(id)
    : (ids as ReadonlySet<string>).has(id);
}
