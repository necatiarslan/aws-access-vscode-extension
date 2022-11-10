"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const ui = require("./ui");
const StatusBar = require("./statusBarItem");
function activate(context) {
    ui.logToOutput('Aws Access is now active!');
    new StatusBar.StatusBarItem(context);
    vscode.commands.registerCommand('aws-access-vscode-extension.RefreshCredentials', () => {
        StatusBar.StatusBarItem.Current.GetCredentials();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.SetAwsLoginCommand', () => {
        StatusBar.StatusBarItem.Current.SetAwsLoginCommand();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.ListAwsProfiles', () => {
        StatusBar.StatusBarItem.Current.ListAwsProfiles();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.RunLoginCommand', () => {
        StatusBar.StatusBarItem.Current.RunLoginCommand();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.PauseAutoLogin', () => {
        StatusBar.StatusBarItem.Current.PauseAutoLogin();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.SetActiveProfile', () => {
        StatusBar.StatusBarItem.Current.SetActiveProfile();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.ShowActiveCredentials', () => {
        StatusBar.StatusBarItem.Current.ShowActiveCredentials();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.ShowDefaultCredentials', () => {
        StatusBar.StatusBarItem.Current.ShowDefaultCredentials();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.OpenCredentialsFile', () => {
        StatusBar.StatusBarItem.Current.OpenCredentialsFile();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.OpenConfigFile', () => {
        StatusBar.StatusBarItem.Current.OpenConfigFile();
    });
    vscode.window.onDidCloseTerminal((terminal) => {
        StatusBar.StatusBarItem.Current.onDidCloseTerminal(terminal);
    });
}
exports.activate = activate;
function deactivate() {
    ui.logToOutput('Aws Access is now de-active!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map