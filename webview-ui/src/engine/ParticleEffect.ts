/**
 * ParticleEffect — lightweight DOM-based particle system.
 *
 * Particles are small absolutely-positioned <div> elements animated with CSS
 * @keyframes. Keyframes are injected into document.head once on first use.
 * Each particle self-removes after its animation completes.
 */

/** Track whether the shared keyframe stylesheet has been injected. */
let keyframesInjected = false;

/** Duration range for burst animations (ms). */
const BURST_DURATION_MIN = 350;
const BURST_DURATION_MAX = 600;

/** Duration range for float-up animations (ms). */
const FLOAT_DURATION_MIN = 500;
const FLOAT_DURATION_MAX = 800;

/**
 * Inject the shared @keyframes and .particle base class into document.head.
 * Safe to call multiple times — only injects once.
 */
function ensureKeyframes(): void {
  if (keyframesInjected) return;
  keyframesInjected = true;

  const style = document.createElement('style');
  style.setAttribute('data-particle-keyframes', '');
  style.textContent = `
    @keyframes particle-burst-up {
      0%   { opacity: 1; transform: translate(0, 0) scale(1); }
      100% { opacity: 0; transform: translate(var(--dx), calc(var(--dy) - 15px)) scale(0); }
    }
    @keyframes particle-burst-down {
      0%   { opacity: 1; transform: translate(0, 0) scale(1); }
      100% { opacity: 0; transform: translate(var(--dx), calc(var(--dy) + 15px)) scale(0); }
    }
    @keyframes particle-burst-out {
      0%   { opacity: 1; transform: translate(0, 0) scale(1); }
      100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0); }
    }
    @keyframes particle-float-up {
      0%   { opacity: 0;   transform: translate(0, 12px) scale(0.4); }
      25%  { opacity: 1;   transform: translate(0, -4px) scale(1.15); }
      100% { opacity: 0;   transform: translate(0, -42px) scale(0.25); }
    }
    @keyframes particle-spawn-burst {
      0%   { opacity: 0;   transform: translate(0, 0) scale(0); }
      40%  { opacity: 1;   transform: translate(var(--dx), var(--dy)) scale(1.15); }
      100% { opacity: 0;   transform: translate(calc(var(--dx) * 2), calc(var(--dy) * 2)) scale(0.15); }
    }
    @keyframes particle-golden-spark {
      0%   { opacity: 0.8; transform: translate(0, 0) scale(0.6) rotate(0deg); }
      50%  { opacity: 1;   transform: translate(var(--dx), var(--dy)) scale(1) rotate(90deg); }
      100% { opacity: 0;   transform: translate(calc(var(--dx) * 1.8), calc(var(--dy) * 1.8)) scale(0.1) rotate(180deg); }
    }
    @keyframes particle-shatter {
      0%   { opacity: 0.9; transform: translate(0, 0) scale(1); }
      100% { opacity: 0;   transform: translate(var(--dx), calc(var(--dy) + 5px)) scale(0); }
    }
    .particle {
      position: absolute;
      pointer-events: none;
      z-index: 99999;
      border-radius: 50%;
      will-change: transform, opacity;
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a random float in [min, max). */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Pick a random element from an array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// ParticleEffect
// ---------------------------------------------------------------------------

export class ParticleEffect {
  /**
   * Spawn a burst of particles at a position.
   *
   * @param container - DOM element to spawn particles in (typically Board.viewportElement)
   * @param x         - Center X in board coordinates (px)
   * @param y         - Center Y in board coordinates (px)
   * @param color     - Base color for particles
   * @param count     - Number of particles (default 8)
   */
  static burst(
    container: HTMLElement,
    x: number,
    y: number,
    color: string,
    count: number = 8,
  ): void {
    ensureKeyframes();

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const size = rand(3, 7);
      const angle = rand(0, Math.PI * 2);
      const distance = rand(15, 40);
      const duration = rand(BURST_DURATION_MIN, BURST_DURATION_MAX);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      // Pick a burst direction for variety
      const animName = pick([
        'particle-burst-out',
        'particle-burst-up',
        'particle-burst-down',
      ]);

      particle.className = 'particle';
      particle.style.cssText = `
        left: ${x}px;
        top:  ${y}px;
        width:  ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${i % 3 === 0 ? '2px' : '50%'};
        animation: ${animName} ${duration}ms ease-out forwards;
        --dx: ${dx}px;
        --dy: ${dy}px;
      `;

      container.appendChild(particle);
      setTimeout(() => particle.remove(), duration + 60);
    }
  }

  /**
   * Card combine success — golden sparkles with varied shapes.
   */
  static combine(container: HTMLElement, x: number, y: number): void {
    ensureKeyframes();

    const goldColors = ['#ffd700', '#ffec8b', '#fff8dc', '#daa520', '#f0e68c'];
    const count = 12;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const size = rand(4, 8);
      const angle = rand(0, Math.PI * 2);
      const distance = rand(18, 45);
      const duration = rand(400, 650);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const color = pick(goldColors);

      particle.className = 'particle';
      particle.style.cssText = `
        left: ${x}px;
        top:  ${y}px;
        width:  ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${i % 4 === 0 ? '1px' : '50%'};
        box-shadow: 0 0 ${rand(3, 6)}px ${color};
        animation: particle-golden-spark ${duration}ms ease-out forwards;
        --dx: ${dx}px;
        --dy: ${dy}px;
      `;

      container.appendChild(particle);
      setTimeout(() => particle.remove(), duration + 60);
    }
  }

  /**
   * Card sold — gold coin particles floating upward.
   */
  static sell(container: HTMLElement, x: number, y: number): void {
    ensureKeyframes();

    const coinColors = ['#ffd700', '#daa520', '#ffec8b', '#ffcc00', '#e6c200'];
    const count = 10;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const size = rand(5, 9);
      const dx = rand(-18, 18);
      const duration = rand(FLOAT_DURATION_MIN, FLOAT_DURATION_MAX);
      const delay = rand(0, 120);
      const color = pick(coinColors);

      // Make some particles rectangular like coin edges
      const isRect = i % 3 === 0;
      const borderRadius = isRect ? '3px' : '50%';

      particle.className = 'particle';
      particle.style.cssText = `
        left: ${x}px;
        top:  ${y}px;
        width:  ${size}px;
        height: ${isRect ? size * 0.4 : size}px;
        background: ${color};
        border-radius: ${borderRadius};
        box-shadow: 0 0 ${rand(4, 8)}px rgba(255, 215, 0, 0.5);
        animation: particle-float-up ${duration}ms ease-out ${delay}ms forwards;
        --dx: ${dx}px;
      `;

      container.appendChild(particle);
      setTimeout(() => particle.remove(), duration + delay + 60);
    }
  }

  /**
   * Card destroyed / died — red and gray particles shattering outward.
   */
  static destroy(container: HTMLElement, x: number, y: number): void {
    ensureKeyframes();

    const destroyColors = [
      '#8b0000', '#a52a2a', '#cd5c5c', '#696969', '#808080',
      '#a9a9a9', '#555555', '#b22222',
    ];
    const count = 10;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const size = rand(3, 7);
      const angle = rand(0, Math.PI * 2);
      const distance = rand(12, 35);
      const duration = rand(300, 500);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 5; // slight upward bias
      const color = pick(destroyColors);

      // Angular fragments for destruction feel
      const isFragment = i < 3;
      const borderRadius = isFragment ? '1px' : '50%';

      particle.className = 'particle';
      particle.style.cssText = `
        left: ${x}px;
        top:  ${y}px;
        width:  ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${borderRadius};
        animation: particle-shatter ${duration}ms ease-out forwards;
        --dx: ${dx}px;
        --dy: ${dy}px;
      `;

      container.appendChild(particle);
      setTimeout(() => particle.remove(), duration + 60);
    }
  }

  /**
   * Card created / spawned — green and white particles bursting outward.
   */
  static spawn(container: HTMLElement, x: number, y: number): void {
    ensureKeyframes();

    const spawnColors = ['#90ee90', '#98fb98', '#ffffff', '#e0ffe0', '#adff2f', '#7cfc00'];
    const count = 8;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const size = rand(3, 7);
      const angle = rand(0, Math.PI * 2);
      const distance = rand(12, 32);
      const duration = rand(350, 550);
      const delay = rand(0, 100);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const color = pick(spawnColors);

      particle.className = 'particle';
      particle.style.cssText = `
        left: ${x}px;
        top:  ${y}px;
        width:  ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        box-shadow: 0 0 ${rand(3, 5)}px ${color};
        animation: particle-spawn-burst ${duration}ms ease-out ${delay}ms forwards;
        --dx: ${dx}px;
        --dy: ${dy}px;
      `;

      container.appendChild(particle);
      setTimeout(() => particle.remove(), duration + delay + 60);
    }
  }
}
