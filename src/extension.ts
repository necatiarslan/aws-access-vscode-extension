import * as vscode from 'vscode';
import * as aws from './aws-login';

export function activate(context: vscode.ExtensionContext) {
	console.log('Aws Access is now active!');

	let disposable = vscode.commands.registerCommand('aws-access-vscode-extension.CheckAwsCredentials', () => {
		
		let provider = aws.getDefaultProvider();
		vscode.window.showInformationMessage(provider);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	console.log('Aws Access is now de-active!');
}
