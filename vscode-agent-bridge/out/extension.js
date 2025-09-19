"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
function activate(context) {
    console.log('Congratulations, your extension "vscode-agent-bridge" is now active!');
    let disposable = vscode.commands.registerCommand('vscode-agent-bridge.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from VSCode Agent Bridge!');
    });
    context.subscriptions.push(disposable);
    const api = {
        sendMessage: (agentId, message) => {
            vscode.window.showInformationMessage(`Message from ${agentId}: ${message}`);
        }
    };
    return api;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map