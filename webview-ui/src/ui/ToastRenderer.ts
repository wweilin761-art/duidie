/**
 * ToastRenderer — lightweight toast notification system.
 *
 * Toasts appear at the bottom center of the screen, stacked vertically,
 * and automatically dismiss after their animation completes.
 *
 * Supports four types: info, success, warning, error.
 * Each type has a colored left border and an emoji icon prefix.
 */

export type ToastType = 'info' | 'success' | 'warning' | 'error';

const TOAST_ICONS: Record<ToastType, string> = {
  info: '🔵',       // 🔵 blue circle
  success: '🟢',    // 🟢 green circle
  warning: '🟡',    // 🟡 yellow circle
  error: '🔴',      // 🔴 red circle
};

const TOAST_CSS_CLASSES: Record<ToastType, string> = {
  info: 'toast-info',
  success: 'toast-success',
  warning: 'toast-warning',
  error: 'toast-error',
};

export class ToastRenderer {
  private container: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    parent.appendChild(this.container);
  }

  /**
   * Show a toast message with an optional type.
   *
   * @param message - The text to display.
   * @param type    - Toast type (info, success, warning, error). Defaults to 'info'.
   * @param durationMs - Optional custom duration in milliseconds before removal. Defaults to 3200.
   */
  show(message: string, type: ToastType = 'info', durationMs: number = 3200): void {
    const toast = document.createElement('div');
    toast.className = 'toast ' + TOAST_CSS_CLASSES[type];

    // Icon span
    const iconEl = document.createElement('span');
    iconEl.className = 'toast-icon';
    iconEl.textContent = TOAST_ICONS[type];
    toast.appendChild(iconEl);

    // Message span
    const msgEl = document.createElement('span');
    msgEl.className = 'toast-message';
    msgEl.textContent = message;
    toast.appendChild(msgEl);

    this.container.appendChild(toast);

    // Remove the element after the CSS animation completes.
    // CSS: toastSlideIn (0.3s) then toastFadeOut (0.3s with 2.5s delay).
    // Default total: 0.3 + 2.5 + 0.3 = 3.1 s. Add a small buffer.
    const removeDelay = Math.max(durationMs, 1000);
    setTimeout(() => {
      if (toast.parentNode === this.container) {
        this.container.removeChild(toast);
      }
    }, removeDelay);
  }
}
