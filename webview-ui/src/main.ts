/**
 * main.ts — webview entry point (IIFE).
 * Bootstraps all game systems and wires them together.
 */
import {
  startListening,
  onMessage,
  requestSave,
  requestLoad,
  autoSave,
  requestSettings,
  clearSaves,
} from './bridge/VscodeBridge';
import { GameState } from './state/GameState';
import { TimeManager } from './engine/TimeManager';
import { Board } from './engine/Board';
import { CardEntity } from './engine/CardEntity';
import { RecipeEngine } from './engine/RecipeEngine';
import { DragSystem } from './engine/DragSystem';
import { ParticleEffect } from './engine/ParticleEffect';
import { EventManager } from './engine/EventManager';
import { ShopManager } from './engine/ShopManager';
import { GameLoop } from './engine/GameLoop';
import { Toolbar } from './ui/Toolbar';
import type { ToolbarCallbacks } from './ui/Toolbar';
import { CardInspector } from './ui/CardInspector';
import { ShopModal } from './ui/ShopModal';
import type { ShopModalCallbacks } from './ui/ShopModal';
import { ToastRenderer } from './ui/ToastRenderer';
import { RecipeBook } from './ui/RecipeBook';
import { getCardDef } from './data/cards';
import { ResourceBar } from './ui/ResourceBar';
import { TechBook } from './ui/TechBook';
import { TutorialBook } from './ui/TutorialBook';
import { StoryDialog } from './ui/StoryDialog';
import { summarizeResources } from './engine/ResourceSystem';
import { sound } from './engine/SoundSystem';
import { previewCombat, applyCombatRound } from './engine/BattleSystem';
import { getStoryDialogue } from './data/story';
import { TECH_NODES as DATA_TECH_NODES } from './data/technology';
import type { SerializedGameState } from '../../src/protocol/messages';
import type { ShopPack } from './data/shop';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STARTER_CARD_IDS = [
  'camp',
  'villager',
  'villager',
  'wood',
  'stone',
  'berry',
  'tree',
  'rock',
  'berry_bush',
  'fertile_land',
  'forest_land',
  'rocky_land',
];

const COMBAT_ATTACKER_DEF_IDS = new Set([
  'villager',
  'builder',
  'farmer',
  'hunter',
  'warrior',
]);

const COMBAT_TOOL_DEF_IDS = new Set([
  'sword',
  'iron_sword',
  'bow',
  'spear',
  'shield',
  'axe',
  'pickaxe',
  'torch',
  'leather_armor',
]);

const COMBAT_TOOL_RADIUS = 90;
const COMBAT_COOLDOWN_SECONDS = 8;

interface CombatDropContext {
  attacker: CardEntity;
  defender: CardEntity;
  weaponDefIds: string[];
}

function arrangeStarterCards(
  defIds: string[],
  gameState: GameState,
  board: Board,
): void {
  const positions = [
    { x: 18, y: 12 },
    { x: 106, y: 12 },
    { x: 194, y: 12 },
    { x: 18, y: 126 },
    { x: 106, y: 126 },
    { x: 194, y: 126 },
    { x: 18, y: 240 },
    { x: 106, y: 240 },
    { x: 194, y: 240 },
    { x: 18, y: 354 },
    { x: 106, y: 354 },
    { x: 194, y: 354 },
  ];

  for (let i = 0; i < Math.min(defIds.length, positions.length); i++) {
    const pos = positions[i];
    const card = gameState.createCard(defIds[i], pos.x, pos.y);
    if (card) board.addEntity(new CardEntity(card));
  }
}

function restoreBoard(
  state: SerializedGameState,
  gameState: GameState,
  board: Board,
  timeManager: TimeManager,
  recipeEngine: RecipeEngine,
): void {
  board.clear();
  gameState.fromJSON(state);
  // Reset recipe engine then restore any in-progress timed recipes from save
  recipeEngine.reset();
  if (state.recipesData) {
    recipeEngine.restoreActiveRecipes(state.recipesData);
  }
  timeManager.elapsedGameTime = gameState.elapsedGameTime;
  timeManager.speedMultiplier = gameState.speedMultiplier;
  timeManager.paused = gameState.paused;

  for (const cardData of gameState.cards) {
    board.addEntity(new CardEntity(cardData));
  }

  // Restore stack groups after all entities are added
  if (state.stackGroups) {
    board.restoreStackGroups(state.stackGroups);
  }
}

function spawnCardBatch(
  cards: { defId: string; count: number }[],
  centreX: number,
  centreY: number,
  gameState: GameState,
  board: Board,
): void {
  const spread = 120;
  for (const entry of cards) {
    for (let i = 0; i < entry.count; i++) {
      const x = centreX + (Math.random() - 0.5) * spread;
      const y = centreY + (Math.random() - 0.5) * spread;
      const instance = gameState.createCard(entry.defId, x, y);
      if (instance) board.addEntity(new CardEntity(instance));
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(function main() {
  // Global diagnostics
  window.addEventListener('error', (e) => {
    const diag = document.getElementById('diag-loading');
    if (diag) { diag.textContent = '❌ ' + e.message; diag.style.background = '#a00'; }
  });

  try {
    const root = document.getElementById('game-root');
    if (!root) throw new Error('#game-root not found');

    startListening();

    // ---- Core state & engine ----
    const gameState = new GameState();
    const timeManager = new TimeManager();
    const board = new Board(root);

  // ---- UI (must exist before engines that use them) ----
  const toastRenderer = new ToastRenderer(root);
  const resourceBar = new ResourceBar(root);

  // ---- Logic engines ----
  const recipeEngine = new RecipeEngine(gameState, board);
  const eventManager = new EventManager(gameState, board, (msg) => toastRenderer.show(msg, 'info'));
  const shopManager = new ShopManager(gameState, board);

  // ---- Toolbar ----
  const toolbarCallbacks: ToolbarCallbacks = {
    onTogglePause: () => {
      if (gameState.gameStatus !== 'playing') {
        gameState.paused = true;
        timeManager.paused = true;
        toastRenderer.show('本局已经结束，请重置后开始新的营地。', 'warning');
        updateResourceBar();
        return;
      }
      gameState.paused = !gameState.paused;
      timeManager.paused = gameState.paused;
      updateResourceBar();
    },
    onSetSpeed: (speed: number) => {
      timeManager.speedMultiplier = speed;
      gameState.speedMultiplier = speed;
      updateResourceBar();
    },
    onSave: () => {
      requestSave(0, buildSaveState());
      toastRenderer.show('游戏已保存。', 'success');
      sound.click();
    },
    onLoad: () => {
      requestLoad(0);
    },
    onShop: () => {
      if (shopModal.isVisible()) {
        shopModal.hide();
      } else {
        const packs = shopManager.getAvailablePacks(eventManager.getEventShopPacks());
        shopModal.show(packs, gameState.coins);
      }
    },
    onRecipes: () => {
      recipeBook.toggle(gameState.unlockedRecipes);
    },
    onTech: () => {
      techBook.toggle(gameState.unlockedTechs);
    },
    onTutorial: () => {
      tutorialBook.toggle();
    },
  };
  const toolbar = new Toolbar(root, toolbarCallbacks);

  // ---- Card inspector ----
  const cardInspector = new CardInspector(root);

  // ---- Recipe book ----
  const recipeBook = new RecipeBook(root);

  // ---- V0.3 panels ----
  const techBook = new TechBook(
    root,
    DATA_TECH_NODES.map((node, index) => ({
      id: node.id,
      name: node.label,
      description: node.description,
      tier: index,
      unlocks: node.unlocks,
    })),
  );
  const tutorialBook = new TutorialBook(root);
  const storyDialog = new StoryDialog(root);

  // ---- Shop modal ----
  const shopCallbacks: ShopModalCallbacks = {
    onBuy: (pack: ShopPack) => {
      if (gameState.coins < pack.cost) {
        toastRenderer.show('金币不足！', 'warning');
        return;
      }
      gameState.coins -= pack.cost;
      spawnCardBatch(pack.cards, 500, 350, gameState, board);
      toastRenderer.show(`购买了${pack.name}！`, 'success');

      // Refresh shop modal with updated coins
      const packs = shopManager.getAvailablePacks(eventManager.getEventShopPacks());
      shopModal.show(packs, gameState.coins);
    },
    onSkip: () => {
      shopModal.hide();
      shopManager.markShopShown();
    },
  };
  const shopModal = new ShopModal(root, shopCallbacks);

  function buildSaveState(): SerializedGameState {
    const state = gameState.toJSON();
    state.recipesData = recipeEngine.getActiveRecipesData();
    state.stackGroups = board.getStackGroupsData();
    return state;
  }

  function updateResourceBar(): void {
    const summary = summarizeResources({
      cards: gameState.cards,
      coins: gameState.coins,
      unlockedTechs: gameState.unlockedTechs,
    });

    resourceBar.update({
      ...summary,
      paused: gameState.paused,
      status: getStatusText(),
    });
  }

  function getStatusText(): string {
    if (gameState.gameStatus === 'victory') return '胜利';
    if (gameState.gameStatus === 'defeat') return '失败';
    return gameState.paused ? '已暂停' : '运行中';
  }

  function showStoryDialogue(dialogueId: string): void {
    const snippet = getStoryDialogue(dialogueId);
    if (!snippet) return;

    storyDialog.show({
      id: snippet.id,
      speaker: snippet.speaker,
      text: snippet.text,
      icon: snippet.icon,
    });
  }

  function getCombatDropContext(
    draggedEntity: CardEntity,
    targetEntity: CardEntity,
  ): CombatDropContext | null {
    if (!targetEntity.data.enemyState) return null;
    if (!COMBAT_ATTACKER_DEF_IDS.has(draggedEntity.data.defId)) return null;

    return {
      attacker: draggedEntity,
      defender: targetEntity,
      weaponDefIds: getNearbyCombatToolDefIds(draggedEntity, targetEntity),
    };
  }

  function getNearbyCombatToolDefIds(
    attacker: CardEntity,
    defender: CardEntity,
  ): string[] {
    const midX = (attacker.data.position.x + defender.data.position.x) / 2;
    const midY = (attacker.data.position.y + defender.data.position.y) / 2;
    const nearbyCards = gameState.getCardsInRadius(midX, midY, COMBAT_TOOL_RADIUS);

    return nearbyCards
      .filter((card) => {
        if (card.uid === attacker.uid || card.uid === defender.uid || card.locked) {
          return false;
        }
        return COMBAT_TOOL_DEF_IDS.has(card.defId);
      })
      .map((card) => card.defId);
  }

  function warnCombatCooldown(context: CombatDropContext): void {
    const remaining = gameState.battleCooldowns[context.attacker.uid] ?? 0;
    context.attacker.playCombatShake();
    toastRenderer.show(
      `还需要 ${Math.ceil(remaining)} 秒才能再次攻击。`,
      'warning',
      2200,
    );
  }

  function showCombatPreviewToast(context: CombatDropContext): void {
    const preview = previewCombat({
      attackerDefId: context.attacker.data.defId,
      defenderDefId: context.defender.data.defId,
      attackerHealth: context.attacker.data.villagerState?.hunger ?? 100,
      defenderHealth: context.defender.data.enemyState?.health ?? 0,
      defenderDamage: context.defender.data.enemyState?.damage,
      weaponDefIds: context.weaponDefIds,
    });
    const attackerName = getCardDef(context.attacker.data.defId)?.name ?? '村民';
    const defenderName = getCardDef(context.defender.data.defId)?.name ?? '敌人';
    const resultText = preview.defenderWillDie ? '可击败' : '将进入战斗';

    toastRenderer.show(
      `${attackerName}攻击${defenderName}：预计 ${preview.expectedDamage} 伤害，风险${formatCombatRisk(preview.attackerRisk)}，${resultText}。`,
      preview.attackerRisk === 'fatal' ? 'warning' : 'info',
      3600,
    );
  }

  function applyCombatRoundToBoard(context: CombatDropContext): void {
    const result = applyCombatRound({
      attackerUid: context.attacker.uid,
      attackerDefId: context.attacker.data.defId,
      defenderDefId: context.defender.data.defId,
      attackerHealth: context.attacker.data.villagerState?.hunger ?? 100,
      defenderHealth: context.defender.data.enemyState?.health ?? 0,
      defenderDamage: context.defender.data.enemyState?.damage,
      weaponDefIds: context.weaponDefIds,
      battleCooldowns: gameState.battleCooldowns,
      cooldownSeconds: COMBAT_COOLDOWN_SECONDS,
    });

    gameState.battleCooldowns = result.battleCooldowns;

    if (result.retaliationDamage > 0) {
      const attackerDamage = gameState.applyVillagerDamage(
        context.attacker.uid,
        result.retaliationDamage,
      );

      if (attackerDamage?.died) {
        delete gameState.battleCooldowns[context.attacker.uid];
        ParticleEffect.destroy(
          board.viewportElement,
          context.attacker.data.position.x + 36,
          context.attacker.data.position.y + 48,
        );
        board.removeEntity(context.attacker.uid);
        toastRenderer.show('村民在反击中倒下了！', 'error');
      } else if (attackerDamage) {
        context.attacker.dirty = true;
        context.attacker.syncDOM();
      }
    }

    if (result.defenderWillDie) {
      ParticleEffect.destroy(
        board.viewportElement,
        context.defender.data.position.x + 36,
        context.defender.data.position.y + 48,
      );
      gameState.removeCard(context.defender.uid);
      board.removeEntity(context.defender.uid);
      toastRenderer.show('敌人被击败了！', 'success');
      return;
    }

    if (context.defender.data.enemyState) {
      context.defender.data.enemyState.health = result.defenderHealth;
      context.defender.dirty = true;
      context.defender.syncDOM();
    }

    toastRenderer.show(
      `命中敌人，剩余生命 ${result.defenderHealth}。`,
      result.attackerRisk === 'fatal' ? 'warning' : 'info',
    );
  }

  function executeDropRecipe(
    draggedEntity: CardEntity,
    targetEntity: CardEntity,
  ): boolean {
    const recipe = recipeEngine.execute(draggedEntity, targetEntity);
    if (!recipe) return false;

    const mx = (draggedEntity.data.position.x + targetEntity.data.position.x) / 2;
    const my = (draggedEntity.data.position.y + targetEntity.data.position.y) / 2;
    ParticleEffect.combine(board.viewportElement, mx, my);
    sound.combine();
    return true;
  }

  function formatCombatRisk(risk: 'low' | 'medium' | 'fatal'): string {
    if (risk === 'fatal') return '致命';
    if (risk === 'medium') return '中等';
    return '较低';
  }

  // ---- Game loop ----
  const gameLoop = new GameLoop(
    timeManager,
    gameState,
    board,
    recipeEngine,
    eventManager,
    shopManager,
    toolbar,
    toastRenderer,
    cardInspector,
    () => {
      autoSave(buildSaveState());
    },
    // onShopReady — auto-open shop modal when month advances
    () => {
      const packs = shopManager.getAvailablePacks(eventManager.getEventShopPacks());
      shopModal.show(packs, gameState.coins);
    },
    showStoryDialogue,
    () => {
      updateResourceBar();
    },
  );

  // ---- Drag system ----
  const dragSystem = new DragSystem(
    board,
    // onDrop
    (draggedUid: string, targetUid: string) => {
      const draggedEntity = board.getEntity(draggedUid);
      const targetEntity = board.getEntity(targetUid);
      if (!draggedEntity || !targetEntity) return;

      // Same defId + stackable → first check for recipe, then merge stacks
      const draggedDef = getCardDef(draggedEntity.data.defId);
      const targetDef = getCardDef(targetEntity.data.defId);

      if (eventManager.revealQuestionCard(draggedUid, targetUid)) {
        updateResourceBar();
        return;
      }

      const combatContext = getCombatDropContext(draggedEntity, targetEntity);
      if (combatContext) {
        const cooldown = gameState.battleCooldowns[combatContext.attacker.uid] ?? 0;
        if (cooldown > 0) {
          warnCombatCooldown(combatContext);
          return;
        }
        showCombatPreviewToast(combatContext);
        applyCombatRoundToBoard(combatContext);
        return;
      }

      if (
        draggedEntity.data.defId === targetEntity.data.defId &&
        draggedDef?.stackable &&
        targetDef?.stackable &&
        draggedUid !== targetUid
      ) {
        // Check if there's a recipe for this combination (e.g., wood+wood→plank)
        // Recipe takes priority over stack merging
        if (executeDropRecipe(draggedEntity, targetEntity)) return; // Recipe executed, skip stack merge

        const maxStack = draggedDef.maxStack;
        const draggedGroupSize = board.getStackGroupSize(draggedUid);
        const targetGroupSize = board.getStackGroupSize(targetUid);

        if (
          draggedEntity.stackGroupId &&
          targetEntity.stackGroupId &&
          draggedEntity.stackGroupId === targetEntity.stackGroupId
        ) {
          return;
        }

        const totalSize = draggedGroupSize + targetGroupSize;

        if (totalSize <= maxStack) {
          if (draggedEntity.stackGroupId && targetEntity.stackGroupId) {
            board.mergeStackGroups(draggedEntity.stackGroupId, targetEntity.stackGroupId);
          } else if (draggedEntity.stackGroupId) {
            board.addToStackGroup(draggedEntity.stackGroupId, targetUid);
          } else if (targetEntity.stackGroupId) {
            board.addToStackGroup(targetEntity.stackGroupId, draggedUid);
          } else {
            board.createStackGroup(draggedUid, targetUid);
          }
          targetEntity.playCombineAnimation();
          return;
        } else {
          // Would exceed maxStack — fill up to max, keep remainder
          const space = maxStack - targetGroupSize;
          if (space > 0) {
            // Move only `space` cards from the dragged group to the target group
            const draggedUids = board.getStackGroupUids(draggedUid);
            const toMove = draggedUids.slice(-space); // Take from the top (end) of dragged group
            for (const uid of toMove) {
              if (targetEntity.stackGroupId) {
                board.addToStackGroup(targetEntity.stackGroupId, uid);
              } else {
                // Target is single; create a group first
                const groupId = board.createStackGroup(targetUid, uid);
                // If there are more to move, add them to the same group
                if (groupId) {
                  targetEntity.stackGroupId = groupId;
                }
              }
            }
            targetEntity.playCombineAnimation();
          }
          return;
        }
      }

      // Otherwise try recipe
      executeDropRecipe(draggedEntity, targetEntity);
    },
    // onSell
    (cardUid: string) => {
      const card = gameState.findCard(cardUid);
      if (!card) return;
      const def = getCardDef(card.defId);
      if (!def) return;
      sound.sell();

      // Sell ALL cards in the stack group (or just one if not stacked)
      const uidsToSell = board.getStackGroupUids(cardUid);
      const effectiveCount = uidsToSell.length;

      // Calculate total position for particle effect (midpoint of all cards)
      let sumX = 0, sumY = 0;
      for (const uid of uidsToSell) {
        const c = gameState.findCard(uid);
        if (c) { sumX += c.position.x; sumY += c.position.y; }
      }
      const avgX = effectiveCount > 0 ? sumX / effectiveCount : card.position.x;
      const avgY = effectiveCount > 0 ? sumY / effectiveCount : card.position.y;

      // Particle burst at average position
      ParticleEffect.sell(
        board.viewportElement,
        avgX + 40,
        avgY + 50,
      );

      const value = def.sellValue * effectiveCount;
      gameState.coins += value;

      // Remove all cards in the stack group from game state and board
      for (const uid of uidsToSell) {
        gameState.removeCard(uid);
        board.removeEntity(uid);
      }

      toastRenderer.show(
        `出售了${def.name}${effectiveCount > 1 ? ' x' + effectiveCount : ''}，获得 ${value} 金币。`,
        'success',
      );
    },
  );
  dragSystem.attach();
  const resourceBarTimer = window.setInterval(updateResourceBar, 500);

  // ---- Board click → card inspector ----
  board.rootElement.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const cardEl = target.closest('.card') as HTMLElement | null;
    if (cardEl) {
      const uid = cardEl.getAttribute('data-uid');
      if (uid) {
        const entity = board.getEntity(uid);
        if (entity) {
          const effectiveCount = entity.isInStack() ? board.getStackGroupSize(uid) : entity.data.stackCount;
          cardInspector.show(entity.data, effectiveCount);
          return;
        }
      }
    }
    cardInspector.hide();
  });

  // ---- Board pan & zoom ----
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panBoardX = 0;
  let panBoardY = 0;

  board.rootElement.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      const pan = board.getPan();
      panBoardX = pan.x;
      panBoardY = pan.y;
      board.rootElement.style.cursor = 'grabbing';
    }
  });

  window.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isPanning) return;
    board.setPan(panBoardX + e.clientX - panStartX, panBoardY + e.clientY - panStartY);
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      board.rootElement.style.cursor = '';
    }
  });

  board.rootElement.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault();
    board.setScale(board.getScale() + (e.deltaY < 0 ? 0.1 : -0.1));
  });

  // ---- Extension message handling + game initialization ----
  let gameStarted = false;

  function startNewGame(): void {
    if (gameStarted) return;
    gameStarted = true;
    arrangeStarterCards(STARTER_CARD_IDS, gameState, board);
    showStoryDialogue('starting_camp');
    updateResourceBar();
    gameLoop.start();
  }

  onMessage((msg) => {
    switch (msg.type) {
      case 'loadResponse': {
        // Only load saves on explicit user request (via toolbar Load button)
        if (msg.state) {
          // Stop the game loop first to prevent race conditions
          // between frame processing and board rebuilding
          gameLoop.stop();
          restoreBoard(msg.state, gameState, board, timeManager, recipeEngine);
          gameLoop.start();
          gameStarted = true;
          updateResourceBar();
          toastRenderer.show('游戏已加载！', 'success');
        }
        break;
      }
      case 'saveResponse': {
        if (!msg.success) {
          toastRenderer.show(`保存失败：${msg.error ?? '未知错误'}`, 'error');
        }
        break;
      }
      case 'settingsUpdate': {
        break;
      }
      case 'themeChanged': {
        document.documentElement.setAttribute('data-theme', msg.theme);
        break;
      }
      case 'resetGame': {
        gameState.reset();
        board.clear();
        recipeEngine.reset();
        eventManager.reset();
        shopManager.reset();
        timeManager.reset();
        gameStarted = false;
        clearSaves();
        startNewGame();
        updateResourceBar();
        toastRenderer.show('游戏已重置！', 'info');
        break;
      }
    }
  });

  // Always start fresh game immediately
  startNewGame();
  setTimeout(() => requestSettings(), 100);

  // Cleanup
  window.addEventListener('beforeunload', () => {
    gameLoop.stop();
    dragSystem.detach();
    window.clearInterval(resourceBarTimer);
  });

  } catch (e: any) {
    const diag = document.getElementById('diag-loading');
    if (diag) { diag.textContent = '❌ 错误: ' + (e?.message || String(e)); diag.style.background = '#a00'; }
    const root = document.getElementById('game-root');
    if (root) {
      const err = document.createElement('div');
      err.style.cssText = 'position:fixed;top:30px;left:0;right:0;z-index:9999;background:#600;color:#fff;padding:10px;font-size:12px;white-space:pre-wrap;';
      err.textContent = '错误: ' + (e?.stack || e?.message || String(e));
      root.appendChild(err);
    }
    console.error('[Stacklands]', e);
  }
})();
