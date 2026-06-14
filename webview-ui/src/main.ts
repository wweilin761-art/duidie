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
import { ToastRenderer, ToastType } from './ui/ToastRenderer';
import { RecipeBook } from './ui/RecipeBook';
import { getStarterCards, getCardDef } from './data/cards';
import type { SerializedGameState } from '../../src/protocol/messages';
import type { ShopPack } from './data/shop';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function arrangeStarterCards(
  defIds: string[],
  gameState: GameState,
  board: Board,
): void {
  const positions = [
    { x: 20, y: 10 },    // 👤 村民 — 左上最显眼位置
    { x: 110, y: 10 },   // 🐱 猫
    { x: 200, y: 10 },   // 🪴 浆果丛
    { x: 20, y: 130 },   // 🌳 树木
    { x: 110, y: 130 },  // 🪨 岩石
    { x: 200, y: 130 },  // 🪵 木材1
    { x: 20, y: 250 },   // 🪵 木材2
    { x: 110, y: 250 },  // 🪨 石头
    { x: 200, y: 250 },  // 🫐 浆果1
    { x: 20, y: 370 },   // 🫐 浆果2
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
  timeManager.elapsedGameTime = state.elapsedGameTime;
  timeManager.speedMultiplier = state.speedMultiplier;
  timeManager.paused = state.paused;

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

  // ---- Logic engines ----
  const recipeEngine = new RecipeEngine(gameState, board);
  const eventManager = new EventManager(gameState, board, (msg) => toastRenderer.show(msg, 'info'));
  const shopManager = new ShopManager(gameState, board);

  // ---- Toolbar ----
  const toolbarCallbacks: ToolbarCallbacks = {
    onTogglePause: () => {
      gameState.paused = !gameState.paused;
      timeManager.paused = gameState.paused;
    },
    onSetSpeed: (speed: number) => {
      timeManager.speedMultiplier = speed;
      gameState.speedMultiplier = speed;
    },
    onSave: () => {
      const state = gameState.toJSON();
      state.recipesData = recipeEngine.getActiveRecipesData();
      state.stackGroups = board.getStackGroupsData();
      requestSave(0, state);
      toastRenderer.show('游戏已保存。', 'success');
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
  };
  const toolbar = new Toolbar(root, toolbarCallbacks);

  // ---- Card inspector ----
  const cardInspector = new CardInspector(root);

  // ---- Recipe book ----
  const recipeBook = new RecipeBook(root);

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
      const state = gameState.toJSON();
      state.recipesData = recipeEngine.getActiveRecipesData();
      state.stackGroups = board.getStackGroupsData();
      autoSave(state);
    },
    // onShopReady — auto-open shop modal when month advances
    () => {
      const packs = shopManager.getAvailablePacks(eventManager.getEventShopPacks());
      shopModal.show(packs, gameState.coins);
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

      if (
        draggedEntity.data.defId === targetEntity.data.defId &&
        draggedDef?.stackable &&
        targetDef?.stackable &&
        draggedUid !== targetUid
      ) {
        // Check if there's a recipe for this combination (e.g., wood+wood→plank)
        // Recipe takes priority over stack merging
        const recipe = recipeEngine.execute(draggedEntity, targetEntity);
        if (recipe) return; // Recipe executed, skip stack merge

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
      const recipe = recipeEngine.execute(draggedEntity, targetEntity);
      if (recipe) {
        const mx = (draggedEntity.data.position.x + targetEntity.data.position.x) / 2;
        const my = (draggedEntity.data.position.y + targetEntity.data.position.y) / 2;
        ParticleEffect.combine(board.viewportElement, mx, my);
      }
    },
    // onSell
    (cardUid: string) => {
      const card = gameState.findCard(cardUid);
      if (!card) return;
      const def = getCardDef(card.defId);
      if (!def) return;

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

  // ---- Board click → card inspector ----
  board.rootElement.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const cardEl = target.closest('.card') as HTMLElement | null;
    if (cardEl) {
      const uid = cardEl.getAttribute('data-uid');
      if (uid) {
        const entity = board.getEntity(uid);
        if (entity) {
          cardInspector.show(entity.data); // Pass CardInstance, not CardEntity
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
    arrangeStarterCards(getStarterCards(), gameState, board);
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
