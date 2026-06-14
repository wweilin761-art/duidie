/**
 * VillagerAI — manages villager-specific behaviors:
 * - Hunger depletion
 * - Eating to restore hunger
 * - Auto-assign tasks to nearby resource nodes
 */
import type { CardInstance } from '../../../src/protocol/messages';
import { GameState } from '../state/GameState';

const HUNGER_RESTORE_BERRY = 25;
const HUNGER_RESTORE_APPLE = 30;
const HUNGER_RESTORE_COOKED_MEAT = 60;
const HUNGER_RESTORE_BREAD = 45;

export class VillagerAI {
  /**
   * Restore villager hunger from eating a specific food type.
   * Returns the amount restored.
   */
  restoreHunger(villager: CardInstance, foodDefId: string): number {
    if (!villager.villagerState) return 0;

    let amount = 0;
    switch (foodDefId) {
      case 'berry':        amount = HUNGER_RESTORE_BERRY; break;
      case 'apple':        amount = HUNGER_RESTORE_APPLE; break;
      case 'cooked_meat':  amount = HUNGER_RESTORE_COOKED_MEAT; break;
      case 'bread':        amount = HUNGER_RESTORE_BREAD; break;
      default:             amount = 15; break;
    }

    villager.villagerState.hunger = Math.min(
      villager.villagerState.maxHunger,
      villager.villagerState.hunger + amount
    );
    villager.villagerState.isStarving = villager.villagerState.hunger < 20;

    return amount;
  }

  /**
   * Find an idle villager near a given position.
   */
  findIdleVillager(
    gameState: GameState,
    x: number,
    y: number,
    radius: number = 150
  ): CardInstance | undefined {
    const nearby = gameState.getCardsInRadius(x, y, radius);
    return nearby.find(
      (c) =>
        c.defId === 'villager' &&
        !c.locked &&
        !c.villagerState?.assignedCardId
    );
  }

  /**
   * Auto-assign idle villagers to nearby resource nodes.
   */
  autoAssignTasks(gameState: GameState): void {
    const resourceNodes = ['tree', 'rock', 'berry_bush', 'iron_deposit', 'farm'];

    for (const card of gameState.cards) {
      if (
        card.defId === 'villager' &&
        !card.locked &&
        !card.villagerState?.assignedCardId
      ) {
        // Look for nearby resource nodes
        const nearby = gameState
          .getCardsInRadius(card.position.x, card.position.y, 100)
          .filter(
            (c) => resourceNodes.includes(c.defId) && !c.locked
          );

        if (nearby.length > 0) {
          // Assign to the first nearby node
          const node = nearby[0];
          card.villagerState!.assignedCardId = node.uid;
        }
      }
    }
  }
}
