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

const RESOURCE_FAMILIES: Readonly<Record<string, readonly string[]>> = {
  wood: ['wood'],
  stone: ['stone'],
  food: Array.from(FOOD_DEF_IDS),
  wealth: ['coin', 'coins', 'gold'],
  population: Array.from(POPULATION_DEF_IDS),
};

type IdCollection = readonly string[] | ReadonlySet<string>;

export interface StoryChapter {
  id: string;
  title: string;
  act: number;
  objectives: readonly string[];
}

export interface StoryDialogue {
  id: string;
  speaker: string;
  text: string;
  cardDefId?: string;
}

export interface ResolveStoryMilestonesInput {
  storyFlags?: IdCollection;
  storyCards?: IdCollection;
  cardDefIds?: IdCollection;
  coins?: number;
  lastStoryDialogId?: string;
}

export interface StoryMilestoneResult {
  flags: string[];
  storyCards: string[];
  newFlags: string[];
  newCards: string[];
  dialogue: StoryDialogue[];
  lastStoryDialogId?: string;
}

export interface StoryCardCodexEntry {
  defId: string;
  title: string;
  description: string;
  chapterId: string;
  discovered: boolean;
}

export interface StoryCardCodexInput {
  storyCards?: IdCollection;
  cardDefIds?: IdCollection;
}

export const STORY_CHAPTERS: readonly StoryChapter[] = [
  {
    id: 'silent_fog_act_one',
    title: 'Silent Fog',
    act: 1,
    objectives: [
      'Establish a camp before the fog closes in.',
      'Gather five resource families to recover a memory fragment.',
      'Study the stone tablet when it appears near the camp.',
    ],
  },
  {
    id: 'silent_fog_act_two',
    title: 'The Hidden Sky',
    act: 2,
    objectives: [
      'Find the sun card beyond the forest.',
      'Recover the moon card and chart the stars.',
      'Prepare dawn with the sun, moon, and star chart.',
    ],
  },
];

const STORY_CARD_CODEX: readonly Omit<StoryCardCodexEntry, 'discovered'>[] = [
  {
    defId: 'memory_fragment',
    title: 'Memory Fragment',
    description: 'A recovered shard of the village before the fog.',
    chapterId: 'silent_fog_act_one',
  },
  {
    defId: 'stone_tablet',
    title: 'Stone Tablet',
    description: 'A camp-side tablet that explains where the fog came from.',
    chapterId: 'silent_fog_act_one',
  },
  {
    defId: 'sun_card',
    title: 'Sun Card',
    description: 'The first sky card, bright enough to open the second act.',
    chapterId: 'silent_fog_act_two',
  },
  {
    defId: 'moon_card',
    title: 'Moon Card',
    description: 'A quiet sky card used to read the dark paths.',
    chapterId: 'silent_fog_act_two',
  },
  {
    defId: 'star_chart',
    title: 'Star Chart',
    description: 'A map of the dawn route through the Silent Fog.',
    chapterId: 'silent_fog_act_two',
  },
  {
    defId: 'dawn_card',
    title: 'Dawn Card',
    description: 'The final sign that the village can leave the fog.',
    chapterId: 'silent_fog_act_two',
  },
];

export function resolveStoryMilestones(input: ResolveStoryMilestonesInput): StoryMilestoneResult {
  const existingFlags = new Set(input.storyFlags ?? []);
  const flags = new Set(existingFlags);
  const storyCards = new Set(input.storyCards ?? []);
  const ownedCards = new Set([...(input.cardDefIds ?? []), ...storyCards]);
  const initialOwnedCards = new Set(ownedCards);
  const newFlags: string[] = [];
  const newCards: string[] = [];
  const dialogue: StoryDialogue[] = [];

  if ((input.coins ?? 0) > 0) {
    ownedCards.add('coins');
  }

  const rememberCount = countRememberedResourceFamilies(ownedCards);
  if (rememberCount >= 5 && addFlag('five_resources_remembered', flags, existingFlags, newFlags)) {
    addStoryCard('memory_fragment', ownedCards, storyCards, newCards);
    dialogue.push({
      id: 'five_resources_remembered',
      speaker: 'Silent Fog',
      text: '雾里传来熟悉的回声：木、石、食物、财富与人声重新连成了记忆。',
      cardDefId: 'memory_fragment',
    });
  }

  if (
    initialOwnedCards.has('memory_fragment') &&
    initialOwnedCards.has('camp') &&
    addFlag('stone_tablet_revealed', flags, existingFlags, newFlags)
  ) {
    addStoryCard('stone_tablet', ownedCards, storyCards, newCards);
    dialogue.push({
      id: 'stone_tablet_revealed',
      speaker: 'Stone Tablet',
      text: '石板在营地旁亮起，记录着驱散浓雾所需的第一束光。',
      cardDefId: 'stone_tablet',
    });
  }

  if (ownedCards.has('sun_card') && addFlag('act_two_unlocked', flags, existingFlags, newFlags)) {
    dialogue.push({
      id: 'act_two_unlocked',
      speaker: 'Sun Card',
      text: '太阳卡划开雾幕，第二幕的道路显现出来。',
      cardDefId: 'sun_card',
    });
  }

  if (
    initialOwnedCards.has('sun_card') &&
    initialOwnedCards.has('moon_card') &&
    initialOwnedCards.has('star_chart') &&
    addFlag('dawn_ready', flags, existingFlags, newFlags)
  ) {
    addStoryCard('dawn_card', ownedCards, storyCards, newCards);
    dialogue.push({
      id: 'dawn_ready',
      speaker: 'Star Chart',
      text: '日、月与星图对齐，黎明已经可以被召回。',
      cardDefId: 'star_chart',
    });
  }

  return {
    flags: Array.from(flags),
    storyCards: Array.from(storyCards),
    newFlags,
    newCards,
    dialogue,
    lastStoryDialogId: dialogue.at(-1)?.id ?? input.lastStoryDialogId,
  };
}

export function getStoryCardCodex(input: StoryCardCodexInput): StoryCardCodexEntry[] {
  const discoveredCards = new Set([...(input.storyCards ?? []), ...(input.cardDefIds ?? [])]);

  return STORY_CARD_CODEX.map((entry) => ({
    ...entry,
    discovered: discoveredCards.has(entry.defId),
  }));
}

function countRememberedResourceFamilies(cardDefIds: ReadonlySet<string>): number {
  let count = 0;

  for (const familyDefIds of Object.values(RESOURCE_FAMILIES)) {
    if (familyDefIds.some((defId) => cardDefIds.has(defId))) {
      count += 1;
    }
  }

  return count;
}

function addFlag(
  flag: string,
  flags: Set<string>,
  existingFlags: ReadonlySet<string>,
  newFlags: string[]
): boolean {
  if (existingFlags.has(flag)) {
    return false;
  }

  flags.add(flag);
  newFlags.push(flag);
  return true;
}

function addStoryCard(
  defId: string,
  ownedCards: Set<string>,
  storyCards: Set<string>,
  newCards: string[]
): void {
  if (ownedCards.has(defId)) {
    return;
  }

  ownedCards.add(defId);
  storyCards.add(defId);
  newCards.push(defId);
}
