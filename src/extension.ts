import * as vscode from 'vscode';
import {
  CMD_START_GAME,
  CMD_SAVE_GAME,
  CMD_LOAD_GAME,
  CMD_RESET_GAME,
  CMD_CLEAR_SAVES,
  VIEW_TYPE_STACKLANDS,
} from './constants';
import { WebviewManager } from './managers/WebviewManager';
import { SaveManager } from './managers/SaveManager';

let webviewManager: WebviewManager | undefined;
let saveManager: SaveManager | undefined;

export function activate(context: vscode.ExtensionContext): void {
  console.log('[Stacklands] 堆叠大陆插件已激活');

  // Initialize managers
  saveManager = new SaveManager(context);
  webviewManager = new WebviewManager(context, saveManager);

  // Register sidebar view provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      VIEW_TYPE_STACKLANDS,
      webviewManager!
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand(CMD_START_GAME, () => {
      webviewManager?.reveal();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(CMD_SAVE_GAME, async () => {
      const messageHandler = webviewManager?.getMessageHandler();
      if (messageHandler) {
        // Trigger save from webview side
        const webview = webviewManager?.getWebview();
        webview?.postMessage({ type: 'requestSave' });
        vscode.window.showInformationMessage('堆叠大陆: 游戏已保存！');
      } else {
        vscode.window.showWarningMessage('堆叠大陆: 请先打开游戏视图');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(CMD_LOAD_GAME, async () => {
      const messageHandler = webviewManager?.getMessageHandler();
      if (messageHandler) {
        const state = await saveManager!.load(0);
        if (state) {
          messageHandler.postMessage({
            type: 'loadResponse',
            slotIndex: 0,
            state,
          });
          vscode.window.showInformationMessage('堆叠大陆: 游戏已加载！');
        } else {
          vscode.window.showWarningMessage('堆叠大陆: 未找到存档');
        }
      } else {
        vscode.window.showWarningMessage('堆叠大陆: 请先点击侧边栏图标打开游戏');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(CMD_RESET_GAME, () => {
      const webview = webviewManager?.getWebview();
      if (webview) {
        webview.postMessage({ type: 'resetGame' });
        vscode.window.showInformationMessage('堆叠大陆: 游戏已重置！');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(CMD_CLEAR_SAVES, async () => {
      const confirmed = await vscode.window.showWarningMessage(
        '确定要清除所有存档吗？此操作不可撤销。',
        { modal: true },
        '确定',
        '取消'
      );
      if (confirmed === '确定') {
        await saveManager!.clearAll();
        vscode.window.showInformationMessage('堆叠大陆: 所有存档已清除！');
      }
    })
  );
}

export function deactivate(): void {
  webviewManager?.dispose();
  console.log('[Stacklands] 堆叠大陆插件已停用');
}
