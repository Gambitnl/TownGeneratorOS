import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "vscode-agent-bridge" is now active!');

    let disposable = vscode.commands.registerCommand('vscode-agent-bridge.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from VSCode Agent Bridge!');
    });

    context.subscriptions.push(disposable);

    const api = {
        sendMessage: (agentId: string, message: string) => {
            vscode.window.showInformationMessage(`Message from ${agentId}: ${message}`);
        }
    };

    return api;
}

export function deactivate() {}