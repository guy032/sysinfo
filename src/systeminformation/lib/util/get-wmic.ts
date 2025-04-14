import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';

// Define constants and variables
const WINDIR = process.env.WINDIR || 'C:\\Windows';
let wmicPath = '';

/**
 * Get the WMIC executable path
 *
 * @returns {string} Path to WMIC executable
 */
export function getWmic(): string {
  if (os.type() === 'Windows_NT' && !wmicPath) {
    wmicPath = WINDIR + '\\system32\\wbem\\wmic.exe';

    if (!fs.existsSync(wmicPath)) {
      try {
        // For TypeScript, we need to define the execOptsWin type
        const execOptsWin = {
          windowsHide: true,
          maxBuffer: 1024 * 50_000,
          encoding: 'utf8' as const,
          env: { ...process.env, LANG: 'en_US.UTF-8' },
        };

        const wmicPathArray = execSync('WHERE WMIC', execOptsWin).toString().split('\r\n');

        wmicPath = wmicPathArray && wmicPathArray.length > 0 ? wmicPathArray[0] : 'wmic';
      } catch {
        wmicPath = 'wmic';
      }
    }
  }

  return wmicPath;
}

export default getWmic;
