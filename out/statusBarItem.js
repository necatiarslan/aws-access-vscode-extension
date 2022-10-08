"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarItem = exports.CredentialsState = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const api = require("./api");
const ui = require("./ui");
var CredentialsState;
(function (CredentialsState) {
    CredentialsState[CredentialsState["Unknown"] = 0] = "Unknown";
    CredentialsState[CredentialsState["HasNoCredentials"] = 1] = "HasNoCredentials";
    CredentialsState[CredentialsState["HasStaticCredentials"] = 2] = "HasStaticCredentials";
    CredentialsState[CredentialsState["HasExpiredCredentials"] = 3] = "HasExpiredCredentials";
    CredentialsState[CredentialsState["HasCloseToExpireCredentials"] = 4] = "HasCloseToExpireCredentials";
})(CredentialsState = exports.CredentialsState || (exports.CredentialsState = {}));
class StatusBarItem {
    constructor(context) {
        this.Text = StatusBarItem.LoadingText;
        this.ToolTip = "Loading ...";
        this.CredentialsState = CredentialsState.Unknown;
        this.Profiles = [];
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
        this.ShowLoading();
        this.LoadProfiles();
        this.GetCredentials();
    }
    get HasCredentials() {
        return this.Credentials !== undefined;
    }
    get HasDefaultCredentials() {
        return this.Profiles.includes("default");
    }
    get HasExpiration() {
        if (this.Credentials && this.Credentials.expiration) {
            return true;
        }
        return false;
    }
    get IsExpired() {
        if (this.HasExpiration && this.Credentials?.expiration) {
            let now = new Date();
            return this.Credentials.expiration < now;
        }
        return false;
    }
    get ExpireTime() {
        if (this.HasExpiration && this.Credentials?.expiration) {
            let now = new Date();
            if (this.IsExpired) {
                return "Expired " + ui.getDuration(this.Credentials.expiration, now);
            }
            else {
                return "To Expire " + ui.getDuration(now, this.Credentials.expiration);
            }
        }
        return "";
    }
    GetCredentials() {
        ui.logToOutput('StatusBarItem.GetDefaultCredentials Started');
        this.Text = StatusBarItem.LoadingText;
        let provider = api.getDefaultCredentials(this.ActiveProfile);
        provider.then(credentials => {
            ui.logToOutput('StatusBarItem.Credentials Found');
            this.Credentials = credentials;
            if (credentials.expiration) {
                let now = new Date();
                if (this.IsExpired) {
                    this.CredentialsState = CredentialsState.HasExpiredCredentials;
                }
                else {
                    this.CredentialsState = CredentialsState.HasCloseToExpireCredentials;
                }
            }
            else {
                this.CredentialsState = CredentialsState.HasStaticCredentials;
            }
        })
            .catch((error) => {
            ui.logToOutput('StatusBarItem.Credentials NOT Found');
            this.CredentialsState = CredentialsState.HasNoCredentials;
        }).finally(() => {
            this.RefreshText();
        });
    }
    LoadProfiles() {
        this.Profiles = [];
        let profileData = api.getIniProfileData();
        profileData.then((value) => {
            this.Profiles = Object.keys(value);
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
            ui.showOutputMessage(this.Credentials);
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
            this.ToolTip = this.ActiveProfile + " Profile Aws Credentials Expired !!!";
            this.Text = "$(cloud) " + this.ExpireTime;
        }
        else if (this.HasExpiration && !this.IsExpired) {
            this.ToolTip = this.ActiveProfile + " Profile Aws Credentials Will Expire in " + this.ExpireTime;
            this.Text = "$(cloud) " + this.ExpireTime;
        }
        else {
            this.ToolTip = this.ActiveProfile + " Profile Aws Credentials Are Set";
            this.Text = "$(cloud) Aws $(check)";
        }
        this.awsAccessStatusBarItem.tooltip = this.ToolTip;
        this.awsAccessStatusBarItem.text = this.Text;
    }
    static StatusBarClicked() {
        ui.logToOutput('StatusBarItem.StatusBarClicked Started');
        if (StatusBarItem.Current.CredentialsState === CredentialsState.HasNoCredentials) {
            ui.showInfoMessage("No Aws Credentials Found");
        }
        else if (StatusBarItem.Current.CredentialsState === CredentialsState.HasExpiredCredentials) {
            ui.showInfoMessage("No Aws Credentials Expired");
        }
        else if (StatusBarItem.Current.CredentialsState === CredentialsState.HasCloseToExpireCredentials) {
            ui.showInfoMessage("Aws Credentials Will Expire in" + StatusBarItem.Current.ExpireTime);
        }
        else {
        }
    }
}
exports.StatusBarItem = StatusBarItem;
StatusBarItem.LoadingText = "$(cloud) Aws $(sync~spin)";
//# sourceMappingURL=statusBarItem.js.map