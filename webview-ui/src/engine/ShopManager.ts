/**
 * ShopManager — shop and economy system.
 *
 * Tracks monthly shop packs, handles purchasing packs (deduct coins,
 * spawn cards) and selling cards (remove card, add coins to balance).
 * Combines regular monthly shop offerings with event-added packs.
 */
import { GameState } from '../state/GameState';
import { Board } from './Board';
import { CardEntity } from './CardEntity';
import {
  getShopForMonth,
  type ShopPack,
} from '../data/shop';
import type { CardInstance } from '../../../src/protocol/messages';
import { getCardDef } from '../data/cards';

/** Spawn offset between cards within a purchased pack */
const PACK_CARD_SPACING = 30;

/** Default spawn position when the board has no room info */
const DEFAULT_SPAWN_X = 300;
const DEFAULT_SPAWN_Y = 200;

export class ShopManager {
  private gameState: GameState;
  private board: Board;

  /** Whether the shop modal should be shown for the current month */
  private shopPending: boolean = false;

  constructor(gameState: GameState, board: Board) {
    this.gameState = gameState;
    this.board = board;
  }

  // ========================================================================
  // Buying
  // ========================================================================

  /**
   * Attempt to purchase a shop pack.
   * Deducts coins and spawns the pack's cards on the board.
   *
   * @param pack - The shop pack to buy
   * @returns true if the purchase succeeded, false if insufficient coins
   */
  buyPack(pack: ShopPack): boolean {
    if (this.gameState.coins < pack.cost) {
      return false;
    }

    // Deduct coins
    this.gameState.coins -= pack.cost;

    // Spawn cards from the pack
    this.spawnPackCards(pack);

    return true;
  }

  // ========================================================================
  // Selling
  // ========================================================================

  /**
   * Sell a card, removing it from the board and adding its sell value
   * (multiplied by stack count) to the player's coins.
   *
   * @param cardId - The UID of the card to sell
   * @returns true if the card was sold successfully
   */
  sellCard(cardId: string): boolean {
    const card = this.gameState.findCard(cardId);
    if (!card) return false;

    // Cannot sell locked cards (e.g., cards in active recipes)
    if (card.locked) return false;

    // Compute sell value: base value * effective count (stack group size)
    const def = getCardDef(card.defId);
    const effectiveCount = this.board.getStackGroupSize(cardId);
    const sellValue = def ? def.sellValue * effectiveCount : 1;

    // Add coins and remove card
    this.gameState.coins += sellValue;
    this.gameState.removeCard(cardId);
    this.board.removeEntity(cardId);

    return true;
  }

  // ========================================================================
  // Shop Availability
  // ========================================================================

  /**
   * Get all available packs for the current shop session.
   * Combines regular monthly packs with event-added packs.
   *
   * @param eventPacks - Extra packs from the event system
   * @returns Combined array of available shop packs
   */
  getAvailablePacks(eventPacks: ShopPack[]): ShopPack[] {
    const monthlyPacks = getShopForMonth(this.gameState.month);
    return [...monthlyPacks, ...eventPacks];
  }

  // ========================================================================
  // Shop Modal Tracking
  // ========================================================================

  /**
   * Check whether the shop modal should be shown.
   * The shop is shown once per month (when the month advances).
   */
  shouldShowShop(): boolean {
    return this.shopPending;
  }

  /**
   * Mark the shop as having been shown for the current month.
   * Call this after the shop modal has been presented to the player.
   */
  markShopShown(): void {
    this.shopPending = false;
  }

  /**
   * Queue the shop to be shown (called when month advances).
   */
  queueShopForMonth(): void {
    this.shopPending = true;
  }

  // ========================================================================
  // Internal: Card Spawning for Packs
  // ========================================================================

  /**
   * Spawn the cards contained in a shop pack at a reasonable position
   * on the board.
   */
  private spawnPackCards(pack: ShopPack): void {
    // Determine a spawn origin — use a position somewhat centered
    // on the visible board area
    const boardW = this.board.boardWidth || 1200;
    const boardH = this.board.boardHeight || 800;

    let originX = boardW * 0.3;
    let originY = boardH * 0.3;

    // If there are already cards, spawn near the existing cards
    if (this.gameState.cards.length > 0) {
      // Average position of all cards (in board coords)
      let sumX = 0;
      let sumY = 0;
      for (const c of this.gameState.cards) {
        sumX += c.position.x;
        sumY += c.position.y;
      }
      originX = sumX / this.gameState.cards.length;
      originY = sumY / this.gameState.cards.length;
    }

    let spawnIndex = 0;
    for (const cardEntry of pack.cards) {
      for (let i = 0; i < cardEntry.count; i++) {
        // Arrange cards in a small grid pattern
        const col = spawnIndex % 3;
        const row = Math.floor(spawnIndex / 3);
        const x = originX + col * PACK_CARD_SPACING;
        const y = originY + row * PACK_CARD_SPACING;

        const cardInstance = this.gameState.createCard(
          cardEntry.defId,
          x,
          y
        );
        if (cardInstance) {
          const entity = new CardEntity(cardInstance);
          entity.playEnterAnimation();
          this.board.addEntity(entity);
        }

        spawnIndex++;
      }
    }
  }

  // ========================================================================
  // Public Utilities
  // ========================================================================

  /**
   * Reset shop state (e.g., on new game).
   */
  reset(): void {
    this.shopPending = false;
  }

  /**
   * Check if the player can afford a given pack.
   */
  canAfford(pack: ShopPack): boolean {
    return this.gameState.coins >= pack.cost;
  }
}
