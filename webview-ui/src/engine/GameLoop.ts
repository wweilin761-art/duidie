/**
 * GameLoop — owns the requestAnimationFrame loop, drives all per-frame updates.
 *
 * On each frame:
 *   1. Calculate wall-clock delta, cap at 0.1 s to avoid spiral-of-death.
 *   2. Tick TimeManager (handles pause internally).
 *   3. If time advanced: update timers, villager hunger, process completed
 *      timers, check starvation, handle month-advance events & shop refresh.
 *   4. Sync every entity's DOM (position, timers, bars).
 *   5. Update toolbar display.
 *   6. Accumulate wall-clock time for autosave (every 120 s).
 */

import { TimeManager, type TimeTickResult } from './TimeManager';
import { GameState } from '../state/GameState';
import { Board } from './Board';
import { RecipeEngine } from './RecipeEngine';
import { EventManager } from './EventManager';
import { ShopManager } from './ShopManager';
import { Toolbar } from '../ui/Toolbar';
import { ToastRenderer } from '../ui/ToastRenderer';
import { CardInspector } from '../ui/CardInspector';
import { getCardDef } from '../data/cards';
import { ParticleEffect } from './ParticleEffect';
import { SeasonManager, Season } from './SeasonManager';
import type { CardInstance } from '../../../src/protocol/messages';

/** Wall-clock seconds between autosaves. */
const AUTOSAVE_INTERVAL = 120;

/** Maximum wall-clock delta per frame to avoid spiral-of-death. */
const MAX_DELTA = 0.1;

export class GameLoop {
  private running: boolean = false;
  private lastTimestamp: number = 0;
  private autosaveAccumulator: number = 0;

  private seasonManager: SeasonManager;
  private currentSeason: Season = Season.Spring;

  constructor(
    private timeManager: TimeManager,
    private gameState: GameState,
    private board: Board,
    private recipeEngine: RecipeEngine,
    private eventManager: EventManager,
    private shopManager: ShopManager,
    private toolbar: Toolbar,
    private toastRenderer: ToastRenderer,
    private cardInspector: CardInspector,
    private onAutosave: () => void,
    private onShopReady?: () => void,
  ) {
    this.seasonManager = new SeasonManager();
    // Compute initial season
    this.currentSeason = this.seasonManager.getSeason(this.gameState.month);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Start (or resume) the game loop. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.autosaveAccumulator = 0;
    requestAnimationFrame(this.frame);
  }

  /** Stop the game loop. The next scheduled frame will be a no-op. */
  stop(): void {
    this.running = false;
  }

  /** Query whether the loop is currently running. */
  isRunning(): boolean {
    return this.running;
  }

  // ---------------------------------------------------------------------------
  // Frame handler
  // ---------------------------------------------------------------------------

  private frame = (timestamp: number): void => {
    if (!this.running) return;

    // --- 1. Delta time -------------------------------------------------------
    let delta = (timestamp - this.lastTimestamp) / 1000;
    if (delta > MAX_DELTA) {
      delta = MAX_DELTA;
    }
    this.lastTimestamp = timestamp;

    // --- 2. Tick time manager ------------------------------------------------
    const tickResult: TimeTickResult = this.timeManager.tick(delta);

    // --- 3. Game-state updates (only when time advanced) ----------------------
    if (tickResult.advanced) {
      this.applyGameUpdates(tickResult);
    }

    // --- 4. Sync DOM ---------------------------------------------------------
    this.syncAllEntities();

    // --- 5. Toolbar ----------------------------------------------------------
    this.toolbar.update(
      this.gameState.month,
      this.gameState.day,
      this.gameState.coins,
      this.gameState.paused,
      this.timeManager.speedMultiplier,
      this.currentSeason,
    );

    // --- 6. Autosave ---------------------------------------------------------
    this.autosaveAccumulator += delta;
    if (this.autosaveAccumulator >= AUTOSAVE_INTERVAL) {
      this.autosaveAccumulator = 0;
      this.onAutosave();
    }

    // --- 7. Schedule next frame ----------------------------------------------
    requestAnimationFrame(this.frame);
  };

  // ---------------------------------------------------------------------------
  // Per-tick game logic (only called when time advanced)
  // ---------------------------------------------------------------------------

  private applyGameUpdates(tickResult: TimeTickResult): void {
    const { deltaGame, monthAdvanced, newMonth, newDay } = tickResult;

    // --- Compute season once per tick ---
    const monthForSeason = monthAdvanced ? newMonth : this.gameState.month;
    const season = this.seasonManager.getSeason(monthForSeason);
    const seasonChanged = season !== this.currentSeason;
    if (seasonChanged) {
      this.currentSeason = season;
    }

    // Gather season modifiers
    const hungerMult = this.seasonManager.getHungerMultiplier(season) * this.gameState.eventHungerModifier;
    const regenMult = this.seasonManager.getRegenMultiplier(season);
    const harvestBonus = this.seasonManager.getHarvestBonus(season);

    // Update static harvest bonus for RecipeEngine to read
    SeasonManager.currentHarvestBonus = harvestBonus;
    this.gameState.harvestBonus = harvestBonus;

    // (a) Advance card timers with season regen multiplier
    this.gameState.updateTimers(deltaGame, regenMult);

    // (b) Deplete villager hunger with season + event multiplier
    this.gameState.updateVillagerHunger(deltaGame, hungerMult);

    // (c) Process completed timers — spawn products, consume ingredients
    const completed = this.gameState.getCompletedTimers();
    if (completed.length > 0) {
      this.recipeEngine.processCompletedTimers();
    }

    // (d) Starvation deaths
    this.checkStarvation();

    // (e) Month advancement
    if (monthAdvanced) {
      this.gameState.month = newMonth;
      // Reset event hunger modifier on new month (event effects last one month)
      this.gameState.eventHungerModifier = 1.0;
      this.eventManager.onMonthAdvance(this.gameState.month);
      this.shopManager.queueShopForMonth();
      if (this.onShopReady) this.onShopReady();
    }

    // Update derived fields so they stay in sync with TimeManager.
    // (month was already set above when monthAdvanced was true.)
    this.gameState.day = newDay;
    this.gameState.elapsedGameTime = this.timeManager.elapsedGameTime;
  }

  // ---------------------------------------------------------------------------
  // Starvation
  // ---------------------------------------------------------------------------

  private checkStarvation(): void {
    const starved: CardInstance[] = this.gameState.getStarvingVillagers();
    if (starved.length === 0) return;

    for (const villager of starved) {
      const def = getCardDef(villager.defId);
      const name = def?.name ?? 'Villager';

      // Particle burst at the villager's position on death
      ParticleEffect.destroy(
        this.board.viewportElement,
        villager.position.x + 36,
        villager.position.y + 48,
      );

      this.toastRenderer.show(
        `${name}饿死了！（第${this.gameState.month}月）`,
        'warning',
        4000,
      );

      // Clean up any active recipe this villager was part of
      this.recipeEngine.cancelRecipeForCard(villager.uid);

      this.board.removeEntity(villager.uid);
      this.gameState.removeCard(villager.uid);
    }
  }

  // ---------------------------------------------------------------------------
  // DOM sync
  // ---------------------------------------------------------------------------

  /**
   * Iterate every entity on the board and call syncDOM.
   * Entities marked for removal (needsRemoval) are cleaned up.
   */
  private syncAllEntities(): void {
    const entities = this.board.getAllEntities();
    for (const entity of entities) {
      if (entity.needsRemoval) {
        this.board.removeEntity(entity.uid);
        continue;
      }
      entity.syncDOM();
    }
  }
}
