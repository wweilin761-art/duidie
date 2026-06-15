interface TutorialEntry {
  title: string;
  body: string;
}

const TUTORIAL_ENTRIES: TutorialEntry[] = [
  {
    title: '拖动卡牌',
    body: '把一张卡拖到另一张相关卡上即可尝试采集、制作、建造或战斗。',
  },
  {
    title: '拆分堆叠',
    body: '按住 Shift 拖动堆叠卡，可以只移动堆顶的一部分，方便凑配方。',
  },
  {
    title: '研究',
    body: '获得灵感或科技后，新的配方节点会从锁定状态变为可用。',
  },
  {
    title: '剧情目标',
    body: '留意弹出的剧情对话和底部状态，那里会提示当前推进方向。',
  },
  {
    title: '战斗预览',
    body: '敌人卡会显示生命值；把村民和武器拖到敌人附近前，先确认战斗时长与风险。',
  },
  {
    title: '保存 / 加载',
    body: '工具栏保留手动保存和加载；游戏也会按间隔自动保存当前局面。',
  },
];

const RECIPE_HINTS: TutorialEntry[] = [
  {
    title: '基础采集',
    body: '村民 + 树木 / 岩石 / 浆果丛，可以产出木材、石头或食物。',
  },
  {
    title: '基础建造',
    body: '木材 + 石头可以搭起篝火；木板和木材能继续扩展营地。',
  },
  {
    title: '工具路线',
    body: '木棍、木材、石头、燧石会组成早期工具，工具能提高采集或战斗效率。',
  },
];

export class TutorialBook {
  private el: HTMLDivElement;
  private contentEl: HTMLDivElement;
  private isOpen = false;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'tutorial-book';
    this.el.className = 'book-panel';

    const header = document.createElement('div');
    header.className = 'book-header';

    const title = document.createElement('h3');
    title.textContent = '生存指南';
    header.appendChild(title);

    const close = document.createElement('button');
    close.className = 'book-close';
    close.type = 'button';
    close.textContent = 'x';
    close.title = '关闭生存指南';
    close.addEventListener('click', () => this.hide());
    header.appendChild(close);

    this.el.appendChild(header);

    this.contentEl = document.createElement('div');
    this.contentEl.className = 'tutorial-content';
    this.el.appendChild(this.contentEl);

    this.render();
    container.appendChild(this.el);
  }

  toggle(): void {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  show(): void {
    this.isOpen = true;
    this.el.classList.add('visible');
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

  private render(): void {
    this.appendSection('常见问题', TUTORIAL_ENTRIES);
    this.appendSection('配方提示', RECIPE_HINTS);
  }

  private appendSection(titleText: string, entries: TutorialEntry[]): void {
    const section = document.createElement('section');
    section.className = 'tutorial-section';

    const title = document.createElement('h4');
    title.textContent = titleText;
    section.appendChild(title);

    for (const entry of entries) {
      const item = document.createElement('article');
      item.className = 'tutorial-entry';

      const heading = document.createElement('div');
      heading.className = 'tutorial-entry-title';
      heading.textContent = entry.title;
      item.appendChild(heading);

      const body = document.createElement('p');
      body.textContent = entry.body;
      item.appendChild(body);

      section.appendChild(item);
    }

    this.contentEl.appendChild(section);
  }
}
