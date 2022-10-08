/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as api from './api';
import * as ui from './ui';
import { Credentials, ParsedIniData } from "@aws-sdk/types";
import { existsSync } from 'fs';

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

    public ActiveProfile:string = "default";
    public IniData:ParsedIniData | undefined;


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

        this.LoadState();
        this.ShowLoading();
        this.GetCredentials();
	}

    public get Profiles():string[]{
        let result:string[] = [];
        if(this.IniData)
        {
            result = Object.keys(this.IniData);
        }
        return result;
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

    public get ExpirationDateString():string | undefined
    {
        let result:string | undefined;

        if(this.IniData)
        {
            if(this.IniData[this.ActiveProfile] && this.IniData[this.ActiveProfile]["token_expiration"])
            {
                result = this.IniData[this.ActiveProfile]["token_expiration"];
            }            
        }

        return result;
    }

    public get HasExpiration():boolean{
        if(this.Credentials && this.ExpirationDateString)
        {
            return true;
        }

        return false;
    }

    public get IsExpired():boolean{

        if(this.ExpirationDateString)
        {
            let expireDate = new Date(this.ExpirationDateString);
            let now = new Date();
            return expireDate < now;
        }
        
        return false;
    }

    public get ExpireTime():string{
        if(this.ExpirationDateString)
        {
            let now = new Date();
            let expireDate = new Date(this.ExpirationDateString);
            if(this.IsExpired)
            {
                return ui.getDuration(expireDate, now);
            }
            else
            {
                return ui.getDuration(now, expireDate);
            }
            
        }
        return "";
    }

    public GetCredentials(){
        ui.logToOutput('StatusBarItem.GetDefaultCredentials Started');
        this.Text = StatusBarItem.LoadingText;

        let profileData = api.getIniProfileData();
        profileData.then( (value:ParsedIniData) => {
            ui.logToOutput('StatusBarItem.GetCredentials IniData Found');
            this.IniData = value;
        });

        let provider = api.getDefaultCredentials(this.ActiveProfile);

		provider.then( credentials => {
            ui.logToOutput('StatusBarItem.GetCredentials Credentials Found');
            this.Credentials = credentials;
		})
		.catch((error) => {
            ui.logToOutput('StatusBarItem.GetCredentials Credentials NOT Found');
		}).finally(()=>{
            this.RefreshText();
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
                    this.SaveState();
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
            this.ToolTip = "Profile:" + this.ActiveProfile + " Expired !!!";
            this.Text = "$(cloud) Expired";
        }
        else if(this.HasExpiration && !this.IsExpired)
        {
            this.ToolTip = "Profile:" + this.ActiveProfile + " will expire on " + this.ExpirationDateString;
            this.Text = "$(cloud) Expire In " + this.ExpireTime;
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

        if (!StatusBarItem.Current.HasCredentials)
        {
            ui.showInfoMessage("No Aws Credentials Found");
        }
        else if (StatusBarItem.Current.HasExpiration)
        {
            ui.showInfoMessage("Aws Credentials Will Expire in" + StatusBarItem.Current.ExpireTime + " on " + StatusBarItem.Current.ExpirationDateString);
        }
        else
        {

        }

    }

    public SaveState() {
		ui.logToOutput('StatusBarItem.SaveState Started');
		try {
			this.context.globalState.update('ActiveProfile', this.ActiveProfile);

		} catch (error) {
			ui.logToOutput("StatusBarItem.SaveState Error !!!");
		}
	}

    public LoadState() {
		ui.logToOutput('StatusBarItem.LoadState Started');
		try {
			let ActiveProfileTemp:string | undefined  = this.context.globalState.get('ActiveProfile');
			if (ActiveProfileTemp) { this.ActiveProfile = ActiveProfileTemp; }

		} catch (error) {
			ui.logToOutput("dagTreeView.LoadState Error !!!");
		}
	}

}