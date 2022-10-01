"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidDate = exports.isJsonString = exports.convertMsToTime = exports.getDuration = exports.openFile = exports.getExtensionVersion = exports.showErrorMessage = exports.showWarningMessage = exports.showInfoMessage = exports.logToOutput = exports.showOutputMessage = void 0;
const vscode = require("vscode");
const fs_1 = require("fs");
const path_1 = require("path");
var outputChannel;
var logsOutputChannel;
var NEW_LINE = "\n\n";
function showOutputMessage(message, popupMessage = "Results are printed to OUTPUT / Airflow-Extension") {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel("Airflow-Extension");
    }
    outputChannel.clear();
    if (typeof message === "object") {
        outputChannel.appendLine(JSON.stringify(message, null, 4));
    }
    else {
        outputChannel.appendLine(message);
    }
    outputChannel.show();
    showInfoMessage(popupMessage);
}
exports.showOutputMessage = showOutputMessage;
function logToOutput(message, error) {
    let now = new Date().toLocaleString();
    if (!logsOutputChannel) {
        logsOutputChannel = vscode.window.createOutputChannel("Airflow-Log");
    }
    if (typeof message === "object") {
        logsOutputChannel.appendLine("[" + now + "] " + JSON.stringify(message, null, 4));
    }
    else {
        logsOutputChannel.appendLine("[" + now + "] " + message);
    }
    if (error) {
        logsOutputChannel.appendLine(error.name);
        logsOutputChannel.appendLine(error.message);
        //logsOutputChannel.appendLine(error.stack);
    }
}
exports.logToOutput = logToOutput;
function showInfoMessage(message) {
    vscode.window.showInformationMessage(message);
}
exports.showInfoMessage = showInfoMessage;
function showWarningMessage(message) {
    vscode.window.showWarningMessage(message);
}
exports.showWarningMessage = showWarningMessage;
function showErrorMessage(message, error) {
    if (error) {
        vscode.window.showErrorMessage(message + NEW_LINE + error.name + NEW_LINE + error.message);
    }
    else {
        vscode.window.showErrorMessage(message);
    }
}
exports.showErrorMessage = showErrorMessage;
function getExtensionVersion() {
    const { version: extVersion } = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '..', 'package.json'), { encoding: 'utf8' }));
    return extVersion;
}
exports.getExtensionVersion = getExtensionVersion;
function openFile(file) {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(file), vscode.ViewColumn.One);
}
exports.openFile = openFile;
function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}
function getDuration(startDate, endDate) {
    if (!startDate) {
        return "";
    }
    if (!endDate || endDate < startDate) {
        endDate = new Date(); //now
    }
    var duration = endDate.valueOf() - startDate.valueOf();
    return (convertMsToTime(duration));
}
exports.getDuration = getDuration;
function convertMsToTime(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    seconds = seconds % 60;
    minutes = minutes % 60;
    return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
}
exports.convertMsToTime = convertMsToTime;
function isJsonString(jsonString) {
    try {
        var json = JSON.parse(jsonString);
        return (typeof json === 'object');
    }
    catch (e) {
        return false;
    }
}
exports.isJsonString = isJsonString;
function isValidDate(dateString) {
    var regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx)) {
        return false; // Invalid format
    }
    var d = new Date(dateString);
    var dNum = d.getTime();
    if (!dNum && dNum !== 0) {
        return false; // NaN value, Invalid date
    }
    return d.toISOString().slice(0, 10) === dateString;
}
exports.isValidDate = isValidDate;
//# sourceMappingURL=ui.js.map