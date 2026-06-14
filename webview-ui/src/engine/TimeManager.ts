/**
 * TimeManager — game clock, speed control, month/day tracking.
 */
export interface TimeTickResult {
  advanced: boolean;
  deltaGame: number;
  monthAdvanced: boolean;
  newMonth: number;
  newDay: number;
}

export class TimeManager {
  elapsedGameTime: number = 0;
  speedMultiplier: number = 1;
  paused: boolean = false;

  /** Game seconds per month (at 1x speed) */
  monthDuration: number = 300; // 5 real minutes

  /** Game days per month */
  daysPerMonth: number = 30;

  get currentMonth(): number {
    return Math.floor(this.elapsedGameTime / this.monthDuration) + 1;
  }

  get currentDay(): number {
    const dayInMonth =
      (this.elapsedGameTime % this.monthDuration) /
      (this.monthDuration / this.daysPerMonth);
    return Math.floor(dayInMonth) + 1;
  }

  /**
   * Advance game time by delta wall-clock seconds.
   * Returns info about what happened during this tick.
   */
  tick(deltaWallSeconds: number): TimeTickResult {
    if (this.paused) {
      return {
        advanced: false,
        deltaGame: 0,
        monthAdvanced: false,
        newMonth: this.currentMonth,
        newDay: this.currentDay,
      };
    }

    const prevMonth = this.currentMonth;
    const deltaGame = deltaWallSeconds * this.speedMultiplier;
    this.elapsedGameTime += deltaGame;

    const monthAdvanced = this.currentMonth !== prevMonth;

    return {
      advanced: true,
      deltaGame,
      monthAdvanced,
      newMonth: this.currentMonth,
      newDay: this.currentDay,
    };
  }

  /** Reset the time manager */
  reset(): void {
    this.elapsedGameTime = 0;
    this.speedMultiplier = 1;
    this.paused = false;
  }
}
