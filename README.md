# Aws Access 
Helps you to manage your AWS Access Credentials.

For more detail on aws credentials
https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html

It will attempt to find credentials from the following sources (listed in order of precedence):

- Environment variables exposed via process.env
- SSO credentials from token cache
- Web identity token credentials
- Shared credentials and config ini files
    - The shared credentials file on Linux, Unix, and macOS: ~/.aws/credentials
    - The shared credentials file on Windows: C:\Users\USER_NAME\.aws\credentials
- The EC2/ECS Instance Metadata Service

The default credential provider will invoke one provider at a time and only continue to the next if no credentials have been located. For example, if the process finds values defined via the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables, the files at ~/.aws/credentials and ~/.aws/config will not be read, nor will any messages be sent to the Instance Metadata Service.

If invalid configuration is encountered (such as a profile in ~/.aws/credentials specifying as its source_profile the name of a profile that does not exist), then the chained provider will be rejected with an error and will not invoke the next provider in the list.

IMPORTANT: if you intend for your code to run using EKS roles at some point (for example in a production environment, but not when working locally) then you must explicitly specify a value for roleAssumerWithWebIdentity. There is a default function available in @aws-sdk/client-sts package.

## Supported configuration
You may customize how credentials are resolved by providing an options hash to the defaultProvider factory function. The following options are supported:

- profile: The configuration profile to use. If not specified, the provider will use the value in the AWS_PROFILE environment variable or a default of default.
- filepath: The path to the shared credentials file. If not specified, the provider will use the value in the AWS_SHARED_CREDENTIALS_FILE environment variable or a default of ~/.aws/credentials.
- configFilepath: The path to the shared config file. If not specified, the provider will use the value in the AWS_CONFIG_FILE environment variable or a default of ~/.aws/config.
- mfaCodeProvider: A function that returns a a promise fulfilled with an MFA token code for the provided MFA Serial code. If a profile requires an MFA code and mfaCodeProvider is not a valid function, the credential provider promise will be rejected.
- roleAssumer: A function that assumes a role and returns a promise fulfilled with credentials for the assumed role. If not specified, the SDK will create an STS client and call its assumeRole method.
- roleArn: ARN to assume. If not specified, the provider will use the value in the AWS_ROLE_ARN environment variable.
- webIdentityTokenFile: File location of where the OIDC token is stored. If not specified, the provider will use the value in the AWS_WEB_IDENTITY_TOKEN_FILE environment variable.
- roleAssumerWithWebIdentity: A function that assumes a role with web identity and returns a promise fulfilled with credentials for the assumed role.
- timeout: The connection timeout (in milliseconds) to apply to any remote requests. If not specified, a default value of 1000 (one second) is used.
- maxRetries: The maximum number of times any HTTP connections should be retried. If not specified, a default value of 0 will be used.


https://github.com/aws/aws-sdk-js-v3/tree/main/packages/credential-provider-node

https://github.com/aws/aws-sdk-js-v3

https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html


