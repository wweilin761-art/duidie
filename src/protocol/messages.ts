/**
 * Shared message types between Extension Host and Webview.
 * This file is imported by both src/ (Node) and webview-ui/src/ (Browser),
 * but only the type definitions — no runtime code.
 */

// ============================================================
// Core game types (also used in webview)
// ============================================================

export enum CardCategory {
  Resource = 'resource',
  Food = 'food',
  Villager = 'villager',
  Building = 'building',
  Tool = 'tool',
  Enemy = 'enemy',
  Idea = 'idea',
  Special = 'special',
}

export interface CardDef {
  id: string;
  name: string;
  category: CardCategory;
  tier: number;
  stackable: boolean;
  maxStack: number;
  sellValue: number;
  icon: string;
  description: string;
  color: string;
  timerTemplate?: {
    duration: number;
    label: string;
    product?: string;
  };
}

export interface CardTimer {
  duration: number;
  remaining: number;
  label: string;
  product?: string;
}

export interface VillagerState {
  hunger: number;
  maxHunger: number;
  isStarving: boolean;
  assignedCardId?: string;
}

export interface EnemyState {
  health: number;
  maxHealth: number;
  damage: number;
}

export interface CardInstance {
  uid: string;
  defId: string;
  position: { x: number; y: number };
  stackCount: number;
  currentTimer?: CardTimer;
  villagerState?: VillagerState;
  enemyState?: EnemyState;
  locked: boolean;
}

export interface SerializedActiveRecipe {
  uid: string;
  recipeId: string;
  lockedUids: string[];
  consumedUids: string[];
  /** Per-UID count of how many from the consumed card's stack are used */
  consumeCounts: Record<string, number>;
  spawnX: number;
  spawnY: number;
}

export type GameStatus = 'playing' | 'victory' | 'defeat';

export type SerializedProductionTimers = Record<string, number>;

export type SerializedBattleCooldowns = Record<string, number>;

export interface SerializedGameState {
  cards: CardInstance[];
  month: number;
  day: number;
  elapsedGameTime: number;
  coins: number;
  unlockedRecipes: string[];
  speedMultiplier?: number;
  paused?: boolean;
  eventHungerModifier?: number;
  version: string;
  recipesData?: SerializedActiveRecipe[];
  stackGroups?: Record<string, string[]>;
  unlockedTechs?: string[];
  storyFlags?: string[];
  storyCards?: string[];
  productionTimers?: SerializedProductionTimers;
  battleCooldowns?: SerializedBattleCooldowns;
  gameStatus?: GameStatus;
  lastStoryDialogId?: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  autosaveInterval: number;
}

// ============================================================
// Message types: Webview → Extension
// ============================================================

export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'saveRequest'; slotIndex: number; state: SerializedGameState }
  | { type: 'loadRequest'; slotIndex: number }
  | { type: 'autoSave'; state: SerializedGameState }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string }
  | { type: 'requestSettings' }
  | { type: 'clearSaves' };

// ============================================================
// Message types: Extension → Webview
// ============================================================

export type ExtensionMessage =
  | { type: 'loadResponse'; slotIndex: number; state: SerializedGameState | null; error?: string }
  | { type: 'saveResponse'; slotIndex: number; success: boolean; error?: string }
  | { type: 'settingsUpdate'; settings: GameSettings }
  | { type: 'themeChanged'; theme: 'dark' | 'light' | 'highContrast' }
  | { type: 'resetGame' }
  | { type: 'clearSavesResponse'; success: boolean };

// ============================================================
// Save slot structure
// ============================================================

export interface SaveSlot {
  slotName: string;
  timestamp: number;
  version: string;
  gameStateJson: string;
}
