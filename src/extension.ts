import * as vscode from 'vscode';
import * as api from './api';
import * as ui from './ui';
import * as StatusBar from './statusBarItem';

export function activate(context: vscode.ExtensionContext) {
	ui.logToOutput('Aws Access is now active!');

	
	new StatusBar.StatusBarItem(context);
	
	vscode.commands.registerCommand('aws-access-vscode-extension.CheckAwsCredentials', () => {
		StatusBar.StatusBarItem.Current.GetCredentials();
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

}

export function deactivate() {
	ui.logToOutput('Aws Access is now de-active!');
}
