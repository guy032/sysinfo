import type { ExecOptions } from 'child_process';
/**
 * Execute command on Windows with correct encoding
 *
 * @param {string} cmd - Command to execute
 * @param {ExecOptions} opts - Execution options
 * @param {Function} callback - Callback function
 */
export declare function execWin(cmd: string, opts?: ExecOptions, callback?: (error: Error | null, stdout: string) => void): void;
export default execWin;
//# sourceMappingURL=exec-win.d.ts.map