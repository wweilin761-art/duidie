/**
 * DragSystem — drag and drop system using Pointer Events API.
 * Handles card dragging, hit-testing, drop-target highlighting,
 * sell-zone detection, and multi-card selection dragging.
 *
 * Works with board pan/zoom by converting screen coordinates
 * to board coordinates via Board.screenToBoard().
 */
import { Board } from './Board';
import { CardEntity } from './CardEntity';
import { ParticleEffect } from './ParticleEffect';
import { sound } from './SoundSystem';

/** Z-index applied to a card while it is being dragged */
const DRAG_Z_INDEX = '10000';

/** Minimum pointer movement before a drag starts (px) */
const DRAG_THRESHOLD = 3;

export class DragSystem {
  private board: Board;
  private onDrop: (draggedId: string, targetId: string) => void;
  private onSell: (cardId: string) => void;

  /** The card entity currently being dragged (primary) */
  private draggedEntity: CardEntity | null = null;

  /** Additional selected cards being dragged along */
  private extraDraggedEntities: CardEntity[] = [];

  /** Offset from pointer to card origin (in board coordinates) */
  private grabOffsetX: number = 0;
  private grabOffsetY: number = 0;

  /** Original board position of the dragged card (for snap-back) */
  private originalX: number = 0;
  private originalY: number = 0;

  /** Original board positions of extra dragged cards */
  private extraOriginalPositions: { uid: string; x: number; y: number }[] = [];

  /** The current drop-target card (highlighted) */
  private dropTarget: CardEntity | null = null;

  /** Ghost clone shown at the original position during drag */
  private dragGhost: HTMLElement | null = null;

  /** Whether a drag session is active */
  private isDragging: boolean = false;

  /** Whether pointer has moved past the drag threshold */
  private hasExceededThreshold: boolean = false;

  /** Whether this drag should split the selected card from its stack. */
  private splitStackOnDragStart: boolean = false;

  /** Bound event handlers (stored for removal) */
  private boundOnPointerDown: (e: PointerEvent) => void;
  private boundOnPointerMove: (e: PointerEvent) => void;
  private boundOnPointerUp: (e: PointerEvent) => void;

  constructor(
    board: Board,
    onDrop: (draggedId: string, targetId: string) => void,
    onSell: (cardId: string) => void
  ) {
    this.board = board;
    this.onDrop = onDrop;
    this.onSell = onSell;

    // Bind handlers once so we can attach/detach reliably
    this.boundOnPointerDown = this.onPointerDown.bind(this);
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerUp = this.onPointerUp.bind(this);
  }

  /** Attach pointer event listeners. Down on board, move/up on window for reliable capture. */
  attach(): void {
    this.board.rootElement.addEventListener('pointerdown', this.boundOnPointerDown);
    window.addEventListener('pointermove', this.boundOnPointerMove);
    window.addEventListener('pointerup', this.boundOnPointerUp);
    window.addEventListener('pointercancel', this.boundOnPointerUp);
  }

  /** Detach pointer event listeners */
  detach(): void {
    this.board.rootElement.removeEventListener('pointerdown', this.boundOnPointerDown);
    window.removeEventListener('pointermove', this.boundOnPointerMove);
    window.removeEventListener('pointerup', this.boundOnPointerUp);
    window.removeEventListener('pointercancel', this.boundOnPointerUp);
  }

  // ========================================================================
  // Event Handlers
  // ========================================================================

  /**
   * Pointer down — attempt to start dragging a card.
   */
  private onPointerDown(e: PointerEvent): void {
    // Only respond to primary (left) button
    if (e.button !== 0) return;

    // Hit-test to find which card (if any) is under the pointer
    const hits = this.board.hitTest(e.clientX, e.clientY);
    if (hits.length === 0) return;

    const targetEntity = hits[0];

    // If the card is locked, it cannot be dragged
    if (targetEntity.data.locked) return;

    // Prevent browser default drag behaviors
    e.preventDefault();

    // Store grab offset in board coordinates
    const boardPos = this.board.screenToBoard(e.clientX, e.clientY);
    this.grabOffsetX = boardPos.x - targetEntity.data.position.x;
    this.grabOffsetY = boardPos.y - targetEntity.data.position.y;

    // Store original position for snap-back
    this.originalX = targetEntity.data.position.x;
    this.originalY = targetEntity.data.position.y;

    // Begin drag state
    this.draggedEntity = targetEntity;
    this.isDragging = false;
    this.hasExceededThreshold = false;
    this.splitStackOnDragStart = e.shiftKey && targetEntity.stackGroupId !== null;

    // Populate extra dragged entities from stack group (Spider Solitaire drag)
    this.extraDraggedEntities = [];
    this.extraOriginalPositions = [];

    if (!this.splitStackOnDragStart && targetEntity.stackGroupId) {
      const groupCards = this.board.getStackGroupCards(targetEntity.stackGroupId);
      for (const card of groupCards) {
        if (card.uid !== targetEntity.uid) {
          this.extraDraggedEntities.push(card);
          this.extraOriginalPositions.push({
            uid: card.uid,
            x: card.data.position.x,
            y: card.data.position.y,
          });
        }
      }
    }
  }

  /**
   * Pointer move — update dragged card position and highlight drop target.
   */
  private onPointerMove(e: PointerEvent): void {
    if (!this.draggedEntity) return;

    const boardPos = this.board.screenToBoard(e.clientX, e.clientY);

    // Check if we've moved past the drag threshold
    if (!this.hasExceededThreshold) {
      const dx = boardPos.x - this.grabOffsetX - this.originalX;
      const dy = boardPos.y - this.grabOffsetY - this.originalY;
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
        return;
      }
      this.hasExceededThreshold = true;

      // Split only after a real drag starts, so Shift-click does not mutate stacks.
      if (this.splitStackOnDragStart) {
        this.board.splitCardFromStack(this.draggedEntity.uid);
        this.extraDraggedEntities = [];
        this.extraOriginalPositions = [];
      }

      // First time exceeding threshold — begin visual drag state
      this.beginDrag();
    }

    // Compute new board position for the dragged card
    const newX = boardPos.x - this.grabOffsetX;
    const newY = boardPos.y - this.grabOffsetY;

    // Update dragged card position directly (bypass syncDOM for responsiveness)
    this.draggedEntity.data.position.x = newX;
    this.draggedEntity.data.position.y = newY;
    this.draggedEntity.el.style.left = `${newX}px`;
    this.draggedEntity.el.style.top = `${newY}px`;

    // Move extra dragged cards by the same delta
    const deltaX = newX - this.originalX;
    const deltaY = newY - this.originalY;
    for (let i = 0; i < this.extraDraggedEntities.length; i++) {
      const entity = this.extraDraggedEntities[i];
      const orig = this.extraOriginalPositions[i];
      const ex = orig.x + deltaX;
      const ey = orig.y + deltaY;
      entity.data.position.x = ex;
      entity.data.position.y = ey;
      entity.el.style.left = `${ex}px`;
      entity.el.style.top = `${ey}px`;
    }

    // Hit-test for drop target (screen coords)
    this.updateDropTarget(e.clientX, e.clientY);

    // Highlight sell zone if hovering over it
    if (this.board.isOverSellZone(e.clientX, e.clientY)) {
      this.board.setSellZoneActive(true);
    } else {
      this.board.setSellZoneActive(false);
    }
  }

  /**
   * Pointer up — finalize the drag. Either drop on target, sell, or snap back.
   */
  private onPointerUp(e: PointerEvent): void {
    if (!this.draggedEntity) return;

    const entity = this.draggedEntity;
    const screenX = e.clientX;
    const screenY = e.clientY;

    this.endDrag();

    // Check if dropped on the sell zone
    if (this.board.isOverSellZone(screenX, screenY)) {
      this.board.setSellZoneActive(false);

      // Particle burst at the card position
      ParticleEffect.sell(
        this.board.viewportElement,
        entity.data.position.x + 40,
        entity.data.position.y + 50,
      );

      // For stack groups, don't snap back — the sell handler will sell all cards
      if (!entity.stackGroupId) {
        this.snapBackExtras();
      }

      // Call sell callback (handles the entire stack group in main.ts)
      this.onSell(entity.uid);
      this.resetDragState();
      return;
    }

    // Check if dropped on another card
    const hits = this.board.hitTest(screenX, screenY);
    // Filter out the dragged entity itself and any extra dragged cards
    const draggedUids = new Set([
      entity.uid,
      ...this.extraDraggedEntities.map((e) => e.uid),
    ]);
    const validHits = hits.filter((h) => !draggedUids.has(h.uid));

    if (validHits.length > 0) {
      const targetEntity = validHits[0];

      // Particle burst at the midpoint of the two cards
      const midX = (entity.data.position.x + targetEntity.data.position.x) / 2;
      const midY = (entity.data.position.y + targetEntity.data.position.y) / 2;
      ParticleEffect.combine(this.board.viewportElement, midX, midY);

      // For stack groups, don't snap back extras — the onDrop handler
      // will reposition them when creating/joining stack groups.
      // For single cards, snap back extras (which are empty anyway).
      if (!entity.stackGroupId) {
        this.snapBackExtras();
      }

      // Call drop callback
      this.onDrop(entity.uid, targetEntity.uid);

      // Clean up dragged entities (primary + extras)
      this.cleanUpDraggedEntities();
    } else {
      sound.drop();
      // Keep card at new position — don't snap back
      // For stack groups, realign positions; for single cards, snap back extras
      if (entity.stackGroupId) {
        // Realign all cards in the stack to their proper offset positions
        this.board.updateStackPositions(entity.stackGroupId);
      } else {
        this.snapBackExtras();
      }

      // Clean up dragged entities
      this.cleanUpDraggedEntities();
    }

    this.resetDragState();
  }

  // ========================================================================
  // Drag State Management
  // ========================================================================

  /**
   * Begin visual drag state.
   * Sets high z-index, adds 'dragging' CSS class, disables transitions.
   */
  private beginDrag(): void {
    if (!this.draggedEntity) return;

    this.isDragging = true;

    sound.pickUp();

    // Style the primary dragged card
    this.draggedEntity.isDragging = true;
    this.draggedEntity.el.style.zIndex = DRAG_Z_INDEX;
    this.draggedEntity.el.classList.add('dragging');
    this.disableTransition(this.draggedEntity.el);

    // Create a ghost clone at the original position
    this.dragGhost = this.draggedEntity.el.cloneNode(true) as HTMLElement;
    this.dragGhost.classList.add('drag-ghost');
    this.dragGhost.style.left = `${this.originalX}px`;
    this.dragGhost.style.top = `${this.originalY}px`;
    this.dragGhost.style.position = 'absolute';
    this.dragGhost.style.opacity = '0.25';
    this.dragGhost.style.pointerEvents = 'none';
    this.dragGhost.style.zIndex = '0';  // Below real cards (z=1), not above
    this.board.viewportElement.appendChild(this.dragGhost);

    // Update its spatial index since it's moving
    this.board.updateSpatialIndex(this.draggedEntity);

    // Style extra dragged cards
    for (const entity of this.extraDraggedEntities) {
      entity.isDragging = true;
      entity.el.style.zIndex = String(Number(DRAG_Z_INDEX) - 1);
      entity.el.classList.add('dragging');
      this.disableTransition(entity.el);
    }
  }

  /**
   * End visual drag state.
   * Removes CSS classes but keeps z-index for snap-back animation.
   */
  private endDrag(): void {
    // Clear drop target highlight
    this.clearDropTarget();

    // Clear sell zone highlight
    this.board.setSellZoneActive(false);

    // Remove drag ghost
    this.removeDragGhost();

    if (this.draggedEntity) {
      this.draggedEntity.isDragging = false;
      this.draggedEntity.el.classList.remove('dragging');
    }

    for (const entity of this.extraDraggedEntities) {
      entity.isDragging = false;
      entity.el.classList.remove('dragging');
    }
  }

  /**
   * Reset all drag state to idle.
   * Also performs defensive cleanup of any lingering visual elements
   * (drag ghost, drop target highlight) in case the normal endDrag()
   * flow was bypassed (e.g., pointercancel).
   */
  private resetDragState(): void {
    // Defensive cleanup — safe to call even if already cleaned up
    this.removeDragGhost();
    this.clearDropTarget();

    this.draggedEntity = null;
    this.extraDraggedEntities = [];
    this.extraOriginalPositions = [];
    this.dropTarget = null;
    this.isDragging = false;
    this.hasExceededThreshold = false;
    this.splitStackOnDragStart = false;
  }

  // ========================================================================
  // Drop Target Highlighting
  // ========================================================================

  /**
   * Update the drop target highlight based on the current pointer position.
   */
  private updateDropTarget(screenX: number, screenY: number): void {
    const hits = this.board.hitTest(screenX, screenY);

    // Filter out dragged cards
    if (this.draggedEntity) {
      const draggedUids = new Set([
        this.draggedEntity.uid,
        ...this.extraDraggedEntities.map((e) => e.uid),
      ]);

      // Find the first valid hit that isn't one of the dragged cards
      const validHit = hits.find((h) => !draggedUids.has(h.uid));

      if (validHit && validHit !== this.dropTarget) {
        // Clear old target
        this.clearDropTarget();
        // Set new target
        this.dropTarget = validHit;
        this.dropTarget.el.classList.add('drop-target');
      } else if (!validHit && this.dropTarget) {
        // Pointer moved off the target
        this.clearDropTarget();
      }
    }
  }

  /**
   * Remove highlight from the current drop target.
   */
  private clearDropTarget(): void {
    if (this.dropTarget) {
      this.dropTarget.el.classList.remove('drop-target');
      this.dropTarget = null;
    }
  }

  // ========================================================================
  // Snap-back
  // ========================================================================

  /**
   * Snap a card entity back to its specified board position with CSS animation.
   */
  private snapBack(
    entity: CardEntity,
    targetX?: number,
    targetY?: number
  ): void {
    const x = targetX ?? this.originalX;
    const y = targetY ?? this.originalY;

    // Enable CSS transition for smooth snap-back
    entity.el.style.transition = 'left 0.2s ease, top 0.2s ease';
    entity.data.position.x = x;
    entity.data.position.y = y;
    entity.el.style.left = `${x}px`;
    entity.el.style.top = `${y}px`;
    entity.el.style.zIndex = '1';

    // Remove transition after animation completes
    const cleanup = () => {
      entity.el.style.transition = '';
      entity.el.removeEventListener('transitionend', cleanup);
    };
    entity.el.addEventListener('transitionend', cleanup, { once: true });
  }

  /**
   * Snap all extra dragged cards back to their original positions.
   */
  private snapBackExtras(): void {
    for (let i = 0; i < this.extraDraggedEntities.length; i++) {
      const entity = this.extraDraggedEntities[i];
      const orig = this.extraOriginalPositions[i];
      this.snapBack(entity, orig.x, orig.y);
    }
    this.extraDraggedEntities = [];
    this.extraOriginalPositions = [];
  }

  // ========================================================================
  // Helpers
  // ========================================================================

  /**
   * Remove the drag ghost element from the DOM.
   */
  private removeDragGhost(): void {
    if (this.dragGhost) {
      this.dragGhost.remove();
      this.dragGhost = null;
    }
  }

  /**
   * Clean up visual drag state on all dragged entities (primary + extras).
   * Resets z-index, transitions, drag flag, and spatial index.
   */
  private cleanUpDraggedEntities(): void {
    if (this.draggedEntity) {
      // Clear inline z-index so CSS can take over (important for stacked cards)
      this.draggedEntity.el.style.zIndex = '';
      this.draggedEntity.el.style.transition = '';
      this.draggedEntity.isDragging = false;
      this.draggedEntity.dirty = true;
      this.board.updateSpatialIndex(this.draggedEntity);
    }

    for (const entity of this.extraDraggedEntities) {
      entity.el.style.zIndex = '';
      entity.el.style.transition = '';
      entity.isDragging = false;
      entity.dirty = true;
      this.board.updateSpatialIndex(entity);
    }
  }

  /**
   * Disable CSS transitions on an element (for instant dragging).
   */
  private disableTransition(el: HTMLElement): void {
    el.style.transition = 'none';
  }
}
