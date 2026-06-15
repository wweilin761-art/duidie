import test from 'node:test';
import assert from 'node:assert/strict';
import { CardCategory, type SerializedGameState } from '../../src/protocol/messages';
import { CARD_DEFS } from '../../webview-ui/src/data/cards';
import { RECIPES, findMatchingRecipes } from '../../webview-ui/src/data/recipes';
import { GameState } from '../../webview-ui/src/state/GameState';
import { summarizeResources } from '../../webview-ui/src/engine/ResourceSystem';
import { resolveStoryMilestones } from '../../webview-ui/src/engine/StorySystem';
import { applyCombatRound, previewCombat } from '../../webview-ui/src/engine/BattleSystem';
import { tickProduction } from '../../webview-ui/src/engine/ProductionSystem';
import { evaluateProgression, evaluateResearch, TECH_NODES } from '../../webview-ui/src/engine/ProgressionSystem';

test('summarizeResources counts food, population, coins, and stack limit bonuses', () => {
  const result = summarizeResources({
    cards: [
      { uid: 'w1', defId: 'wood', position: { x: 0, y: 0 }, stackCount: 2, locked: false },
      { uid: 'b1', defId: 'berry', position: { x: 0, y: 0 }, stackCount: 3, locked: false },
      { uid: 'v1', defId: 'villager', position: { x: 0, y: 0 }, stackCount: 1, locked: false },
    ],
    coins: 7,
    unlockedTechs: ['storage_sheds'],
  });

  assert.equal(result.wood, 2);
  assert.equal(result.food, 3);
  assert.equal(result.population, 1);
  assert.equal(result.coins, 7);
  assert.equal(result.stackLimitBonus, 5);
});

test('story milestones create memory fragment from five resource families', () => {
  const result = resolveStoryMilestones({
    storyFlags: [],
    storyCards: [],
    cardDefIds: ['wood', 'stone', 'berry', 'gold', 'villager', 'camp'],
  });

  assert.deepEqual(result.newCards, ['memory_fragment']);
  assert.ok(result.flags.includes('five_resources_remembered'));
  assert.match(result.dialogue[0].text, /雾/);
});

test('story milestones create stone tablet and dawn card', () => {
  const tablet = resolveStoryMilestones({
    storyFlags: ['five_resources_remembered'],
    storyCards: ['memory_fragment'],
    cardDefIds: ['memory_fragment', 'camp'],
  });

  assert.ok(tablet.flags.includes('stone_tablet_revealed'));
  assert.deepEqual(tablet.newCards, ['stone_tablet']);

  const dawn = resolveStoryMilestones({
    storyFlags: ['five_resources_remembered', 'stone_tablet_revealed', 'act_two_unlocked'],
    storyCards: ['memory_fragment', 'stone_tablet', 'sun_card', 'moon_card', 'star_chart'],
    cardDefIds: ['sun_card', 'moon_card', 'star_chart'],
  });

  assert.ok(dawn.flags.includes('dawn_ready'));
  assert.deepEqual(dawn.newCards, ['dawn_card']);
});

test('battle preview reports damage and death risk', () => {
  const preview = previewCombat({
    attackerDefId: 'villager',
    defenderDefId: 'goblin',
    attackerHealth: 100,
    defenderHealth: 20,
    weaponDefIds: ['sword'],
  });

  assert.equal(preview.expectedDamage, 18);
  assert.equal(preview.defenderWillDie, false);
  assert.equal(preview.attackerRisk, 'low');
});

test('combat rounds expose attacker damage and GameState can apply lethal retaliation', () => {
  const state = new GameState();
  const villager = state.createCard('villager', 0, 0);
  assert.ok(villager);
  assert.ok(villager.villagerState);
  villager.villagerState.hunger = 15;

  const result = applyCombatRound({
    attackerUid: villager.uid,
    attackerDefId: 'villager',
    defenderDefId: 'boss_troll',
    attackerHealth: villager.villagerState.hunger,
    defenderHealth: 80,
    defenderDamage: 20,
    battleCooldowns: {},
    cooldownSeconds: 8,
  });

  assert.equal(result.retaliationDamage, 20);
  assert.equal(result.attackerHealth, 0);
  assert.equal(result.attackerWillDie, true);
  assert.equal(result.battleCooldowns[villager.uid], 8);

  const damageResult = state.applyVillagerDamage(villager.uid, result.retaliationDamage);
  assert.deepEqual(damageResult, { remainingHealth: 0, died: true });
  assert.equal(state.findCard(villager.uid), undefined);
});

test('legacy fight recipes do not match enemy combat or output duplicate villagers', () => {
  const fightRecipes = RECIPES.filter((recipe) => recipe.id.startsWith('fight_'));

  assert.deepEqual(fightRecipes.map((recipe) => recipe.id), []);
  assert.equal(
    findMatchingRecipes(['villager', 'goblin'], [], new Set()).some(
      (recipe) => recipe.output.defId === 'villager'
    ),
    false
  );
});

test('advertised tech nodes have reachable research ideas', () => {
  for (const node of TECH_NODES) {
    const reachableIdeaId = node.researchCardIds.find((researchId) => {
      const def = CARD_DEFS[researchId];
      if (!def || def.category !== CardCategory.Idea) return false;

      return RECIPES.some((recipe) => (
        recipe.output.defId === researchId &&
        recipe.inputs.some((input) => input.defId === 'research_table' && !input.consumed)
      ));
    });

    assert.ok(reachableIdeaId, `${node.id} has no research_table recipe producing an advertised idea`);
    const research = evaluateResearch({ cardDefIds: [reachableIdeaId] });
    assert.ok(research.unlockedTechs.includes(node.id), `${reachableIdeaId} does not unlock ${node.id}`);
  }
});

test('production tick emits food only when farm sits on fertile land', () => {
  const result = tickProduction({
    elapsedGameSeconds: 30,
    cards: [
      { uid: 'farm1', defId: 'farm', position: { x: 100, y: 100 }, stackCount: 1, locked: false },
      { uid: 'land1', defId: 'fertile_land', position: { x: 105, y: 105 }, stackCount: 1, locked: false },
    ],
    productionTimers: {},
  });

  assert.deepEqual(result.spawnCards, [{ defId: 'berry', count: 1, sourceUid: 'farm1' }]);
});

test('progression evaluates dawn victory and population loss failure', () => {
  assert.equal(evaluateProgression({ cardDefIds: ['dawn_card'], population: 1, hasCamp: true }).status, 'victory');
  assert.equal(evaluateProgression({ cardDefIds: ['camp'], population: 0, hasCamp: true }).status, 'defeat');
  assert.equal(evaluateProgression({ cardDefIds: ['wood'], population: 1, hasCamp: false }).status, 'defeat');
});

test('game state serializes event hunger modifier and defaults legacy timing fields', () => {
  const state = new GameState();
  state.speedMultiplier = 3;
  state.paused = true;
  state.eventHungerModifier = 2;

  const serialized = state.toJSON();
  assert.equal(serialized.speedMultiplier, 3);
  assert.equal(serialized.paused, true);
  assert.equal(serialized.eventHungerModifier, 2);

  const legacyState = {
    cards: [],
    month: 2,
    day: 4,
    elapsedGameTime: 42,
    coins: 9,
    unlockedRecipes: [],
    version: '1.0.0',
  } as SerializedGameState;

  const restoredLegacy = new GameState();
  restoredLegacy.fromJSON(legacyState);
  assert.equal(restoredLegacy.speedMultiplier, 1);
  assert.equal(restoredLegacy.paused, false);
  assert.equal(restoredLegacy.eventHungerModifier, 1.0);

  const restoredCurrent = new GameState();
  restoredCurrent.fromJSON(serialized);
  assert.equal(restoredCurrent.speedMultiplier, 3);
  assert.equal(restoredCurrent.paused, true);
  assert.equal(restoredCurrent.eventHungerModifier, 2);
});
