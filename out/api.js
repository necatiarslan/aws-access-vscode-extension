"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCredential = exports.setCredentials = exports.testAwsConnectivity = exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = exports.getIniProfileData = void 0;
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const parseKnownFiles_1 = require("./aws-sdk/parseKnownFiles");
const AWS = require("aws-sdk");
const ui = require("./ui");
async function getIniProfileData(init = {}) {
    const profiles = await (0, parseKnownFiles_1.parseKnownFiles)(init);
    return profiles;
}
exports.getIniProfileData = getIniProfileData;
exports.ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
const getHomeDir = () => {
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
exports.getHomeDir = getHomeDir;
const getCredentialsFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.getHomeDir)(), ".aws", "credentials");
exports.getCredentialsFilepath = getCredentialsFilepath;
const getConfigFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.getHomeDir)(), ".aws", "config");
exports.getConfigFilepath = getConfigFilepath;
async function testAwsConnectivity(profile) {
    try {
        const credentials = new AWS.SharedIniFileCredentials({ profile: profile });
        // Initialize the CloudWatchLogs client
        const cloudwatchlogs = new AWS.CloudWatchLogs({ region: "us-east-1", credentials: credentials });
        // Set the parameters for the describeLogGroups API
        const params = {
            limit: 1, //max value
        };
        let response = await cloudwatchlogs.describeLogGroups(params).promise();
        return true;
    }
    catch (error) {
        ui.showErrorMessage('api.GetLogGroupList Error !!!', error);
        ui.logToOutput("api.GetLogGroupList Error !!!", error);
        return false;
    }
}
exports.testAwsConnectivity = testAwsConnectivity;
async function setCredentials(profileName, accessKeyId, secretAccessKey, sessionToken, securityToken, tokenExpiraion) {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const credentialsFilePath = path.join(os.homedir(), '.aws', 'credentials');
    var fileContent = fs.readFileSync(credentialsFilePath, 'utf8');
    //const lines = fileContent.split('\n');
    if (accessKeyId) {
        fileContent = updateCredential(fileContent, profileName, "aws_access_key_id", accessKeyId);
    }
    if (secretAccessKey) {
        fileContent = updateCredential(fileContent, profileName, "aws_secret_access_key", secretAccessKey);
    }
    if (sessionToken) {
        fileContent = updateCredential(fileContent, profileName, "aws_session_token", sessionToken);
    }
    if (securityToken) {
        fileContent = updateCredential(fileContent, profileName, "aws_security_token", securityToken);
    }
    if (tokenExpiraion) {
        fileContent = updateCredential(fileContent, profileName, "token_expiration", tokenExpiraion);
    }
    fs.writeFileSync(credentialsFilePath, fileContent, 'utf8');
}
exports.setCredentials = setCredentials;
function updateCredential(credentialText, profileName, credentialName, newCredentialValue) {
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
exports.updateCredential = updateCredential;
//# sourceMappingURL=api.js.map