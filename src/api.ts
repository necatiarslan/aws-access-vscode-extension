import { defaultProvider, DefaultProviderInit } from '@aws-sdk/credential-provider-node';
import { Credentials } from "@aws-sdk/types";
import { homedir } from "os";
import { sep } from "path";
import { join } from "path";
import { parseKnownFiles, SourceProfileInit } from "./parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";


export async function getDefaultCredentials(profile:string):Promise<Credentials>
{
    let init:DefaultProviderInit = { profile:profile };
    const provider = defaultProvider(init);
    const credential = provider();
    return credential;
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