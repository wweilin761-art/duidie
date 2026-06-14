/**
 * RecipeBook — a slide-out panel from the left side that shows all
 * unlocked/available recipes in a compact 2-column card grid.
 *
 * Each recipe card shows input icons → output icon and is colour-coded
 * by its required station:
 *   campfire → red border
 *   furnace  → orange border
 *   mill     → gold border
 *   bakery   → brown border
 *   well     → blue border
 *   none     → subtle grey border
 */
import { RECIPES, type Recipe } from '../data/recipes';
import { getCardDef } from '../data/cards';

/** Map a station defId to a CSS border-color class. */
function stationBorderClass(station: string | undefined): string {
  if (!station) return 'station-none';
  const s = station.toLowerCase();
  if (s.includes('campfire') || s.includes('camp_fire') || s.includes('firepit')) return 'station-campfire';
  if (s.includes('furnace') || s.includes('smelter') || s.includes('forge')) return 'station-furnace';
  if (s.includes('mill') || s.includes('grinder') || s.includes('grindstone')) return 'station-mill';
  if (s.includes('bakery') || s.includes('oven') || s.includes('bak')) return 'station-bakery';
  if (s.includes('well') || s.includes('water') || s.includes('spring')) return 'station-well';
  return 'station-none';
}

/** Group recipes by category for section headers. */
function groupRecipesByCategory(recipes: Recipe[]): Map<string, Recipe[]> {
  const groups = new Map<string, Recipe[]>();
  for (const r of recipes) {
    const cat = r.category || r.station || '一般';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(r);
  }
  return groups;
}

export class RecipeBook {
  private el: HTMLDivElement;
  private contentEl: HTMLDivElement;
  private gridEl: HTMLDivElement;
  private isOpen = false;

  private toggleBtn?: HTMLButtonElement;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'recipe-book';

    // Title
    const title = document.createElement('h3');
    title.textContent = '📖 配方手册'; // 📖 配方手册
    this.el.appendChild(title);

    // Scrollable content area
    this.contentEl = document.createElement('div');
    this.contentEl.style.cssText = 'overflow-y:auto;flex:1;';

    this.gridEl = document.createElement('div');
    this.gridEl.className = 'recipe-grid';
    this.contentEl.appendChild(this.gridEl);

    this.el.appendChild(this.contentEl);

    container.appendChild(this.el);
  }

  toggle(unlockedRecipeIds: Set<string>): void {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show(unlockedRecipeIds);
    }
  }

  show(unlockedRecipeIds: Set<string>): void {
    this.isOpen = true;
    this.el.classList.add('visible');

    // Clear grid
    while (this.gridEl.firstChild) {
      this.gridEl.removeChild(this.gridEl.firstChild);
    }

    // Group recipes and render sections
    const grouped = groupRecipesByCategory(RECIPES);

    for (const [category, recipes] of grouped) {
      // Section header
      const header = document.createElement('div');
      header.className = 'recipe-section-header';
      header.textContent = category;
      this.gridEl.appendChild(header);

      for (const recipe of recipes) {
        const card = this.buildRecipeCard(recipe, unlockedRecipeIds.has(recipe.id));
        this.gridEl.appendChild(card);
      }
    }
  }

  hide(): void {
    this.isOpen = false;
    this.el.classList.remove('visible');
  }

  isVisible(): boolean {
    return this.isOpen;
  }

  // ---- Card builder ----

  private buildRecipeCard(recipe: Recipe, unlocked: boolean): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'recipe-card ' + stationBorderClass(recipe.station);

    if (!unlocked) {
      card.style.opacity = '0.4';
      card.style.filter = 'grayscale(0.5)';
    }

    // Icons row: inputs → output
    const iconsRow = document.createElement('div');
    iconsRow.className = 'recipe-icons';

    // Input icons
    for (const inp of recipe.inputs) {
      const def = getCardDef(inp.defId);
      const iconEl = document.createElement('span');
      iconEl.className = 'recipe-icon';
      iconEl.textContent = def?.icon ?? '?';
      if (inp.count > 1) {
        iconEl.textContent += '×' + inp.count; // ×N
      }
      iconEl.title = (def?.name ?? inp.defId) + (inp.count > 1 ? ' x' + inp.count : '');
      iconsRow.appendChild(iconEl);
    }

    // Arrow
    const arrow = document.createElement('span');
    arrow.className = 'recipe-arrow';
    arrow.textContent = '→'; // →
    iconsRow.appendChild(arrow);

    // Output icon
    const outDef = getCardDef(recipe.output.defId);
    const outIcon = document.createElement('span');
    outIcon.className = 'recipe-icon';
    outIcon.textContent = outDef?.icon ?? '?';
    outIcon.title = outDef?.name ?? recipe.output.defId;
    iconsRow.appendChild(outIcon);

    card.appendChild(iconsRow);

    // Meta info (station name and duration)
    const meta = document.createElement('div');
    meta.className = 'recipe-meta';

    if (recipe.station) {
      const stationDef = getCardDef(recipe.station);
      const stationSpan = document.createElement('span');
      stationSpan.className = 'recipe-station';
      stationSpan.textContent = stationDef?.name ?? recipe.station;
      meta.appendChild(stationSpan);
    }

    if (recipe.duration && recipe.duration > 0) {
      if (meta.childNodes.length > 0) {
        meta.appendChild(document.createTextNode(' '));
      }
      meta.appendChild(document.createTextNode('⏱' + recipe.duration + 's')); // ⏱
    }

    card.appendChild(meta);

    return card;
  }

  get element(): HTMLDivElement {
    return this.el;
  }
}
