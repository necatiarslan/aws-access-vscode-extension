/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as api from './api';
import * as ui from './ui';
import { Credentials } from "@aws-sdk/types";

export class StatusBarItem {

    public static Current: StatusBarItem;
    public context: vscode.ExtensionContext;
    public awsAccessStatusBarItem: vscode.StatusBarItem;
    public Text: string = "$(cloud) Aws $(loading~spin)";
    public hasCredentials: boolean = false;
    public isExpired:boolean = false;
    public ExpireTime:string = "";
    public hasExpiration:boolean = false;
    public ToolTip:string = "Loading ...";
    public ForeColor:string | vscode.ThemeColor | undefined;
    public BackColor:string | vscode.ThemeColor | undefined;



	constructor(context: vscode.ExtensionContext) {
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

    public GetDefaultCredentials(){
        ui.logToOutput('StatusBarItem.GetDefaultCredentials Started');
        let provider = api.getDefaultCredentials();

		provider.then( credentials => {
            //this.Credentials = credentials;
            this.hasCredentials = true;
            if(credentials.expiration)
            {
                this.hasExpiration = true;
                let now = new Date();
                this.isExpired = credentials.expiration < now;
                if(this.isExpired)
                {
                    this.ExpireTime = "Expired " + ui.getDuration(credentials.expiration, now);
                }
                else
                {
                    this.ExpireTime = "To Expire " + ui.getDuration(now, credentials.expiration);
                }
            }
            else
            {
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

    public SetAwsLoginCommand(){
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        ui.showInfoMessage("Development In Progress...");
    }

    public ListAwsProfiles(){
        ui.logToOutput('StatusBarItem.ListAwsProfiles Started');
        ui.showInfoMessage("Development In Progress...");

    }

    public AutoCallLoginCommand(){
        ui.logToOutput('StatusBarItem.AutoCallLoginCommand Started');
        ui.showInfoMessage("Development In Progress...");

    }

    public SetAutoCallLoginCommandTime(){
        ui.logToOutput('StatusBarItem.SetAutoCallLoginCommandTime Started');
        ui.showInfoMessage("Development In Progress...");

    }

    public SetTimeoutErrorTime(){
        ui.logToOutput('StatusBarItem.SetTimeoutErrorTime Started');
        ui.showInfoMessage("Development In Progress...");

    }

    public Refresh(){
        ui.logToOutput('StatusBarItem.Refresh Started');
        if(!this.hasCredentials)
        {
            
            this.Text = "$(cloud) $(error) Aws No Credentials";
        }
        else if(this.hasExpiration && this.isExpired)
        {
            
            this.Text = "$(cloud) $(error) " + this.ExpireTime;
        }
        else if(this.hasExpiration && !this.isExpired)
        {
            
            this.Text = "$(cloud) $(warning) " + this.ExpireTime;
        }
        else
        {
            
            this.Text = "$(cloud) Aws $(check)";
        }
        this.awsAccessStatusBarItem.text = this.Text;
    }

    public static StatusBarClicked()
    {
        ui.logToOutput('StatusBarItem.StatusBarClicked Started');

        ui.showInfoMessage("Development In Progress...");
    }

}