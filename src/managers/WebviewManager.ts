import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { VIEW_TYPE_STACKLANDS } from '../constants';
import { MessageHandler } from './MessageHandler';
import { SaveManager } from './SaveManager';

/**
 * WebviewManager now implements WebviewViewProvider for sidebar integration.
 * The game lives in the VSCode activity bar sidebar instead of an editor panel.
 */
export class WebviewManager implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;
  private messageHandler: MessageHandler | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly saveManager: SaveManager
  ) {}

  /**
   * Called by VSCode when the sidebar view is created or restored.
   */
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void | Thenable<void> {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(
          path.join(this.context.extensionPath, 'webview-ui')
        ),
      ],
    };

    // Set the HTML content
    webviewView.webview.html = this.getHtmlContent();

    // Set up message handler
    this.messageHandler = new MessageHandler(
      webviewView.webview,
      this.saveManager
    );
    this.messageHandler.listen();

    // Handle visibility changes
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        // View became visible — game continues (retainContextWhenHidden keeps it alive)
      }
    });

    // Handle disposal
    webviewView.onDidDispose(() => {
      this.messageHandler?.dispose();
      this.messageHandler = undefined;
      this.view = undefined;
    });
  }

  /**
   * Get the current webview instance.
   */
  getWebview(): vscode.Webview | undefined {
    return this.view?.webview;
  }

  /**
   * Get the message handler for external access.
   */
  getMessageHandler(): MessageHandler | undefined {
    return this.messageHandler;
  }

  /**
   * Show/reveal the sidebar view.
   */
  reveal(): void {
    if (this.view) {
      this.view.show(true);
    }
  }

  /**
   * Build the HTML page loaded inside the webview.
   */
  private getHtmlContent(): string {
    const webview = this.view!.webview;

    // Path to the bundled webview script
    const bundleUri = webview.asWebviewUri(
      vscode.Uri.file(
        path.join(
          this.context.extensionPath,
          'webview-ui',
          'dist',
          'bundle.js'
        )
      )
    );

    // Read CSS files from disk and inline them
    const cssFiles = ['main.css', 'board.css', 'card.css', 'overlays.css'];
    let inlineStyles = '';
    for (const cssFile of cssFiles) {
      const cssPath = path.join(
        this.context.extensionPath,
        'webview-ui',
        'styles',
        cssFile
      );
      try {
        if (fs.existsSync(cssPath)) {
          inlineStyles += fs.readFileSync(cssPath, 'utf-8') + '\n';
        }
      } catch (err) {
        console.error(
          `[Stacklands] Failed to read CSS: ${cssPath}`,
          err
        );
      }
    }

    // Use a nonce for script security
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:;">
  <title>堆叠大陆 Stacklands</title>
  <style>${inlineStyles}</style>
</head>
<body>
  <div id="game-root"></div>
  <script nonce="${nonce}" src="${bundleUri}"></script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 64; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  dispose(): void {
    this.messageHandler?.dispose();
    this.view = undefined;
  }
}
