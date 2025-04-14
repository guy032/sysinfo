import getWmic from './get-wmic';

/**
 * Type definition for PowerShell function
 */
type PowerShellFn = (command: string | string[], opts?: any) => Promise<string | string[]>;

// Will be imported from the main file
let powerShell: PowerShellFn;

/**
 * Initialize the module with dependencies
 *
 * @param {PowerShellFn} ps - PowerShell function to use
 */
export function init(ps: PowerShellFn): void {
  powerShell = ps;
}

/**
 * Execute a WMIC command
 *
 * @param {string} command - Command to execute
 * @returns {Promise<string>} Command output
 */
export function wmic(command: string): Promise<string> {
  return new Promise((resolve) => {
    process.nextTick(() => {
      try {
        const result = powerShell(getWmic() + ' ' + command);

        // Since we know we're passing a string, we expect a string response
        // but need to handle the possibility of string[] due to the function type
        if (result instanceof Promise) {
          result.then((stdout) => {
            if (typeof stdout === 'string') {
              resolve(stdout);
            } else if (Array.isArray(stdout)) {
              // Join array results if needed
              resolve(stdout.join('\n'));
            } else {
              resolve('');
            }
          });
        } else {
          resolve('');
        }
      } catch {
        resolve('');
      }
    });
  });
}

export default wmic;
