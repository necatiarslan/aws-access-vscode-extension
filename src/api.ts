import { homedir } from "os";
import { sep } from "path";
import { join } from "path";
import { parseKnownFiles, SourceProfileInit } from "./aws-sdk/parseKnownFiles";
import { ParsedIniData, AwsCredentialIdentity } from "@aws-sdk/types";
import { fromIni } from "@aws-sdk/credential-providers";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import * as ui from './ui';
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import * as StatusBarItem from './statusBarItem';

let CurrentCredentials: AwsCredentialIdentity | undefined = undefined;

export async function StartConnection() {
  ui.logToOutput("Starting Connection");
  CurrentCredentials = await getCredentials();
  //CurrentS3Client = await GetS3Client();
  ui.logToOutput("Connection Started");
}

export async function StopConnection() {
  ui.logToOutput("Stopping Connection");
  CurrentCredentials = undefined
  //CurrentS3Client = undefined;
  ui.logToOutput("Connection Stopped");
}

export function isSharedIniFileCredentials(credentials: AwsCredentialIdentity | undefined = undefined) {
  return true
}

export async function getCredentials(): Promise<AwsCredentialIdentity | undefined> {
  let credentials: AwsCredentialIdentity | undefined;

  if (CurrentCredentials !== undefined) { 
    ui.logToOutput("Aws credentials From Pool AccessKeyId=" + CurrentCredentials.accessKeyId);
    return CurrentCredentials; 
  }

  try {
    if (StatusBarItem.StatusBarItem.Current){
      process.env.AWS_PROFILE = StatusBarItem.StatusBarItem.Current.ActiveProfile;
    }
    const provider = fromNodeProviderChain({ignoreCache: true});
    credentials = await provider();

    if (!credentials) {
      throw new Error("Aws credentials not found !!!");
    }

    return credentials;
  } catch (error: any) {
    ui.showErrorMessage('Aws Credentials Not Found !!!', error);
    ui.logToOutput("GetCredentials Error !!!", error);
    return credentials;
  }
}

export async function getCredentialProviderName(): Promise<string> {
  return "";
}

export async function getIniProfileData(init: SourceProfileInit = {}): Promise<ParsedIniData> {
  const profiles = await parseKnownFiles(init);
  return profiles;
}

export const ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";

export const getHomeDir = (): string => {
  const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${sep}` } = process.env;

  if (HOME) { return HOME; }
  if (USERPROFILE) { return USERPROFILE; }
  if (HOMEPATH) { return `${HOMEDRIVE}${HOMEPATH}`; }

  return homedir();
};

export const getCredentialsFilepath = () =>
  process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "credentials");

export const getConfigFilepath = () =>
  process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "config");

export async function testAwsConnectivity(profile: string): Promise<boolean> {
  try {
    const credentials = await fromIni({ profile })();

    const client = new CloudWatchLogsClient({
      credentials,
      region: "us-east-1"
    });

    const command = new DescribeLogGroupsCommand({
      limit: 1
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    ui.showErrorMessage('api.GetLogGroupList Error !!!', error);
    ui.logToOutput("api.GetLogGroupList Error !!!", error);
    return false;
  }
}

export async function setCredentials(profileName: string, accessKeyId: string | undefined, secretAccessKey: string | undefined, sessionToken: string | undefined, securityToken: string | undefined, tokenExpiraion: string | undefined) {

  const fs = require('fs');
  const credentialsFilePath = getCredentialsFilepath();
  var fileContent = fs.readFileSync(credentialsFilePath, 'utf8');

  if (accessKeyId) { fileContent = updateCredential(fileContent, profileName, "aws_access_key_id", accessKeyId); }
  if (secretAccessKey) { fileContent = updateCredential(fileContent, profileName, "aws_secret_access_key", secretAccessKey); }
  if (sessionToken) { fileContent = updateCredential(fileContent, profileName, "aws_session_token", sessionToken); }
  if (securityToken) { fileContent = updateCredential(fileContent, profileName, "aws_security_token", securityToken); }
  if (tokenExpiraion) { fileContent = updateCredential(fileContent, profileName, "token_expiration", tokenExpiraion); }

  fs.writeFileSync(credentialsFilePath, fileContent, 'utf8');
}

export function updateCredential(credentialText: string, profileName: string, credentialName: string, newCredentialValue: string) {
  const lines = credentialText.split('\n');

  var profileFound = false;
  var lineFound = false;
  // Loop through each line
  for (let i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (profileFound && line.startsWith("[")) {
      //another profile
      break;
    }

    if (line === "[" + profileName + "]") {
      profileFound = true;
    }
    if (profileFound && line.startsWith(credentialName)) {
      var credential = line.split("=")[1].trim();
      lines[i] = credentialName + " = " + newCredentialValue;
      lineFound = true;
    }
  }

  return lines.join('\n');
}