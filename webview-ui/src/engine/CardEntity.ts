/**
 * CardEntity — bridges game data with DOM representation.
 * Each visible card on the board is an instance of this class.
 */
import type { CardInstance, CardDef } from '../../../src/protocol/messages';
import { getCardDef } from '../data/cards';

export class CardEntity {
  readonly uid: string;
  data: CardInstance;
  def: CardDef;
  el: HTMLDivElement;

  // Stack group: if this card belongs to a stack group, this is the group ID.
  // null means the card is not in any stack group.
  stackGroupId: string | null = null;

  // Dirty flags for efficient DOM updates
  dirty = true;
  needsRemoval = false;

  // Drag state
  isDragging = false;

  constructor(data: CardInstance) {
    this.uid = data.uid;
    this.data = data;
    this.def = getCardDef(data.defId)!;
    this.el = this.createElement();
  }

  /** Returns true if this card belongs to a stack group */
  isInStack(): boolean {
    return this.stackGroupId !== null;
  }

  /** Create the DOM element for this card */
  private createElement(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'card entering';
    el.setAttribute('data-uid', this.uid);
    el.setAttribute('data-defid', this.data.defId);
    el.setAttribute('data-category', this.def.category);
    el.setAttribute('data-tier', String(this.def.tier));
    el.style.left = `${this.data.position.x}px`;
    el.style.top = `${this.data.position.y}px`;
    el.style.zIndex = '1';

    // Icon circle wrapper
    const iconCircle = document.createElement('div');
    iconCircle.className = 'card-icon-circle';

    const icon = document.createElement('div');
    icon.className = 'card-icon';
    icon.textContent = this.def.icon;
    iconCircle.appendChild(icon);
    el.appendChild(iconCircle);

    // Name
    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = this.def.name;
    el.appendChild(name);

    // Stack count badge is no longer rendered.
    // Stack size is shown visually via Spider Solitaire-style overlapping cards.

    // Timer bar (hidden by default)
    const timerBar = document.createElement('div');
    timerBar.className = 'card-timer-bar';
    timerBar.style.display = 'none';
    const timerFill = document.createElement('div');
    timerFill.className = 'card-timer-fill';
    timerBar.appendChild(timerFill);
    el.appendChild(timerBar);

    const timerLabel = document.createElement('div');
    timerLabel.className = 'card-timer-label';
    timerLabel.style.display = 'none';
    el.appendChild(timerLabel);

    // Hunger bar (for villagers)
    if (this.data.villagerState) {
      const hungerBar = document.createElement('div');
      hungerBar.className = 'card-hunger-bar';
      const hungerFill = document.createElement('div');
      hungerFill.className = 'card-hunger-fill';
      hungerFill.style.width = `${this.data.villagerState.hunger}%`;
      hungerBar.appendChild(hungerFill);
      el.appendChild(hungerBar);

      // Apply starving class if needed at creation
      if (this.data.villagerState.isStarving) {
        el.classList.add('starving');
      }
    }

    // Health bar (for enemies) — separate class for thicker bar
    if (this.data.enemyState) {
      const healthBar = document.createElement('div');
      healthBar.className = 'card-health-bar';
      const healthFill = document.createElement('div');
      healthFill.className = 'card-health-fill';
      healthFill.style.width = `${
        (this.data.enemyState.health / this.data.enemyState.maxHealth) * 100
      }%`;
      healthBar.appendChild(healthFill);
      el.appendChild(healthBar);
    }

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'card-tooltip';
    tooltip.textContent = this.def.description;
    el.appendChild(tooltip);

    return el;
  }

  /** Sync the DOM element with current data state */
  syncDOM(): void {
    const el = this.el;

    // --- Critical states: always sync (ignoring dirty flag) ---
    // Lock state — must always be up-to-date for drag interaction
    if (this.data.locked) {
      el.classList.add('locked');
    } else {
      el.classList.remove('locked');
    }

    // Timer — must update even when dirty=false (timer reaches 0)
    const timerBar = el.querySelector('.card-timer-bar') as HTMLDivElement;
    const timerFill = el.querySelector('.card-timer-fill') as HTMLDivElement;
    const timerLabel = el.querySelector('.card-timer-label') as HTMLDivElement;
    if (timerBar && timerFill && timerLabel) {
      if (this.data.currentTimer) {
        timerBar.style.display = 'block';
        timerLabel.style.display = 'block';
        const pct =
          (this.data.currentTimer.remaining /
            this.data.currentTimer.duration) *
          100;
        timerFill.style.width = `${pct}%`;
        timerLabel.textContent = this.data.currentTimer.label;
        el.setAttribute('data-timer-label', this.data.currentTimer.label);
      } else {
        timerBar.style.display = 'none';
        timerLabel.style.display = 'none';
        el.removeAttribute('data-timer-label');
      }
    }

    // Starving state — affects interactivity hints
    if (this.data.villagerState) {
      if (this.data.villagerState.isStarving) {
        el.classList.add('starving');
      } else {
        el.classList.remove('starving');
      }
    }

    // --- Dirty-gated updates (position changes are expensive) ---
    if (!this.dirty) return;
    this.dirty = false;

    // Position
    el.style.left = `${this.data.position.x}px`;
    el.style.top = `${this.data.position.y}px`;

    // Stacked visual class and depth indicator
    if (this.stackGroupId) {
      el.classList.add('stacked');
      // Depth attribute for CSS: set by Board when updating stack positions
    } else {
      el.classList.remove('stacked');
      el.removeAttribute('data-stack-depth');
    }

    // Hunger bar fill
    if (this.data.villagerState) {
      const hungerFill = el.querySelector('.card-hunger-fill') as HTMLDivElement;
      if (hungerFill) {
        const pct = this.data.villagerState.hunger;
        hungerFill.style.width = `${pct}%`;
        if (this.data.villagerState.isStarving) {
          hungerFill.style.background = '#cc0000';
        } else if (pct < 50) {
          hungerFill.style.background = '#cc6600';
        } else {
          hungerFill.style.background = '#4ec94e';
        }
      }
    }

    // Health bar
    if (this.data.enemyState) {
      const healthFill = el.querySelector(
        '.card-health-fill'
      ) as HTMLDivElement;
      if (healthFill) {
        const pct =
          (this.data.enemyState.health /
            this.data.enemyState.maxHealth) *
          100;
        healthFill.style.width = `${pct}%`;
      }
    }

    // Z-index
    if (this.isDragging) {
      el.style.zIndex = '1000';
    } else {
      el.style.zIndex = '1';
    }
  }

  /** Mark as entering (for animation) — slight rotation and scale spring. */
  playEnterAnimation(): void {
    this.el.classList.remove('entering');
    void this.el.offsetWidth; // Force reflow
    // Randomize starting rotation for variety
    const startRot = (Math.random() - 0.5) * 15;
    this.el.style.setProperty('--enter-rotation', `${startRot}deg`);
    this.el.classList.add('entering');
  }

  /** Mark as leaving (for removal animation) — disintegration effect. */
  playLeaveAnimation(): void {
    this.el.classList.add('leaving');
  }

  /** Play combine effect — white flash frame before scale bounce. */
  playCombineAnimation(): void {
    // Create a flash overlay
    const flash = document.createElement('div');
    flash.className = 'card-combine-flash';
    flash.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(255, 255, 255, 0.6);
      border-radius: var(--card-radius);
      pointer-events: none;
      z-index: 10;
      animation: combine-flash 0.15s ease-out forwards;
    `;
    this.el.appendChild(flash);

    // Remove flash after animation
    setTimeout(() => flash.remove(), 160);

    // Then play the scale bounce
    this.el.classList.add('combining');
    setTimeout(() => this.el.classList.remove('combining'), 350);
  }

  /** Clean up the DOM element */
  dispose(): void {
    this.el.remove();
  }
}
