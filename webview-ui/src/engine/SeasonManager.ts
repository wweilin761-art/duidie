/**
 * SeasonManager — tracks the current season based on month and provides
 * season-dependent gameplay modifiers.
 *
 * Season cycle:
 *   Months 1-3:  春 (Spring) — normal rates
 *   Months 4-6:  夏 (Summer) — food grows 1.5x faster
 *   Months 7-9:  秋 (Autumn) — harvest yields +1 extra
 *   Months 10-12: 冬 (Winter) — hunger 2x faster, regen 2x slower
 */

export enum Season {
  Spring,
  Summer,
  Autumn,
  Winter,
}

export class SeasonManager {
  /** Current harvest bonus, set per-month so RecipeEngine can read it. */
  static currentHarvestBonus: number = 0;

  /** Extra hunger multiplier from seasonal events (heatwave, blizzard). */
  static eventHungerModifier: number = 1.0;

  /**
   * Determine the season for a given 1-based month.
   */
  getSeason(month: number): Season {
    const m = ((month - 1) % 12) + 1; // normalise to 1-12
    if (m <= 3) return Season.Spring;
    if (m <= 6) return Season.Summer;
    if (m <= 9) return Season.Autumn;
    return Season.Winter;
  }

  /**
   * Hunger depletion multiplier for the given season.
   * Winter: 2.0 (hunger depletes twice as fast).
   */
  getHungerMultiplier(season: Season): number {
    switch (season) {
      case Season.Winter: return 2.0;
      default: return 1.0;
    }
  }

  /**
   * Bonus harvest yield for the given season.
   * Autumn: +1 extra item from gathering recipes.
   */
  getHarvestBonus(season: Season): number {
    switch (season) {
      case Season.Autumn: return 1;
      default: return 0;
    }
  }

  /**
   * Resource-node regeneration speed multiplier.
   * Summer: 1.5 (50% faster).  Winter: 0.5 (50% slower).
   */
  getRegenMultiplier(season: Season): number {
    switch (season) {
      case Season.Summer: return 1.5;
      case Season.Winter: return 0.5;
      default: return 1.0;
    }
  }

  /**
   * Human-readable season name in Chinese.
   */
  getSeasonName(season: Season): string {
    switch (season) {
      case Season.Spring: return '春';
      case Season.Summer: return '夏';
      case Season.Autumn: return '秋';
      case Season.Winter: return '冬';
    }
  }

  /**
   * Emoji icon for the season.
   */
  getSeasonIcon(season: Season): string {
    switch (season) {
      case Season.Spring: return '\u{1F338}';  // 🌸
      case Season.Summer: return '\u{2600}\u{FE0F}'; // ☀️
      case Season.Autumn: return '\u{1F342}'; // 🍂
      case Season.Winter: return '\u{2744}\u{FE0F}';  // ❄️
    }
  }
}
