"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBar = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const api = require("./api");
const ui = require("./ui");
const fs_1 = require("fs");
class StatusBar {
    constructor(context) {
        this.Text = StatusBar.LoadingText;
        this.ToolTip = "Loading ...";
        this.ActiveProfile = "default";
        this.AwsLoginShellCommandList = {};
        this.IsAwsLoginCommandExecuted = false;
        this.IsAutoLoginPaused = false;
        this.IsMeWhoRefreshedTheCredentials = false;
        this.IsCopyCredentialsToDefaultProfile = false;
        this.HasCredentials = false;
        ui.logToOutput('StatusBarItem.constructor Started');
        this.context = context;
        StatusBar.Current = this;
        const statusBarClickedCommand = 'aws-access-vscode-extension.statusBarClicked';
        context.subscriptions.push(vscode.commands.registerCommand(statusBarClickedCommand, StatusBar.StatusBarClicked));
        this.awsAccessStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
        this.awsAccessStatusBarItem.command = statusBarClickedCommand;
        this.awsAccessStatusBarItem.text = StatusBar.LoadingText;
        this.awsAccessStatusBarItem.tooltip = this.ToolTip;
        context.subscriptions.push(this.awsAccessStatusBarItem);
        this.awsAccessStatusBarItem.show();
        const refreshButtonClickedCommand = 'aws-access-vscode-extension.refreshButtonClicked';
        context.subscriptions.push(vscode.commands.registerCommand(refreshButtonClickedCommand, StatusBar.RefreshButtonClicked));
        this.awsRefreshStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.awsRefreshStatusBarItem.command = refreshButtonClickedCommand;
        context.subscriptions.push(this.awsRefreshStatusBarItem);
        const profileButtonClickedCommand = 'aws-access-vscode-extension.profileButtonClicked';
        context.subscriptions.push(vscode.commands.registerCommand(profileButtonClickedCommand, StatusBar.ProfileButtonClicked));
        this.awsProfileStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.awsProfileStatusBarItem.command = profileButtonClickedCommand;
        context.subscriptions.push(this.awsProfileStatusBarItem);
        this.ShowLoading();
        this.LoadState();
        this.GetCredentials();
    }
    StartTimer() {
        this.Timer = setInterval(StatusBar.OnTimerTicked, 1 * 1000);
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
    get HasIniCredentials() {
        return this.IniData !== undefined;
    }
    get HasDefaultProfile() {
        return this.Profiles.includes("default");
    }
    OpenCredentialsFile() {
        if (this.HasIniCredentials) {
            let filePath = api.GetCredentialsFilepath();
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
        if (this.HasIniCredentials) {
            let filePath = api.GetConfigFilepath();
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
        if (this.HasIniCredentials) {
            let canConnect = await api.TestAwsConnectivity();
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
        if (this.HasIniCredentials && this.ExpirationDateString) {
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
        let iniCredentials = await api.GetIniCredentials();
        if (iniCredentials) {
            this.HasCredentials = true;
            let profileData = await api.GetIniProfileData();
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
        }
        else {
            let credentials = await api.GetCredentials();
            if (credentials) {
                this.HasCredentials = true;
            }
        }
        this.RefreshText();
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
                api.SetCredentials('default', aws_access_key_id, aws_secret_access_key, aws_session_token, aws_security_token, token_expiration);
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
        if (this.HasIniCredentials) {
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
        if (this.IniData && this.HasDefaultProfile) {
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
            // const exitCommandBash = `
            // echo "Terminal will close after all jobs finish...";
            // while true; do
            //     jobs_count=$(jobs -r | wc -l)
            //     if [ "$jobs_count" -eq 0 ]; then
            //         echo "No running jobs. Closing in 5 seconds..."
            //         sleep 5
            //         exit
            //     else
            //         echo "There are still $jobs_count running job(s). Waiting 5 seconds..."
            //         sleep 5
            //     fi
            // done
            // `;
            // const exitCommandWindows = `
            // Write-Output "Terminal will close after all jobs finish..."
            // while ($true) {
            //     $jobsCount = (Get-Job | Where-Object { $_.State -eq 'Running' }).Count
            //     if ($jobsCount -eq 0) {
            //         Write-Output "No running jobs. Closing in 5 seconds..."
            //         Start-Sleep -Seconds 5
            //         exit
            //     }
            //     else {
            //         Write-Output "There are still $jobsCount running job(s). Waiting 5 seconds..."
            //         Start-Sleep -Seconds 5
            //     }
            // }
            // `;
            let exitCommandBash = "echo 'Terminal Will Close In 10 Secs'; sleep 10; exit 0";
            let exitCommandWindows = "Write-Output 'Terminal Will Close In 10 Secs'; Start-Sleep -Seconds 10; exit 0";
            let exitCommand = exitCommandBash;
            if (process.platform === "win32") {
                exitCommand = exitCommandWindows;
            }
            let commandToRun = this.AwsLoginShellCommand + "; " + exitCommand;
            ui.logToOutput('StatusBarItem.AutoCallLoginCommand Executing Command=' + commandToRun);
            terminal.sendText(commandToRun);
        }
        else {
            ui.showWarningMessage("Set a Aws Login Shell Command To Run");
            StatusBar.OpenCommandPalette();
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
        this.awsAccessStatusBarItem.text = StatusBar.LoadingText;
    }
    RefreshText() {
        ui.logToOutput('StatusBarItem.Refresh Started');
        this.awsRefreshStatusBarItem.hide();
        this.awsProfileStatusBarItem.hide();
        if (this.Profiles && this.Profiles.length > 1) {
            this.awsProfileStatusBarItem.text = "$(account)";
            this.awsProfileStatusBarItem.tooltip = "Select Profile";
            this.awsProfileStatusBarItem.show();
        }
        if (!this.HasCredentials) {
            this.ToolTip = "No Aws Credentials Found !!!";
            this.Text = "$(cloud) Aws No Credentials";
        }
        else if (this.HasIniCredentials && this.HasExpiration && this.IsExpired) {
            this.ToolTip = "Profile:" + this.ActiveProfile + " Expired !!!";
            this.Text = "$(cloud) Expired";
            if (this.AwsLoginShellCommand) {
                this.awsRefreshStatusBarItem.text = "$(sync)";
                this.awsRefreshStatusBarItem.tooltip = "Refresh Aws Token";
                this.awsRefreshStatusBarItem.show();
            }
        }
        else if (this.HasIniCredentials && this.HasExpiration && !this.IsExpired) {
            this.ToolTip = "Profile:" + this.ActiveProfile + " will expire on " + this.ExpirationDateString;
            this.Text = "$(cloud) Expire In " + this.ExpireTime;
        }
        else if (this.HasIniCredentials && !this.HasExpiration) {
            this.ToolTip = "Profile:" + this.ActiveProfile;
            this.Text = "$(cloud) Aws $(check)";
        }
        else {
            this.ToolTip = "You have Aws Credentials";
            this.Text = "$(cloud) Aws $(check)";
        }
        let tooltipLastline = "";
        tooltipLastline += this.GetBoolChar(this.IsMeWhoRefreshedTheCredentials) + "Renew ";
        tooltipLastline += this.GetBoolChar(this.IsCopyCredentialsToDefaultProfile) + "Copy to Default Profile";
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
        if (StatusBar.Current.HasExpiration) {
            if (StatusBar.Current.ExpirationDateString && StatusBar.Current.IsExpired) {
                let expireDate = new Date(StatusBar.Current.ExpirationDateString);
                StatusBar.Current.ToolTip = "Profile:" + StatusBar.Current.ActiveProfile + " Expired !!!";
                StatusBar.Current.ToolTip += "\nExpire Time:" + expireDate.toLocaleDateString() + " - " + expireDate.toLocaleTimeString();
                StatusBar.Current.Text = "$(cloud) Expired";
                StatusBar.Current.StopTimer();
                StatusBar.Current.IsAwsLoginCommandExecuted = false;
                if (StatusBar.Current.AwsLoginShellCommand) {
                    StatusBar.Current.awsRefreshStatusBarItem.text = "$(sync)";
                    StatusBar.Current.awsRefreshStatusBarItem.tooltip = "Refresh Aws Token";
                    StatusBar.Current.awsRefreshStatusBarItem.show();
                }
                else {
                    StatusBar.Current.awsRefreshStatusBarItem.hide();
                }
            }
            else {
                StatusBar.Current.ToolTip = "Profile:" + StatusBar.Current.ActiveProfile;
                StatusBar.Current.Text = "$(cloud) Expire In " + StatusBar.Current.ExpireTime;
                if (StatusBar.Current.IsAutoLoginPaused) {
                    StatusBar.Current.ToolTip += "\nAuto Login Paused";
                    StatusBar.Current.Text += "(P)";
                }
                if (StatusBar.Current.ExpirationDateString && !StatusBar.Current.IsAwsLoginCommandExecuted) {
                    let expireDate = new Date(StatusBar.Current.ExpirationDateString);
                    let now = new Date();
                    StatusBar.Current.ToolTip += "\nExpire Time:" + expireDate.toLocaleDateString() + " - " + expireDate.toLocaleTimeString();
                    if (ui.getSeconds(now, expireDate) === 0 && StatusBar.Current.AwsLoginShellCommand) {
                        if (StatusBar.Current.IsMeWhoRefreshedTheCredentials === true) {
                            StatusBar.Current.RunLoginCommand();
                            StatusBar.Current.IsAwsLoginCommandExecuted = true;
                        }
                        else {
                            setTimeout(StatusBar.Current.GetCredentials, 60000);
                        }
                    }
                }
            }
            let tooltipLastline = "";
            tooltipLastline += StatusBar.Current.GetBoolChar(StatusBar.Current.IsMeWhoRefreshedTheCredentials) + "Renew ";
            tooltipLastline += StatusBar.Current.GetBoolChar(StatusBar.Current.IsCopyCredentialsToDefaultProfile) + "Copy to Default Profile ";
            StatusBar.Current.ToolTip += "\n" + tooltipLastline;
            StatusBar.Current.awsAccessStatusBarItem.tooltip = StatusBar.Current.ToolTip;
            StatusBar.Current.awsAccessStatusBarItem.text = StatusBar.Current.Text;
        }
    }
    static async StatusBarClicked() {
        ui.logToOutput('StatusBarItem.StatusBarClicked Started');
        StatusBar.OpenCommandPalette();
    }
    static async RefreshButtonClicked() {
        ui.logToOutput('StatusBarItem.RefreshButtonClicked Started');
        if (StatusBar.Current.HasExpiration && StatusBar.Current.IsExpired) {
            //the credentials may refreshed in another windows, check again
            await StatusBar.Current.GetCredentials();
            if (StatusBar.Current.HasExpiration && StatusBar.Current.IsExpired) {
                StatusBar.Current.RunLoginCommand();
            }
        }
    }
    static async ProfileButtonClicked() {
        ui.logToOutput('StatusBarItem.ProfileButtonClicked Started');
        if (StatusBar.Current.Profiles.length > 1) {
            StatusBar.Current.SetActiveProfile();
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
exports.StatusBar = StatusBar;
StatusBar.LoadingText = "$(cloud) Aws $(sync~spin)";
//# sourceMappingURL=StatusBar.js.map