/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as api from './api';
import * as ui from './ui';
import { Credentials } from "@aws-sdk/types";
import { existsSync } from 'fs';

export enum CredentialsState {
    Unknown = 0,
    HasNoCredentials = 1,
    HasStaticCredentials = 2,
    HasExpiredCredentials = 3,
    HasCloseToExpireCredentials = 4,
  }

export class StatusBarItem {

    public static LoadingText:string = "$(cloud) Aws $(sync~spin)";
    public static Current: StatusBarItem;
    public context: vscode.ExtensionContext;
    public awsAccessStatusBarItem: vscode.StatusBarItem;

    public Credentials:Credentials | undefined;

    public Text: string = StatusBarItem.LoadingText;
    public ToolTip:string = "Loading ...";
    public ForeColor:string | vscode.ThemeColor | undefined;
    public BackColor:string | vscode.ThemeColor | undefined;
    public CredentialsState:CredentialsState = CredentialsState.Unknown;
    public Profiles:string[] = [];
    public ActiveProfile:string = "default";


	constructor(context: vscode.ExtensionContext) {
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

    public get HasCredentials():boolean
    {
        return this.Credentials !== undefined;
    }

    public get HasDefaultCredentials():boolean
    {
        return this.Profiles.includes("default");
    }

    public OpenCredentialsFile()
    {
        if(this.HasCredentials)
        {
            let filePath = api.getCredentialsFilepath();
            if (existsSync(filePath))
            {
                ui.openFile(filePath);
            }
            else
            {
                ui.showWarningMessage("Credentials File NOT Found Path=" + filePath);
            }
        }
        else
        {
            ui.showWarningMessage("Credentials File NOT Found");
        }
    }

    public OpenConfigFile()
    {
        if(this.HasCredentials)
        {
            let filePath = api.getConfigFilepath();
            if (existsSync(filePath))
            {
                ui.openFile(filePath);
            }
            else
            {
                ui.showWarningMessage("Config File NOT Found Path=" + filePath);
            }
        }
        else
        {
            ui.showWarningMessage("Config File NOT Found");
        }
    }

    public get HasExpiration():boolean{
        if(this.Credentials && this.Credentials.expiration)
        {
            return true;
        }

        return false;
    }

    public get IsExpired():boolean{
        if(this.HasExpiration && this.Credentials?.expiration)
        {
            let now = new Date();
            return this.Credentials.expiration < now;
        }

        return false;
    }

    public get ExpireTime():string{
        if(this.HasExpiration && this.Credentials?.expiration)
        {
            let now = new Date();
            if(this.IsExpired)
            {
                return "Expired " + ui.getDuration(this.Credentials.expiration, now);
            }
            else
            {
                return "To Expire " + ui.getDuration(now, this.Credentials.expiration);
            }
            
        }
        return "";
    }

    public GetCredentials(){
        ui.logToOutput('StatusBarItem.GetDefaultCredentials Started');
        this.Text = StatusBarItem.LoadingText;
        let provider = api.getDefaultCredentials(this.ActiveProfile);

		provider.then( credentials => {
            ui.logToOutput('StatusBarItem.Credentials Found');
            this.Credentials = credentials;
            if(credentials.expiration)
            {
                let now = new Date();
                if(this.IsExpired)
                {
                    this.CredentialsState = CredentialsState.HasExpiredCredentials;
                }
                else
                {
                    this.CredentialsState = CredentialsState.HasCloseToExpireCredentials;
                }
            }
            else
            {
                this.CredentialsState = CredentialsState.HasStaticCredentials;
            }
		})
		.catch((error) => {
            ui.logToOutput('StatusBarItem.Credentials NOT Found');
            this.CredentialsState = CredentialsState.HasNoCredentials;
		}).finally(()=>{
            this.RefreshText();
        });
    }

    public LoadProfiles(){
        this.Profiles = [];
        let profileData = api.getIniProfileData();
        profileData.then( (value) => {
            this.Profiles = Object.keys(value);
        });
    }

    public SetAwsLoginCommand(){
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        ui.showInfoMessage("Development In Progress...");
    }

    public SetActiveProfile(){
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        if(this.Profiles && this.Profiles.length > 0)
        {
            let selected = vscode.window.showQuickPick(this.Profiles, {canPickMany:false, placeHolder: 'Select Profile'});
            selected.then(value=>{
                if(value){
                    this.ActiveProfile = value;
                    this.GetCredentials();
                }
            });
        }
        else
        {
            ui.showWarningMessage("No Profiles Found !!!");
        }
    }

    public ShowActiveCredentials(){
        ui.logToOutput('StatusBarItem.ShowActiveCredentials Started');
        if(this.HasCredentials)
        {
            ui.showOutputMessage(this.Credentials);
        }
        else
        {
            ui.showWarningMessage("No Profiles Found !!!");
        }
    }

    public ShowDefaultCredentials(){
        ui.logToOutput('StatusBarItem.ShowDefaultCredentials Started');
        if(this.HasDefaultCredentials)
        {
            let provider = api.getDefaultCredentials("default");

            provider.then( credentials => {
                ui.showOutputMessage(credentials);
            })
            .catch((error) => {
                ui.showWarningMessage('Default Credentials NOT Found');
            });
        }
        else
        {
            ui.showWarningMessage("Default Credentials NOT Found");
        }
    }

    public ListAwsProfiles(){
        ui.logToOutput('StatusBarItem.ListAwsProfiles Started');
        if(this.Profiles && this.Profiles.length > 0)
        {
            ui.showOutputMessage(this.Profiles);
        }
        else
        {
            ui.showWarningMessage("No Profiles Found !!!");
        }
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

    public ShowLoading(){
        ui.logToOutput('StatusBarItem.ShowLoading Started');
        this.awsAccessStatusBarItem.text = StatusBarItem.LoadingText;
    }

    public RefreshText(){
        ui.logToOutput('StatusBarItem.Refresh Started');
        if(!this.HasCredentials)
        {
            this.ToolTip = "No Aws Credentials Found !!!";
            this.Text = "$(cloud) Aws No Credentials";
        }
        else if(this.HasExpiration && this.IsExpired)
        {
            this.ToolTip = this.ActiveProfile + " Profile Aws Credentials Expired !!!";
            this.Text = "$(cloud) " + this.ExpireTime;
        }
        else if(this.HasExpiration && !this.IsExpired)
        {
            this.ToolTip = this.ActiveProfile + " Profile Aws Credentials Will Expire in " + this.ExpireTime;
            this.Text = "$(cloud) " + this.ExpireTime;
        }
        else
        {
            this.ToolTip = "Profile:" + this.ActiveProfile;
            this.Text = "$(cloud) Aws $(check)";
        }
        this.awsAccessStatusBarItem.tooltip = this.ToolTip;
        this.awsAccessStatusBarItem.text = this.Text;
    }

    public static StatusBarClicked()
    {
        ui.logToOutput('StatusBarItem.StatusBarClicked Started');

        if (StatusBarItem.Current.CredentialsState === CredentialsState.HasNoCredentials)
        {
            ui.showInfoMessage("No Aws Credentials Found");
        }
        else if (StatusBarItem.Current.CredentialsState === CredentialsState.HasExpiredCredentials)
        {
            ui.showInfoMessage("No Aws Credentials Expired");
        }
        else if (StatusBarItem.Current.CredentialsState === CredentialsState.HasCloseToExpireCredentials)
        {
            ui.showInfoMessage("Aws Credentials Will Expire in" + StatusBarItem.Current.ExpireTime);
        }
        else
        {


        }

    }

}