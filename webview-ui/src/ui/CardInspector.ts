/**
 * CardInspector — sliding side panel that shows detailed information
 * about a selected card instance.
 */
import type { CardInstance } from '../../../src/protocol/messages';
import { getCardDef } from '../data/cards';

export class CardInspector {
  private el: HTMLDivElement;
  private closeBtn: HTMLButtonElement;
  private contentEl: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'card-inspector';

    // Close button
    this.closeBtn = document.createElement('button');
    this.closeBtn.textContent = '✕ 关闭';
    this.closeBtn.style.cssText =
      'position:absolute;top:8px;right:12px;background:none;border:1px solid var(--vscode-panel-border,#555);border-radius:4px;padding:2px 8px;font-size:11px;color:var(--vscode-editor-foreground,#ccc);cursor:pointer;';
    this.closeBtn.addEventListener('click', () => {
      this.hide();
    });

    this.el.appendChild(this.closeBtn);

    // Content container
    this.contentEl = document.createElement('div');
    this.contentEl.style.paddingTop = '28px';
    this.el.appendChild(this.contentEl);

    container.appendChild(this.el);
  }

  /**
   * Show details for the given card.  Builds the full DOM for the panel.
   */
  show(card: CardInstance): void {
    // Clear previous content safely — no innerHTML
    while (this.contentEl.firstChild) {
      this.contentEl.removeChild(this.contentEl.firstChild);
    }

    const def = getCardDef(card.defId);
    if (!def) {
      const unknown = document.createElement('p');
      unknown.textContent = '未知卡牌：' + card.defId;
      unknown.style.color = 'var(--vscode-descriptionForeground,#888)';
      this.contentEl.appendChild(unknown);
      this.el.classList.add('visible');
      return;
    }

    // ---- Icon + Name header ----
    const header = document.createElement('h3');
    header.textContent = def.icon + ' ' + def.name;
    this.contentEl.appendChild(header);

    // ---- Description ----
    const desc = document.createElement('p');
    desc.textContent = def.description;
    desc.style.cssText =
      'font-size:12px;color:var(--vscode-descriptionForeground,#888);margin-bottom:12px;';
    this.contentEl.appendChild(desc);

    // ---- Basic stats ----
    const statRows: [string, string][] = [
      ['类别', def.category],
      ['等级', String(def.tier)],
      ['售价', def.sellValue + ' 金币'],
      ['堆叠', card.stackCount > 1 ? card.stackCount + '/' + def.maxStack : '单个'],
    ];

    for (const [label, value] of statRows) {
      const row = document.createElement('div');
      row.className = 'inspector-stat';

      const labelEl = document.createElement('span');
      labelEl.textContent = label;
      labelEl.style.color = 'var(--vscode-descriptionForeground,#888)';

      const valueEl = document.createElement('span');
      valueEl.textContent = value;

      row.appendChild(labelEl);
      row.appendChild(valueEl);
      this.contentEl.appendChild(row);
    }

    // ---- Villager-specific: hunger bar ----
    if (card.villagerState) {
      this.renderHungerBar(card);
    }

    // ---- Enemy-specific: health bar ----
    if (card.enemyState) {
      this.renderHealthBar(card);
    }

    // ---- Timer / progress ----
    if (card.currentTimer) {
      this.renderTimerProgress(card);
    }

    // Show the panel
    this.el.classList.add('visible');
  }

  /**
   * Hide the inspector by sliding it off-screen.
   */
  hide(): void {
    this.el.classList.remove('visible');
  }

  // --- Private helpers ---

  private renderHungerBar(card: CardInstance): void {
    const vs = card.villagerState!;
    const pct = Math.max(0, Math.min(100, (vs.hunger / vs.maxHunger) * 100));

    const section = document.createElement('div');
    section.style.cssText = 'margin-top:12px;';

    const label = document.createElement('div');
    label.textContent = '饥饿度';
    label.style.cssText = 'font-size:12px;font-weight:600;margin-bottom:4px;';
    section.appendChild(label);

    const barOuter = document.createElement('div');
    barOuter.style.cssText =
      'height:10px;background:var(--vscode-input-background,#3c3c3c);border-radius:5px;overflow:hidden;';

    const barInner = document.createElement('div');
    barInner.style.width = pct + '%';
    barInner.style.height = '100%';
    barInner.style.borderRadius = '5px';
    barInner.style.transition = 'width 0.3s';
    if (vs.isStarving) {
      barInner.style.backgroundColor = '#cc4444';
    } else if (pct < 30) {
      barInner.style.backgroundColor = '#cc8844';
    } else {
      barInner.style.backgroundColor = '#44aa44';
    }
    barOuter.appendChild(barInner);
    section.appendChild(barOuter);

    const status = document.createElement('div');
    status.textContent = vs.isStarving
      ? '⚠ 饥饿中！'
      : Math.floor(vs.hunger) + ' / ' + vs.maxHunger;
    status.style.cssText = 'font-size:11px;margin-top:2px;';
    if (vs.isStarving) {
      status.style.color = '#cc4444';
    }
    section.appendChild(status);

    this.contentEl.appendChild(section);

    if (vs.assignedCardId) {
      const assigned = document.createElement('div');
      assigned.textContent = '分配至：' + vs.assignedCardId;
      assigned.style.cssText =
        'font-size:11px;margin-top:4px;color:var(--vscode-descriptionForeground,#888);';
      this.contentEl.appendChild(assigned);
    }
  }

  private renderHealthBar(card: CardInstance): void {
    const es = card.enemyState!;
    const pct = Math.max(0, Math.min(100, (es.health / es.maxHealth) * 100));

    const section = document.createElement('div');
    section.style.cssText = 'margin-top:12px;';

    const label = document.createElement('div');
    label.textContent = '生命值';
    label.style.cssText = 'font-size:12px;font-weight:600;margin-bottom:4px;';
    section.appendChild(label);

    const barOuter = document.createElement('div');
    barOuter.style.cssText =
      'height:10px;background:var(--vscode-input-background,#3c3c3c);border-radius:5px;overflow:hidden;';

    const barInner = document.createElement('div');
    barInner.style.width = pct + '%';
    barInner.style.height = '100%';
    barInner.style.borderRadius = '5px';
    barInner.style.transition = 'width 0.3s';
    if (pct < 30) {
      barInner.style.backgroundColor = '#cc4444';
    } else if (pct < 60) {
      barInner.style.backgroundColor = '#cc8844';
    } else {
      barInner.style.backgroundColor = '#44aa44';
    }
    barOuter.appendChild(barInner);
    section.appendChild(barOuter);

    const value = document.createElement('div');
    value.textContent = es.health + ' / ' + es.maxHealth;
    value.style.cssText = 'font-size:11px;margin-top:2px;';
    section.appendChild(value);

    this.contentEl.appendChild(section);

    const dmg = document.createElement('div');
    dmg.textContent = '攻击力：' + es.damage;
    dmg.style.cssText =
      'font-size:11px;margin-top:4px;color:var(--vscode-descriptionForeground,#888);';
    this.contentEl.appendChild(dmg);
  }

  private renderTimerProgress(card: CardInstance): void {
    const t = card.currentTimer!;
    const pct = t.duration > 0
      ? Math.max(0, Math.min(100, ((t.duration - t.remaining) / t.duration) * 100))
      : 100;

    const section = document.createElement('div');
    section.style.cssText = 'margin-top:12px;';

    const label = document.createElement('div');
    label.textContent = t.label || '进度';
    label.style.cssText = 'font-size:12px;font-weight:600;margin-bottom:4px;';
    section.appendChild(label);

    const barOuter = document.createElement('div');
    barOuter.style.cssText =
      'height:10px;background:var(--vscode-input-background,#3c3c3c);border-radius:5px;overflow:hidden;';

    const barInner = document.createElement('div');
    barInner.style.width = pct + '%';
    barInner.style.height = '100%';
    barInner.style.borderRadius = '5px';
    barInner.style.backgroundColor = '#3399cc';
    barInner.style.transition = 'width 0.3s';
    barOuter.appendChild(barInner);
    section.appendChild(barOuter);

    const value = document.createElement('div');
    value.textContent = t.remaining.toFixed(1) + 's / ' + t.duration.toFixed(1) + 's';
    value.style.cssText = 'font-size:11px;margin-top:2px;';
    section.appendChild(value);

    this.contentEl.appendChild(section);

    if (t.product) {
      const prod = document.createElement('div');
      prod.textContent = '产出：' + t.product;
      prod.style.cssText =
        'font-size:11px;margin-top:4px;color:var(--vscode-descriptionForeground,#888);';
      this.contentEl.appendChild(prod);
    }
  }

  get element(): HTMLDivElement {
    return this.el;
  }
}
