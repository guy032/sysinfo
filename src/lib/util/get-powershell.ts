import fs from 'fs';
import os from 'os';

// Define constants and variables
const _windows = os.type() === 'Windows_NT';
const WINDIR = process.env.WINDIR || 'C:\\Windows';
let _powerShell = 'powershell.exe';

/**
 * Get the PowerShell executable path
 *
 * @returns {string} Path to PowerShell executable
 */
export function getPowershell(): string {
  _powerShell = 'powershell.exe';

  if (_windows) {
    const defaultPath = `${WINDIR}\\system32\\WindowsPowerShell\\v1.0\\powershell.exe`;

    if (fs.existsSync(defaultPath)) {
      _powerShell = defaultPath;
    }
  }

  return _powerShell;
}

export default getPowershell;
