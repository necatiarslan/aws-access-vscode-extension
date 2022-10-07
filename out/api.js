"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultCredentials = void 0;
const credential_provider_node_1 = require("@aws-sdk/credential-provider-node");
async function getDefaultCredentials() {
    const provider = (0, credential_provider_node_1.defaultProvider)();
    const credential = provider();
    return credential;
}
exports.getDefaultCredentials = getDefaultCredentials;
//# sourceMappingURL=api.js.map