"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const api = require("./api");
const ui = require("./ui");
const fs_1 = require("fs");
class StatusBarItem {
    constructor(context) {
        this.Text = StatusBarItem.LoadingText;
        this.ToolTip = "Loading ...";
        this.ActiveProfile = "default";
        this.AwsLoginShellCommandList = {};
        this.IsAwsLoginCommandExecuted = false;
        this.IsAutoLoginPaused = false;
        this.IsMeWhoRefreshedTheCredentials = false;
        this.IsCopyCredentialsToDefaultProfile = false;
        ui.logToOutput('StatusBarItem.constructor Started');
        this.context = context;
        StatusBarItem.Current = this;
        const statusBarClickedCommand = 'aws-access-vscode-extension.statusBarClicked';
        context.subscriptions.push(vscode.commands.registerCommand(statusBarClickedCommand, StatusBarItem.StatusBarClicked));
        this.awsAccessStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
        this.awsAccessStatusBarItem.command = statusBarClickedCommand;
        this.awsAccessStatusBarItem.text = StatusBarItem.LoadingText;
        this.awsAccessStatusBarItem.tooltip = this.ToolTip;
        context.subscriptions.push(this.awsAccessStatusBarItem);
        this.awsAccessStatusBarItem.show();
        const extraButtonClickedCommand = 'aws-access-vscode-extension.extraButtonClicked';
        context.subscriptions.push(vscode.commands.registerCommand(extraButtonClickedCommand, StatusBarItem.ExtraButtonClicked));
        this.awsExtraStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.awsExtraStatusBarItem.command = extraButtonClickedCommand;
        context.subscriptions.push(this.awsExtraStatusBarItem);
        this.ShowLoading();
        this.LoadState();
        this.GetCredentials();
    }
    StartTimer() {
        this.Timer = setInterval(StatusBarItem.OnTimerTicked, 1 * 1000);
    }
    StopTimer() {
        clearInterval(this.Timer);
    }
    get Profiles() {
        let result = [];
        if (this.IniData) {
            result = Object.keys(this.IniData);
        }
        return result;
    }
    get HasCredentials() {
        return this.IniData !== undefined;
    }
    get HasDefaultCredentials() {
        return this.Profiles.includes("default");
    }
    OpenCredentialsFile() {
        if (this.HasCredentials) {
            let filePath = api.getCredentialsFilepath();
            if ((0, fs_1.existsSync)(filePath)) {
                ui.openFile(filePath);
            }
            else {
                ui.showWarningMessage("Credentials File NOT Found Path=" + filePath);
            }
        }
        else {
            ui.showWarningMessage("Credentials File NOT Found");
        }
    }
    OpenConfigFile() {
        if (this.HasCredentials) {
            let filePath = api.getConfigFilepath();
            if ((0, fs_1.existsSync)(filePath)) {
                ui.openFile(filePath);
            }
            else {
                ui.showWarningMessage("Config File NOT Found Path=" + filePath);
            }
        }
        else {
            ui.showWarningMessage("Config File NOT Found");
        }
    }
    async TestAwsConnectivity() {
        if (this.HasCredentials) {
            let canConnect = await api.testAwsConnectivity(this.ActiveProfile);
            if (canConnect) {
                ui.showInfoMessage("Successfully Connect to AWS with User " + this.ActiveProfile);
            }
        }
        else {
            ui.showWarningMessage("Config File NOT Found");
        }
    }
    async CopyCredentialsToDefaultProfile() {
        this.IsCopyCredentialsToDefaultProfile = !this.IsCopyCredentialsToDefaultProfile;
        this.RefreshText();
        this.SaveState();
    }
    get ExpirationDateString() {
        let result;
        if (this.IniData) {
            if (this.IniData[this.ActiveProfile] && this.IniData[this.ActiveProfile]["token_expiration"]) {
                result = this.IniData[this.ActiveProfile]["token_expiration"];
            }
        }
        return result;
    }
    get ExpireDate() {
        let result;
        if (this.ExpirationDateString) {
            result = new Date(this.ExpirationDateString);
        }
        return result;
    }
    get HasExpiration() {
        if (this.HasCredentials && this.ExpirationDateString) {
            return true;
        }
        return false;
    }
    get IsExpired() {
        if (this.ExpirationDateString) {
            let expireDate = new Date(this.ExpirationDateString);
            let now = new Date();
            return expireDate < now;
        }
        return false;
    }
    get ExpireTime() {
        if (this.ExpirationDateString) {
            let now = new Date();
            let expireDate = new Date(this.ExpirationDateString);
            if (this.IsExpired) {
                return ui.getDuration(expireDate, now);
            }
            else {
                return ui.getDuration(now, expireDate);
            }
        }
        return "";
    }
    async GetCredentials() {
        ui.logToOutput('StatusBarItem.GetDefaultCredentials Started');
        let profileData = await api.getIniProfileData();
        try {
            ui.logToOutput('StatusBarItem.GetCredentials IniData Found');
            this.IniData = profileData;
            if (!this.Profiles.includes(this.ActiveProfile) && this.Profiles.length > 0) {
                this.ActiveProfile = this.Profiles[0];
                this.SaveState();
            }
            if (this.HasExpiration) {
                this.StartTimer();
            }
            this.SetDefaultCredentials();
        }
        catch (error) {
            ui.logToOutput('StatusBarItem.GetCredentials Error ' + error);
        }
        finally {
            this.RefreshText();
        }
    }
    SetDefaultCredentials() {
        if (!this.IsCopyCredentialsToDefaultProfile) {
            return;
        }
        ui.logToOutput('StatusBarItem.SetDefaultCredentials Started');
        //active profile is default so no need to update
        if (this.ActiveProfile === "default") {
            return;
        }
        if (this.IniData) {
            if (this.IniData[this.ActiveProfile] && this.IniData["default"]) {
                var aws_access_key_id = this.GetCredentialValue(this.ActiveProfile, "aws_access_key_id");
                var aws_secret_access_key = this.GetCredentialValue(this.ActiveProfile, "aws_secret_access_key");
                var aws_session_token = this.GetCredentialValue(this.ActiveProfile, "aws_session_token");
                var aws_security_token = this.GetCredentialValue(this.ActiveProfile, "aws_security_token");
                var token_expiration = this.GetCredentialValue(this.ActiveProfile, "token_expiration");
                api.setCredentials('default', aws_access_key_id, aws_secret_access_key, aws_session_token, aws_security_token, token_expiration);
                ui.logToOutput('StatusBarItem.SetDefaultCredentials Credentials copied to defauld profile');
            }
        }
    }
    GetCredentialValue(profileName, credentialName) {
        if (this.IniData) {
            if (this.IniData[profileName] && this.IniData[profileName][credentialName]) {
                return this.IniData[profileName][credentialName];
            }
        }
        return undefined;
    }
    async SetAwsLoginCommand() {
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        let shellCommand = await vscode.window.showInputBox({ placeHolder: 'Aws Login Shell Command' });
        if (shellCommand) {
            if (shellCommand.length > 0) {
                this.AwsLoginShellCommand = shellCommand;
                this.AwsLoginShellCommandList[this.ActiveProfile] = shellCommand;
            }
            else {
                this.AwsLoginShellCommand = undefined;
                this.AwsLoginShellCommandList[this.ActiveProfile] = undefined;
            }
            this.SaveState();
        }
    }
    GetAwsLoginCommand(profile) {
        var result = this.AwsLoginShellCommandList[profile];
        return result;
    }
    SetActiveProfile() {
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        if (this.Profiles && this.Profiles.length > 0) {
            let selected = vscode.window.showQuickPick(this.Profiles, { canPickMany: false, placeHolder: 'Select Profile' });
            selected.then(value => {
                if (value) {
                    this.ActiveProfile = value;
                    this.AwsLoginShellCommand = this.GetAwsLoginCommand(this.ActiveProfile);
                    this.ShowLoading();
                    this.GetCredentials();
                    this.SaveState();
                }
            });
        }
        else {
            ui.showWarningMessage("No Profiles Found !!!");
        }
    }
    ShowActiveCredentials() {
        ui.logToOutput('StatusBarItem.ShowActiveCredentials Started');
        ui.showOutputMessage("ActiveProfile: " + this.ActiveProfile, "");
        if (this.HasCredentials) {
            //ui.showOutputMessage(this.Credentials);
            if (this.IniData) {
                ui.showOutputMessage(this.IniData[this.ActiveProfile], "", false);
            }
        }
        else {
            ui.showWarningMessage("No Profiles Found !!!");
        }
        ui.showOutputMessage("AwsLoginShellCommand: " + this.AwsLoginShellCommand, "", false);
    }
    ShowDefaultCredentials() {
        ui.logToOutput('StatusBarItem.ShowDefaultCredentials Started');
        if (this.IniData && this.HasDefaultCredentials) {
            ui.showOutputMessage(this.IniData["default"]);
        }
        else {
            ui.showWarningMessage("Default Credentials NOT Found");
        }
    }
    ListAwsProfiles() {
        ui.logToOutput('StatusBarItem.ListAwsProfiles Started');
        if (this.Profiles && this.Profiles.length > 0) {
            ui.showOutputMessage(this.Profiles);
        }
        else {
            ui.showWarningMessage("No Profiles Found !!!");
        }
        ui.showOutputMessage("AwsLoginShellCommands: ", "", false);
        ui.showOutputMessage(this.AwsLoginShellCommandList, "", false);
    }
    RunLoginCommand() {
        ui.logToOutput('StatusBarItem.AutoCallLoginCommand Started');
        if (this.AwsLoginShellCommand) {
            if (this.IsAutoLoginPaused) {
                setTimeout(this.GetCredentials, 60000);
                return;
            }
            const terminal = vscode.window.createTerminal("Aws Login");
            terminal.show();
            terminal.sendText(this.AwsLoginShellCommand + "; echo 'Terminal Will Close In 5 Secs'; sleep 5; exit");
        }
        else {
            ui.showWarningMessage("Set a Aws Login Shell Command To Run");
            StatusBarItem.OpenCommandPalette();
        }
    }
    PauseAutoLogin() {
        this.IsAutoLoginPaused = !this.IsAutoLoginPaused;
    }
    onDidCloseTerminal(terminal) {
        ui.logToOutput('StatusBarItem.onDidCloseTerminal Started');
        if (terminal.creationOptions.name === "Aws Login") {
            this.IsMeWhoRefreshedTheCredentials = true;
            this.GetCredentials();
        }
    }
    ShowLoading() {
        ui.logToOutput('StatusBarItem.ShowLoading Started');
        this.awsAccessStatusBarItem.text = StatusBarItem.LoadingText;
    }
    RefreshText() {
        ui.logToOutput('StatusBarItem.Refresh Started');
        this.awsExtraStatusBarItem.hide();
        if (!this.HasCredentials) {
            this.ToolTip = "No Aws Credentials Found !!!";
            this.Text = "$(cloud) Aws No Credentials";
        }
        else if (this.HasExpiration && this.IsExpired) {
            this.ToolTip = "Profile:" + this.ActiveProfile + " Expired !!!";
            this.Text = "$(cloud) Expired";
            if (this.AwsLoginShellCommand) {
                this.awsExtraStatusBarItem.text = "$(sync)";
                this.awsExtraStatusBarItem.tooltip = "Refresh Aws Token";
                this.awsExtraStatusBarItem.show();
            }
        }
        else if (this.HasExpiration && !this.IsExpired) {
            this.ToolTip = "Profile:" + this.ActiveProfile + " will expire on " + this.ExpirationDateString;
            this.Text = "$(cloud) Expire In " + this.ExpireTime;
            if (this.Profiles.length > 1) {
                this.awsExtraStatusBarItem.text = "$(account)";
                this.awsExtraStatusBarItem.tooltip = "Switch Aws Account";
                this.awsExtraStatusBarItem.show();
            }
        }
        else {
            this.ToolTip = "Profile:" + this.ActiveProfile;
            this.Text = "$(cloud) Aws $(check)";
            if (this.Profiles.length > 1) {
                this.awsExtraStatusBarItem.text = "$(account)";
                this.awsExtraStatusBarItem.tooltip = "Switch Aws Account";
                this.awsExtraStatusBarItem.show();
            }
        }
        let tooltipLastline = "";
        tooltipLastline += this.GetBoolChar(this.IsMeWhoRefreshedTheCredentials) + "Renew ";
        tooltipLastline += this.GetBoolChar(this.IsCopyCredentialsToDefaultProfile) + "Copy ";
        tooltipLastline += api.getCredentialProvider();
        this.ToolTip += "\n" + tooltipLastline;
        this.awsAccessStatusBarItem.tooltip = this.ToolTip;
        this.awsAccessStatusBarItem.text = this.Text;
    }
    GetBoolChar(value) {
        if (value) {
            return "✓";
        }
        else {
            return "x";
        }
    }
    static OnTimerTicked() {
        if (StatusBarItem.Current.HasExpiration) {
            if (StatusBarItem.Current.ExpirationDateString && StatusBarItem.Current.IsExpired) {
                let expireDate = new Date(StatusBarItem.Current.ExpirationDateString);
                StatusBarItem.Current.ToolTip = "Profile:" + StatusBarItem.Current.ActiveProfile + " Expired !!!";
                StatusBarItem.Current.ToolTip += "\nExpire Time:" + expireDate.toLocaleDateString() + " - " + expireDate.toLocaleTimeString();
                StatusBarItem.Current.Text = "$(cloud) Expired";
                StatusBarItem.Current.StopTimer();
                StatusBarItem.Current.IsAwsLoginCommandExecuted = false;
                if (StatusBarItem.Current.AwsLoginShellCommand) {
                    StatusBarItem.Current.awsExtraStatusBarItem.text = "$(sync)";
                    StatusBarItem.Current.awsExtraStatusBarItem.tooltip = "Refresh Aws Token";
                    StatusBarItem.Current.awsExtraStatusBarItem.show();
                }
                else {
                    StatusBarItem.Current.awsExtraStatusBarItem.hide();
                }
            }
            else {
                StatusBarItem.Current.ToolTip = "Profile:" + StatusBarItem.Current.ActiveProfile;
                StatusBarItem.Current.Text = "$(cloud) Expire In " + StatusBarItem.Current.ExpireTime;
                if (StatusBarItem.Current.IsAutoLoginPaused) {
                    StatusBarItem.Current.ToolTip += "\nAuto Login Paused";
                    StatusBarItem.Current.Text += "(P)";
                }
                if (StatusBarItem.Current.ExpirationDateString && !StatusBarItem.Current.IsAwsLoginCommandExecuted) {
                    let expireDate = new Date(StatusBarItem.Current.ExpirationDateString);
                    let now = new Date();
                    StatusBarItem.Current.ToolTip += "\nExpire Time:" + expireDate.toLocaleDateString() + " - " + expireDate.toLocaleTimeString();
                    if (ui.getSeconds(now, expireDate) === 0 && StatusBarItem.Current.AwsLoginShellCommand) {
                        if (StatusBarItem.Current.IsMeWhoRefreshedTheCredentials === true) {
                            StatusBarItem.Current.RunLoginCommand();
                            StatusBarItem.Current.IsAwsLoginCommandExecuted = true;
                        }
                        else {
                            setTimeout(StatusBarItem.Current.GetCredentials, 60000);
                        }
                    }
                }
                if (StatusBarItem.Current.Profiles.length > 1) {
                    StatusBarItem.Current.awsExtraStatusBarItem.text = "$(account)";
                    StatusBarItem.Current.awsExtraStatusBarItem.tooltip = "Switch Aws Account";
                    StatusBarItem.Current.awsExtraStatusBarItem.show();
                }
                else {
                    StatusBarItem.Current.awsExtraStatusBarItem.hide();
                }
            }
            let tooltipLastline = "";
            tooltipLastline += StatusBarItem.Current.GetBoolChar(StatusBarItem.Current.IsMeWhoRefreshedTheCredentials) + "Renew ";
            tooltipLastline += StatusBarItem.Current.GetBoolChar(StatusBarItem.Current.IsCopyCredentialsToDefaultProfile) + "Copy ";
            tooltipLastline += api.getCredentialProvider();
            StatusBarItem.Current.ToolTip += "\n" + tooltipLastline;
            StatusBarItem.Current.awsAccessStatusBarItem.tooltip = StatusBarItem.Current.ToolTip;
            StatusBarItem.Current.awsAccessStatusBarItem.text = StatusBarItem.Current.Text;
        }
    }
    static async StatusBarClicked() {
        ui.logToOutput('StatusBarItem.StatusBarClicked Started');
        StatusBarItem.OpenCommandPalette();
    }
    static async ExtraButtonClicked() {
        ui.logToOutput('StatusBarItem.ExtraButtonClicked Started');
        if (StatusBarItem.Current.HasExpiration && StatusBarItem.Current.IsExpired) {
            //the credentials may refreshed in another windows, check again
            await StatusBarItem.Current.GetCredentials();
            if (StatusBarItem.Current.HasExpiration && StatusBarItem.Current.IsExpired) {
                StatusBarItem.Current.RunLoginCommand();
            }
        }
        else if (StatusBarItem.Current.Profiles.length > 1) {
            StatusBarItem.Current.SetActiveProfile();
        }
    }
    static OpenCommandPalette() {
        const extensionPrefix = 'Aws Access';
        vscode.commands.executeCommand('workbench.action.quickOpen', `> ${extensionPrefix}`);
    }
    SaveState() {
        ui.logToOutput('StatusBarItem.SaveState Started');
        try {
            this.context.globalState.update('ActiveProfile', this.ActiveProfile);
            this.context.globalState.update('AwsLoginShellCommand', this.AwsLoginShellCommand);
            this.context.globalState.update('AwsLoginShellCommandList', this.AwsLoginShellCommandList);
            this.context.globalState.update('IsCopyCredentialsToDefaultProfile', this.IsCopyCredentialsToDefaultProfile);
        }
        catch (error) {
            ui.logToOutput("StatusBarItem.SaveState Error !!!");
        }
    }
    LoadState() {
        ui.logToOutput('StatusBarItem.LoadState Started');
        try {
            let ActiveProfileTemp = this.context.globalState.get('ActiveProfile');
            if (ActiveProfileTemp) {
                this.ActiveProfile = ActiveProfileTemp;
            }
            let AwsLoginShellCommandTemp = this.context.globalState.get('AwsLoginShellCommand');
            if (AwsLoginShellCommandTemp) {
                this.AwsLoginShellCommand = AwsLoginShellCommandTemp;
            }
            let AwsLoginShellCommandListTemp = this.context.globalState.get('AwsLoginShellCommandList');
            if (AwsLoginShellCommandListTemp) {
                this.AwsLoginShellCommandList = AwsLoginShellCommandListTemp;
            }
            let IsCopyCredentialsToDefaultProfileTemp = this.context.globalState.get('IsCopyCredentialsToDefaultProfile');
            if (IsCopyCredentialsToDefaultProfileTemp) {
                this.IsCopyCredentialsToDefaultProfile = IsCopyCredentialsToDefaultProfileTemp;
            }
        }
        catch (error) {
            ui.logToOutput("dagTreeView.LoadState Error !!!");
        }
    }
}
exports.StatusBarItem = StatusBarItem;
StatusBarItem.LoadingText = "$(cloud) Aws $(sync~spin)";
//# sourceMappingURL=statusBarItem.js.map