import { exec } from 'child_process';
// Default options for Windows execution
const execOptsWin = {
    windowsHide: true,
    maxBuffer: 1024 * 50_000,
    encoding: 'utf8',
    env: { ...process.env, LANG: 'en_US.UTF-8' },
};
/**
 * Execute command on Windows with correct encoding
 *
 * @param {string} cmd - Command to execute
 * @param {ExecOptions} opts - Execution options
 * @param {Function} callback - Callback function
 */
export function execWin(cmd, opts = execOptsWin, callback) {
    if (!callback) {
        callback = opts;
        opts = execOptsWin;
    }
    const newCmd = 'chcp 65001 > nul && cmd /C ' + cmd + ' && chcp ' + (global.codepage || 437) + ' > nul';
    exec(newCmd, opts, function (error, stdout) {
        if (callback) {
            callback(error, stdout);
        }
    });
}
export default execWin;
