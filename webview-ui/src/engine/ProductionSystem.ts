import type { CardInstance } from '../../../src/protocol/messages';

export interface ProductionSpawnCard {
  defId: string;
  count: number;
  sourceUid: string;
}

type IdCollection = readonly string[] | ReadonlySet<string>;

export interface TickProductionInput {
  elapsedGameSeconds: number;
  cards: Pick<CardInstance, 'uid' | 'defId' | 'position'>[];
  productionTimers: Record<string, number>;
  unlockedTechs?: IdCollection;
  landRadius?: number;
}

export interface TickProductionResult {
  productionTimers: Record<string, number>;
  spawnCards: ProductionSpawnCard[];
}

interface ProductionRule {
  buildingDefId: string;
  landDefId: string;
  productDefId: string;
}

const PRODUCTION_RULES: readonly ProductionRule[] = [
  { buildingDefId: 'farm', landDefId: 'fertile_land', productDefId: 'berry' },
  { buildingDefId: 'lumber_camp', landDefId: 'forest_land', productDefId: 'wood' },
  { buildingDefId: 'quarry', landDefId: 'rocky_land', productDefId: 'stone' },
];

const DEFAULT_LAND_RADIUS = 80;
const STANDARD_INTERVAL = 30;
const EFFICIENT_TOOLS_INTERVAL = 22;

export function tickProduction(input: TickProductionInput): TickProductionResult {
  const interval = hasId(input.unlockedTechs, 'efficient_tools')
    ? EFFICIENT_TOOLS_INTERVAL
    : STANDARD_INTERVAL;
  const elapsed = Math.max(0, input.elapsedGameSeconds);
  const landRadius = input.landRadius ?? DEFAULT_LAND_RADIUS;
  const productionTimers: Record<string, number> = {};
  const spawnCards: ProductionSpawnCard[] = [];

  for (const rule of PRODUCTION_RULES) {
    const buildings = input.cards.filter((card) => card.defId === rule.buildingDefId);

    for (const building of buildings) {
      if (!hasRequiredLand(building, input.cards, rule.landDefId, landRadius)) {
        continue;
      }

      const nextElapsed = (input.productionTimers[building.uid] ?? 0) + elapsed;
      const producedCount = Math.floor(nextElapsed / interval);
      productionTimers[building.uid] = nextElapsed % interval;

      if (producedCount > 0) {
        spawnCards.push({
          defId: rule.productDefId,
          count: producedCount,
          sourceUid: building.uid,
        });
      }
    }
  }

  return {
    productionTimers,
    spawnCards,
  };
}

function hasId(ids: IdCollection | undefined, id: string): boolean {
  if (!ids) {
    return false;
  }

  return Array.isArray(ids) ? ids.includes(id) : ids.has(id);
}

function hasRequiredLand(
  building: Pick<CardInstance, 'uid' | 'position'>,
  cards: Pick<CardInstance, 'uid' | 'defId' | 'position'>[],
  landDefId: string,
  radius: number
): boolean {
  return cards.some((card) => {
    if (card.uid === building.uid || card.defId !== landDefId) {
      return false;
    }

    const dx = card.position.x - building.position.x;
    const dy = card.position.y - building.position.y;
    return Math.sqrt(dx * dx + dy * dy) <= radius;
  });
}
