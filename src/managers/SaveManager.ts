import * as vscode from 'vscode';
import type { SerializedGameState, SaveSlot } from '../protocol/messages';

export class SaveManager {
  private static readonly SAVE_KEY_PREFIX = 'stacklands.save.';
  /** Current game version — saves from older versions will be rejected. */
  private static readonly CURRENT_VERSION = '1.1.0';

  constructor(private readonly context: vscode.ExtensionContext) {}

  async save(slotIndex: number, state: SerializedGameState): Promise<void> {
    const slot: SaveSlot = {
      slotName: `Save ${slotIndex}`,
      timestamp: Date.now(),
      version: state.version,
      gameStateJson: JSON.stringify(state),
    };
    await this.context.globalState.update(
      `${SaveManager.SAVE_KEY_PREFIX}${slotIndex}`,
      slot
    );
  }

  async load(slotIndex: number): Promise<SerializedGameState | null> {
    const slot = this.context.globalState.get<SaveSlot>(
      `${SaveManager.SAVE_KEY_PREFIX}${slotIndex}`
    );
    if (!slot) {
      return null;
    }
    // Version check: reject saves from older or different versions
    if (slot.version !== SaveManager.CURRENT_VERSION) {
      console.log(
        `[Stacklands] Save slot ${slotIndex} version mismatch (saved: ${slot.version}, current: ${SaveManager.CURRENT_VERSION}). Discarding old save.`
      );
      await this.clearSlot(slotIndex);
      return null;
    }
    try {
      return JSON.parse(slot.gameStateJson) as SerializedGameState;
    } catch {
      return null;
    }
  }

  /** Clear all 5 save slots. */
  async clearAll(): Promise<void> {
    for (let i = 0; i < 5; i++) {
      await this.clearSlot(i);
    }
  }

  /** Clear a single save slot. */
  async clearSlot(slotIndex: number): Promise<void> {
    await this.context.globalState.update(
      `${SaveManager.SAVE_KEY_PREFIX}${slotIndex}`,
      undefined
    );
  }

  async listSlots(): Promise<{ index: number; timestamp: number; name: string }[]> {
    const slots: { index: number; timestamp: number; name: string }[] = [];
    // Check up to 5 save slots
    for (let i = 0; i < 5; i++) {
      const slot = this.context.globalState.get<SaveSlot>(
        `${SaveManager.SAVE_KEY_PREFIX}${i}`
      );
      if (slot) {
        slots.push({
          index: i,
          timestamp: slot.timestamp,
          name: slot.slotName,
        });
      }
    }
    return slots;
  }

  getConfig(): { autosaveInterval: number; soundEnabled: boolean } {
    const config = vscode.workspace.getConfiguration('stacklands');
    return {
      autosaveInterval: config.get<number>('autosaveInterval', 120),
      soundEnabled: config.get<boolean>('soundEnabled', true),
    };
  }
}
