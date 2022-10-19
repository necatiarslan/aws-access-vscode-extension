/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as api from './api';
import * as ui from './ui';
import { Credentials, ParsedIniData } from "@aws-sdk/types";
import { existsSync, statSync } from 'fs';

export class StatusBarItem {

    public static LoadingText:string = "$(cloud) Aws $(sync~spin)";
    public static Current: StatusBarItem;
    public context: vscode.ExtensionContext;
    public awsAccessStatusBarItem: vscode.StatusBarItem;

    public Text: string = StatusBarItem.LoadingText;
    public ToolTip:string = "Loading ...";

    public ActiveProfile:string = "default";
    public IniData:ParsedIniData | undefined;
    public AwsLoginShellCommand:string | undefined;
    public Timer: NodeJS.Timer | undefined;

    public IsAwsLoginCommandExecuted:boolean = false;
    public IsAutoLoginPaused:boolean = false;


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
        this.LoadState();
        this.GetCredentials();
	}

    public StartTimer()
    {
        this.Timer = setInterval(StatusBarItem.OnTimerTicked, 1 * 1000);
    }

    public StopTimer(){
        clearInterval(this.Timer);
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
        return this.IniData !== undefined;
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

    public get ExpireDate():Date | undefined
    {
        let result:Date | undefined;

        if(this.ExpirationDateString)
        {
            result = new Date(this.ExpirationDateString);         
        }

        return result;
    }

    public get HasExpiration():boolean{
        if(this.HasCredentials && this.ExpirationDateString)
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

        let profileData = api.getIniProfileData();
        profileData.then( (value:ParsedIniData) => {
            ui.logToOutput('StatusBarItem.GetCredentials IniData Found');
            this.IniData = value;

            if(!this.Profiles.includes(this.ActiveProfile) && this.Profiles.length > 0)
            {
                this.ActiveProfile = this.Profiles[0];
                this.SaveState();
            }

            if(this.HasExpiration)
            {
                this.StartTimer();
            }

        }).catch((error) => {
            ui.logToOutput('StatusBarItem.GetCredentials IniData NOT Found ' + error);
		}).finally(() => {
            this.RefreshText();
        });

 
    }

    public SetAwsLoginCommand(){
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        
        let thenableResult = vscode.window.showInputBox({ placeHolder: 'Aws Login Shell Command' });
		thenableResult.then((value)=>{
            if(value && value.length >= 3)
            {
                if(value.length>0)
                {
                    this.AwsLoginShellCommand = value;
                }
                else
                {
                    this.AwsLoginShellCommand = undefined;
                }
                this.SaveState();
            }
        });
    }

    public SetActiveProfile(){
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        if(this.Profiles && this.Profiles.length > 0)
        {
            let selected = vscode.window.showQuickPick(this.Profiles, {canPickMany:false, placeHolder: 'Select Profile'});
            selected.then(value=>{
                if(value){
                    this.ActiveProfile = value;
                    this.ShowLoading();
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

        ui.showOutputMessage("ActiveProfile: " + this.ActiveProfile, "");
        if(this.HasCredentials)
        {
            //ui.showOutputMessage(this.Credentials);
            if(this.IniData)
            {
                ui.showOutputMessage(this.IniData[this.ActiveProfile], "", false);
            }
        }
        else
        {
            ui.showWarningMessage("No Profiles Found !!!");
        }
        ui.showOutputMessage("AwsLoginShellCommand: " + this.AwsLoginShellCommand, "", false);
    }

    public ShowDefaultCredentials(){
        ui.logToOutput('StatusBarItem.ShowDefaultCredentials Started');
        if(this.IniData && this.HasDefaultCredentials)
        {
            ui.showOutputMessage(this.IniData["default"]);
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

    public RunLoginCommand(){
        ui.logToOutput('StatusBarItem.AutoCallLoginCommand Started');
        
        if(this.AwsLoginShellCommand)
        {
            if(this.IsAutoLoginPaused)
            {
                this.GetCredentials();
                return;
            }

            const terminal = vscode.window.createTerminal("Aws Login");
            terminal.show();
            terminal.sendText(this.AwsLoginShellCommand + "; echo 'Terminal Will Close In 5 Secs'; sleep 5; exit");
        }
        else
        {
            ui.showWarningMessage("Set a Aws Login Shell Command To Run");
            StatusBarItem.OpenCommandPalette();
        }
    }

    public PauseAutoLogin(){
        this.IsAutoLoginPaused = !this.IsAutoLoginPaused;
    }

    public onDidCloseTerminal(terminal:vscode.Terminal)
    {
        if(terminal.name === "Aws Login")
        {
            ui.logToOutput('StatusBarItem.onDidCloseTerminal Started');
            this.GetCredentials();
        }
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

    public static OnTimerTicked()
    {
        if(StatusBarItem.Current.HasExpiration)
        {
            if(StatusBarItem.Current.IsExpired)
            {   
                StatusBarItem.Current.ToolTip = "Profile:" + StatusBarItem.Current.ActiveProfile + " Expired !!!";
                StatusBarItem.Current.Text = "$(cloud) Expired";

                StatusBarItem.Current.StopTimer();
                StatusBarItem.Current.IsAwsLoginCommandExecuted =false;
            }
            else 
            {
                StatusBarItem.Current.ToolTip = "Profile:" + StatusBarItem.Current.ActiveProfile;
                StatusBarItem.Current.Text = "$(cloud) Expire In " + StatusBarItem.Current.ExpireTime;

                if(StatusBarItem.Current.IsAutoLoginPaused)
                {
                    StatusBarItem.Current.ToolTip += "\nAuto Login Paused";
                    StatusBarItem.Current.Text += "(P)";
                }

                if(StatusBarItem.Current.ExpirationDateString && !StatusBarItem.Current.IsAwsLoginCommandExecuted )
                {
                    let expireDate = new Date(StatusBarItem.Current.ExpirationDateString);
                    let now = new Date();

                    StatusBarItem.Current.ToolTip += "\nExpire Time:" + expireDate.toLocaleTimeString();

                    if(ui.getSeconds(now, expireDate) === 0 && StatusBarItem.Current.AwsLoginShellCommand)
                    {
                        StatusBarItem.Current.RunLoginCommand();
                        StatusBarItem.Current.IsAwsLoginCommandExecuted = true;
                    }
                }
            }

            StatusBarItem.Current.awsAccessStatusBarItem.tooltip = StatusBarItem.Current.ToolTip;
            StatusBarItem.Current.awsAccessStatusBarItem.text = StatusBarItem.Current.Text;
        }
    }

    public static StatusBarClicked()
    {
        ui.logToOutput('StatusBarItem.StatusBarClicked Started');
        StatusBarItem.OpenCommandPalette();
    }

    public static OpenCommandPalette()
    {
        const extensionPrefix = 'Aws Access';
        vscode.commands.executeCommand('workbench.action.quickOpen', `> ${extensionPrefix}`);
    }

    public SaveState() {
		ui.logToOutput('StatusBarItem.SaveState Started');
		try {
			this.context.globalState.update('ActiveProfile', this.ActiveProfile);
            this.context.globalState.update('AwsLoginShellCommand', this.AwsLoginShellCommand);

		} catch (error) {
			ui.logToOutput("StatusBarItem.SaveState Error !!!");
		}
	}

    public LoadState() {
		ui.logToOutput('StatusBarItem.LoadState Started');
		try {
			let ActiveProfileTemp:string | undefined  = this.context.globalState.get('ActiveProfile');
			if (ActiveProfileTemp) { this.ActiveProfile = ActiveProfileTemp; }

            let AwsLoginShellCommandTemp:string | undefined  = this.context.globalState.get('AwsLoginShellCommand');
			if (AwsLoginShellCommandTemp) { this.AwsLoginShellCommand = AwsLoginShellCommandTemp; }

		} catch (error) {
			ui.logToOutput("dagTreeView.LoadState Error !!!");
		}
	}

}