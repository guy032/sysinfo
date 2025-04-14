import type { StdioOptions } from 'child_process';
import { execSync } from 'child_process';

/**
 * ExecOptions type for Linux operations
 */
interface ExecOptions {
  maxBuffer: number;
  encoding: BufferEncoding;
  stdio?: StdioOptions;
}

/**
 * Default options for Linux exec operations
 */
const execOptsLinux: ExecOptions = {
  maxBuffer: 1024 * 50_000,
  encoding: 'utf8',
  stdio: ['pipe', 'pipe', 'ignore'],
};

/**
 * Get Linux version information
 * @returns {string} Linux version string
 */
function linuxVersion(): string {
  let result = '';

  try {
    // Only run this on Linux
    if (process.platform === 'linux') {
      result = execSync('uname -v', execOptsLinux).toString();
    }
  } catch {
    result = '';
  }

  return result;
}

export default linuxVersion;
