export interface ResourceSummary {
  wood?: number;
  stone?: number;
  food?: number;
  coins?: number;
  population?: number;
  populationLimit?: number;
  stackLimitBonus?: number;
  status?: string;
  paused?: boolean;
}

interface ResourceItem {
  key: keyof ResourceSummary;
  icon: string;
  label: string;
  suffix?: string;
}

const RESOURCE_ITEMS: ResourceItem[] = [
  { key: 'wood', icon: 'W', label: '木材' },
  { key: 'stone', icon: 'S', label: '石头' },
  { key: 'food', icon: 'F', label: '食物' },
  { key: 'coins', icon: 'C', label: '金币' },
  { key: 'population', icon: 'P', label: '人口' },
  { key: 'stackLimitBonus', icon: '+', label: '堆叠', suffix: '%' },
];

export class ResourceBar {
  private el: HTMLDivElement;
  private itemValues = new Map<keyof ResourceSummary, HTMLSpanElement>();
  private statusEl: HTMLSpanElement;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'resource-bar';

    const itemsWrap = document.createElement('div');
    itemsWrap.className = 'resource-bar-items';
    this.el.appendChild(itemsWrap);

    for (const item of RESOURCE_ITEMS) {
      const row = document.createElement('div');
      row.className = 'resource-pill';
      row.title = item.label;

      const icon = document.createElement('span');
      icon.className = 'resource-icon';
      icon.textContent = item.icon;
      row.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'resource-label';
      label.textContent = item.label;
      row.appendChild(label);

      const value = document.createElement('span');
      value.className = 'resource-value';
      value.textContent = '0' + (item.suffix ?? '');
      row.appendChild(value);

      this.itemValues.set(item.key, value);
      itemsWrap.appendChild(row);
    }

    const status = document.createElement('div');
    status.className = 'resource-status';

    const dot = document.createElement('span');
    dot.className = 'status-dot';
    status.appendChild(dot);

    this.statusEl = document.createElement('span');
    this.statusEl.textContent = '运行中';
    status.appendChild(this.statusEl);

    this.el.appendChild(status);
    container.appendChild(this.el);
  }

  update(summary: ResourceSummary): void {
    this.setValue('wood', summary.wood ?? 0);
    this.setValue('stone', summary.stone ?? 0);
    this.setValue('food', summary.food ?? 0);
    this.setValue('coins', summary.coins ?? 0);
    this.setPopulation(summary);
    this.setValue('stackLimitBonus', summary.stackLimitBonus ?? 0, '%');

    this.statusEl.textContent = summary.status ?? (summary.paused ? '已暂停' : '运行中');
    this.el.classList.toggle('paused', summary.paused === true);
  }

  get element(): HTMLDivElement {
    return this.el;
  }

  private setValue(key: keyof ResourceSummary, value: number, suffix = ''): void {
    const el = this.itemValues.get(key);
    if (!el) return;
    el.textContent = String(value) + suffix;
  }

  private setPopulation(summary: ResourceSummary): void {
    const el = this.itemValues.get('population');
    if (!el) return;

    const population = summary.population ?? 0;
    if (summary.populationLimit !== undefined) {
      el.textContent = `${population}/${summary.populationLimit}`;
    } else {
      el.textContent = String(population);
    }
  }
}
