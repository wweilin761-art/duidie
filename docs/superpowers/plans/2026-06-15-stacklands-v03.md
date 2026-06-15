# Stacklands v0.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a playable VS Code webview game slice with complete core stack interactions, season/event expansion, a full "Silent Fog" main story, better UI, local persistence, and verifiable build/test tooling.

**Architecture:** Keep the existing VS Code extension + DOM webview architecture. Add pure TypeScript game systems for progression, story, battle preview, production ticks, and resource summaries so Node-based tests can verify core behavior without a browser. UI components remain DOM-based and are wired through `webview-ui/src/main.ts` after the data and logic systems are in place.

**Tech Stack:** TypeScript, VS Code Webview API, DOM/CSS rendering, esbuild bundling, Node built-in test runner, ESLint flat config.

---

## File Structure

- `.gitignore` ignores local `.codegraph/` indexes.
- `package.json` and `package-lock.json` define `test`, working `lint`, updated esbuild, and ESLint dependencies.
- `eslint.config.mjs` contains flat ESLint rules for extension, webview, tests, and scripts.
- `scripts/run-tests.mjs` bundles TypeScript tests with esbuild and runs them with `node --test`.
- `tests/core/v03-systems.test.ts` verifies story progression, resource summaries, production, battle preview, and win/loss rules.
- `src/protocol/messages.ts` expands serialized game state with story, tech, production, battle cooldown, and game-over metadata.
- `webview-ui/src/state/GameState.ts` owns the expanded state and serialization defaults.
- `webview-ui/src/engine/ResourceSystem.ts` summarizes wood, stone, food, coins, population, and stack limits.
- `webview-ui/src/engine/ProductionSystem.ts` produces resources from production buildings placed on valid land cards.
- `webview-ui/src/engine/BattleSystem.ts` computes combat preview and applies cooldown-based attacks.
- `webview-ui/src/engine/ProgressionSystem.ts` tracks research, tech unlocks, memory fragment creation, victory, and failure.
- `webview-ui/src/engine/StorySystem.ts` stores Silent Fog chapters, dialogue beats, story card collection, and next objectives.
- `webview-ui/src/data/cards.ts` adds camp, land, research, tech, memory, origin, sun/moon/star/dawn, event, NPC, and wonder cards.
- `webview-ui/src/data/recipes.ts` adds research, story, production-building, exploration-party, and dawn victory recipes.
- `webview-ui/src/data/technology.ts` defines card-codex tech nodes and stack-limit upgrades.
- `webview-ui/src/ui/ResourceBar.ts` renders the bottom resource bar.
- `webview-ui/src/ui/TechBook.ts` renders the card-style tech tree.
- `webview-ui/src/ui/TutorialBook.ts` renders tutorial and FAQ entries.
- `webview-ui/src/ui/StoryDialog.ts` renders story/NPC dialogue.
- `webview-ui/src/ui/CardInspector.ts` adds participating recipe hints and richer current attributes.
- `webview-ui/src/ui/Toolbar.ts` adds tutorial/settings/tech controls and clearer season/day text.
- `webview-ui/src/engine/Board.ts`, `DragSystem.ts`, and `CardEntity.ts` handle split-stack dragging, layout zones, improved badges, and combat feedback classes.
- `webview-ui/src/engine/GameLoop.ts` ticks production, event cards, battle cooldowns, story/progression checks, and game-over state.
- `webview-ui/src/main.ts` wires all new systems and UI together.
- `webview-ui/styles/main.css`, `board.css`, `card.css`, and `overlays.css` implement the new left-hand hand area, right map area, bottom resource bar, paper-card visuals, story overlays, event cards, combat preview, and feedback animations.

---

## Task DAG

### Task T1: Tooling and Test Harness

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `eslint.config.mjs`
- Create: `scripts/run-tests.mjs`
- Create: `tests/core/v03-systems.test.ts`

- [ ] **Step 1: Add tests before implementation**

Create `tests/core/v03-systems.test.ts` with tests that import planned pure systems and assert:

```ts
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

test('story milestones create memory fragment and reveal the sun objective', () => {
  const result = resolveStoryMilestones({
    storyFlags: [],
    storyCards: [],
    cardDefIds: ['wood', 'stone', 'berry', 'gold', 'villager', 'camp'],
  });
  assert.deepEqual(result.newCards, ['memory_fragment']);
  assert.ok(result.flags.includes('five_resources_remembered'));
  assert.match(result.dialogue[0].text, /雾/);
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
```

- [ ] **Step 2: Verify RED**

Run: `npm run test`

Expected: fail because `ResourceSystem`, `StorySystem`, `BattleSystem`, `ProductionSystem`, and `ProgressionSystem` do not exist yet.

- [ ] **Step 3: Add the test runner and lint config**

`scripts/run-tests.mjs` bundles `tests/core/v03-systems.test.ts` with esbuild to `/tmp/stacklands-v03-tests.mjs`, then executes `node --test /tmp/stacklands-v03-tests.mjs`.

`eslint.config.mjs` uses `@eslint/js`, `typescript-eslint`, and Node/browser globals. It ignores `dist/`, `webview-ui/dist/`, `node_modules/`, and `.codegraph/`.

Update scripts:

```json
{
  "test": "node scripts/run-tests.mjs",
  "lint": "eslint src webview-ui/src tests scripts --ext .ts,.js,.mjs"
}
```

- [ ] **Step 4: Upgrade dependencies**

Install dev dependencies:

```bash
npm install --save-dev esbuild@^0.28.1 eslint @eslint/js typescript-eslint globals
```

- [ ] **Step 5: Verify GREEN later**

After Tasks T2-T4 land, run `npm run test`, `npm run lint`, `npm run compile`, `npm run bundle-webview`, and `npm audit --audit-level=high`.

**Done When:** `npm run test` runs the new tests, lint script is available, compile and bundle still work, and audit no longer reports the esbuild high vulnerability.

---

### Task T2: Pure Gameplay Systems

**Files:**
- Create: `webview-ui/src/engine/ResourceSystem.ts`
- Create: `webview-ui/src/engine/ProductionSystem.ts`
- Create: `webview-ui/src/engine/BattleSystem.ts`
- Create: `webview-ui/src/engine/ProgressionSystem.ts`
- Create: `webview-ui/src/engine/StorySystem.ts`
- Modify: `src/protocol/messages.ts`
- Modify: `webview-ui/src/state/GameState.ts`

- [ ] **Step 1: Implement `ResourceSystem.ts`**

Export `summarizeResources(input)` that counts:

- `wood`: `wood` stack counts.
- `stone`: `stone` stack counts.
- `food`: `berry`, `apple`, `cooked_meat`, `bread`, `cheese`, `milk`, `fish`, `wheat`.
- `coins`: input `coins`.
- `population`: `villager`, `builder`, `farmer`, `hunter`, `warrior`.
- `stackLimitBonus`: `5` when `storage_sheds` is unlocked, otherwise `0`.

- [ ] **Step 2: Implement `BattleSystem.ts`**

Export `previewCombat(input)` and `applyCombatRound(input)`. Use base damage:

- `villager`: 8
- `builder`: 7
- `farmer`: 6
- `hunter`: 10
- `warrior`: 14

Weapon bonuses:

- `sword`: +10
- `iron_sword`: +18
- `bow`: +12
- `spear`: +9
- `shield`: reduces risk one level.

Risk is `low`, `medium`, or `fatal` based on expected retaliation versus attacker health.

- [ ] **Step 3: Implement `ProductionSystem.ts`**

Export `tickProduction(input)` that advances per-building timers. Farms on `fertile_land` produce `berry`; lumber camps on `forest_land` produce `wood`; quarries on `rocky_land` produce `stone`. Production interval is 30 game seconds, reduced to 22 when `efficient_tools` is unlocked.

- [ ] **Step 4: Implement `StorySystem.ts`**

Export `STORY_CHAPTERS`, `resolveStoryMilestones(input)`, and `getStoryCardCodex(input)`. Implement the main line:

1. Starting camp objective.
2. Five different resource families create `memory_fragment`.
3. `memory_fragment + camp` unlocks `stone_tablet`.
4. `sun_card` unlocks act two.
5. `sun_card + moon_card + star_chart` creates `dawn_card`.

- [ ] **Step 5: Implement `ProgressionSystem.ts`**

Export `TECH_NODES`, `evaluateResearch(input)`, and `evaluateProgression(input)`. Include tech nodes:

- `storage_sheds`: unlocks +5 stack cap bonus.
- `field_lore`: unlocks `farm`, `fertile_land` production.
- `war_drums`: unlocks `warrior` and combat preview.
- `mist_cartography`: unlocks story exploration recipes.

Victory is `dawn_card`; defeat is population zero or missing `camp`.

- [ ] **Step 6: Extend serialized state**

Add optional fields to `SerializedGameState`: `unlockedTechs`, `storyFlags`, `storyCards`, `productionTimers`, `battleCooldowns`, `gameStatus`, `lastStoryDialogId`.

Add defaults in `GameState`, include them in `reset`, `toJSON`, and `fromJSON`.

- [ ] **Step 7: Run tests**

Run: `npm run test`

Expected after T1 and T2: all tests in `tests/core/v03-systems.test.ts` pass.

**Done When:** pure systems are covered by Node tests and GameState serializes/restores the new state fields.

---

### Task T3: Card, Recipe, Tech, and Story Data

**Files:**
- Modify: `webview-ui/src/data/cards.ts`
- Modify: `webview-ui/src/data/recipes.ts`
- Create: `webview-ui/src/data/technology.ts`
- Create: `webview-ui/src/data/story.ts`

- [ ] **Step 1: Add required card definitions**

Add these cards with Chinese names, descriptions, icons, categories, and appropriate tiers:

- `camp`, `fertile_land`, `forest_land`, `rocky_land`
- `lumber_camp`, `quarry`, `research_table`, `warrior`
- `memory_fragment`, `stone_tablet`, `sun_card`, `moon_card`, `star_chart`, `dawn_card`
- `event_question`, `old_sage`, `travelling_merchant`, `exploration_party`

- [ ] **Step 2: Add story and research recipes**

Add recipes:

- `build_camp`: `wood + stone -> camp`
- `build_research_table`: `plank + stone -> research_table`
- `research_storage`: `research_table + wood + stone -> idea_storage`
- `build_lumber_camp`: `wood x2 + plank + forest_land -> lumber_camp`
- `build_quarry`: `stone x2 + plank + rocky_land -> quarry`
- `build_exploration_party`: `villager x3 + berry x3 -> exploration_party`
- `read_memory_fragment`: `memory_fragment + camp -> stone_tablet`
- `find_sun_card`: `exploration_party + forest_land -> sun_card`
- `chart_moon`: `sun_card + old_sage -> moon_card`
- `chart_stars`: `moon_card + stone_tablet -> star_chart`
- `craft_dawn`: `sun_card + moon_card + star_chart -> dawn_card`

- [ ] **Step 3: Export tech/story data**

`technology.ts` exports the same node ids used by `ProgressionSystem`.

`story.ts` exports dialogue snippets with ids matching `StorySystem` milestones.

**Done When:** all new ids used by systems and UI resolve through `getCardDef` and recipe matching.

---

### Task T4: UI Components and Visual Style

**Files:**
- Create: `webview-ui/src/ui/ResourceBar.ts`
- Create: `webview-ui/src/ui/TechBook.ts`
- Create: `webview-ui/src/ui/TutorialBook.ts`
- Create: `webview-ui/src/ui/StoryDialog.ts`
- Modify: `webview-ui/src/ui/CardInspector.ts`
- Modify: `webview-ui/src/ui/Toolbar.ts`
- Modify: `webview-ui/styles/main.css`
- Modify: `webview-ui/styles/board.css`
- Modify: `webview-ui/styles/card.css`
- Modify: `webview-ui/styles/overlays.css`

- [ ] **Step 1: Add bottom resource bar**

`ResourceBar.update(summary)` displays wood, stone, food, coins, population, stack limit bonus, game status.

- [ ] **Step 2: Add tech book**

`TechBook.toggle(unlockedTechs)` renders locked/unlocked card-like nodes and uses clear visual distinction for unknown nodes.

- [ ] **Step 3: Add tutorial book**

`TutorialBook.toggle()` renders FAQ and recipe hints: drag cards, Shift-drag split stacks, research, story objective, combat preview, save/load.

- [ ] **Step 4: Add story dialog**

`StoryDialog.show(dialogue)` displays speaker, text, and optional portrait/icon, then records dismissal through callback.

- [ ] **Step 5: Improve inspector**

Show hover/click attributes: enemy health/damage, villager hunger, production hint, story card role, and recipes involving the selected card.

- [ ] **Step 6: Update visual style**

CSS implements paper card texture, worn edges, rarity glows, large rounded stack badge, combat shake, resource-not-enough shake, `+1` floating text, left hand shelf, right map area, bottom resource bar, and tutorial/story overlays.

**Done When:** UI components compile and expose simple `show/hide/toggle/update` methods for `main.ts` integration.

---

### Task T5: Interaction, Loop, and VS Code Webview Integration

**Files:**
- Modify: `webview-ui/src/engine/Board.ts`
- Modify: `webview-ui/src/engine/DragSystem.ts`
- Modify: `webview-ui/src/engine/CardEntity.ts`
- Modify: `webview-ui/src/engine/EventManager.ts`
- Modify: `webview-ui/src/engine/GameLoop.ts`
- Modify: `webview-ui/src/main.ts`
- Modify: `src/managers/MessageHandler.ts`

- [ ] **Step 1: Split stack dragging**

Shift-dragging a stack card splits the top card from its stack group and drags only that card. Normal drag keeps moving the whole stack group.

- [ ] **Step 2: Combat preview and cooldown attacks**

When a villager/warrior/tool combination is dropped on an enemy, show preview feedback before applying the existing timed fight recipe. If cooldown is active, shake the attacker and show a warning toast.

- [ ] **Step 3: Random event cards**

Spawn `event_question` at the map edge on a timed interval. Dropping a villager on it flips it into one weighted event from existing `EVENT_TEMPLATES`, spawning cards or NPCs.

- [ ] **Step 4: Production and progression loop**

`GameLoop` calls `tickProduction`, `evaluateProgression`, and `resolveStoryMilestones`; spawned cards are added to the board; story dialog opens at new milestones; game-over freezes time.

- [ ] **Step 5: UI wiring**

`main.ts` instantiates `ResourceBar`, `TechBook`, `TutorialBook`, `StoryDialog`, pure systems, and new toolbar callbacks. Save/autosave includes new state fields through existing `GameState.toJSON()`.

- [ ] **Step 6: Starting layout**

New game starts with `camp`, 2 villagers, wood, stone, berry, tree, rock, berry bush, and land cards laid out so the tutorial objective is visible.

**Done When:** VS Code webview can start a new game, play through core story milestones, save/load state, and show the new UI without console errors.

---

### Task T6: Final Verification and Review

**Files:**
- No planned production writes unless review fixes require them.

- [ ] **Step 1: Run verification**

Run:

```bash
npm run test
npm run lint
npm run compile
npm run bundle-webview
npm audit --audit-level=high
```

- [ ] **Step 2: Update `TEST_PLAN.md`**

Mark implemented v0.3 items with concise status notes: split stack, tooltip/inspector, production, combat preview, research, win/loss, season/events, story, UI, save/load.

- [ ] **Step 3: Final integration review**

Review full diff from base `d03601e01d52ec000e06dd03530712c6e2366dd1` to current HEAD/worktree. Block on Critical or Important issues. Record Minor issues in the final report.

**Done When:** all verification commands pass or any unavoidable blocker is reported with exact command output and file references.

---

## Execution Plan

- Wave 1 (parallel): T1 tooling/test harness, T2 pure gameplay system skeleton exploration.
- Wave 2 (parallel): T3 data expansion, T4 UI components.
- Wave 3 (serial): T5 interaction and `main.ts` integration.
- Wave 4 (serial): T6 final verification and review.

## Review Plan

- Incremental review after each task diff: spec compliance first, then code quality.
- Final integration review after T6 verification, focusing on cross-system consistency, save/load compatibility, UI wiring, and test coverage.

## Self-Review

- Coverage: Every user requirement maps to T2-T6, with two new gameplay directions selected as season/day plus random event cards. Existing season support is retained and displayed; random event cards are newly integrated.
- Placeholders: No task contains TBD/TODO/fill-in wording.
- Type consistency: State fields are named consistently across protocol, GameState, systems, and UI.
