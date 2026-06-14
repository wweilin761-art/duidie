/**
 * Board — manages the card container and spatial indexing.
 */
import { CardEntity } from './CardEntity';
import type { CardInstance } from '../../../src/protocol/messages';

const GRID_CELL_SIZE = 200; // px per spatial grid cell

/** Visual offset between stacked cards (Spider Solitaire style) */
const STACK_OFFSET_X = 6;
const STACK_OFFSET_Y = 6;

export class Board {
  private el: HTMLDivElement;
  private viewport: HTMLDivElement;
  private entities: Map<string, CardEntity> = new Map();

  // Spatial grid for efficient hit-testing
  private spatialGrid: Map<string, Set<string>> = new Map();

  // Pan state
  private panX = 0;
  private panY = 0;
  private scale = 1;

  // Sell zone
  private sellZone: HTMLDivElement;

  // Stack groups: groupId → ordered array of card UIDs
  // Index 0 is the "base" card (top-left anchor).
  // Each subsequent card is offset by (STACK_OFFSET_X, STACK_OFFSET_Y) from the previous.
  stackGroups: Map<string, string[]> = new Map();

  private groupIdCounter = 0;

  constructor(container: HTMLElement) {
    // Create board container
    this.el = document.createElement('div');
    this.el.id = 'game-board';
    container.appendChild(this.el);

    // Create viewport (pannable/zoomable)
    this.viewport = document.createElement('div');
    this.viewport.className = 'board-viewport';
    this.el.appendChild(this.viewport);

    // Create sell zone
    this.sellZone = document.createElement('div');
    this.sellZone.className = 'sell-zone';
    this.el.appendChild(this.sellZone);
  }

  get rootElement(): HTMLDivElement {
    return this.el;
  }

  get viewportElement(): HTMLDivElement {
    return this.viewport;
  }

  get sellZoneElement(): HTMLDivElement {
    return this.sellZone;
  }

  get boardWidth(): number {
    return this.el.clientWidth;
  }

  get boardHeight(): number {
    return this.el.clientHeight;
  }

  /** Get screen position from board coordinates */
  boardToScreen(boardX: number, boardY: number): { x: number; y: number } {
    return {
      x: boardX * this.scale + this.panX,
      y: boardY * this.scale + this.panY,
    };
  }

  /** Get board coordinates from screen position */
  screenToBoard(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.panX) / this.scale,
      y: (screenY - this.panY) / this.scale,
    };
  }

  /** Set pan offset */
  setPan(x: number, y: number): void {
    this.panX = x;
    this.panY = y;
    this.updateTransform();
  }

  /** Get pan offset */
  getPan(): { x: number; y: number } {
    return { x: this.panX, y: this.panY };
  }

  /** Set zoom scale */
  setScale(scale: number): void {
    this.scale = Math.max(0.3, Math.min(2, scale));
    this.updateTransform();
  }

  getScale(): number {
    return this.scale;
  }

  private updateTransform(): void {
    this.viewport.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
  }

  /** Add a card entity to the board */
  addEntity(entity: CardEntity): void {
    this.entities.set(entity.uid, entity);
    this.viewport.appendChild(entity.el);
    this.updateSpatialIndex(entity);
  }

  /** Remove a card entity from the board */
  removeEntity(uid: string): void {
    const entity = this.entities.get(uid);
    if (!entity) return;

    // Remove from stack group first (dissolves group if needed)
    if (entity.stackGroupId) {
      this.removeFromStackGroup(uid);
    }

    this.removeFromSpatialIndex(entity);
    entity.dispose();
    this.entities.delete(uid);
  }

  /** Get an entity by UID */
  getEntity(uid: string): CardEntity | undefined {
    return this.entities.get(uid);
  }

  /** Get all entities */
  getAllEntities(): CardEntity[] {
    return Array.from(this.entities.values());
  }

  /** Find entities whose bounds intersect the given point (screen coords) */
  hitTest(screenX: number, screenY: number): CardEntity[] {
    const boardPos = this.screenToBoard(screenX, screenY);
    const cellKey = this.getCellKey(boardPos.x, boardPos.y);
    const nearbyUids = new Set<string>();

    // Check the target cell and adjacent cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = this.getCellKey(
          boardPos.x + dx * GRID_CELL_SIZE,
          boardPos.y + dy * GRID_CELL_SIZE
        );
        const cellUids = this.spatialGrid.get(key);
        if (cellUids) {
          for (const uid of cellUids) {
            nearbyUids.add(uid);
          }
        }
      }
    }

    const hits: CardEntity[] = [];
    const CARD_W = 72;
    const CARD_H = 96;

    for (const uid of nearbyUids) {
      const entity = this.entities.get(uid);
      if (!entity || entity.isDragging) continue;

      const { x, y } = entity.data.position;
      if (
        boardPos.x >= x &&
        boardPos.x <= x + CARD_W &&
        boardPos.y >= y &&
        boardPos.y <= y + CARD_H
      ) {
        hits.push(entity);
      }
    }

    // Sort by z-order (entities added later on top)
    return hits.reverse();
  }

  /** Get entities within screen bounds (for rendering optimization) */
  getVisibleEntities(): CardEntity[] {
    // For now, return all. Optimize with viewport culling later if needed.
    return Array.from(this.entities.values());
  }

  // ========================================================================
  // Stack group management
  // ========================================================================

  /** Get the effective count of items for a card (stack group size, or 1 if not stacked) */
  getStackGroupSize(cardUid: string): number {
    const entity = this.getEntity(cardUid);
    if (!entity || !entity.stackGroupId) return 1;
    const group = this.stackGroups.get(entity.stackGroupId);
    return group ? group.length : 1;
  }

  /** Get all UIDs in the same stack group as the given card (or just itself if not stacked) */
  getStackGroupUids(cardUid: string): string[] {
    const entity = this.getEntity(cardUid);
    if (!entity || !entity.stackGroupId) return [cardUid];
    const group = this.stackGroups.get(entity.stackGroupId);
    return group ? [...group] : [cardUid];
  }

  /** Create a new stack group from two cards. Returns the group ID. */
  createStackGroup(card1Uid: string, card2Uid: string): string {
    const groupId = `stack_${++this.groupIdCounter}_${Date.now()}`;
    const entity1 = this.getEntity(card1Uid);
    const entity2 = this.getEntity(card2Uid);
    if (!entity1 || !entity2) return '';

    // Ensure neither is already in a group
    this.removeFromStackGroupSilent(card1Uid);
    this.removeFromStackGroupSilent(card2Uid);

    const uids = [card1Uid, card2Uid];
    this.stackGroups.set(groupId, uids);
    entity1.stackGroupId = groupId;
    entity2.stackGroupId = groupId;

    // Position the second card offset from the first
    this.updateStackPositions(groupId);
    return groupId;
  }

  /** Add a card to an existing stack group */
  addToStackGroup(groupId: string, cardUid: string): void {
    const group = this.stackGroups.get(groupId);
    if (!group) return;

    const entity = this.getEntity(cardUid);
    if (!entity) return;

    // Ensure card is not already in another group
    this.removeFromStackGroupSilent(cardUid);

    group.push(cardUid);
    entity.stackGroupId = groupId;

    // Reposition the newly added card
    this.updateStackPositions(groupId);
  }

  /** Remove a card from its stack group. Dissolves the group if fewer than 2 cards remain. */
  removeFromStackGroup(cardUid: string): void {
    const entity = this.getEntity(cardUid);
    if (!entity || !entity.stackGroupId) return;

    const groupId = entity.stackGroupId;
    const group = this.stackGroups.get(groupId);
    if (!group) {
      entity.stackGroupId = null;
      return;
    }

    const idx = group.indexOf(cardUid);
    if (idx >= 0) {
      group.splice(idx, 1);
    }

    entity.stackGroupId = null;
    entity.dirty = true;

    // Dissolve group if fewer than 2 cards remain
    if (group.length < 2) {
      // If one card remains, remove it from the group too
      if (group.length === 1) {
        const remainingEntity = this.getEntity(group[0]);
        if (remainingEntity) {
          remainingEntity.stackGroupId = null;
          remainingEntity.dirty = true;
        }
      }
      this.stackGroups.delete(groupId);
    } else {
      // Reposition remaining cards
      this.updateStackPositions(groupId);
    }
  }

  /**
   * Merge all cards from fromGroupId into toGroupId.
   * fromGroup is dissolved after the merge.
   */
  mergeStackGroups(fromGroupId: string, toGroupId: string): void {
    const fromGroup = this.stackGroups.get(fromGroupId);
    const toGroup = this.stackGroups.get(toGroupId);
    if (!fromGroup || !toGroup) return;
    if (fromGroupId === toGroupId) return;

    // Move all cards from the source group to the target group
    for (const uid of fromGroup) {
      const entity = this.getEntity(uid);
      if (entity) {
        entity.stackGroupId = toGroupId;
      }
      toGroup.push(uid);
    }

    this.stackGroups.delete(fromGroupId);
    this.updateStackPositions(toGroupId);
  }

  /**
   * Reposition all cards in a stack group.
   * Index 0 is the anchor (base card). Each subsequent card is offset
   * by (STACK_OFFSET_X, STACK_OFFSET_Y) from the previous.
   */
  updateStackPositions(groupId: string): void {
    const uids = this.stackGroups.get(groupId);
    if (!uids || uids.length === 0) return;

    const baseEntity = this.getEntity(uids[0]);
    if (!baseEntity) return;

    const baseX = baseEntity.data.position.x;
    const baseY = baseEntity.data.position.y;

    for (let i = 0; i < uids.length; i++) {
      const entity = this.getEntity(uids[i]);
      if (!entity) continue;
      entity.data.position.x = baseX + i * STACK_OFFSET_X;
      entity.data.position.y = baseY + i * STACK_OFFSET_Y;
      entity.el.setAttribute('data-stack-depth', String(i));
      entity.dirty = true;
    }
  }

  /** Remove the top card(s) from a stack group (used by recipe consumption).
   *  @returns array of UIDs that were removed from the group */
  removeTopCardsFromGroup(cardUid: string, count: number): string[] {
    const entity = this.getEntity(cardUid);
    if (!entity || !entity.stackGroupId) return [];

    const groupId = entity.stackGroupId;
    const group = this.stackGroups.get(groupId);
    if (!group) return [];

    const removed: string[] = [];
    const actualCount = Math.min(count, group.length);

    for (let i = 0; i < actualCount; i++) {
      // Remove from the top (last element) of the stack
      const removedUid = group.pop()!;
      const removedEntity = this.getEntity(removedUid);
      if (removedEntity) {
        removedEntity.stackGroupId = null;
      }
      removed.push(removedUid);
    }

    // Dissolve or reposition remaining cards
    if (group.length < 2) {
      if (group.length === 1) {
        const remainingEntity = this.getEntity(group[0]);
        if (remainingEntity) {
          remainingEntity.stackGroupId = null;
          remainingEntity.dirty = true;
        }
      }
      this.stackGroups.delete(groupId);
    } else {
      this.updateStackPositions(groupId);
    }

    return removed;
  }

  /** Get all CardEntity objects in a stack group */
  getStackGroupCards(groupId: string): CardEntity[] {
    const uids = this.stackGroups.get(groupId);
    if (!uids) return [];
    const entities: CardEntity[] = [];
    for (const uid of uids) {
      const entity = this.getEntity(uid);
      if (entity) entities.push(entity);
    }
    return entities;
  }

  /** Serialize stack groups for saving */
  getStackGroupsData(): Record<string, string[]> {
    const data: Record<string, string[]> = {};
    for (const [groupId, uids] of this.stackGroups) {
      data[groupId] = [...uids];
    }
    return data;
  }

  /** Restore stack groups from saved data */
  restoreStackGroups(data: Record<string, string[]>): void {
    this.stackGroups.clear();
    for (const [groupId, uids] of Object.entries(data)) {
      this.stackGroups.set(groupId, [...uids]);
      for (const uid of uids) {
        const entity = this.getEntity(uid);
        if (entity) entity.stackGroupId = groupId;
      }
    }
    // Reposition all restored groups
    for (const groupId of this.stackGroups.keys()) {
      this.updateStackPositions(groupId);
    }
  }

  /**
   * Internal: remove a card from its stack group.
   * Repositions the old group if it still has 2+ cards.
   * Used as a building block by createStackGroup / addToStackGroup.
   */
  private removeFromStackGroupSilent(cardUid: string): void {
    const entity = this.getEntity(cardUid);
    if (!entity || !entity.stackGroupId) return;

    const oldGroupId = entity.stackGroupId;
    const group = this.stackGroups.get(oldGroupId);
    if (!group) {
      entity.stackGroupId = null;
      return;
    }

    const idx = group.indexOf(cardUid);
    if (idx >= 0) {
      group.splice(idx, 1);
    }
    entity.stackGroupId = null;

    if (group.length < 2) {
      if (group.length === 1) {
        const remainingEntity = this.getEntity(group[0]);
        if (remainingEntity) {
          remainingEntity.stackGroupId = null;
        }
      }
      this.stackGroups.delete(oldGroupId);
    } else {
      // Reposition the old group after removing the card
      this.updateStackPositions(oldGroupId);
    }
  }

  /** Clear all entities from the board */
  clear(): void {
    for (const [, entity] of this.entities) {
      entity.dispose();
    }
    this.entities.clear();
    this.spatialGrid.clear();
    this.stackGroups.clear();

    // Remove any non-card children from the viewport that may have been
    // left behind (particles from effects, drag ghosts, etc.).
    // CardEntity.dispose() already removes each card's element above;
    // any remaining children are transient and safe to discard.
    while (this.viewport.firstChild) {
      this.viewport.firstChild.remove();
    }
  }

  /** Mark sell zone as active/inactive */
  setSellZoneActive(active: boolean): void {
    if (active) {
      this.sellZone.classList.add('active');
    } else {
      this.sellZone.classList.remove('active');
    }
  }

  /** Check if a screen position is over the sell zone */
  isOverSellZone(screenX: number, screenY: number): boolean {
    const rect = this.sellZone.getBoundingClientRect();
    return (
      screenX >= rect.left &&
      screenX <= rect.right &&
      screenY >= rect.top &&
      screenY <= rect.bottom
    );
  }

  /** Update entity in spatial index */
  updateSpatialIndex(entity: CardEntity): void {
    this.removeFromSpatialIndex(entity);
    const key = this.getCellKey(
      entity.data.position.x,
      entity.data.position.y
    );
    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, new Set());
    }
    this.spatialGrid.get(key)!.add(entity.uid);
  }

  private removeFromSpatialIndex(entity: CardEntity): void {
    for (const [, cell] of this.spatialGrid) {
      cell.delete(entity.uid);
    }
  }

  private getCellKey(x: number, y: number): string {
    const cx = Math.floor(x / GRID_CELL_SIZE);
    const cy = Math.floor(y / GRID_CELL_SIZE);
    return `${cx},${cy}`;
  }
}
