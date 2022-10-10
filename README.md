# Aws Access 
Helps you to manage your local AWS Access Credentials.
Apps use this credentials to access AWS resources.
This extension especially developed for Aws Access Tokens which has a Expire Time, to monitor them and run a Aws Login Command to renew this token. You can see a countdown next to cloud icon.

You can have more then one credentials which is called Profiles.
If you do not set a profile while calling an AWS resource through the AWS API, api will use default profile.

To use this extension effectively
- Set the Active Profile you use, to do so Cmd+Shift+P then search Aws Access: Set Active Profile
- Set Aws Login Command, to do so Cmd+Shift+P then search Aws Access: Set Aws Login Command



It will attempt to find credentials from the following sources (listed in order of precedence):
- Environment variables exposed via process.env
- SSO credentials from token cache
- Web identity token credentials
- Shared credentials and config ini files
    - The shared credentials file on Linux, Unix, and macOS: ~/.aws/credentials
    - The shared credentials file on Windows: C:\Users\USER_NAME\.aws\credentials
- The EC2/ECS Instance Metadata Service

For more detail on aws credentials
https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html

TODO:
- Aws Login Command from File
- Test Aws Credentials

