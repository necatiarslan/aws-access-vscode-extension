"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const aws = require("./aws-login");
function activate(context) {
    console.log('Aws Access is now active!');
    let disposable = vscode.commands.registerCommand('aws-access-vscode-extension.CheckAwsCredentials', () => {
        let provider = aws.getDefaultProvider();
        vscode.window.showInformationMessage(provider);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() {
    console.log('Aws Access is now de-active!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map