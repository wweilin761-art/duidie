/**
 * EventManager — random game event system.
 *
 * Triggers on month advancement, picks random events from templates,
 * spawns cards, adds shop packs, tracks recent events to avoid repeats,
 * and displays toast messages.
 */
import { pickRandomEvent, type EventTemplate } from '../data/events';
import { GameState } from '../state/GameState';
import { Board } from './Board';
import { CardEntity } from './CardEntity';
import { ParticleEffect } from './ParticleEffect';
import { getCardDef } from '../data/cards';
import type { ShopPack } from '../data/shop';

/** How many recent event IDs to track to avoid repeats */
const RECENT_EVENT_MEMORY = 3;

/** Event-trigger chance per month (0-1). Set below 1 so events are not guaranteed. */
const EVENT_CHANCE = 0.65;

/** Spawn margin from board edges (in board pixels) */
const SPAWN_MARGIN = 60;

export class EventManager {
  private gameState: GameState;
  private board: Board;
  private onToast: (message: string) => void;

  /** IDs of recently triggered events to avoid repeats */
  private recentEventIds: string[] = [];

  /** Shop packs contributed by the current month's event */
  private activeEventShopPacks: ShopPack[] = [];

  /** Whether the current month has had its event triggered yet */
  private eventTriggeredThisMonth: boolean = false;

  constructor(
    gameState: GameState,
    board: Board,
    onToast: (message: string) => void
  ) {
    this.gameState = gameState;
    this.board = board;
    this.onToast = onToast;
  }

  // ========================================================================
  // Month Advancement
  // ========================================================================

  /**
   * Called when the month advances.
   * May trigger a random event, spawn cards, and add shop packs.
   *
   * @param month - The new month number (1-based)
   */
  onMonthAdvance(month: number): void {
    // Reset per-month state
    this.activeEventShopPacks = [];
    this.eventTriggeredThisMonth = false;

    // Roll for event chance
    if (Math.random() > EVENT_CHANCE) return;

    // Pick a random event eligible for this month
    const event = pickRandomEvent(month, this.recentEventIds);
    if (!event) return;

    // Mark event as triggered
    this.eventTriggeredThisMonth = true;

    // Track to avoid repeats
    this.recentEventIds.push(event.id);
    if (this.recentEventIds.length > RECENT_EVENT_MEMORY) {
      this.recentEventIds.shift();
    }

    // Spawn cards from the event template
    if (event.spawnCards && event.spawnCards.length > 0) {
      this.spawnEventCards(event);
    }

    // Add shop packs from the event
    if (event.shopPacks && event.shopPacks.length > 0) {
      this.activeEventShopPacks = [...event.shopPacks];
    }

    // Apply special effect
    if (event.specialEffect) {
      this.applySpecialEffect(event);
    }

    // Show toast message
    this.onToast(`${event.name}: ${event.description}`);
  }

  // ========================================================================
  // Shop Packs
  // ========================================================================

  /**
   * Get any extra shop packs contributed by the current month's event.
   * These are combined with the regular monthly shop.
   */
  getEventShopPacks(): ShopPack[] {
    return [...this.activeEventShopPacks];
  }

  // ========================================================================
  // Special Effects
  // ========================================================================

  /**
   * Apply a special effect associated with an event.
   */
  private applySpecialEffect(event: EventTemplate): void {
    switch (event.specialEffect) {
      case 'heatwave':
        // Hunger depletes faster this month
        this.gameState.eventHungerModifier = 2.0;
        break;

      case 'blizzard':
        // Hunger depletes faster this month (wolves already spawned)
        this.gameState.eventHungerModifier = 2.0;
        break;

      case 'autumn_harvest':
        // All resource nodes instantly ready — reset their timers to 0
        for (const card of this.gameState.cards) {
          const def = getCardDef(card.defId);
          if (def?.timerTemplate && card.currentTimer) {
            card.currentTimer.remaining = 0;
            const entity = this.board.getEntity(card.uid);
            if (entity) entity.dirty = true;
          }
        }
        break;

      case 'cave_in':
        // Remove 1 random rock or iron_deposit
        this.causeCaveIn();
        break;
    }
  }

  /** Remove a random rock or iron_deposit from the board. */
  private causeCaveIn(): void {
    const targets = this.gameState.cards.filter(
      (c) => c.defId === 'rock' || c.defId === 'iron_deposit'
    );
    if (targets.length === 0) return;

    const victim = targets[Math.floor(Math.random() * targets.length)];
    const def = getCardDef(victim.defId);
    const name = def?.name ?? victim.defId;

    // Particle burst at the removed card's position
    ParticleEffect.destroy(
      this.board.viewportElement,
      victim.position.x + 36,
      victim.position.y + 48,
    );

    this.gameState.removeCard(victim.uid);
    this.board.removeEntity(victim.uid);

    this.onToast(`${name}塌方消失了！`);
  }

  // ========================================================================
  // Internal: Card Spawning
  // ========================================================================

  /** Set of defIds that are enemy cards — they get a slide-in spawn animation. */
  private static readonly ENEMY_DEF_IDS = new Set(['goblin', 'wolf', 'boss_troll']);

  /**
   * Spawn cards from an event template at random positions on the board.
   * Enemy cards get a slide-in animation from the board edge.
   * Non-enemy cards get a particle burst spawn effect.
   */
  private spawnEventCards(event: EventTemplate): void {
    // Determine spawn bounds based on board viewport size
    const boardW = this.board.boardWidth || 1200;
    const boardH = this.board.boardHeight || 800;
    const isEnemy = EventManager.ENEMY_DEF_IDS.has(event.spawnCards![0]?.defId ?? '');

    for (const spawn of event.spawnCards!) {
      for (let i = 0; i < spawn.count; i++) {
        // Generate a random position within board bounds (with margin)
        const x = SPAWN_MARGIN + Math.random() * (boardW - SPAWN_MARGIN * 2);
        const y = SPAWN_MARGIN + Math.random() * (boardH - SPAWN_MARGIN * 2);

        const cardInstance = this.gameState.createCard(spawn.defId, x, y);
        if (cardInstance) {
          const entity = new CardEntity(cardInstance);

          if (isEnemy) {
            // Enemy: start off-screen (left side) and slide in
            entity.el.classList.add('enemy-spawn');
            // Store final position as CSS custom properties for the animation
            entity.el.style.setProperty('--final-x', `${x}px`);
            entity.el.style.setProperty('--final-y', `${y}px`);
            // Start off-screen to the left
            entity.el.style.left = '-150px';
            entity.el.style.top = `${y}px`;

            this.board.addEntity(entity);

            // After animation, set final position and clean up
            const animDuration = 500; // matches CSS enemy-spawn animation
            setTimeout(() => {
              entity.el.classList.remove('enemy-spawn');
              entity.el.style.removeProperty('--final-x');
              entity.el.style.removeProperty('--final-y');
              entity.data.position.x = x;
              entity.data.position.y = y;
              entity.el.style.left = `${x}px`;
              entity.el.style.top = `${y}px`;
              entity.dirty = true;
            }, animDuration);
          } else {
            // Non-enemy: particle burst spawn effect
            entity.playEnterAnimation();
            this.board.addEntity(entity);
            ParticleEffect.spawn(
              this.board.viewportElement,
              x + 36,
              y + 48,
            );
          }
        }
      }
    }
  }

  // ========================================================================
  // Public Utilities
  // ========================================================================

  /**
   * Check whether an event was triggered for the current month.
   */
  hasEventTriggered(): boolean {
    return this.eventTriggeredThisMonth;
  }

  /**
   * Reset all event state (e.g., on new game).
   */
  reset(): void {
    this.recentEventIds = [];
    this.activeEventShopPacks = [];
    this.eventTriggeredThisMonth = false;
  }
}
