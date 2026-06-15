export interface TechNode {
  id: string;
  name: string;
  description: string;
  icon?: string;
  tier?: number;
  requires?: string[];
  unlocks?: string[];
}

const FALLBACK_TECHS: TechNode[] = [
  {
    id: 'survival',
    name: '基础生存',
    description: '解锁采集、进食和基础堆叠操作。',
    icon: 'S',
    tier: 0,
    unlocks: ['采集', '进食'],
  },
  {
    id: 'crafting',
    name: '手工制作',
    description: '把木材、石头和燧石组合成工具。',
    icon: 'C',
    tier: 1,
    requires: ['survival'],
    unlocks: ['斧头', '镐子', '长剑'],
  },
  {
    id: 'building',
    name: '营地建设',
    description: '建造篝火、房屋、农场和生产设施。',
    icon: 'B',
    tier: 1,
    requires: ['crafting'],
    unlocks: ['篝火', '房屋', '农场'],
  },
  {
    id: 'food_chain',
    name: '食物链',
    description: '加工鱼、牛奶、小麦和面粉，稳定食物来源。',
    icon: 'F',
    tier: 2,
    requires: ['building'],
    unlocks: ['面包', '奶酪'],
  },
  {
    id: 'combat',
    name: '战斗训练',
    description: '预判战斗风险，使用武器缩短战斗时间。',
    icon: 'X',
    tier: 2,
    requires: ['crafting'],
    unlocks: ['弓', '盾牌', '铁剑'],
  },
  {
    id: 'commerce',
    name: '集市贸易',
    description: '提高资源变现能力，支撑后期扩张。',
    icon: '$',
    tier: 3,
    requires: ['building', 'food_chain'],
    unlocks: ['集市', '藏宝图'],
  },
];

export class TechBook {
  private el: HTMLDivElement;
  private listEl: HTMLDivElement;
  private isOpen = false;
  private techs: TechNode[];

  constructor(container: HTMLElement, techs: TechNode[] = FALLBACK_TECHS) {
    this.techs = techs;
    this.el = document.createElement('div');
    this.el.id = 'tech-book';
    this.el.className = 'book-panel';

    const header = document.createElement('div');
    header.className = 'book-header';

    const title = document.createElement('h3');
    title.textContent = '科技手册';
    header.appendChild(title);

    const close = document.createElement('button');
    close.className = 'book-close';
    close.type = 'button';
    close.textContent = 'x';
    close.title = '关闭科技手册';
    close.addEventListener('click', () => this.hide());
    header.appendChild(close);

    this.el.appendChild(header);

    this.listEl = document.createElement('div');
    this.listEl.className = 'tech-node-list';
    this.el.appendChild(this.listEl);

    container.appendChild(this.el);
  }

  toggle(unlockedTechs: Set<string> | string[]): void {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show(unlockedTechs);
    }
  }

  show(unlockedTechs: Set<string> | string[]): void {
    const unlocked = Array.isArray(unlockedTechs) ? new Set(unlockedTechs) : unlockedTechs;
    this.isOpen = true;
    this.el.classList.add('visible');
    this.render(unlocked);
  }

  hide(): void {
    this.isOpen = false;
    this.el.classList.remove('visible');
  }

  isVisible(): boolean {
    return this.isOpen;
  }

  get element(): HTMLDivElement {
    return this.el;
  }

  private render(unlockedTechs: Set<string>): void {
    while (this.listEl.firstChild) {
      this.listEl.removeChild(this.listEl.firstChild);
    }

    for (const tech of this.techs) {
      const unlocked = unlockedTechs.has(tech.id);
      const card = document.createElement('div');
      card.className = 'tech-node';
      card.classList.toggle('unlocked', unlocked);
      card.classList.toggle('locked', !unlocked);
      card.setAttribute('data-tier', String(tech.tier ?? 0));

      const icon = document.createElement('div');
      icon.className = 'tech-node-icon';
      icon.textContent = tech.icon ?? '?';
      card.appendChild(icon);

      const body = document.createElement('div');
      body.className = 'tech-node-body';

      const title = document.createElement('div');
      title.className = 'tech-node-title';
      title.textContent = tech.name;
      body.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'tech-node-description';
      desc.textContent = tech.description;
      body.appendChild(desc);

      const meta = document.createElement('div');
      meta.className = 'tech-node-meta';
      meta.textContent = this.formatTechMeta(tech, unlocked);
      body.appendChild(meta);

      card.appendChild(body);
      this.listEl.appendChild(card);
    }
  }

  private formatTechMeta(tech: TechNode, unlocked: boolean): string {
    const parts: string[] = [unlocked ? '已解锁' : '未解锁'];
    if (tech.requires && tech.requires.length > 0) {
      parts.push('前置: ' + tech.requires.join(', '));
    }
    if (tech.unlocks && tech.unlocks.length > 0) {
      parts.push('开放: ' + tech.unlocks.join(', '));
    }
    return parts.join(' · ');
  }
}
