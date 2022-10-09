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
        ui.logToOutput('StatusBarItem.constructor Started');
        this.context = context;
        StatusBarItem.Current = this;
        const statusBarClickedCommand = 'aws-access-vscode-extension.statusBarClicked';
        context.subscriptions.push(vscode.commands.registerCommand(statusBarClickedCommand, StatusBarItem.StatusBarClicked));
        this.awsAccessStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.awsAccessStatusBarItem.command = statusBarClickedCommand;
        this.awsAccessStatusBarItem.text = StatusBarItem.LoadingText;
        this.awsAccessStatusBarItem.tooltip = this.ToolTip;
        context.subscriptions.push(this.awsAccessStatusBarItem);
        this.awsAccessStatusBarItem.show();
        this.LoadState();
        this.ShowLoading();
        this.GetCredentials();
    }
    StartTimer() {
        this.Timer = setInterval(StatusBarItem.RefreshExpirationDuration, 1 * 1000);
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
        return this.Credentials !== undefined;
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
    get ExpirationDateString() {
        let result;
        if (this.IniData) {
            if (this.IniData[this.ActiveProfile] && this.IniData[this.ActiveProfile]["token_expiration"]) {
                result = this.IniData[this.ActiveProfile]["token_expiration"];
            }
        }
        return result;
    }
    get HasExpiration() {
        if (this.Credentials && this.ExpirationDateString) {
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
    GetCredentials() {
        ui.logToOutput('StatusBarItem.GetDefaultCredentials Started');
        this.Text = StatusBarItem.LoadingText;
        let profileData = api.getIniProfileData();
        profileData.then((value) => {
            ui.logToOutput('StatusBarItem.GetCredentials IniData Found');
            this.IniData = value;
        }).catch((error) => {
            ui.logToOutput('StatusBarItem.GetCredentials IniData NOT Found ' + error);
        });
        if (!this.Profiles.includes(this.ActiveProfile) && this.Profiles.length > 0) {
            this.ActiveProfile = this.Profiles[0];
            this.SaveState();
        }
        let provider = api.getDefaultCredentials(this.ActiveProfile);
        provider.then(credentials => {
            ui.logToOutput('StatusBarItem.GetCredentials Credentials Found');
            this.Credentials = credentials;
            if (this.HasExpiration) {
                this.StartTimer();
            }
        })
            .catch((error) => {
            ui.logToOutput('StatusBarItem.GetCredentials Credentials NOT Found ' + error);
        }).finally(() => {
            this.RefreshText();
        });
    }
    SetAwsLoginCommand() {
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        ui.showInfoMessage("Development In Progress...");
    }
    SetActiveProfile() {
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        if (this.Profiles && this.Profiles.length > 0) {
            let selected = vscode.window.showQuickPick(this.Profiles, { canPickMany: false, placeHolder: 'Select Profile' });
            selected.then(value => {
                if (value) {
                    this.ActiveProfile = value;
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
        if (this.HasCredentials) {
            //ui.showOutputMessage(this.Credentials);
            if (this.IniData) {
                ui.showOutputMessage(this.IniData[this.ActiveProfile]);
            }
        }
        else {
            ui.showWarningMessage("No Profiles Found !!!");
        }
    }
    ShowDefaultCredentials() {
        ui.logToOutput('StatusBarItem.ShowDefaultCredentials Started');
        if (this.HasDefaultCredentials) {
            let provider = api.getDefaultCredentials("default");
            provider.then(credentials => {
                ui.showOutputMessage(credentials);
            })
                .catch((error) => {
                ui.showWarningMessage('Default Credentials NOT Found');
            });
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
    }
    AutoCallLoginCommand() {
        ui.logToOutput('StatusBarItem.AutoCallLoginCommand Started');
        ui.showInfoMessage("Development In Progress...");
    }
    SetAutoCallLoginCommandTime() {
        ui.logToOutput('StatusBarItem.SetAutoCallLoginCommandTime Started');
        ui.showInfoMessage("Development In Progress...");
    }
    SetTimeoutErrorTime() {
        ui.logToOutput('StatusBarItem.SetTimeoutErrorTime Started');
        ui.showInfoMessage("Development In Progress...");
    }
    ShowLoading() {
        ui.logToOutput('StatusBarItem.ShowLoading Started');
        this.awsAccessStatusBarItem.text = StatusBarItem.LoadingText;
    }
    RefreshText() {
        ui.logToOutput('StatusBarItem.Refresh Started');
        if (!this.HasCredentials) {
            this.ToolTip = "No Aws Credentials Found !!!";
            this.Text = "$(cloud) Aws No Credentials";
        }
        else if (this.HasExpiration && this.IsExpired) {
            this.ToolTip = "Profile:" + this.ActiveProfile + " Expired !!!";
            this.Text = "$(cloud) Expired";
        }
        else if (this.HasExpiration && !this.IsExpired) {
            this.ToolTip = "Profile:" + this.ActiveProfile + " will expire on " + this.ExpirationDateString;
            this.Text = "$(cloud) Expire In " + this.ExpireTime;
        }
        else {
            this.ToolTip = "Profile:" + this.ActiveProfile;
            this.Text = "$(cloud) Aws $(check)";
        }
        this.awsAccessStatusBarItem.tooltip = this.ToolTip;
        this.awsAccessStatusBarItem.text = this.Text;
    }
    static RefreshExpirationDuration() {
        if (StatusBarItem.Current.HasExpiration) {
            if (StatusBarItem.Current.IsExpired) {
                StatusBarItem.Current.ToolTip = "Profile:" + StatusBarItem.Current.ActiveProfile + " Expired !!!";
                StatusBarItem.Current.Text = "$(cloud) Expired";
                StatusBarItem.Current.StopTimer();
            }
            else {
                StatusBarItem.Current.ToolTip = "Profile:" + StatusBarItem.Current.ActiveProfile + " will expire on " + StatusBarItem.Current.ExpirationDateString;
                StatusBarItem.Current.Text = "$(cloud) Expire In " + StatusBarItem.Current.ExpireTime;
            }
            StatusBarItem.Current.awsAccessStatusBarItem.tooltip = StatusBarItem.Current.ToolTip;
            StatusBarItem.Current.awsAccessStatusBarItem.text = StatusBarItem.Current.Text;
        }
    }
    static StatusBarClicked() {
        ui.logToOutput('StatusBarItem.StatusBarClicked Started');
        StatusBarItem.Current.GetCredentials();
        ui.showInfoMessage("Aws Credentials Reloaded");
    }
    SaveState() {
        ui.logToOutput('StatusBarItem.SaveState Started');
        try {
            this.context.globalState.update('ActiveProfile', this.ActiveProfile);
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
        }
        catch (error) {
            ui.logToOutput("dagTreeView.LoadState Error !!!");
        }
    }
}
exports.StatusBarItem = StatusBarItem;
StatusBarItem.LoadingText = "$(cloud) Aws $(sync~spin)";
//# sourceMappingURL=statusBarItem.js.map