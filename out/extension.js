"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const ui = require("./ui");
const StatusBar = require("./statusBarItem");
function activate(context) {
    ui.logToOutput('Aws Access is now active!');
    new StatusBar.StatusBarItem(context);
    vscode.commands.registerCommand('aws-access-vscode-extension.CheckAwsCredentials', () => {
        StatusBar.StatusBarItem.Current.GetDefaultCredentials();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.SetAwsLoginCommand', () => {
        StatusBar.StatusBarItem.Current.SetAwsLoginCommand();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.ListAwsProfiles', () => {
        StatusBar.StatusBarItem.Current.ListAwsProfiles();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.AutoCallLoginCommand', () => {
        StatusBar.StatusBarItem.Current.AutoCallLoginCommand();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.SetAutoCallLoginCommandTime', () => {
        StatusBar.StatusBarItem.Current.SetAutoCallLoginCommandTime();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.SetTimeoutErrorTime', () => {
        StatusBar.StatusBarItem.Current.SetTimeoutErrorTime();
    });
}
exports.activate = activate;
function deactivate() {
    ui.logToOutput('Aws Access is now de-active!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map