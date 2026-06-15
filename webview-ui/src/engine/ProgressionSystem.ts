import type { GameStatus } from '../../../src/protocol/messages';

type IdCollection = readonly string[] | ReadonlySet<string>;

export interface TechNode {
  id: string;
  title: string;
  description: string;
  unlocks: readonly string[];
  researchCardIds: readonly string[];
  prerequisites?: readonly string[];
}

export interface EvaluateResearchInput {
  cardDefIds?: IdCollection;
  completedResearchIds?: IdCollection;
  unlockedTechs?: IdCollection;
}

export interface ResearchEvaluation {
  unlockedTechs: string[];
  newTechs: string[];
}

export interface EvaluateProgressionInput {
  cardDefIds?: IdCollection;
  population: number;
  hasCamp?: boolean;
}

export interface ProgressionEvaluation {
  status: GameStatus;
  reason?: string;
}

export const TECH_NODES: readonly TechNode[] = [
  {
    id: 'storage_sheds',
    title: 'Storage Sheds',
    description: 'Adds 5 to stack limits through better village storage.',
    unlocks: ['stack_limit_bonus'],
    researchCardIds: ['storage_sheds', 'idea_storage', 'storage_shed'],
  },
  {
    id: 'field_lore',
    title: 'Field Lore',
    description: 'Explains farm and fertile land production.',
    unlocks: ['farm', 'fertile_land'],
    researchCardIds: ['field_lore', 'idea_field_lore'],
  },
  {
    id: 'war_drums',
    title: 'War Drums',
    description: 'Unlocks warriors and clearer combat previews.',
    unlocks: ['warrior', 'combat_preview'],
    researchCardIds: ['war_drums', 'idea_war_drums'],
  },
  {
    id: 'mist_cartography',
    title: 'Mist Cartography',
    description: 'Unlocks exploration recipes for the Silent Fog story.',
    unlocks: ['story_exploration_recipes'],
    researchCardIds: ['mist_cartography', 'idea_mist_cartography'],
  },
];

export function evaluateResearch(input: EvaluateResearchInput): ResearchEvaluation {
  const unlockedTechs = new Set(input.unlockedTechs ?? []);
  const completedResearchIds = new Set([
    ...(input.completedResearchIds ?? []),
    ...(input.cardDefIds ?? []),
  ]);
  const newTechs: string[] = [];

  for (const node of TECH_NODES) {
    if (unlockedTechs.has(node.id)) {
      continue;
    }

    const prerequisitesMet = (node.prerequisites ?? []).every((id) => unlockedTechs.has(id));
    const researchCompleted = node.researchCardIds.some((id) => completedResearchIds.has(id));

    if (prerequisitesMet && researchCompleted) {
      unlockedTechs.add(node.id);
      newTechs.push(node.id);
    }
  }

  return {
    unlockedTechs: Array.from(unlockedTechs),
    newTechs,
  };
}

export function evaluateProgression(input: EvaluateProgressionInput): ProgressionEvaluation {
  const cardDefIds = new Set(input.cardDefIds ?? []);
  const hasCamp = input.hasCamp ?? cardDefIds.has('camp');

  if (cardDefIds.has('dawn_card')) {
    return {
      status: 'victory',
      reason: 'dawn_card',
    };
  }

  if (input.population <= 0) {
    return {
      status: 'defeat',
      reason: 'population_lost',
    };
  }

  if (!hasCamp) {
    return {
      status: 'defeat',
      reason: 'camp_missing',
    };
  }

  return {
    status: 'playing',
  };
}
