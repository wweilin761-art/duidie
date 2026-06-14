import * as vscode from 'vscode';
import type { WebviewMessage, ExtensionMessage } from '../protocol/messages';
import { SaveManager } from './SaveManager';

export class MessageHandler {
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly webview: vscode.Webview,
    private readonly saveManager: SaveManager
  ) {}

  /**
   * Set up message listener for incoming webview messages.
   */
  listen(): void {
    this.disposables.push(
      this.webview.onDidReceiveMessage(
        (message: WebviewMessage) => this.handleMessage(message),
        null,
        this.disposables
      )
    );
  }

  /**
   * Send a typed message to the webview.
   */
  postMessage(message: ExtensionMessage): void {
    this.webview.postMessage(message);
  }

  /**
   * Route incoming messages from the webview.
   */
  private async handleMessage(msg: WebviewMessage): Promise<void> {
    switch (msg.type) {
      case 'ready':
        break;

      case 'saveRequest':
        await this.handleSaveRequest(msg.slotIndex, msg.state);
        break;

      case 'loadRequest':
        await this.handleLoadRequest(msg.slotIndex);
        break;

      case 'autoSave':
        await this.handleAutoSave(msg.state);
        break;

      case 'requestSettings':
        this.handleRequestSettings();
        break;

      case 'log':
        this.handleLog(msg.level, msg.message);
        break;

      case 'clearSaves':
        this.handleClearSaves();
        break;

      default:
        console.warn(`[Stacklands] 未知消息类型: ${(msg as any).type}`);
    }
  }

  private async handleSaveRequest(slotIndex: number, state: any): Promise<void> {
    try {
      await this.saveManager.save(slotIndex, state);
      this.postMessage({
        type: 'saveResponse',
        slotIndex,
        success: true,
      });
    } catch (err: any) {
      this.postMessage({
        type: 'saveResponse',
        slotIndex,
        success: false,
        error: err.message,
      });
    }
  }

  private async handleLoadRequest(slotIndex: number): Promise<void> {
    try {
      const state = await this.saveManager.load(slotIndex);
      this.postMessage({
        type: 'loadResponse',
        slotIndex,
        state,
        error: state ? undefined : '此存档槽位为空',
      });
    } catch (err: any) {
      this.postMessage({
        type: 'loadResponse',
        slotIndex,
        state: null,
        error: err.message,
      });
    }
  }

  private async handleAutoSave(state: any): Promise<void> {
    try {
      await this.saveManager.save(0, state);
    } catch (err) {
      console.error('[Stacklands] 自动保存失败:', err);
    }
  }

  private async handleClearSaves(): Promise<void> {
    try {
      await this.saveManager.clearAll();
      this.postMessage({
        type: 'clearSavesResponse',
        success: true,
      });
    } catch (err: any) {
      this.postMessage({
        type: 'clearSavesResponse',
        success: false,
      });
    }
  }

  private handleRequestSettings(): void {
    const config = this.saveManager.getConfig();
    this.postMessage({
      type: 'settingsUpdate',
      settings: config,
    });
  }

  private handleLog(level: 'info' | 'warn' | 'error', message: string): void {
    const prefix = '[Stacklands:Webview]';
    switch (level) {
      case 'error':
        console.error(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
