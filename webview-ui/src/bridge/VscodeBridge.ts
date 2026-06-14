/**
 * Typed communication bridge between webview and extension host.
 * Wraps the VSCode postMessage API with typed send/receive.
 */
import type {
  WebviewMessage,
  ExtensionMessage,
} from '../../../src/protocol/messages';

type MessageListener = (msg: ExtensionMessage) => void;

const listeners: Set<MessageListener> = new Set();

/**
 * Acquire the VSCode API. Only call once at startup.
 */
export function acquireVsCodeApi(): any {
  // The VSCode webview sandbox injects this function globally
  return (window as any).acquireVsCodeApi?.() ?? {
    postMessage: (msg: any) =>
      console.log('[Bridge:Dev] postMessage:', msg),
    getState: () => ({}),
    setState: (_state: any) => {},
  };
}

const vscode = acquireVsCodeApi();

/**
 * Send a typed message to the extension host.
 */
export function send(message: WebviewMessage): void {
  vscode.postMessage(message);
}

/**
 * Register a listener for incoming extension messages.
 */
export function onMessage(listener: MessageListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Boot the message listener. Call once at startup.
 */
export function startListening(): void {
  window.addEventListener('message', (event) => {
    const msg = event.data as ExtensionMessage;
    if (!msg || typeof msg.type !== 'string') {
      return;
    }
    for (const listener of listeners) {
      listener(msg);
    }
  });

  // Tell the extension host we're ready
  send({ type: 'ready' });
}

/**
 * Request current settings from the extension host.
 */
export function requestSettings(): void {
  send({ type: 'requestSettings' });
}

/**
 * Request a save to a specific slot.
 */
export function requestSave(slotIndex: number, state: any): void {
  send({ type: 'saveRequest', slotIndex, state } as WebviewMessage);
}

/**
 * Request a load from a specific slot.
 */
export function requestLoad(slotIndex: number): void {
  send({ type: 'loadRequest', slotIndex });
}

/**
 * Trigger autosave.
 */
export function autoSave(state: any): void {
  send({ type: 'autoSave', state } as WebviewMessage);
}

/**
 * Clear all save slots on the extension host.
 */
export function clearSaves(): void {
  send({ type: 'clearSaves' });
}

/**
 * Log to the extension host console.
 */
export function log(
  level: 'info' | 'warn' | 'error',
  message: string
): void {
  send({ type: 'log', level, message });
}
