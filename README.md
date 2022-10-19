# Aws Access 
![screenshoot](./media/MainScreen.png)
Helps you to manage your local AWS Access Credentials.\
Apps use this credentials to access AWS resources.\
This extension especially developed to monitor Aws Access Tokens which has a Expire Time and run a Aws Login Command to renew this token. You can see a countdown next to cloud icon.

## Shared credentials and config ini files
Aws access credentials lives in the files below
    - On Linux, Unix, and macOS: ~/.aws/credentials
    - On Windows: C:\Users\USER_NAME\.aws\credentials

## Profiles
You could have more then one credentials which is called Profiles.\
If you do not set a profile while calling an AWS resource through the AWS API, api will use default profile.

## To use this extension effectively
- Set the Active Profile you use, to do so Cmd+Shift+P then search Aws Access: Set Active Profile
- Set Aws Login Command, to do so Cmd+Shift+P then search Aws Access: Set Aws Login Command

## Commands
![screenshoot](./media/CommandPalette.png)


## Bug Report
To report your bugs or request new features, use link below\
https://github.com/necatiarslan/aws-access-vscode-extension/issues/new

## Credentials Search Order (Not Supported Yet)
The extension will attempt to find credentials from the following sources (listed in order of precedence):
- Environment variables exposed via process.env
- SSO credentials from token cache
- Web identity token credentials
- Shared credentials and config ini files
    - The shared credentials file on Linux, Unix, and macOS: ~/.aws/credentials
    - The shared credentials file on Windows: C:\Users\USER_NAME\.aws\credentials
- The EC2/ECS Instance Metadata Service

For more detail on aws credentials
https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html

## TODO:
- Aws Login Command from File
- Test Aws Credentials
- When Aws Login Command Fails, vscode shows warning message the terminal process "/bin/zsh '-l'" terminated with exit code:1

