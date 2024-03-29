"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const ui = require("./ui");
const StatusBar = require("./statusBarItem");
function activate(context) {
    ui.logToOutput('Aws Credentials is now active!');
    new StatusBar.StatusBarItem(context);
    vscode.commands.registerCommand('aws-credentials-vscode-extension.RefreshCredentials', () => {
        StatusBar.StatusBarItem.Current.GetCredentials();
    });
    vscode.commands.registerCommand('aws-credentials-vscode-extension.SetAwsLoginCommand', () => {
        StatusBar.StatusBarItem.Current.SetAwsLoginCommand();
    });
    vscode.commands.registerCommand('aws-credentials-vscode-extension.ListAwsProfiles', () => {
        StatusBar.StatusBarItem.Current.ListAwsProfiles();
    });
    vscode.commands.registerCommand('aws-credentials-vscode-extension.RunLoginCommand', () => {
        StatusBar.StatusBarItem.Current.RunLoginCommand();
    });
    vscode.commands.registerCommand('aws-credentials-vscode-extension.PauseAutoLogin', () => {
        StatusBar.StatusBarItem.Current.PauseAutoLogin();
    });
    vscode.commands.registerCommand('aws-credentials-vscode-extension.SetActiveProfile', () => {
        StatusBar.StatusBarItem.Current.SetActiveProfile();
    });
    vscode.commands.registerCommand('aws-credentials-vscode-extension.ShowActiveCredentials', () => {
        StatusBar.StatusBarItem.Current.ShowActiveCredentials();
    });
    vscode.commands.registerCommand('aws-credentials-vscode-extension.ShowDefaultCredentials', () => {
        StatusBar.StatusBarItem.Current.ShowDefaultCredentials();
    });
    vscode.commands.registerCommand('aws-credentials-vscode-extension.OpenCredentialsFile', () => {
        StatusBar.StatusBarItem.Current.OpenCredentialsFile();
    });
    vscode.commands.registerCommand('aws-credentials-vscode-extension.OpenConfigFile', () => {
        StatusBar.StatusBarItem.Current.OpenConfigFile();
    });
    vscode.commands.registerCommand('aws-credentials-vscode-extension.TestAwsConnectivity', () => {
        StatusBar.StatusBarItem.Current.TestAwsConnectivity();
    });
    vscode.commands.registerCommand('aws-credentials-vscode-extension.CopyCredentialsToDefaultProfile', () => {
        StatusBar.StatusBarItem.Current.CopyCredentialsToDefaultProfile();
    });
    vscode.window.onDidCloseTerminal((terminal) => {
        StatusBar.StatusBarItem.Current.onDidCloseTerminal(terminal);
    });
}
exports.activate = activate;
function deactivate() {
    ui.logToOutput('Aws Credentials is now de-active!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map