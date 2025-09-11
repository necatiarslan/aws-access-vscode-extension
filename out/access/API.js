"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetConfigFilepath = exports.GetCredentialsFilepath = exports.GetHomeDir = exports.ENV_CREDENTIALS_PATH = void 0;
exports.StartConnection = StartConnection;
exports.StopConnection = StopConnection;
exports.GetIniCredentials = GetIniCredentials;
exports.GetCredentials = GetCredentials;
exports.GetIniProfileData = GetIniProfileData;
exports.TestAwsConnectivity = TestAwsConnectivity;
exports.SetCredentials = SetCredentials;
exports.UpdateCredential = UpdateCredential;
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const parseKnownFiles_1 = require("../aws-sdk/parseKnownFiles");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const ui = require("./UI");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const StatusBarItem = require("./StatusBarItem");
let CurrentCredentials = undefined;
async function StartConnection() {
    ui.logToOutput("Starting Connection");
    CurrentCredentials = await GetCredentials();
    //CurrentS3Client = await GetS3Client();
    ui.logToOutput("Connection Started");
}
async function StopConnection() {
    ui.logToOutput("Stopping Connection");
    CurrentCredentials = undefined;
    //CurrentS3Client = undefined;
    ui.logToOutput("Connection Stopped");
}
async function GetIniCredentials() {
    let credentials;
    try {
        const providerIni = (0, credential_providers_1.fromIni)({ ignoreCache: true });
        credentials = await providerIni();
    }
    catch (error) {
        ui.logToOutput("GetIniCredentials Error !!!", error);
    }
    return credentials;
}
async function GetCredentials() {
    let credentials;
    if (CurrentCredentials !== undefined) {
        ui.logToOutput("Aws credentials From Pool AccessKeyId=" + CurrentCredentials.accessKeyId);
        return CurrentCredentials;
    }
    try {
        if (StatusBarItem.StatusBarItem.Current) {
            process.env.AWS_PROFILE = StatusBarItem.StatusBarItem.Current.ActiveProfile;
        }
        const provider = (0, credential_providers_1.fromNodeProviderChain)({ ignoreCache: true });
        credentials = await provider();
        if (!credentials) {
            throw new Error("Aws credentials not found !!!");
        }
        return credentials;
    }
    catch (error) {
        ui.logToOutput("GetCredentials Error !!!", error);
        return credentials;
    }
}
async function GetIniProfileData(init = {}) {
    const profiles = await (0, parseKnownFiles_1.parseKnownFiles)(init);
    return profiles;
}
exports.ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
const GetHomeDir = () => {
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${path_1.sep}` } = process.env;
    if (HOME) {
        return HOME;
    }
    if (USERPROFILE) {
        return USERPROFILE;
    }
    if (HOMEPATH) {
        return `${HOMEDRIVE}${HOMEPATH}`;
    }
    return (0, os_1.homedir)();
};
exports.GetHomeDir = GetHomeDir;
const GetCredentialsFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.GetHomeDir)(), ".aws", "credentials");
exports.GetCredentialsFilepath = GetCredentialsFilepath;
const GetConfigFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.GetHomeDir)(), ".aws", "config");
exports.GetConfigFilepath = GetConfigFilepath;
async function TestAwsConnectivity() {
    try {
        const credentials = await GetCredentials();
        const client = new client_cloudwatch_logs_1.CloudWatchLogsClient({
            credentials,
            region: "us-east-1"
        });
        const command = new client_cloudwatch_logs_1.DescribeLogGroupsCommand({
            limit: 1
        });
        await client.send(command);
        return true;
    }
    catch (error) {
        ui.showErrorMessage('api.GetLogGroupList Error !!!', error);
        ui.logToOutput("api.GetLogGroupList Error !!!", error);
        return false;
    }
}
async function SetCredentials(profileName, accessKeyId, secretAccessKey, sessionToken, securityToken, tokenExpiraion) {
    const fs = require('fs');
    const credentialsFilePath = (0, exports.GetCredentialsFilepath)();
    var fileContent = fs.readFileSync(credentialsFilePath, 'utf8');
    if (accessKeyId) {
        fileContent = UpdateCredential(fileContent, profileName, "aws_access_key_id", accessKeyId);
    }
    if (secretAccessKey) {
        fileContent = UpdateCredential(fileContent, profileName, "aws_secret_access_key", secretAccessKey);
    }
    if (sessionToken) {
        fileContent = UpdateCredential(fileContent, profileName, "aws_session_token", sessionToken);
    }
    if (securityToken) {
        fileContent = UpdateCredential(fileContent, profileName, "aws_security_token", securityToken);
    }
    if (tokenExpiraion) {
        fileContent = UpdateCredential(fileContent, profileName, "token_expiration", tokenExpiraion);
    }
    fs.writeFileSync(credentialsFilePath, fileContent, 'utf8');
}
function UpdateCredential(credentialText, profileName, credentialName, newCredentialValue) {
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
//# sourceMappingURL=API.js.map