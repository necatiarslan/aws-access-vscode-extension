"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const api = require("./api");
const ui = require("./ui");
class StatusBarItem {
    constructor(context) {
        this.Text = "$(cloud) Aws $(loading~spin)";
        this.hasCredentials = false;
        this.isExpired = false;
        this.ExpireTime = "";
        this.hasExpiration = false;
        this.ToolTip = "Loading ...";
        ui.logToOutput('StatusBarItem.constructor Started');
        this.context = context;
        StatusBarItem.Current = this;
        const statusBarClickedCommand = 'aws-access-vscode-extension.statusBarClicked';
        context.subscriptions.push(vscode.commands.registerCommand(statusBarClickedCommand, StatusBarItem.StatusBarClicked));
        this.awsAccessStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.awsAccessStatusBarItem.command = statusBarClickedCommand;
        this.awsAccessStatusBarItem.text = this.Text;
        this.awsAccessStatusBarItem.tooltip = this.ToolTip;
        context.subscriptions.push(this.awsAccessStatusBarItem);
        this.awsAccessStatusBarItem.show();
        this.GetDefaultCredentials();
    }
    GetDefaultCredentials() {
        ui.logToOutput('StatusBarItem.GetDefaultCredentials Started');
        let provider = api.getDefaultCredentials();
        provider.then(credentials => {
            //this.Credentials = credentials;
            this.hasCredentials = true;
            if (credentials.expiration) {
                this.hasExpiration = true;
                let now = new Date();
                this.isExpired = credentials.expiration < now;
                if (this.isExpired) {
                    this.ExpireTime = "Expired " + ui.getDuration(credentials.expiration, now);
                }
                else {
                    this.ExpireTime = "To Expire " + ui.getDuration(now, credentials.expiration);
                }
            }
            else {
                this.hasExpiration = false;
                this.isExpired = false;
                this.ExpireTime = "";
            }
        })
            .catch((error) => {
            this.hasCredentials = false;
        })
            .finally(() => {
            this.Refresh();
        });
    }
    SetAwsLoginCommand() {
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        ui.showInfoMessage("Development In Progress...");
    }
    ListAwsProfiles() {
        ui.logToOutput('StatusBarItem.ListAwsProfiles Started');
        ui.showInfoMessage("Development In Progress...");
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
    Refresh() {
        ui.logToOutput('StatusBarItem.Refresh Started');
        if (!this.hasCredentials) {
            this.Text = "$(cloud) $(error) Aws No Credentials";
        }
        else if (this.hasExpiration && this.isExpired) {
            this.Text = "$(cloud) $(error) " + this.ExpireTime;
        }
        else if (this.hasExpiration && !this.isExpired) {
            this.Text = "$(cloud) $(warning) " + this.ExpireTime;
        }
        else {
            this.Text = "$(cloud) Aws $(check)";
        }
        this.awsAccessStatusBarItem.text = this.Text;
    }
    static StatusBarClicked() {
        ui.logToOutput('StatusBarItem.StatusBarClicked Started');
        ui.showInfoMessage("Development In Progress...");
    }
}
exports.StatusBarItem = StatusBarItem;
//# sourceMappingURL=statusBarItem.js.map