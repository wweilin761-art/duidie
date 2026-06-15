/**
 * Central game state manager.
 * Holds all card instances and game-level data.
 */
import type {
  CardInstance,
  SerializedGameState,
  CardDef,
  GameStatus,
  SerializedBattleCooldowns,
  SerializedProductionTimers,
} from '../../../src/protocol/messages';
import { getCardDef } from '../data/cards';

export class GameState {
  cards: CardInstance[] = [];
  month: number = 1;
  day: number = 1;
  elapsedGameTime: number = 0;
  coins: number = 5;
  unlockedRecipes: Set<string> = new Set();
  unlockedTechs: Set<string> = new Set();
  storyFlags: Set<string> = new Set();
  storyCards: Set<string> = new Set();
  productionTimers: SerializedProductionTimers = {};
  battleCooldowns: SerializedBattleCooldowns = {};
  gameStatus: GameStatus = 'playing';
  lastStoryDialogId?: string;
  speedMultiplier: number = 1;
  paused: boolean = false;
  version: string = '1.1.0';

  /** Harvest bonus set by season (autumn = 1). RecipeEngine reads this. */
  harvestBonus: number = 0;

  /** Temporary event-driven hunger modifier (resets each month). */
  eventHungerModifier: number = 1.0;

  private uidCounter: number = 0;

  /** Generate a unique card instance ID */
  generateUid(): string {
    return `card_${++this.uidCounter}_${Date.now()}`;
  }

  /** Create a new card instance from a definition ID */
  createCard(defId: string, x: number, y: number): CardInstance | null {
    const def = getCardDef(defId);
    if (!def) return null;

    const card: CardInstance = {
      uid: this.generateUid(),
      defId,
      position: { x, y },
      stackCount: 1,
      locked: false,
    };

    // Initialize villager state if applicable
    if (def.category === 'villager') {
      card.villagerState = {
        hunger: 100,
        maxHunger: 100,
        isStarving: false,
      };
    }

    // Initialize enemy state if applicable
    if (def.category === 'enemy') {
      if (defId === 'goblin') {
        card.enemyState = { health: 20, maxHealth: 20, damage: 5 };
      } else if (defId === 'wolf') {
        card.enemyState = { health: 35, maxHealth: 35, damage: 10 };
      } else if (defId === 'boss_troll') {
        card.enemyState = { health: 80, maxHealth: 80, damage: 20 };
      }
    }

    // Resource nodes start READY — cooldown timer is applied by RecipeEngine after harvest
    this.cards.push(card);
    return card;
  }

  /** Remove a card by UID */
  removeCard(uid: string): void {
    const index = this.cards.findIndex((c) => c.uid === uid);
    if (index >= 0) {
      this.cards.splice(index, 1);
    }
  }

  /** Find a card by UID */
  findCard(uid: string): CardInstance | undefined {
    return this.cards.find((c) => c.uid === uid);
  }

  /** Get all cards of a specific definition */
  getCardsByDef(defId: string): CardInstance[] {
    return this.cards.filter((c) => c.defId === defId);
  }

  /** Get cards within a radius of a position */
  getCardsInRadius(cx: number, cy: number, radius: number): CardInstance[] {
    return this.cards.filter((c) => {
      const dx = c.position.x - cx;
      const dy = c.position.y - cy;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
  }

  /** Count cards by definition ID (counts 1 per entity; use board.getStackGroupSize for stack groups) */
  countCardsByDef(defId: string): number {
    return this.cards
      .filter((c) => c.defId === defId)
      .reduce((sum, c) => sum + c.stackCount, 0);
  }

  /**
   * Get the effective count for a card UID.
   * If the card is in a stack group, returns the group size; otherwise returns stackCount.
   * Requires a Board reference since stack groups live on the Board.
   */
  getEffectiveCount(uid: string, board?: { getStackGroupSize(uid: string): number }): number {
    return board ? board.getStackGroupSize(uid) : (this.findCard(uid)?.stackCount || 1);
  }

  /** Get Def IDs of cards near a position (for station detection) */
  getNearbyDefIds(x: number, y: number, radius: number = 80): string[] {
    return this.getCardsInRadius(x, y, radius)
      .filter((c) => !c.locked || c.currentTimer)
      .map((c) => c.defId);
  }

  /** Advance game timers by delta seconds.
   *  @param deltaGameSeconds  Raw game-seconds delta.
   *  @param regenMultiplier   Applied only to resource-node timers (1.0 = normal). */
  updateTimers(deltaGameSeconds: number, regenMultiplier: number = 1.0): void {
    for (const card of this.cards) {
      if (card.currentTimer) {
        // Resource nodes (def with timerTemplate) are affected by season regen rate
        const def = getCardDef(card.defId);
        const mult = def?.timerTemplate ? regenMultiplier : 1.0;
        card.currentTimer.remaining -= deltaGameSeconds * mult;
        if (card.currentTimer.remaining <= 0) {
          card.currentTimer.remaining = 0;
        }
      }
    }
  }

  /** Process completed timers (spawn products, consume inputs) */
  getCompletedTimers(): CardInstance[] {
    return this.cards.filter(
      (c) => c.currentTimer && c.currentTimer.remaining <= 0
    );
  }

  /** Update villager hunger.
   *  @param deltaGameSeconds  Raw game-seconds delta.
   *  @param hungerMultiplier  Season + event multiplier (1.0 = normal). */
  updateVillagerHunger(deltaGameSeconds: number, hungerMultiplier: number = 1.0): void {
    // Hunger decreases by ~5 points per game day (300s per month, 30 days = 10s per day)
    const hungerLossRate = (5 / 10) * hungerMultiplier; // 0.5 per game second * multiplier
    for (const card of this.cards) {
      if (card.villagerState) {
        card.villagerState.hunger = Math.max(
          0,
          card.villagerState.hunger - hungerLossRate * deltaGameSeconds
        );
        card.villagerState.isStarving = card.villagerState.hunger < 20;
      }
    }
  }

  /** Get starving villagers */
  getStarvingVillagers(): CardInstance[] {
    return this.cards.filter(
      (c) => c.villagerState && c.villagerState.hunger <= 0
    );
  }

  /** Lock cards involved in a recipe */
  lockCards(uids: string[]): void {
    for (const uid of uids) {
      const card = this.findCard(uid);
      if (card) card.locked = true;
    }
  }

  /** Unlock cards */
  unlockCards(uids: string[]): void {
    for (const uid of uids) {
      const card = this.findCard(uid);
      if (card) card.locked = false;
    }
  }

  /** Reset to fresh game state */
  reset(): void {
    this.cards = [];
    this.month = 1;
    this.day = 1;
    this.elapsedGameTime = 0;
    this.coins = 5;
    this.unlockedRecipes = new Set();
    this.unlockedTechs = new Set();
    this.storyFlags = new Set();
    this.storyCards = new Set();
    this.productionTimers = {};
    this.battleCooldowns = {};
    this.gameStatus = 'playing';
    this.lastStoryDialogId = undefined;
    this.speedMultiplier = 1;
    this.paused = false;
    this.harvestBonus = 0;
    this.eventHungerModifier = 1.0;
    this.uidCounter = 0;
  }

  /** Serialize to plain object */
  toJSON(): SerializedGameState {
    return {
      cards: this.cards,
      month: this.month,
      day: this.day,
      elapsedGameTime: this.elapsedGameTime,
      coins: this.coins,
      unlockedRecipes: Array.from(this.unlockedRecipes),
      unlockedTechs: Array.from(this.unlockedTechs),
      storyFlags: Array.from(this.storyFlags),
      storyCards: Array.from(this.storyCards),
      productionTimers: { ...this.productionTimers },
      battleCooldowns: { ...this.battleCooldowns },
      gameStatus: this.gameStatus,
      lastStoryDialogId: this.lastStoryDialogId,
      speedMultiplier: this.speedMultiplier,
      paused: this.paused,
      version: this.version,
    };
  }

  /** Restore from serialized state */
  fromJSON(state: SerializedGameState): void {
    this.cards = state.cards;
    this.month = state.month;
    this.day = state.day;
    this.elapsedGameTime = state.elapsedGameTime;
    this.coins = state.coins;
    this.unlockedRecipes = new Set(state.unlockedRecipes ?? []);
    this.unlockedTechs = new Set(state.unlockedTechs ?? []);
    this.storyFlags = new Set(state.storyFlags ?? []);
    this.storyCards = new Set(state.storyCards ?? []);
    this.productionTimers = { ...(state.productionTimers ?? {}) };
    this.battleCooldowns = { ...(state.battleCooldowns ?? {}) };
    this.gameStatus = state.gameStatus ?? 'playing';
    this.lastStoryDialogId = state.lastStoryDialogId;
    this.speedMultiplier = state.speedMultiplier;
    this.paused = state.paused;
    this.version = state.version;

    // Restore uid counter to avoid collisions
    let maxId = 0;
    for (const card of this.cards) {
      const match = card.uid.match(/card_(\d+)_/);
      if (match) {
        maxId = Math.max(maxId, parseInt(match[1]));
      }
    }
    this.uidCounter = maxId;
  }
}
