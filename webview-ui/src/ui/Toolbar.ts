/**
 * Toolbar — top bar with game controls and status displays.
 *
 * Layout groups (left to right):
 *   [⏸暂停] | [1x|2x|3x] | <separator> | 月/日 values | 金币 value | <spacer>
 *   [💾保存] [📂加载] [🛒商店] [📖配方] [科技] [指南]
 */

import { SeasonManager, Season } from '../engine/SeasonManager';

export interface ToolbarCallbacks {
  onTogglePause: () => void;
  onSetSpeed: (speed: number) => void;
  onSave: () => void;
  onLoad: () => void;
  onShop?: () => void;
  onRecipes?: () => void;
  onTech?: () => void;
  onTutorial?: () => void;
}

export class Toolbar {
  private el: HTMLDivElement;
  private pauseBtn: HTMLButtonElement;
  private speed1xBtn: HTMLButtonElement;
  private speed2xBtn: HTMLButtonElement;
  private speed3xBtn: HTMLButtonElement;
  private monthLabel: HTMLSpanElement;
  private dayLabel: HTMLSpanElement;
  private seasonIcon: HTMLSpanElement;
  private coinLabel: HTMLSpanElement;
  private saveBtn: HTMLButtonElement;
  private loadBtn: HTMLButtonElement;
  private shopBtn: HTMLButtonElement;
  private recipeBtn: HTMLButtonElement;
  private techBtn: HTMLButtonElement;
  private tutorialBtn: HTMLButtonElement;
  private monthProgressBar: HTMLDivElement;
  private monthProgressFill: HTMLDivElement;

  private callbacks: ToolbarCallbacks;
  private currentPaused = false;
  private currentSpeed = 1;
  private seasonManager: SeasonManager;

  /** Days per month (fixed at 30) */
  private static readonly DAYS_PER_MONTH = 30;

  constructor(container: HTMLElement, callbacks: ToolbarCallbacks) {
    this.callbacks = callbacks;
    this.seasonManager = new SeasonManager();

    this.el = document.createElement('div');
    this.el.id = 'toolbar';

    // ---- Pause / Play button ----
    this.pauseBtn = document.createElement('button');
    this.pauseBtn.textContent = '⏸ 暂停'; // ⏸ 暂停
    this.pauseBtn.addEventListener('click', () => {
      this.callbacks.onTogglePause();
    });
    this.el.appendChild(this.pauseBtn);

    // ---- Segmented speed group ----
    const speedGroup = document.createElement('div');
    speedGroup.className = 'speed-group';

    this.speed1xBtn = document.createElement('button');
    this.speed1xBtn.textContent = '1x';
    this.speed1xBtn.addEventListener('click', () => {
      this.callbacks.onSetSpeed(1);
    });
    speedGroup.appendChild(this.speed1xBtn);

    this.speed2xBtn = document.createElement('button');
    this.speed2xBtn.textContent = '2x';
    this.speed2xBtn.addEventListener('click', () => {
      this.callbacks.onSetSpeed(2);
    });
    speedGroup.appendChild(this.speed2xBtn);

    this.speed3xBtn = document.createElement('button');
    this.speed3xBtn.textContent = '3x';
    this.speed3xBtn.addEventListener('click', () => {
      this.callbacks.onSetSpeed(3);
    });
    speedGroup.appendChild(this.speed3xBtn);

    this.el.appendChild(speedGroup);

    // ---- Separator ----
    const sep1 = document.createElement('div');
    sep1.className = 'toolbar-separator';
    this.el.appendChild(sep1);

    // ---- Date display ----
    const dateGroup = document.createElement('span');
    dateGroup.className = 'toolbar-label';

    const monthPrefix = document.createElement('span');
    monthPrefix.textContent = '月 '; // 月

    this.monthLabel = document.createElement('span');
    this.monthLabel.className = 'toolbar-value';

    const dayPrefix = document.createElement('span');
    dayPrefix.textContent = ' 日 '; // 日

    this.dayLabel = document.createElement('span');
    this.dayLabel.className = 'toolbar-value';

    dateGroup.appendChild(monthPrefix);
    dateGroup.appendChild(this.monthLabel);
    dateGroup.appendChild(dayPrefix);
    dateGroup.appendChild(this.dayLabel);
    this.el.appendChild(dateGroup);

    // ---- Month progress bar ----
    this.monthProgressBar = document.createElement('div');
    this.monthProgressBar.className = 'month-progress-bar';
    this.monthProgressFill = document.createElement('div');
    this.monthProgressFill.className = 'month-progress-fill';
    this.monthProgressBar.appendChild(this.monthProgressFill);
    this.el.appendChild(this.monthProgressBar);

    // ---- Season icon ----
    this.seasonIcon = document.createElement('span');
    this.seasonIcon.className = 'toolbar-season-icon';
    this.seasonIcon.textContent = this.seasonManager.getSeasonIcon(
      this.seasonManager.getSeason(1)
    );
    this.seasonIcon.title = this.seasonManager.getSeasonName(
      this.seasonManager.getSeason(1)
    );
    this.el.appendChild(this.seasonIcon);

    // ---- Coin display ----
    const coinGroup = document.createElement('span');
    coinGroup.className = 'toolbar-label';

    const coinPrefix = document.createElement('span');
    coinPrefix.textContent = '金币：'; // 金币：

    this.coinLabel = document.createElement('span');
    this.coinLabel.className = 'toolbar-value coin-value';

    coinGroup.appendChild(coinPrefix);
    coinGroup.appendChild(this.coinLabel);
    this.el.appendChild(coinGroup);

    // ---- Spacer ----
    const spacer = document.createElement('div');
    spacer.className = 'toolbar-spacer';
    this.el.appendChild(spacer);

    // ---- Action buttons ----
    this.saveBtn = document.createElement('button');
    this.saveBtn.textContent = '💾 保存'; // 💾 保存
    this.saveBtn.addEventListener('click', () => {
      this.callbacks.onSave();
    });
    this.el.appendChild(this.saveBtn);

    this.loadBtn = document.createElement('button');
    this.loadBtn.textContent = '📂 加载'; // 📂 加载
    this.loadBtn.addEventListener('click', () => {
      this.callbacks.onLoad();
    });
    this.el.appendChild(this.loadBtn);

    // ---- Separator ----
    const sep2 = document.createElement('div');
    sep2.className = 'toolbar-separator';
    this.el.appendChild(sep2);

    // ---- Shop button ----
    this.shopBtn = document.createElement('button');
    this.shopBtn.textContent = '🛒 商店'; // 🛒 商店
    this.shopBtn.addEventListener('click', () => {
      this.callbacks.onShop?.();
    });
    this.el.appendChild(this.shopBtn);

    // ---- Recipe book button ----
    this.recipeBtn = document.createElement('button');
    this.recipeBtn.textContent = '📖 配方'; // 📖 配方
    this.recipeBtn.addEventListener('click', () => {
      this.callbacks.onRecipes?.();
    });
    this.el.appendChild(this.recipeBtn);

    // ---- Tech book button ----
    this.techBtn = document.createElement('button');
    this.techBtn.textContent = '科技';
    this.techBtn.title = '打开科技手册';
    this.techBtn.addEventListener('click', () => {
      this.callbacks.onTech?.();
    });
    this.el.appendChild(this.techBtn);

    // ---- Tutorial button ----
    this.tutorialBtn = document.createElement('button');
    this.tutorialBtn.textContent = '?';
    this.tutorialBtn.title = '打开生存指南';
    this.tutorialBtn.className = 'toolbar-icon-button';
    this.tutorialBtn.addEventListener('click', () => {
      this.callbacks.onTutorial?.();
    });
    this.el.appendChild(this.tutorialBtn);

    container.appendChild(this.el);
  }

  /**
   * Update all toolbar display values.
   */
  update(month: number, day: number, coins: number, paused: boolean, speed: number, season?: Season): void {
    // Month / day
    this.monthLabel.textContent = String(month);
    this.dayLabel.textContent = String(day);

    // Season icon (update only when season changes)
    if (season !== undefined) {
      const icon = this.seasonManager.getSeasonIcon(season);
      const name = this.seasonManager.getSeasonName(season);
      if (this.seasonIcon.textContent !== icon) {
        this.seasonIcon.textContent = icon;
        this.seasonIcon.title = name;
      }
    }

    // Month progress bar
    const progressPct = Math.min((day / Toolbar.DAYS_PER_MONTH) * 100, 100);
    this.monthProgressFill.style.width = `${progressPct}%`;

    // Color transitions: spring green → summer gold → autumn orange → winter blue
    const seasonIndex = (month - 1) % 12; // 0-based month
    let barColor: string;
    if (seasonIndex < 3) {
      // Spring (months 1-3): green
      barColor = '#4ec94e';
    } else if (seasonIndex < 6) {
      // Summer (months 4-6): gold
      barColor = '#ffcc00';
    } else if (seasonIndex < 9) {
      // Autumn (months 7-9): orange
      barColor = '#ff8800';
    } else {
      // Winter (months 10-12): blue
      barColor = '#4ea0e0';
    }
    this.monthProgressFill.style.background = barColor;

    // Coins
    this.coinLabel.textContent = String(coins);

    // Pause button
    if (paused !== this.currentPaused) {
      this.currentPaused = paused;
      if (paused) {
        this.pauseBtn.textContent = '▶ 继续'; // ▶ 继续
        this.pauseBtn.classList.add('active');
      } else {
        this.pauseBtn.textContent = '⏸ 暂停'; // ⏸ 暂停
        this.pauseBtn.classList.remove('active');
      }
    }

    // Speed buttons
    if (speed !== this.currentSpeed) {
      this.currentSpeed = speed;
      this.speed1xBtn.classList.toggle('active', speed === 1);
      this.speed2xBtn.classList.toggle('active', speed === 2);
      this.speed3xBtn.classList.toggle('active', speed === 3);
    }
  }

  get element(): HTMLDivElement {
    return this.el;
  }
}
