/**
 * ShopModal — full-screen modal overlay for purchasing card packs
 * at the start of each month.
 *
 * Pack cards have category-colored top borders:
 *   Food packs:    green
 *   Weapon packs:  red
 *   Builder packs: brown
 *   Idea packs:    golden
 *   Special packs: purple (fallback)
 */
import type { ShopPack } from '../data/shop';
import { getCardDef } from '../data/cards';

export interface ShopModalCallbacks {
  onBuy: (pack: ShopPack) => void;
  onSkip: () => void;
}

/** Maps pack category to a CSS class suffix for coloured top borders. */
function packCategoryClass(pack: ShopPack): string {
  // Use the pack's internal category or infer from the first card's def
  const cat = (pack as any).category as string | undefined;
  if (cat) {
    return 'pack-' + cat.toLowerCase();
  }
  // Fallback: derive from pack name hints
  const name = pack.name.toLowerCase();
  if (name.includes('食物') || name.includes('food') || name.includes('食品')) return 'pack-food';
  if (name.includes('武器') || name.includes('weapon') || name.includes('兵器')) return 'pack-weapon';
  if (name.includes('建筑') || name.includes('建材') || name.includes('builder') || name.includes('材料')) return 'pack-builder';
  if (name.includes('灵光') || name.includes('点子') || name.includes('idea') || name.includes('智慧')) return 'pack-idea';
  return 'pack-special';
}

export class ShopModal {
  private el: HTMLDivElement;
  private contentEl: HTMLDivElement;
  private callbacks: ShopModalCallbacks;

  constructor(container: HTMLElement, callbacks: ShopModalCallbacks) {
    this.callbacks = callbacks;

    this.el = document.createElement('div');
    this.el.id = 'shop-modal';

    // Content wrapper
    this.contentEl = document.createElement('div');
    this.contentEl.className = 'shop-content';
    this.el.appendChild(this.contentEl);

    container.appendChild(this.el);
  }

  /**
   * Show the shop modal with the given packs and current coin balance.
   */
  show(packs: ShopPack[], coins: number): void {
    // Clear previous content safely — no innerHTML
    while (this.contentEl.firstChild) {
      this.contentEl.removeChild(this.contentEl.firstChild);
    }

    // Title
    const title = document.createElement('h2');
    title.textContent = '📦 月度商店'; // 📦 月度商店
    this.contentEl.appendChild(title);

    // Coin balance
    const coinDisplay = document.createElement('div');
    coinDisplay.className = 'shop-coin-display';
    coinDisplay.textContent = '你的金币：🪙 ' + coins; // 你的金币：🪙
    this.contentEl.appendChild(coinDisplay);

    // Packs container
    const packsContainer = document.createElement('div');
    packsContainer.className = 'shop-packs';

    for (const pack of packs) {
      const packEl = this.buildPackElement(pack, coins);
      packsContainer.appendChild(packEl);
    }

    this.contentEl.appendChild(packsContainer);

    // Skip button
    const skipBtn = document.createElement('button');
    skipBtn.textContent = '跳过 →'; // 跳过 →
    skipBtn.className = 'shop-skip-btn';
    skipBtn.addEventListener('click', () => {
      this.callbacks.onSkip();
    });
    this.contentEl.appendChild(skipBtn);

    // Show the modal
    this.el.classList.add('visible');
  }

  /**
   * Hide the shop modal.
   */
  hide(): void {
    this.el.classList.remove('visible');
  }

  /**
   * Check if the shop modal is currently visible.
   */
  isVisible(): boolean {
    return this.el.classList.contains('visible');
  }

  /**
   * Build a DOM element for a single shop pack.
   */
  private buildPackElement(pack: ShopPack, currentCoins: number): HTMLDivElement {
    const el = document.createElement('div');
    const categoryClass = packCategoryClass(pack);
    el.className = 'shop-pack ' + categoryClass;

    const canAfford = currentCoins >= pack.cost;

    if (!canAfford) {
      el.classList.add('disabled');
    }

    // Pack name
    const nameEl = document.createElement('div');
    nameEl.className = 'pack-name';
    nameEl.textContent = pack.name;
    el.appendChild(nameEl);

    // Pack price with coin icon
    const priceEl = document.createElement('div');
    priceEl.className = 'pack-price';
    priceEl.textContent = '🪙 ' + pack.cost; // 🪙
    el.appendChild(priceEl);

    // Card count preview
    const totalCards = pack.cards.reduce((sum, item) => sum + item.count, 0);
    const countEl = document.createElement('div');
    countEl.className = 'pack-count';
    countEl.textContent = '📦 ' + totalCards + ' 张卡片'; // 📦 N 张卡片
    el.appendChild(countEl);

    // Card previews
    const previewContainer = document.createElement('div');
    previewContainer.style.cssText =
      'display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-top:8px;';

    for (const item of pack.cards) {
      const def = getCardDef(item.defId);
      const preview = document.createElement('span');
      preview.title = def ? def.name : item.defId;
      const icon = def ? def.icon : '?';
      const countText = item.count > 1 ? 'x' + item.count : '';
      preview.textContent = icon + countText;
      preview.style.cssText =
        'font-size:13px;padding:1px 3px;background:rgba(255,255,255,0.06);border-radius:4px;';
      previewContainer.appendChild(preview);
    }

    el.appendChild(previewContainer);

    // Click handler
    if (canAfford) {
      el.addEventListener('click', () => {
        this.callbacks.onBuy(pack);
      });
    }

    return el;
  }

  get element(): HTMLDivElement {
    return this.el;
  }
}
