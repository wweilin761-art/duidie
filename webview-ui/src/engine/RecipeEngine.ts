/**
 * RecipeEngine — recipe execution engine.
 *
 * Matches card combinations against the recipe table, executes instant
 * recipes immediately, and manages timed recipes (locking inputs, tracking
 * timers, spawning products on completion).
 *
 * Also handles station requirements, idea unlocking, and villager hunger
 * restoration for eating recipes.
 */
import { findBestRecipe, getRecipeById, type Recipe, type RecipeInput } from '../data/recipes';
import { GameState } from '../state/GameState';
import { CardEntity } from './CardEntity';
import { Board } from './Board';
import { SeasonManager } from './SeasonManager';
import type { CardInstance, SerializedActiveRecipe } from '../../../src/protocol/messages';
import { getCardDef } from '../data/cards';

/** Result of matching recipe inputs to available cards */
interface InputAssignment {
  /** UIDs whose stacks are partially or fully consumed */
  consumed: string[];
  /** UIDs not consumed (e.g., villager, resource node, tool) */
  nonConsumed: string[];
  /** Per-UID count of how many items from the card's stack are consumed */
  consumeCounts: Map<string, number>;
}

/** Internal tracking for an active timed recipe */
interface ActiveRecipe {
  recipe: Recipe;
  /** UIDs of all cards locked for this recipe */
  lockedUids: string[];
  /** UIDs of consumed inputs (removed or stack-reduced on completion) */
  consumedUids: string[];
  /** Per-UID count of how many items from the consumed card's stack are used */
  consumeCounts: Map<string, number>;
  /** Position where the output should spawn */
  spawnX: number;
  spawnY: number;
}

export class RecipeEngine {
  private gameState: GameState;
  private board: Board;

  /**
   * Maps a card UID (the one holding the timer) to its active recipe data.
   */
  private activeRecipes: Map<string, ActiveRecipe> = new Map();

  constructor(gameState: GameState, board: Board) {
    this.gameState = gameState;
    this.board = board;
  }

  /**
   * Get the effective count of items represented by a card.
   * If the card is in a stack group, returns the group size (but only once per group).
   * If the card is not stacked, returns its stackCount.
   * @param countedGroups Set of group IDs already counted — used to avoid double-counting.
   */
  private getCardEffectiveCount(card: CardInstance, countedGroups: Set<string>): number {
    const entity = this.board.getEntity(card.uid);
    if (!entity || !entity.stackGroupId) return card.stackCount;
    if (countedGroups.has(entity.stackGroupId)) return 0;
    countedGroups.add(entity.stackGroupId);
    return this.board.getStackGroupSize(card.uid);
  }

  /**
   * Consume inputs according to the assignment.
   * For stack-grouped cards, removes top cards from the group.
   * For standalone cards, reduces stackCount or removes entirely.
   * Unlocks cards after consumption.
   */
  private consumeAssignedInputs(assigned: InputAssignment): void {
    const consumedGroups = new Set<string>();

    for (const uid of assigned.consumed) {
      const card = this.gameState.findCard(uid);
      if (!card) continue;

      const entity = this.board.getEntity(uid);
      const consumeCount = assigned.consumeCounts.get(uid) ?? 1;

      if (entity && entity.stackGroupId) {
        // Card is in a stack group — remove top cards from the group
        if (consumedGroups.has(entity.stackGroupId)) continue;
        consumedGroups.add(entity.stackGroupId);

        const removedUids = this.board.removeTopCardsFromGroup(uid, consumeCount);
        for (const removedUid of removedUids) {
          this.gameState.removeCard(removedUid);
          this.board.removeEntity(removedUid);
        }
      } else {
        // Traditional stackCount-based consumption
        if (consumeCount >= card.stackCount) {
          this.gameState.removeCard(uid);
          this.board.removeEntity(uid);
        } else {
          card.stackCount -= consumeCount;
          card.locked = false;
          const cardEntity = this.board.getEntity(uid);
          if (cardEntity) {
            cardEntity.dirty = true;
            cardEntity.syncDOM();
          }
        }
      }
    }
  }

  // ========================================================================
  // Recipe Execution
  // ========================================================================

  /**
   * Try to match and execute a recipe between two cards.
   *
   * Accounts for stackCount of both cards (Bug 1), includes nearby cards
   * within 80px as potential additional inputs (Bug 3, 5), and supports
   * multi-input recipes through stack-aware assignment (Bug 2).
   *
   * @param draggedCard - The card that was dragged (primary actor)
   * @param targetCard  - The card that was dropped onto
   * @returns The matched Recipe, or null if no recipe matched
   */
  execute(draggedCard: CardEntity, targetCard: CardEntity): Recipe | null {
    const card1 = draggedCard.data;
    const card2 = targetCard.data;

    // Compute midpoint for station detection and nearby card scan
    const midX = (card1.position.x + card2.position.x) / 2;
    const midY = (card1.position.y + card2.position.y) / 2;

    // Build expanded input defIds using stack group effective counts
    // (avoids double-counting cards in the same stack group)
    const countedGroups = new Set<string>();
    const expandedDefIds: string[] = [];

    function pushDefIds(card: CardInstance, count: number): void {
      for (let i = 0; i < count; i++) expandedDefIds.push(card.defId);
    }

    const effCount1 = this.getCardEffectiveCount(card1, countedGroups);
    pushDefIds(card1, effCount1);
    const effCount2 = this.getCardEffectiveCount(card2, countedGroups);
    pushDefIds(card2, effCount2);

    // Scan for nearby cards to include as additional inputs (Bug 3, 5)
    // Use same filter as getNearbyDefIds: unlocked cards, or locked cards with timers
    const nearbyCards = this.gameState.getCardsInRadius(midX, midY, 80)
      .filter((c) => !c.locked || c.currentTimer);

    // Build the full available cards list for input assignment
    const availableCards: CardInstance[] = [card1, card2];

    for (const nearby of nearbyCards) {
      // Skip cards already in the primary pair
      if (nearby.uid === card1.uid || nearby.uid === card2.uid) continue;

      availableCards.push(nearby);
      // Expand defIds using effective count (stack group aware)
      const effCount = this.getCardEffectiveCount(nearby, countedGroups);
      pushDefIds(nearby, effCount);
    }

    // Station detection (within 100px)
    const nearbyDefIds = this.gameState.getNearbyDefIds(midX, midY, 100);

    // Find best matching recipe
    const recipe = findBestRecipe(
      expandedDefIds,
      nearbyDefIds,
      this.gameState.unlockedRecipes
    );

    if (!recipe) return null;

    // Assign recipe inputs from available cards (including nearby cards)
    const assigned = this.assignInputs(recipe, availableCards);
    if (!assigned) return null;

    // CRITICAL: The dragged card MUST be used by the recipe. The target card is
    // optional (for single-input recipes like wood→plank). Nearby cards are helpers.
    const allAssignedUids = new Set([...assigned.consumed, ...assigned.nonConsumed]);
    if (!allAssignedUids.has(card1.uid)) {
      return null;  // Dragged card not used → reject unintended nearby match
    }

    // Compute spawn position (midpoint of the involved cards)
    const spawnX = midX;
    const spawnY = midY;

    if (!recipe.duration || recipe.duration <= 0) {
      // Instant recipe — execute immediately
      this.executeInstant(recipe, assigned, spawnX, spawnY);
    } else {
      // Timed recipe — lock inputs and set a timer
      this.executeTimed(recipe, assigned, spawnX, spawnY);
    }

    return recipe;
  }

  /**
   * Get the recipe for a set of card definitions without executing it.
   * Used for UI preview purposes.
   *
   * @param cardDefIds - DefIds of the cards to check
   * @returns The best matching recipe, or undefined
   */
  getRecipe(cardDefIds: string[]): Recipe | undefined {
    // For station detection, check near the first card's position
    let stationDefIds: string[] = [];
    if (cardDefIds.length > 0) {
      // Find the first card's position
      const card = this.gameState.cards.find(
        (c) => c.defId === cardDefIds[0]
      );
      if (card) {
        stationDefIds = this.gameState.getNearbyDefIds(
          card.position.x,
          card.position.y,
          100
        );
      }
    }

    return findBestRecipe(
      cardDefIds,
      stationDefIds,
      this.gameState.unlockedRecipes
    );
  }

  // ========================================================================
  // Timer Processing
  // ========================================================================

  /**
   * Check completed timers and process them.
   * Should be called each game tick.
   *
   * @returns Array of newly created CardInstances from completed recipes
   */
  processCompletedTimers(): CardInstance[] {
    const completed = this.gameState.getCompletedTimers();
    const newCards: CardInstance[] = [];

    for (const card of completed) {
      // Check if this card's timer belongs to an active recipe
      const active = this.activeRecipes.get(card.uid);
      if (!active) {
        // Non-recipe timer (e.g., resource node cooldown) — just clear it.
        // The node is now ready to harvest again.
        card.currentTimer = undefined;
        const entity = this.board.getEntity(card.uid);
        if (entity) {
          entity.dirty = true;
          entity.syncDOM();
        }
        continue;
      }

      // Consume inputs with stack group aware handling
      this.consumeAssignedInputs(active);

      // Unlock non-consumed cards
      const nonConsumedUids = active.lockedUids.filter(
        (uid) => !active.consumedUids.includes(uid)
      );
      this.gameState.unlockCards(nonConsumedUids);

      // Apply cooldown timer to resource nodes (tree, rock, bush, etc.)
      for (const uid of nonConsumedUids) {
        const nonConsumedCard = this.gameState.findCard(uid);
        if (nonConsumedCard) {
          const def = getCardDef(nonConsumedCard.defId);
          if (def?.timerTemplate && !nonConsumedCard.currentTimer) {
            nonConsumedCard.currentTimer = {
              duration: def.timerTemplate.duration,
              remaining: def.timerTemplate.duration,
              label: def.timerTemplate.label,
              product: def.timerTemplate.product,
            };
            const entity = this.board.getEntity(uid);
            if (entity) entity.dirty = true;
          }
        }
      }

      // Spawn output — skip for eating recipes (they just restore hunger)
      if (!active.recipe.id.startsWith('eat_')) {
        const totalOutput = active.recipe.output.count + this.getHarvestBonusForRecipe(active.recipe);
        for (let i = 0; i < totalOutput; i++) {
          const ox = active.spawnX + (i * 15);
          const oy = active.spawnY + (i * 10);
          const newCard = this.gameState.createCard(
            active.recipe.output.defId,
            ox,
            oy
          );
          if (newCard) {
            newCards.push(newCard);
            const entity = new CardEntity(newCard);
            entity.playEnterAnimation();
            this.board.addEntity(entity);
          }
        }
      }

      // Handle villager hunger for eating recipes
      if (active.recipe.id.startsWith('eat_')) {
        this.handleEatingResult(active);
      }

      // Clear the timer on the host card
      // If the host card was consumed, it has already been removed above.
      // If non-consumed (e.g., villager), just clear the timer and update DOM.
      if (!active.consumedUids.includes(card.uid)) {
        card.currentTimer = undefined;
        const hostEntity = this.board.getEntity(card.uid);
        if (hostEntity) {
          hostEntity.dirty = true;
          hostEntity.syncDOM();
        }
      }

      // Clean up tracking
      this.activeRecipes.delete(card.uid);
    }

    return newCards;
  }

  // ========================================================================
  // Internal: Instant Recipe Execution
  // ========================================================================

  /**
   * Execute an instant (duration === 0 or undefined) recipe.
   * Immediately consumes inputs and creates output.
   * Handles stackCount reduction for partially consumed stackable cards (Bug 2).
   */
  private executeInstant(
    recipe: Recipe,
    assigned: InputAssignment,
    spawnX: number,
    spawnY: number
  ): void {
    // Consume inputs with stack group aware handling
    this.consumeAssignedInputs(assigned);

    // Create output card(s) — skip for eating recipes (they just restore hunger)
    if (!recipe.id.startsWith('eat_')) {
      const totalOutput = recipe.output.count + this.getHarvestBonusForRecipe(recipe);
      for (let i = 0; i < totalOutput; i++) {
        const ox = spawnX + (i * 15);
        const oy = spawnY + (i * 10);
        const newCard = this.gameState.createCard(
          recipe.output.defId,
          ox,
          oy
        );
        if (newCard) {
          const entity = new CardEntity(newCard);
          entity.playEnterAnimation();
          this.board.addEntity(entity);
        }
      }
    }

    // Handle idea unlocking: if the output is an idea card, unlock related recipes
    const outputDef = getCardDef(recipe.output.defId);
    if (outputDef && outputDef.category === 'idea') {
      // Unlock all recipes whose ideaRequired matches this output defId
      this.gameState.unlockedRecipes.add(recipe.output.defId);
    }

    // Handle villager hunger for instant eating recipes
    if (recipe.id.startsWith('eat_')) {
      // Find the food input to determine what was eaten
      const foodInput = recipe.inputs.find(
        (inp) => inp.defId !== 'villager' && inp.consumed
      );
      if (foodInput) {
        // Find the villager card (non-consumed input)
        for (const uid of assigned.nonConsumed) {
          const villagerCard = this.gameState.findCard(uid);
          if (
            villagerCard &&
            villagerCard.defId === 'villager' &&
            villagerCard.villagerState
          ) {
            this.restoreVillagerHunger(villagerCard, foodInput.defId);
          }
        }
      }
    }

    // Apply cooldown timer to resource nodes (non-consumed inputs with timerTemplate)
    for (const uid of assigned.nonConsumed) {
      const card = this.gameState.findCard(uid);
      if (card) {
        const def = getCardDef(card.defId);
        if (def?.timerTemplate && !card.currentTimer) {
          card.currentTimer = {
            duration: def.timerTemplate.duration,
            remaining: def.timerTemplate.duration,
            label: def.timerTemplate.label,
            product: def.timerTemplate.product,
          };
          const entity = this.board.getEntity(uid);
          if (entity) entity.dirty = true;
        }
      }
    }
  }

  // ========================================================================
  // Internal: Timed Recipe Execution
  // ========================================================================

  /**
   * Execute a timed recipe.
   * Locks all input cards and starts a timer on the primary consumed card.
   */
  private executeTimed(
    recipe: Recipe,
    assigned: InputAssignment,
    spawnX: number,
    spawnY: number
  ): void {
    const allUids = [...assigned.consumed, ...assigned.nonConsumed];

    // Lock all involved cards
    this.gameState.lockCards(allUids);

    // Put the timer on the first consumed card, or the first input if none consumed
    const timerHostUid =
      assigned.consumed.length > 0
        ? assigned.consumed[0]
        : assigned.nonConsumed[0];

    const timerHost = this.gameState.findCard(timerHostUid);
    if (!timerHost) return;

    // Set the timer on the host card
    timerHost.currentTimer = {
      duration: recipe.duration!,
      remaining: recipe.duration!,
      label: recipe.output.spawnTimer?.label || recipe.id,
      product: recipe.output.defId,
    };

    // Update the entity's DOM to show the timer
    const hostEntity = this.board.getEntity(timerHostUid);
    if (hostEntity) {
      hostEntity.dirty = true;
      hostEntity.syncDOM();
    }

    // Track this active recipe
    this.activeRecipes.set(timerHostUid, {
      recipe,
      lockedUids: allUids,
      consumedUids: assigned.consumed,
      consumeCounts: assigned.consumeCounts,
      spawnX,
      spawnY,
    });
  }

  // ========================================================================
  // Internal: Villager Hunger
  // ========================================================================

  /**
   * Restore a villager's hunger based on the food they ate.
   */
  private restoreVillagerHunger(
    villager: CardInstance,
    foodDefId: string
  ): void {
    if (!villager.villagerState) return;

    let amount = 15; // default
    switch (foodDefId) {
      case 'berry':        amount = 25; break;
      case 'apple':        amount = 30; break;
      case 'cooked_meat':  amount = 60; break;
      case 'bread':        amount = 45; break;
      case 'cheese':       amount = 55; break;
      case 'milk':         amount = 20; break;
      case 'fish':         amount = 35; break;
    }

    villager.villagerState.hunger = Math.min(
      villager.villagerState.maxHunger,
      villager.villagerState.hunger + amount
    );
    villager.villagerState.isStarving =
      villager.villagerState.hunger < 20;
  }

  /**
   * Handle hunger restoration after a timed eating recipe completes.
   */
  private handleEatingResult(active: ActiveRecipe): void {
    const foodInput = active.recipe.inputs.find(
      (inp) => inp.defId !== 'villager' && inp.consumed
    );
    if (!foodInput) return;

    // Find the villager from the non-consumed inputs
    for (const uid of active.lockedUids) {
      if (active.consumedUids.includes(uid)) continue;
      const card = this.gameState.findCard(uid);
      if (card && card.defId === 'villager' && card.villagerState) {
        this.restoreVillagerHunger(card, foodInput.defId);
      }
    }
  }

  // ========================================================================
  // Internal: Input Assignment
  // ========================================================================

  /**
   * Assign input cards from the available set to the recipe's input
   * requirements. Supports using a single stackable card to satisfy
   * multiple count requirements (Bug 2).
   *
   * For example, a wood card with stackCount=3 can satisfy a recipe
   * that needs wood x 2 — two items are consumed from the stack,
   * leaving stackCount=1.
   *
   * @returns Assignment object, or null if the assignment is not possible
   */
  private assignInputs(
    recipe: Recipe,
    availableCards: CardInstance[]
  ): InputAssignment | null {
    const consumedUids: string[] = [];
    const nonConsumedUids: string[] = [];
    const consumeCounts = new Map<string, number>();

    // Track how many items remain available from each card's stack.
    // For cards in stack groups, use the group size (avoiding double-counting).
    const remainingStacks = new Map<string, number>();
    const availableCountedGroups = new Set<string>();
    for (const card of availableCards) {
      const entity = this.board.getEntity(card.uid);
      if (entity && entity.stackGroupId) {
        if (availableCountedGroups.has(entity.stackGroupId)) {
          remainingStacks.set(card.uid, 0);
        } else {
          availableCountedGroups.add(entity.stackGroupId);
          remainingStacks.set(card.uid, this.board.getStackGroupSize(card.uid));
        }
      } else {
        remainingStacks.set(card.uid, card.stackCount);
      }
    }

    for (const input of recipe.inputs) {
      let needed = input.count;

      for (const card of availableCards) {
        if (needed <= 0) break;
        // Specialized villagers can act as regular villagers
        const cardMatches = card.defId === input.defId ||
          (input.defId === 'villager' && ['builder', 'farmer', 'hunter'].includes(card.defId));
        if (!cardMatches) continue;

        const available = remainingStacks.get(card.uid) || 0;
        if (available <= 0) continue;

        const used = Math.min(needed, available);
        needed -= used;
        remainingStacks.set(card.uid, available - used);

        // Track cumulative consumption for this card
        const prevCount = consumeCounts.get(card.uid) || 0;
        consumeCounts.set(card.uid, prevCount + used);

        // Track card in appropriate list
        if (input.consumed) {
          if (!consumedUids.includes(card.uid)) {
            consumedUids.push(card.uid);
          }
        } else {
          if (!nonConsumedUids.includes(card.uid)) {
            nonConsumedUids.push(card.uid);
          }
        }
      }

      if (needed > 0) return null; // not enough matching cards
    }

    return { consumed: consumedUids, nonConsumed: nonConsumedUids, consumeCounts };
  }

  // ========================================================================
  // Public Utilities
  // ========================================================================

  /**
   * Clear all tracked active recipes (e.g., on game reset).
   */
  reset(): void {
    this.activeRecipes.clear();
  }

  /**
   * Serialize all active timed recipes for saving.
   * Returns lightweight data that can be stored in the game state and
   * restored later via restoreActiveRecipes().
   */
  getActiveRecipesData(): SerializedActiveRecipe[] {
    const result: SerializedActiveRecipe[] = [];
    for (const [uid, active] of this.activeRecipes) {
      // Convert Map to plain object for JSON serialization
      const consumeCountsObj: Record<string, number> = {};
      for (const [key, value] of active.consumeCounts) {
        consumeCountsObj[key] = value;
      }
      result.push({
        uid,
        recipeId: active.recipe.id,
        lockedUids: active.lockedUids,
        consumedUids: active.consumedUids,
        consumeCounts: consumeCountsObj,
        spawnX: active.spawnX,
        spawnY: active.spawnY,
      });
    }
    return result;
  }

  /**
   * Restore active timed recipes from saved data (e.g., after loading a save).
   * Looks up each recipe by its id in the recipe table. If a recipe is no
   * longer in the table (e.g., mod removed), that entry is silently skipped.
   */
  restoreActiveRecipes(data: SerializedActiveRecipe[]): void {
    this.activeRecipes.clear();
    for (const item of data) {
      const recipe = getRecipeById(item.recipeId);
      if (!recipe) continue;

      // Convert plain object back to Map
      const consumeCounts = new Map<string, number>();
      if (item.consumeCounts) {
        for (const [key, value] of Object.entries(item.consumeCounts)) {
          consumeCounts.set(key, value);
        }
      }

      this.activeRecipes.set(item.uid, {
        recipe,
        lockedUids: item.lockedUids,
        consumedUids: item.consumedUids,
        consumeCounts,
        spawnX: item.spawnX,
        spawnY: item.spawnY,
      });
    }
  }

  /**
   * Check if a specific card UID is part of an active timed recipe.
   */
  isCardInActiveRecipe(uid: string): boolean {
    for (const active of this.activeRecipes.values()) {
      if (active.lockedUids.includes(uid)) return true;
    }
    return false;
  }

  /**
   * Determine if a recipe qualifies for the seasonal harvest bonus.
   * Gathering recipes (villager + resource node) qualify.
   * Returns 0 or the current harvest bonus value.
   */
  private getHarvestBonusForRecipe(recipe: Recipe): number {
    if (this.gameState.harvestBonus <= 0) return 0;
    if (recipe.id.startsWith('eat_')) return 0;
    if (recipe.id.startsWith('fight_')) return 0;

    // Gathering recipes have a non-consumed input that is a resource node
    const hasResourceNode = recipe.inputs.some(
      (inp) => !inp.consumed && getCardDef(inp.defId)?.timerTemplate !== undefined
    );
    if (hasResourceNode) {
      return this.gameState.harvestBonus;
    }
    return 0;
  }

  /**
   * Cancel any active recipe that involves the given card UID.
   * Unlocks all other locked cards, clears the host timer, and removes
   * the recipe from tracking. Used when a card dies mid-recipe (e.g.,
   * villager starvation).
   */
  cancelRecipeForCard(uid: string): void {
    for (const [hostUid, active] of this.activeRecipes.entries()) {
      if (active.lockedUids.includes(uid)) {
        // Unlock all other cards locked in this recipe
        const otherUids = active.lockedUids.filter((u) => u !== uid);
        this.gameState.unlockCards(otherUids);

        // Clear the timer on the host card (if it hasn't already been removed)
        const hostCard = this.gameState.findCard(hostUid);
        if (hostCard && hostCard.currentTimer) {
          hostCard.currentTimer = undefined;
          const hostEntity = this.board.getEntity(hostUid);
          if (hostEntity) {
            hostEntity.dirty = true;
          }
        }

        // Remove this recipe from tracking
        this.activeRecipes.delete(hostUid);
        return;
      }
    }
  }
}
