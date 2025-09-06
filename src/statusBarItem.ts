/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as api from './api';
import * as ui from './ui';
import { ParsedIniData } from "@aws-sdk/types";
import { existsSync } from 'fs';
import { profile } from 'console';

export class StatusBarItem {

    public static LoadingText:string = "$(cloud) Aws $(sync~spin)";
    public static Current: StatusBarItem;
    public context: vscode.ExtensionContext;
    public awsAccessStatusBarItem: vscode.StatusBarItem;
    public awsRefreshStatusBarItem: vscode.StatusBarItem;
    public awsProfileStatusBarItem: vscode.StatusBarItem;

    public Text: string = StatusBarItem.LoadingText;
    public ToolTip:string = "Loading ...";

    public ActiveProfile:string = "default";
    public IniData:ParsedIniData | undefined;
    public AwsLoginShellCommand:string | undefined;
    public AwsLoginShellCommandList:{[key:string]:string|undefined;} = {};
    public Timer: NodeJS.Timeout | undefined;

    public IsAwsLoginCommandExecuted:boolean = false;
    public IsAutoLoginPaused:boolean = false;
    public IsMeWhoRefreshedTheCredentials:boolean = false;
    public IsCopyCredentialsToDefaultProfile:boolean = false;


	constructor(context: vscode.ExtensionContext) {
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

        const refreshButtonClickedCommand = 'aws-access-vscode-extension.refreshButtonClicked';
        context.subscriptions.push(vscode.commands.registerCommand(refreshButtonClickedCommand, StatusBarItem.RefreshButtonClicked));
        this.awsRefreshStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.awsRefreshStatusBarItem.command = refreshButtonClickedCommand;
        context.subscriptions.push(this.awsRefreshStatusBarItem);
        
        const profileButtonClickedCommand = 'aws-access-vscode-extension.profileButtonClicked';
        context.subscriptions.push(vscode.commands.registerCommand(profileButtonClickedCommand, StatusBarItem.ProfileButtonClicked));
        this.awsProfileStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.awsProfileStatusBarItem.command = profileButtonClickedCommand;
        context.subscriptions.push(this.awsProfileStatusBarItem);

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

    public async TestAwsConnectivity()
    {
        if(this.HasCredentials)
        {
            let canConnect = await api.testAwsConnectivity(this.ActiveProfile);
            if (canConnect)
            {
                ui.showInfoMessage("Successfully Connect to AWS with User " + this.ActiveProfile);
            }
        }
        else
        {
            ui.showWarningMessage("Config File NOT Found");
        }
    }

    public async CopyCredentialsToDefaultProfile(){
        this.IsCopyCredentialsToDefaultProfile = !this.IsCopyCredentialsToDefaultProfile;
        this.RefreshText();
        this.SaveState();
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

    public async GetCredentials(){
        ui.logToOutput('StatusBarItem.GetDefaultCredentials Started');

        let profileData = await api.getIniProfileData();
        try
        {
            ui.logToOutput('StatusBarItem.GetCredentials IniData Found');
            this.IniData = profileData;

            if(!this.Profiles.includes(this.ActiveProfile) && this.Profiles.length > 0)
            {
                this.ActiveProfile = this.Profiles[0];
                this.SaveState();
            }

            if(this.HasExpiration)
            {
                this.StartTimer();
            }

            this.SetDefaultCredentials();

        }
        catch(error)
        {
            ui.logToOutput('StatusBarItem.GetCredentials Error ' + error);
		}
        finally
        {
            this.RefreshText();
        }

 
    }

    public SetDefaultCredentials(){
        if(!this.IsCopyCredentialsToDefaultProfile)
        {
            return;
        }

        ui.logToOutput('StatusBarItem.SetDefaultCredentials Started');
        
        //active profile is default so no need to update
        if (this.ActiveProfile === "default")
        {
            return;
        }

        if(this.IniData)
        {
            if(this.IniData[this.ActiveProfile] && this.IniData["default"])
            {
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

    public GetCredentialValue(profileName:string, credentialName:string):string|undefined{
        if(this.IniData)
        {
            if(this.IniData[profileName] && this.IniData[profileName][credentialName])
            {
                return this.IniData[profileName][credentialName];
            }
        }
        return undefined;
    }

    public async SetAwsLoginCommand(){
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        
        let shellCommand = await vscode.window.showInputBox({ placeHolder: 'Aws Login Shell Command' });
        if(shellCommand)
        {
            if(shellCommand.length>0)
            {
                this.AwsLoginShellCommand = shellCommand;
                this.AwsLoginShellCommandList[this.ActiveProfile] = shellCommand;
            }
            else
            {
                this.AwsLoginShellCommand = undefined;
                this.AwsLoginShellCommandList[this.ActiveProfile] = undefined;
            }
            this.SaveState();
        }
    }

    public GetAwsLoginCommand(profile:string):string|undefined
    {
        var result = this.AwsLoginShellCommandList[profile];
        return result;
    }

    public SetActiveProfile(){
        ui.logToOutput('StatusBarItem.SetAwsLoginCommand Started');
        if(this.Profiles && this.Profiles.length > 0)
        {
            let selected = vscode.window.showQuickPick(this.Profiles, {canPickMany:false, placeHolder: 'Select Profile'});
            selected.then(value=>{
                if(value){
                    this.ActiveProfile = value;
                    this.AwsLoginShellCommand = this.GetAwsLoginCommand(this.ActiveProfile);
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
        ui.showOutputMessage("AwsLoginShellCommands: ", "", false);
        ui.showOutputMessage(this.AwsLoginShellCommandList, "", false);
    }

    public RunLoginCommand(){
        ui.logToOutput('StatusBarItem.AutoCallLoginCommand Started');
        
        if(this.AwsLoginShellCommand)
        {
            if(this.IsAutoLoginPaused)
            {
                setTimeout(this.GetCredentials, 60000);
                return;
            }

            const terminal = vscode.window.createTerminal("Aws Login");
            terminal.show();
            const exitCommandBash = `
            echo "Terminal will close after all jobs finish...";
            while true; do
                jobs_count=$(jobs -r | wc -l)
                if [ "$jobs_count" -eq 0 ]; then
                    echo "No running jobs. Closing in 5 seconds..."
                    sleep 5
                    exit
                else
                    echo "There are still $jobs_count running job(s). Waiting 5 seconds..."
                    sleep 5
                fi
            done
            `;
            const exitCommandWindows = `
            Write-Output "Terminal will close after all jobs finish..."
            while ($true) {
                $jobsCount = (Get-Job | Where-Object { $_.State -eq 'Running' }).Count
                if ($jobsCount -eq 0) {
                    Write-Output "No running jobs. Closing in 5 seconds..."
                    Start-Sleep -Seconds 5
                    exit
                }
                else {
                    Write-Output "There are still $jobsCount running job(s). Waiting 5 seconds..."
                    Start-Sleep -Seconds 5
                }
            }
            `;
            let exitCommand = exitCommandBash;
            if(process.platform === "win32")
            {
                exitCommand = exitCommandWindows;
            }
            let commandToRun = this.AwsLoginShellCommand + "; " + exitCommand;
            ui.logToOutput('StatusBarItem.AutoCallLoginCommand Executing Command=' + commandToRun);
            terminal.sendText(commandToRun);
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
        ui.logToOutput('StatusBarItem.onDidCloseTerminal Started');
        if(terminal.creationOptions.name === "Aws Login")
        {
            this.IsMeWhoRefreshedTheCredentials = true;
            this.GetCredentials();
        }
    }

    public ShowLoading(){
        ui.logToOutput('StatusBarItem.ShowLoading Started');
        this.awsAccessStatusBarItem.text = StatusBarItem.LoadingText;
    }

    public RefreshText(){
        ui.logToOutput('StatusBarItem.Refresh Started');
        this.awsRefreshStatusBarItem.hide();
        this.awsProfileStatusBarItem.hide();

        if(this.Profiles && this.Profiles.length > 1)
        {
            this.awsProfileStatusBarItem.text = "$(account)";
            this.awsProfileStatusBarItem.tooltip = "Select Profile";
            this.awsProfileStatusBarItem.show();
        }

        if(!this.HasCredentials)
        {
            this.ToolTip = "No Aws Credentials Found !!!";
            this.Text = "$(cloud) Aws No Credentials";
        }
        else if(this.HasExpiration && this.IsExpired)
        {
            this.ToolTip = "Profile:" + this.ActiveProfile + " Expired !!!";
            this.Text = "$(cloud) Expired";
            if(this.AwsLoginShellCommand)
            {
                this.awsRefreshStatusBarItem.text = "$(sync)";
                this.awsRefreshStatusBarItem.tooltip = "Refresh Aws Token";
                this.awsRefreshStatusBarItem.show();
            }
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

        let tooltipLastline = "";
        tooltipLastline += this.GetBoolChar(this.IsMeWhoRefreshedTheCredentials) + "Renew ";
        tooltipLastline += this.GetBoolChar(this.IsCopyCredentialsToDefaultProfile) + "Copy ";
        tooltipLastline += api.getCredentialProviderName(this.ActiveProfile);
        this.ToolTip += "\n" + tooltipLastline;

        this.awsAccessStatusBarItem.tooltip = this.ToolTip;
        this.awsAccessStatusBarItem.text = this.Text;
    }

    public GetBoolChar(value:boolean){
        if(value)
        {
            return "✓";
        }
        else{
            return "x";
        }

    }

    public static OnTimerTicked()
    {
        if(StatusBarItem.Current.HasExpiration)
        {
            if(StatusBarItem.Current.ExpirationDateString && StatusBarItem.Current.IsExpired)
            {
                let expireDate = new Date(StatusBarItem.Current.ExpirationDateString);   
                StatusBarItem.Current.ToolTip = "Profile:" + StatusBarItem.Current.ActiveProfile + " Expired !!!";
                StatusBarItem.Current.ToolTip += "\nExpire Time:" + expireDate.toLocaleDateString() + " - " + expireDate.toLocaleTimeString();
                StatusBarItem.Current.Text = "$(cloud) Expired";

                StatusBarItem.Current.StopTimer();
                StatusBarItem.Current.IsAwsLoginCommandExecuted =false;

                if(StatusBarItem.Current.AwsLoginShellCommand)
                {
                    StatusBarItem.Current.awsRefreshStatusBarItem.text = "$(sync)";
                    StatusBarItem.Current.awsRefreshStatusBarItem.tooltip = "Refresh Aws Token";
                    StatusBarItem.Current.awsRefreshStatusBarItem.show();
                }
                else
                {
                    StatusBarItem.Current.awsRefreshStatusBarItem.hide();
                }
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

                    StatusBarItem.Current.ToolTip += "\nExpire Time:" + expireDate.toLocaleDateString() + " - " + expireDate.toLocaleTimeString();

                    if(ui.getSeconds(now, expireDate) === 0 && StatusBarItem.Current.AwsLoginShellCommand)
                    {
                        if(StatusBarItem.Current.IsMeWhoRefreshedTheCredentials === true)
                        {
                            StatusBarItem.Current.RunLoginCommand();
                            StatusBarItem.Current.IsAwsLoginCommandExecuted = true;
                        }
                        else
                        {
                            setTimeout(StatusBarItem.Current.GetCredentials, 60000);
                        }
                        
                    }
                }
            }

            let tooltipLastline = "";
            tooltipLastline += StatusBarItem.Current.GetBoolChar(StatusBarItem.Current.IsMeWhoRefreshedTheCredentials) + "Renew ";
            tooltipLastline += StatusBarItem.Current.GetBoolChar(StatusBarItem.Current.IsCopyCredentialsToDefaultProfile) + "Copy ";
            tooltipLastline += api.getCredentialProviderName(StatusBarItem.Current.ActiveProfile);
            StatusBarItem.Current.ToolTip += "\n" + tooltipLastline;

            StatusBarItem.Current.awsAccessStatusBarItem.tooltip = StatusBarItem.Current.ToolTip;
            StatusBarItem.Current.awsAccessStatusBarItem.text = StatusBarItem.Current.Text;
        }
    }

    public static async StatusBarClicked()
    {
        ui.logToOutput('StatusBarItem.StatusBarClicked Started');
        StatusBarItem.OpenCommandPalette();
    }

    public static async RefreshButtonClicked()
    {
        ui.logToOutput('StatusBarItem.RefreshButtonClicked Started');
        
        if(StatusBarItem.Current.HasExpiration && StatusBarItem.Current.IsExpired)
        {
            //the credentials may refreshed in another windows, check again
            await StatusBarItem.Current.GetCredentials();
            if (StatusBarItem.Current.HasExpiration && StatusBarItem.Current.IsExpired)
            {
                StatusBarItem.Current.RunLoginCommand();
            }
        }
    }

    public static async ProfileButtonClicked()
    {
        ui.logToOutput('StatusBarItem.ProfileButtonClicked Started');
        
        if(StatusBarItem.Current.Profiles.length > 1)
        {
            StatusBarItem.Current.SetActiveProfile();
        }
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
            this.context.globalState.update('AwsLoginShellCommandList', this.AwsLoginShellCommandList);
            this.context.globalState.update('IsCopyCredentialsToDefaultProfile', this.IsCopyCredentialsToDefaultProfile);
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

            let AwsLoginShellCommandListTemp:{[key:string]:string|undefined;} | undefined  = this.context.globalState.get('AwsLoginShellCommandList');
			if (AwsLoginShellCommandListTemp) { this.AwsLoginShellCommandList = AwsLoginShellCommandListTemp; }

            let IsCopyCredentialsToDefaultProfileTemp:boolean|undefined = this.context.globalState.get('IsCopyCredentialsToDefaultProfile');
			if (IsCopyCredentialsToDefaultProfileTemp) { this.IsCopyCredentialsToDefaultProfile = IsCopyCredentialsToDefaultProfileTemp; }

		} catch (error) {
			ui.logToOutput("dagTreeView.LoadState Error !!!");
		}
	}

}