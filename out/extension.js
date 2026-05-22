"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ui = __importStar(require("./access/UI"));
const StatusBar = __importStar(require("./access/StatusBarItem"));
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
    vscode.commands.registerCommand('aws-access-vscode-extension.TestAwsConnectivity', () => {
        StatusBar.StatusBarItem.Current.TestAwsConnectivity();
    });
    vscode.commands.registerCommand('aws-access-vscode-extension.CopyCredentialsToDefaultProfile', () => {
        StatusBar.StatusBarItem.Current.CopyCredentialsToDefaultProfile();
    });
    vscode.window.onDidCloseTerminal((terminal) => {
        StatusBar.StatusBarItem.Current.onDidCloseTerminal(terminal);
    });
}
function deactivate() {
    ui.logToOutput('Aws Access is now de-active!');
}
//# sourceMappingURL=extension.js.map