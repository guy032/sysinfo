"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.powerShellWinRMWorkload = exports.powerShellWinRMSingleShell = exports.powerShellWinRMBatch = void 0;
exports.executeScript = executeScript;
exports.getPowerShellPath = getPowerShellPath;
exports.init = init;
exports.powerShell = powerShell;
exports.powerShellRelease = powerShellRelease;
exports.powerShellStart = powerShellStart;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const fs = tslib_1.__importStar(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const winrm_1 = require("./winrm");
// Variables
let _psChild = null;
let _psResult = '';
const _psCmds = [];
let _psPersistent = false;
let _powerShell = '';
const _psToUTF8 = '$OutputEncoding = [System.Console]::OutputEncoding = [System.Console]::InputEncoding = [System.Text.Encoding]::UTF8 ; ';
const _psCmdStart = '--###START###--';
const _psError = '--ERROR--';
const _psCmdSeperator = '--###ENDCMD###--';
const _psIdSeperator = '--##ID##--';
// PowerShell process functions
function powerShellProceedResults(data) {
    let id = '';
    let parts;
    let res = '';
    // startID
    if (data.includes(_psCmdStart)) {
        parts = data.split(_psCmdStart);
        const parts2 = parts[1].split(_psIdSeperator);
        id = parts2[0];
        if (parts2.length > 1) {
            data = parts2.slice(1).join(_psIdSeperator);
        }
    }
    // result;
    if (data.includes(_psCmdSeperator)) {
        parts = data.split(_psCmdSeperator);
        res = parts[0];
    }
    let remove = -1;
    for (const [i, _psCmd] of _psCmds.entries()) {
        if (_psCmd.id === id) {
            remove = i;
            _psCmd.callback(res);
        }
    }
    if (remove >= 0) {
        _psCmds.splice(remove, 1);
    }
}
function powerShellStart() {
    if (!_psChild) {
        _psChild = (0, child_process_1.spawn)(_powerShell, ['-NoProfile', '-NoLogo', '-InputFormat', 'Text', '-NoExit', '-Command', '-'], {
            stdio: 'pipe',
            windowsHide: true,
            env: { ...process.env, LANG: 'en_US.UTF-8' },
        });
        if (_psChild && _psChild.pid) {
            _psPersistent = true;
            _psChild.stdout.on('data', function (data) {
                _psResult = _psResult + data.toString('utf8');
                if (data.includes(_psCmdSeperator)) {
                    powerShellProceedResults(_psResult);
                    _psResult = '';
                }
            });
            _psChild.stderr.on('data', function () {
                powerShellProceedResults(_psResult + _psError);
            });
            _psChild.on('error', function () {
                powerShellProceedResults(_psResult + _psError);
            });
            _psChild.on('close', function () {
                if (_psChild) {
                    _psChild.kill();
                }
            });
        }
    }
}
function powerShellRelease() {
    try {
        if (_psChild) {
            _psChild.stdin.write('exit' + '\r\n');
            _psChild.stdin.end();
            _psPersistent = false;
        }
    }
    catch {
        if (_psChild) {
            _psChild.kill();
        }
    }
    _psChild = null;
}
// Main PowerShell execution function
function powerShell(cmd, opts = {}) {
    // If WinRM connection parameters are provided, use WinRM
    if (opts.winrm && opts.host && opts.username && opts.password) {
        // Check if this is a batch of commands to execute in a single shell
        if (Array.isArray(cmd)) {
            // Use the more efficient single shell approach for multiple commands
            return (0, winrm_1.winRMSingleShell)(cmd, opts);
        }
        // Single command execution - run directly with WinRM
        return (0, winrm_1.executeSingleCommand)(cmd, opts);
    }
    if (_psPersistent) {
        const id = Math.random().toString(36).slice(2, 12);
        return new Promise((resolve) => {
            function callback(data) {
                resolve(data);
            }
            process.nextTick(() => {
                _psCmds.push({
                    id,
                    cmd: cmd,
                    callback,
                    start: new Date(),
                });
                try {
                    if (_psChild && _psChild.pid) {
                        _psChild.stdin.write(_psToUTF8 +
                            'echo ' +
                            _psCmdStart +
                            id +
                            _psIdSeperator +
                            '; ' +
                            '\r\n' +
                            cmd +
                            '\r\n' +
                            'echo ' +
                            _psCmdSeperator +
                            '\r\n');
                    }
                }
                catch {
                    resolve('');
                }
            });
        });
    }
    let result = '';
    return new Promise((resolve) => {
        process.nextTick(() => {
            try {
                const child = (0, child_process_1.spawn)(_powerShell, [
                    '-NoProfile',
                    '-NoLogo',
                    '-InputFormat',
                    'Text',
                    '-NoExit',
                    '-ExecutionPolicy',
                    'Unrestricted',
                    '-Command',
                    '-',
                ], {
                    stdio: 'pipe',
                    windowsHide: true,
                    env: { ...process.env, LANG: 'en_US.UTF-8' },
                });
                if (child && !child.pid) {
                    child.on('error', function () {
                        resolve(result);
                    });
                }
                if (child && child.pid) {
                    child.stdout.on('data', function (data) {
                        result = result + data.toString('utf8');
                    });
                    child.stderr.on('data', function () {
                        child.kill();
                        resolve(result);
                    });
                    child.on('close', function () {
                        child.kill();
                        resolve(result);
                    });
                    child.on('error', function () {
                        child.kill();
                        resolve(result);
                    });
                    try {
                        child.stdin.write(_psToUTF8 + cmd + '\r\n');
                        child.stdin.write('exit' + '\r\n');
                        child.stdin.end();
                    }
                    catch {
                        child.kill();
                        resolve(result);
                    }
                }
                else {
                    resolve(result);
                }
            }
            catch {
                resolve(result);
            }
        });
    });
}
// Re-export WinRM functions with PowerShell naming convention for backwards compatibility
const powerShellWinRMBatch = winrm_1.winRMBatch;
exports.powerShellWinRMBatch = powerShellWinRMBatch;
const powerShellWinRMSingleShell = winrm_1.winRMSingleShell;
exports.powerShellWinRMSingleShell = powerShellWinRMSingleShell;
const powerShellWinRMWorkload = winrm_1.winRMWorkload;
exports.powerShellWinRMWorkload = powerShellWinRMWorkload;
// PowerShell path initialization
function getPowerShellPath() {
    if (!_powerShell && process.platform === 'win32') {
        try {
            const windowsDirectories = [
                process.env.WINDIR || 'C:\\Windows',
                process.env.SystemRoot || 'C:\\Windows',
            ];
            for (const dir of windowsDirectories) {
                const ps = `${dir}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
                if (require('fs').existsSync(ps)) {
                    _powerShell = ps;
                    break;
                }
            }
        }
        catch {
            _powerShell = '';
        }
    }
    return _powerShell;
}
// Initialization for external dependencies
function init(powershellPath) {
    _powerShell = powershellPath;
}
/**
 * Execute a PowerShell script file with consistent handling for both local and WinRM execution
 *
 * @param {string} scriptPath - Path to the PowerShell script
 * @param {object} options - Options for execution including WinRM details if needed
 * @returns {Promise<string|string[]>} - Script execution output
 */
function executeScript(scriptPath, options = {}) {
    // Ensure the script path is absolute
    const absoluteScriptPath = path_1.default.isAbsolute(scriptPath) ? scriptPath : path_1.default.resolve(scriptPath);
    // Check if the script exists
    if (!fs.existsSync(absoluteScriptPath)) {
        return Promise.reject(new Error(`Script file not found: ${absoluteScriptPath}`));
    }
    let command;
    // Handle WinRM vs local execution
    if (options.winrm && options.host && options.username && options.password) {
        // For WinRM, we need to inline the script content
        try {
            const scriptContent = fs.readFileSync(absoluteScriptPath, 'utf8');
            // Normalize the script to a single line for WinRM
            command = scriptContent
                .replaceAll(/\s*#.*$/gm, '') // Remove comments
                .replaceAll(/\r?\n/g, ' ') // Replace newlines with spaces
                .replaceAll(/\s+/g, ' ') // Normalize spaces
                // eslint-disable-next-line no-useless-escape
                .replaceAll('"', '\"') // Escape double quotes
                .trim(); // Remove leading/trailing spaces
            // Build environment variable prefix
            const envVars = [];
            // Traditional batch parameters
            if (options.batch) {
                if (options.batch.skip !== undefined) {
                    envVars.push(`$env:SKIP=${options.batch.skip}`);
                }
                if (options.batch.batchSize !== undefined) {
                    envVars.push(`$env:BATCHSIZE=${options.batch.batchSize}`);
                }
            }
            // Add directory pagination environment variables
            if (options.p !== undefined) {
                envVars.push(`$env:P='${options.p}'`);
            }
            if (options.d !== undefined) {
                envVars.push(`$env:DEPTH=${options.d}`);
            }
            if (options.fileOffset !== undefined) {
                envVars.push(`$env:FILEOFFSET=${options.fileOffset}`);
            }
            if (options.fileLimit !== undefined) {
                envVars.push(`$env:FILELIMIT=${options.fileLimit}`);
            }
            if (options.dirOffset !== undefined) {
                envVars.push(`$env:DIROFFSET=${options.dirOffset}`);
            }
            if (options.dirLimit !== undefined) {
                envVars.push(`$env:DIRLIMIT=${options.dirLimit}`);
            }
            if (options.includeSystemDirs !== undefined) {
                envVars.push(`$env:INCLUDESYSTEMDIRS=$${options.includeSystemDirs}`);
            }
            // Combine environment variables with the command
            if (envVars.length > 0) {
                command = `${envVars.join('; ')}; ${command}`;
            }
            // console.log('Full command with env vars:', command);
        }
        catch (error) {
            return Promise.reject(new Error(`Error reading script file: ${error}`));
        }
    }
    else {
        // For local execution, use the script path directly (without &)
        command = `"${absoluteScriptPath}"`;
    }
    // Execute the command using the existing powerShell function
    return powerShell(command, options);
}
