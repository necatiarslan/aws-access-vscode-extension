import { homedir } from "os";
import { sep } from "path";
import { join } from "path";
import { parseKnownFiles, SourceProfileInit } from "./aws-sdk/parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";
import * as AWS from 'aws-sdk';
import * as ui from './ui';

export function getCredentialProvider(credentials:any|undefined=undefined){
  if(!credentials)
  {
    credentials = AWS.config.credentials;
  }

  if(!credentials)
  {
    return "Credential Not Found";
  }

  if (credentials instanceof(AWS.EnvironmentCredentials))
  {
    return "EnvironmentCredentials";
  }
  else if (credentials instanceof(AWS.ECSCredentials))
  {
    return "ECSCredentials";
  }
  else if (credentials instanceof(AWS.SsoCredentials))
  {
    return "SsoCredentials";
  }
  else if (credentials instanceof(AWS.SharedIniFileCredentials))
  {
    return "SharedIniFileCredentials";
  }
  else if (credentials instanceof(AWS.ProcessCredentials))
  {
    return "ProcessCredentials";
  }
  else if (credentials instanceof(AWS.TokenFileWebIdentityCredentials))
  {
    return "TokenFileWebIdentityCredentials";
  }
  else if (credentials instanceof(AWS.EC2MetadataCredentials))
  {
    return "EC2MetadataCredentials";
  }
  return "UnknownProvider";
}

export async function getIniProfileData(init: SourceProfileInit = {}):Promise<ParsedIniData>
{
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

export async function testAwsConnectivity(profile:string): Promise<boolean> {

  try 
  {
    const credentials = new AWS.SharedIniFileCredentials({ profile: profile });

    // Initialize the CloudWatchLogs client
    const cloudwatchlogs = new AWS.CloudWatchLogs({region:"us-east-1", credentials:credentials});

    // Set the parameters for the describeLogGroups API
    const params = {
      limit: 1,//max value
    };

    let response = await cloudwatchlogs.describeLogGroups(params).promise();

    return true;
  } 
  catch (error:any) 
  {
    ui.showErrorMessage('api.GetLogGroupList Error !!!', error);
    ui.logToOutput("api.GetLogGroupList Error !!!", error); 
    return false;
  }
}

export async function setCredentials(profileName:string, accessKeyId:string|undefined, secretAccessKey:string|undefined, sessionToken:string|undefined, securityToken:string|undefined, tokenExpiraion:string|undefined){

  const fs = require('fs');
  const credentialsFilePath = getCredentialsFilepath();
  var fileContent = fs.readFileSync(credentialsFilePath, 'utf8');

  if(accessKeyId){ fileContent = updateCredential(fileContent, profileName, "aws_access_key_id", accessKeyId); }
  if(secretAccessKey){ fileContent = updateCredential(fileContent, profileName, "aws_secret_access_key", secretAccessKey); }
  if(sessionToken){ fileContent = updateCredential(fileContent, profileName, "aws_session_token", sessionToken); }
  if(securityToken){ fileContent = updateCredential(fileContent, profileName, "aws_security_token", securityToken); }
  if(tokenExpiraion){ fileContent = updateCredential(fileContent, profileName, "token_expiration", tokenExpiraion); }
  
  fs.writeFileSync(credentialsFilePath, fileContent, 'utf8');
}

export function updateCredential(credentialText:string, profileName:string, credentialName:string, newCredentialValue:string){
  const lines = credentialText.split('\n');

  var profileFound = false;
  var lineFound = false;
  // Loop through each line
  for (let i = 0; i < lines.length; i++) {
    var line = lines[i];
    if(profileFound && line.startsWith("["))
    {
      //another profile
      break;
    }
    
    if (line === "[" + profileName + "]")
    {
      profileFound = true;
    }
    if (profileFound && line.startsWith(credentialName))
    {
      var credential = line.split("=")[1].trim();
      lines[i] = credentialName + " = " + newCredentialValue;
      lineFound = true;
    }
  }

  return lines.join('\n');
}