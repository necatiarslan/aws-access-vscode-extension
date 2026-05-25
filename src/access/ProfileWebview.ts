/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as api from './API';
import { StatusBarItem } from './StatusBarItem';

type WebviewMessage =
    | { command: 'ready' }
    | { command: 'refreshCredentials' }
    | { command: 'openCredentialsFile' }
    | { command: 'openConfigFile' }
    | { command: 'testConnection' }
    | { command: 'runLoginCommand' }
    | { command: 'setAutoLoginEnabled'; value: boolean }
    | { command: 'setActiveProfile'; profile: string }
    | { command: 'setLoginCommand'; value: string };

type ProfileWebviewState = {
    profiles: string[];
    activeProfile: string;
    hasCredentials: boolean;
    hasIniCredentials: boolean;
    hasExpiration: boolean;
    isExpired: boolean;
    expirationDate: string;
    expireTime: string;
    autoLoginEnabled: boolean;
    copyToDefaultEnabled: boolean;
    loginCommand: string;
    profileData: Record<string, string>;
    credentialsFilePath: string;
    configFilePath: string;
};

export class ProfileWebview {
    public static readonly OpenCommand = 'aws-access-vscode-extension.OpenProfilesWebview';
    private static Current: ProfileWebview | undefined;

    private panel: vscode.WebviewPanel | undefined;
    private syncTimer: NodeJS.Timeout | undefined;

    public static Create(context: vscode.ExtensionContext): ProfileWebview {
        if (!ProfileWebview.Current) {
            ProfileWebview.Current = new ProfileWebview(context);
        }

        return ProfileWebview.Current;
    }

    public static GetCurrent(): ProfileWebview | undefined {
        return ProfileWebview.Current;
    }

    private constructor(private readonly context: vscode.ExtensionContext) {
        // Singleton is created through Create().
    }

    public Open() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            this.PostState();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'aws-access-profiles',
            'AWS Profiles',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    this.context.extensionUri,
                    vscode.Uri.joinPath(this.context.extensionUri, 'node_modules'),
                ],
            },
        );

        this.panel.webview.html = this.GetHtml(this.panel.webview);

        this.panel.webview.onDidReceiveMessage(
            async (rawMessage: unknown) => {
                const message = rawMessage as WebviewMessage;
                await this.OnMessage(message);
            },
            undefined,
            this.context.subscriptions,
        );

        this.panel.onDidDispose(
            () => {
                this.StopSyncTimer();
                this.panel = undefined;
            },
            undefined,
            this.context.subscriptions,
        );

        this.StartSyncTimer();
        this.PostState();
    }

    public PostState() {
        if (!this.panel) {
            return;
        }

        const state = this.GetState();
        this.panel.webview.postMessage({ type: 'state', data: state });
    }

    private async OnMessage(message: WebviewMessage) {
        const current = StatusBarItem.Current;

        if (!current) {
            return;
        }

        switch (message.command) {
            case 'ready':
                this.PostState();
                break;
            case 'refreshCredentials':
                await current.GetCredentials();
                this.PostState();
                break;
            case 'openCredentialsFile':
                current.OpenCredentialsFile();
                break;
            case 'openConfigFile':
                current.OpenConfigFile();
                break;
            case 'testConnection':
                await current.TestAwsConnectivity();
                break;
            case 'runLoginCommand':
                current.RunLoginCommand();
                break;
            case 'setAutoLoginEnabled':
                if (current.IsAutoLoginPaused === message.value) {
                    current.PauseAutoLogin();
                    current.RefreshText();
                }
                this.PostState();
                break;
            case 'setActiveProfile':
                if (!current.Profiles.includes(message.profile)) {
                    return;
                }

                current.ActiveProfile = message.profile;
                current.AwsLoginShellCommand = current.GetAwsLoginCommand(message.profile);
                current.ShowLoading();
                await current.GetCredentials();
                current.SaveState();
                this.PostState();
                break;
            case 'setLoginCommand': {
                const value = message.value.trim();
                if (value.length === 0) {
                    current.AwsLoginShellCommand = undefined;
                    current.AwsLoginShellCommandList[current.ActiveProfile] = undefined;
                } else {
                    current.AwsLoginShellCommand = value;
                    current.AwsLoginShellCommandList[current.ActiveProfile] = value;
                }

                current.SaveState();
                current.RefreshText();
                this.PostState();
                break;
            }
            default:
                break;
        }
    }

    private StartSyncTimer() {
        this.StopSyncTimer();
        this.syncTimer = setInterval(() => {
            this.PostState();
        }, 1000);
    }

    private StopSyncTimer() {
        if (!this.syncTimer) {
            return;
        }

        clearInterval(this.syncTimer);
        this.syncTimer = undefined;
    }

    private GetState(): ProfileWebviewState {
        const current = StatusBarItem.Current;

        if (!current) {
            return {
                profiles: [],
                activeProfile: 'default',
                hasCredentials: false,
                hasIniCredentials: false,
                hasExpiration: false,
                isExpired: false,
                expirationDate: '',
                expireTime: '',
                autoLoginEnabled: true,
                copyToDefaultEnabled: false,
                loginCommand: '',
                profileData: {},
                credentialsFilePath: api.GetCredentialsFilepath(),
                configFilePath: api.GetConfigFilepath(),
            };
        }

        const activeData = current.IniData?.[current.ActiveProfile] || {};
        const profileData: Record<string, string> = {};
        Object.keys(activeData)
            .sort()
            .forEach((key) => {
                const value = activeData[key];
                profileData[key] = value === undefined ? '' : String(value);
            });

        return {
            profiles: current.Profiles,
            activeProfile: current.ActiveProfile,
            hasCredentials: current.HasCredentials,
            hasIniCredentials: current.HasIniCredentials,
            hasExpiration: current.HasExpiration,
            isExpired: current.IsExpired,
            expirationDate: current.ExpirationDateString || '',
            expireTime: current.ExpireTime,
            autoLoginEnabled: !current.IsAutoLoginPaused,
            copyToDefaultEnabled: current.IsCopyCredentialsToDefaultProfile,
            loginCommand: current.AwsLoginShellCommand || '',
            profileData,
            credentialsFilePath: api.GetCredentialsFilepath(),
            configFilePath: api.GetConfigFilepath(),
        };
    }

    private GetHtml(webview: vscode.Webview): string {
        const nonce = this.GetNonce();
        const elementsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'node_modules', '@vscode-elements', 'elements', 'dist', 'bundled.js'),
        );
        const codiconsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'),
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
        http-equiv="Content-Security-Policy"
        content="default-src 'none'; img-src ${webview.cspSource} https:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}';"
    />
    <link href="${codiconsUri}" rel="stylesheet" />
    <style>
        :root {
            color-scheme: light dark;
        }

        body {
            margin: 0;
            padding: 16px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-editor-foreground);
            background: var(--vscode-editor-background);
        }

        .layout {
            display: grid;
            gap: 16px;
        }

        .card {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 12px;
            background: color-mix(in srgb, var(--vscode-editor-background) 85%, var(--vscode-editor-foreground) 15%);
        }

        .top-row {
            display: grid;
            grid-template-columns: minmax(200px, 1fr) auto;
            gap: 12px;
            align-items: center;
        }

        .active-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 999px;
            background: var(--vscode-testing-iconPassed);
            color: var(--vscode-editor-background);
            font-weight: 600;
        }

        .status {
            font-size: 13px;
            line-height: 1.4;
        }

        .status.expired {
            color: var(--vscode-errorForeground);
        }

        .status.ok {
            color: var(--vscode-testing-iconPassed);
        }

        .button-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
        }

        .field-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 10px;
            align-items: end;
        }

        .meta {
            margin-top: 8px;
            font-size: 12px;
            opacity: 0.9;
            word-break: break-all;
        }

        .meta a {
            color: var(--vscode-textLink-foreground);
            text-decoration: underline;
            cursor: pointer;
        }

        .meta a:hover {
            color: var(--vscode-textLink-activeForeground);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }

        th, td {
            text-align: left;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding: 8px 6px;
            vertical-align: top;
        }

        th {
            width: 35%;
            color: var(--vscode-descriptionForeground);
            font-weight: 600;
        }

        .empty {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }

        h2, h3 {
            margin: 0 0 10px;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="layout">
        <section class="card">
            <h2>AWS Profiles</h2>
            <div class="top-row">
                <vscode-single-select id="profileSelect"></vscode-single-select>
                <span id="activePill" class="active-pill">
                    <span class="codicon codicon-check"></span>
                    Active
                </span>
            </div>
            <div id="statusText" class="status"></div>
            <div class="meta">
                <div>Credentials: <a id="credentialsPath" href="#"></a></div>
                <div>Config: <a id="configPath" href="#"></a></div>
            </div>
        </section>

        <section class="card">
            <h3>Actions</h3>
            <div class="button-row">
                <vscode-button id="refreshBtn">Refresh Credentials</vscode-button>
                <vscode-button id="testConnectionBtn">Test Connection</vscode-button>
            </div>
        </section>

        <section class="card">
            <h3>Auto Login</h3>
            <div class="field-row">
                <vscode-textfield id="loginCommandInput" placeholder="aws sso login --profile my-profile"></vscode-textfield>
                <vscode-checkbox id="autoLoginCheckbox">Enabled</vscode-checkbox>
                <vscode-button id="saveLoginBtn">Save</vscode-button>
            </div>
            <div class="button-row" style="margin-top: 10px;">
                <vscode-button id="runLoginBtn">Run</vscode-button>
            </div>
        </section>

        <section class="card">
            <h3>Profile Details</h3>
            <table>
                <tbody id="profileDetailsBody"></tbody>
            </table>
        </section>
    </div>

    <script nonce="${nonce}" type="module">
        import '${elementsUri}';

        const vscode = acquireVsCodeApi();

        const profileSelect = document.getElementById('profileSelect');
        const activePill = document.getElementById('activePill');
        const statusText = document.getElementById('statusText');
        const credentialsPath = document.getElementById('credentialsPath');
        const configPath = document.getElementById('configPath');
        const refreshBtn = document.getElementById('refreshBtn');
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        const runLoginBtn = document.getElementById('runLoginBtn');
        const autoLoginCheckbox = document.getElementById('autoLoginCheckbox');
        const loginCommandInput = document.getElementById('loginCommandInput');
        const saveLoginBtn = document.getElementById('saveLoginBtn');
        const profileDetailsBody = document.getElementById('profileDetailsBody');

        let currentState = undefined;

        function post(command, payload = {}) {
            vscode.postMessage({ command, ...payload });
        }

        function setActionsDisabled(disabled) {
            [refreshBtn, testConnectionBtn, runLoginBtn, saveLoginBtn].forEach((btn) => {
                btn.disabled = disabled;
            });
        }

        function renderProfileOptions(state) {
            profileSelect.innerHTML = '';

            for (const profile of state.profiles) {
                const option = document.createElement('vscode-option');
                option.value = profile;
                option.textContent = profile;
                if (profile === state.activeProfile) {
                    option.setAttribute('selected', 'true');
                }
                profileSelect.appendChild(option);
            }

            profileSelect.value = state.activeProfile;
            activePill.title = 'Active profile: ' + state.activeProfile;
        }

        function renderStatus(state) {
            if (!state.hasCredentials) {
                statusText.className = 'status expired';
                statusText.textContent = 'No AWS credentials found.';
                return;
            }

            if (!state.hasIniCredentials) {
                statusText.className = 'status ok';
                statusText.textContent = 'Credentials are available from provider chain.';
                return;
            }

            if (!state.hasExpiration) {
                statusText.className = 'status ok';
                statusText.textContent = 'Profile has no token expiration.';
                return;
            }

            if (state.isExpired) {
                statusText.className = 'status expired';
                statusText.textContent = 'Token expired (' + state.expireTime + ' ago).';
                return;
            }

            statusText.className = 'status ok';
            statusText.textContent = 'Token expires in ' + state.expireTime + ' (' + state.expirationDate + ').';
        }

        function renderDetails(state) {
            const entries = Object.entries(state.profileData || {});
            if (entries.length === 0) {
                profileDetailsBody.innerHTML = '<tr><td class="empty" colspan="2">No profile data available.</td></tr>';
                return;
            }

            profileDetailsBody.innerHTML = '';
            for (const [key, value] of entries) {
                const row = document.createElement('tr');
                const keyCell = document.createElement('th');
                const valueCell = document.createElement('td');
                keyCell.textContent = key;
                valueCell.textContent = value;
                row.appendChild(keyCell);
                row.appendChild(valueCell);
                profileDetailsBody.appendChild(row);
            }
        }

        function render(state) {
            currentState = state;
            renderProfileOptions(state);
            renderStatus(state);
            renderDetails(state);
            autoLoginCheckbox.checked = state.autoLoginEnabled;
            loginCommandInput.value = state.loginCommand || '';
            credentialsPath.textContent = state.credentialsFilePath;
            credentialsPath.title = state.credentialsFilePath;
            configPath.textContent = state.configFilePath;
            configPath.title = state.configFilePath;
        }

        profileSelect.addEventListener('change', () => {
            post('setActiveProfile', { profile: profileSelect.value });
        });

        refreshBtn.addEventListener('click', async () => {
            setActionsDisabled(true);
            post('refreshCredentials');
            setActionsDisabled(false);
        });

        credentialsPath.addEventListener('click', (event) => {
            event.preventDefault();
            post('openCredentialsFile');
        });

        configPath.addEventListener('click', (event) => {
            event.preventDefault();
            post('openConfigFile');
        });

        testConnectionBtn.addEventListener('click', () => {
            post('testConnection');
        });

        runLoginBtn.addEventListener('click', () => {
            post('runLoginCommand');
        });

        autoLoginCheckbox.addEventListener('change', () => {
            post('setAutoLoginEnabled', { value: autoLoginCheckbox.checked });
        });

        saveLoginBtn.addEventListener('click', () => {
            post('setLoginCommand', { value: loginCommandInput.value || '' });
        });

        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'state') {
                render(message.data);
            }
        });

        if (!currentState) {
            post('ready');
        }
    </script>
</body>
</html>`;
    }

    private GetNonce(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';

        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }
}
