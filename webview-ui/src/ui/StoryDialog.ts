export interface StoryDialogue {
  id: string;
  speaker: string;
  text: string;
  portrait?: string;
  icon?: string;
}

export class StoryDialog {
  private el: HTMLDivElement;
  private portraitEl: HTMLDivElement;
  private speakerEl: HTMLDivElement;
  private textEl: HTMLParagraphElement;
  private visible = false;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'story-dialog';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-live', 'polite');

    const panel = document.createElement('div');
    panel.className = 'story-dialog-panel';

    this.portraitEl = document.createElement('div');
    this.portraitEl.className = 'story-portrait';
    panel.appendChild(this.portraitEl);

    const body = document.createElement('div');
    body.className = 'story-body';

    this.speakerEl = document.createElement('div');
    this.speakerEl.className = 'story-speaker';
    body.appendChild(this.speakerEl);

    this.textEl = document.createElement('p');
    this.textEl.className = 'story-text';
    body.appendChild(this.textEl);

    panel.appendChild(body);

    const close = document.createElement('button');
    close.className = 'story-close';
    close.type = 'button';
    close.textContent = 'x';
    close.title = '关闭剧情';
    close.addEventListener('click', () => this.hide());
    panel.appendChild(close);

    this.el.appendChild(panel);
    container.appendChild(this.el);
  }

  show(dialogue: StoryDialogue): void {
    this.el.setAttribute('data-dialogue-id', dialogue.id);
    this.speakerEl.textContent = dialogue.speaker;
    this.textEl.textContent = dialogue.text;
    this.portraitEl.textContent = dialogue.portrait ?? dialogue.icon ?? '?';

    this.visible = true;
    this.el.classList.add('visible');
  }

  hide(): void {
    this.visible = false;
    this.el.classList.remove('visible');
  }

  isVisible(): boolean {
    return this.visible;
  }

  get element(): HTMLDivElement {
    return this.el;
  }
}
