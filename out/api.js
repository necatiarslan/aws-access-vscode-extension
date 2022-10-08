"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = exports.getIniProfileData = exports.getDefaultCredentials = void 0;
const credential_provider_node_1 = require("@aws-sdk/credential-provider-node");
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const shared_ini_file_loader_1 = require("@aws-sdk/shared-ini-file-loader");
async function getDefaultCredentials(profile) {
    let init = { profile: profile };
    const provider = (0, credential_provider_node_1.defaultProvider)(init);
    const credential = provider();
    return credential;
}
exports.getDefaultCredentials = getDefaultCredentials;
async function getIniProfileData(init = {}) {
    const profiles = await (0, shared_ini_file_loader_1.parseKnownFiles)(init);
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
//# sourceMappingURL=api.js.map