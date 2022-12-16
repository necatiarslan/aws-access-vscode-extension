import { homedir } from "os";
import { sep } from "path";
import { join } from "path";
import { parseKnownFiles, SourceProfileInit } from "./aws-sdk/parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";
import * as AWS from 'aws-sdk';
import * as ui from './ui';

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