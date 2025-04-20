import type { ExecOptions } from 'child_process';
import { exec } from 'child_process';

// Default options for Windows execution
const execOptsWin = {
  windowsHide: true,
  maxBuffer: 1024 * 50_000,
  encoding: 'utf8' as const,
  env: { ...process.env, LANG: 'en_US.UTF-8' },
};

/**
 * Execute command on Windows with correct encoding
 *
 * @param {string} cmd - Command to execute
 * @param {ExecOptions} opts - Execution options
 * @param {Function} callback - Callback function
 */
export function execWin(
  cmd: string,
  opts: ExecOptions = execOptsWin,
  callback?: (error: Error | null, stdout: string) => void,
): void {
  if (!callback) {
    callback = opts as unknown as (error: Error | null, stdout: string) => void;
    opts = execOptsWin;
  }

  const newCmd =
    'chcp 65001 > nul && cmd /C ' + cmd + ' && chcp ' + (global.codepage || 437) + ' > nul';
  exec(newCmd, opts, function (error, stdout) {
    if (callback) {
      callback(error, stdout);
    }
  });
}

export default execWin;
