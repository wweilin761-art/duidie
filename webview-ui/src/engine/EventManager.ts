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

/** Cards that can investigate event question cards. */
const EVENT_ACTOR_DEF_IDS = new Set([
  'villager',
  'builder',
  'farmer',
  'hunter',
  'warrior',
]);

/** Event templates that should leave an NPC on the board. */
const EVENT_NPC_DEF_IDS: Partial<Record<string, string>> = {
  wandering_trader: 'travelling_merchant',
  merchant_caravan: 'travelling_merchant',
};

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

    this.triggerEvent(event);
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
  private spawnEventCards(
    event: EventTemplate,
    origin?: { x: number; y: number }
  ): void {
    // Determine spawn bounds based on board viewport size
    const boardW = this.board.boardWidth || 1200;
    const boardH = this.board.boardHeight || 800;

    for (const spawn of event.spawnCards!) {
      for (let i = 0; i < spawn.count; i++) {
        const isEnemy = EventManager.ENEMY_DEF_IDS.has(spawn.defId);
        const { x, y } = origin
          ? this.getNearbySpawnPosition(origin, i)
          : this.getRandomBoardPosition(boardW, boardH);

        const cardInstance = this.gameState.createCard(spawn.defId, x, y);
        if (cardInstance) {
          this.addSpawnedEntity(cardInstance, isEnemy);
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
   * Spawn an unresolved event card at one edge of the visible map.
   * Returns false if one is already waiting.
   */
  spawnQuestionCard(): boolean {
    const existing = this.gameState.cards.some(
      (card) => card.defId === 'event_question'
    );
    if (existing) return false;

    const { x, y } = this.getEdgeSpawnPosition();
    const card = this.gameState.createCard('event_question', x, y);
    if (!card) return false;

    const entity = new CardEntity(card);
    entity.el.classList.add('event-question');
    entity.playEnterAnimation();
    this.board.addEntity(entity);
    ParticleEffect.spawn(this.board.viewportElement, x + 36, y + 48);
    this.onToast('地图边缘出现了未知事件，派村民去看看吧。');
    return true;
  }

  /**
   * Reveal an event question card by dropping an eligible actor on it.
   * The question card is removed, then a weighted event is resolved.
   */
  revealQuestionCard(actorUid: string, questionUid: string): boolean {
    const actor = this.gameState.findCard(actorUid);
    const question = this.gameState.findCard(questionUid);
    if (
      !actor ||
      !question ||
      question.defId !== 'event_question' ||
      !EVENT_ACTOR_DEF_IDS.has(actor.defId)
    ) {
      return false;
    }

    const event = pickRandomEvent(this.gameState.month, this.recentEventIds);
    if (!event) {
      this.onToast('迷雾散开了，但什么也没有发生。');
      this.gameState.removeCard(questionUid);
      this.board.removeEntity(questionUid);
      return true;
    }

    const origin = { ...question.position };
    ParticleEffect.combine(
      this.board.viewportElement,
      origin.x + 36,
      origin.y + 48,
    );
    this.gameState.removeCard(questionUid);
    this.board.removeEntity(questionUid);
    this.triggerEvent(event, origin);
    return true;
  }

  /**
   * Reset all event state (e.g., on new game).
   */
  reset(): void {
    this.recentEventIds = [];
    this.activeEventShopPacks = [];
    this.eventTriggeredThisMonth = false;
  }

  private triggerEvent(
    event: EventTemplate,
    origin?: { x: number; y: number }
  ): void {
    this.eventTriggeredThisMonth = true;
    this.rememberEvent(event.id);

    if (event.spawnCards && event.spawnCards.length > 0) {
      this.spawnEventCards(event, origin);
    }

    if (event.shopPacks && event.shopPacks.length > 0) {
      this.activeEventShopPacks = [...event.shopPacks];
      this.spawnEventNpc(event, origin);
    }

    if (event.specialEffect) {
      this.applySpecialEffect(event);
    }

    this.onToast(`${event.name}: ${event.description}`);
  }

  private rememberEvent(eventId: string): void {
    this.recentEventIds.push(eventId);
    if (this.recentEventIds.length > RECENT_EVENT_MEMORY) {
      this.recentEventIds.shift();
    }
  }

  private spawnEventNpc(
    event: EventTemplate,
    origin?: { x: number; y: number }
  ): void {
    const defId = EVENT_NPC_DEF_IDS[event.id];
    if (!defId) return;

    const { x, y } = origin
      ? this.getNearbySpawnPosition(origin, 0)
      : this.getEdgeSpawnPosition();
    const card = this.gameState.createCard(defId, x, y);
    if (!card) return;

    const entity = new CardEntity(card);
    entity.playEnterAnimation();
    this.board.addEntity(entity);
    ParticleEffect.spawn(this.board.viewportElement, x + 36, y + 48);
  }

  private addSpawnedEntity(cardInstance: ReturnType<GameState['createCard']>, isEnemy: boolean): void {
    if (!cardInstance) return;

    const entity = new CardEntity(cardInstance);
    const { x, y } = cardInstance.position;

    if (isEnemy) {
      // Enemy: start off-screen (left side) and slide in
      entity.el.classList.add('enemy-spawn');
      entity.el.style.setProperty('--final-x', `${x}px`);
      entity.el.style.setProperty('--final-y', `${y}px`);
      entity.el.style.left = '-150px';
      entity.el.style.top = `${y}px`;

      this.board.addEntity(entity);

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
      return;
    }

    entity.playEnterAnimation();
    this.board.addEntity(entity);
    ParticleEffect.spawn(this.board.viewportElement, x + 36, y + 48);
  }

  private getEdgeSpawnPosition(): { x: number; y: number } {
    const boardW = this.board.boardWidth || 1200;
    const boardH = this.board.boardHeight || 800;
    const minX = SPAWN_MARGIN;
    const minY = SPAWN_MARGIN;
    const maxX = Math.max(minX, boardW - SPAWN_MARGIN - 72);
    const maxY = Math.max(minY, boardH - SPAWN_MARGIN - 96);
    const edge = Math.floor(Math.random() * 4);

    if (edge === 0) return { x: minX, y: this.randomBetween(minY, maxY) };
    if (edge === 1) return { x: maxX, y: this.randomBetween(minY, maxY) };
    if (edge === 2) return { x: this.randomBetween(minX, maxX), y: minY };
    return { x: this.randomBetween(minX, maxX), y: maxY };
  }

  private getRandomBoardPosition(boardW: number, boardH: number): { x: number; y: number } {
    const minX = SPAWN_MARGIN;
    const minY = SPAWN_MARGIN;
    const maxX = Math.max(minX, boardW - SPAWN_MARGIN - 72);
    const maxY = Math.max(minY, boardH - SPAWN_MARGIN - 96);
    return {
      x: this.randomBetween(minX, maxX),
      y: this.randomBetween(minY, maxY),
    };
  }

  private getNearbySpawnPosition(
    origin: { x: number; y: number },
    index: number
  ): { x: number; y: number } {
    const boardW = this.board.boardWidth || 1200;
    const boardH = this.board.boardHeight || 800;
    const angle = index * 0.9 + Math.random() * 0.5;
    const radius = 42 + index * 16;
    const x = origin.x + Math.cos(angle) * radius;
    const y = origin.y + Math.sin(angle) * radius;

    return {
      x: this.clamp(x, SPAWN_MARGIN, Math.max(SPAWN_MARGIN, boardW - SPAWN_MARGIN - 72)),
      y: this.clamp(y, SPAWN_MARGIN, Math.max(SPAWN_MARGIN, boardH - SPAWN_MARGIN - 96)),
    };
  }

  private randomBetween(min: number, max: number): number {
    if (max <= min) return min;
    return min + Math.random() * (max - min);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
