import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeResources } from '../../webview-ui/src/engine/ResourceSystem';
import { resolveStoryMilestones } from '../../webview-ui/src/engine/StorySystem';
import { previewCombat } from '../../webview-ui/src/engine/BattleSystem';
import { tickProduction } from '../../webview-ui/src/engine/ProductionSystem';
import { evaluateProgression } from '../../webview-ui/src/engine/ProgressionSystem';

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
