/**
 * Serialize and deserialize game state for save/load.
 */
import type { SerializedGameState } from '../../../src/protocol/messages';
import { GameState } from './GameState';

export function serializeState(gameState: GameState): SerializedGameState {
  return gameState.toJSON();
}

export function deserializeState(
  gameState: GameState,
  data: SerializedGameState
): void {
  gameState.fromJSON(data);
}
