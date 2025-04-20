import { execSync } from 'child_process';
// Cache the codepage value
let codepage = '';
/**
 * Reference to powerShell function that will be set during initialization
 */
let powerShell;
const execOptsLinux = {
    maxBuffer: 1024 * 50_000,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
};
/**
 * Initialize the module with dependencies
 *
 * @param {Function} ps - powerShell function to use
 */
export function init(ps) {
    powerShell = ps;
}
/**
 * Get current codepage of system
 *
 * @param {PlatformOptions} [options={}] - Function options
 * @returns {string} Returns codepage
 */
export function getCodepage(options = {}) {
    // Platform constants
    const _windows = options.platform === 'win32' || process.platform === 'win32';
    const _linux = options.platform === 'linux' ||
        options.platform === 'android' ||
        (!options.platform && (process.platform === 'linux' || process.platform === 'android'));
    const _darwin = options.platform === 'darwin' || (!options.platform && process.platform === 'darwin');
    const _freebsd = options.platform === 'freebsd' || (!options.platform && process.platform === 'freebsd');
    const _openbsd = options.platform === 'openbsd' || (!options.platform && process.platform === 'openbsd');
    const _netbsd = options.platform === 'netbsd' || (!options.platform && process.platform === 'netbsd');
    if (_windows) {
        if (!codepage) {
            try {
                if (typeof powerShell === 'function') {
                    const result = powerShell('chcp', options);
                    // Handle the result which could be a string or string[]
                    if (result instanceof Promise) {
                        result.then((data) => {
                            if (typeof data === 'string') {
                                const lines = data.split('\r\n');
                                const parts = lines[0]?.split(':') || [];
                                codepage = parts.length > 1 ? parts[1].replace('.', '').trim() : '';
                            }
                        });
                    }
                    // Return current codepage or default
                    if (!codepage) {
                        codepage = '437';
                    }
                }
                else {
                    codepage = '437'; // Default if powerShell is not initialized
                }
            }
            catch {
                codepage = '437';
            }
        }
        return codepage;
    }
    if (_linux || _darwin || _freebsd || _openbsd || _netbsd) {
        if (!codepage) {
            try {
                const stdout = execSync('echo $LANG', execOptsLinux);
                const lines = stdout.toString().split('\r\n');
                const parts = lines[0].split('.');
                codepage = parts.length > 1 ? parts[1].trim() : '';
                if (!codepage) {
                    codepage = 'utf8';
                }
            }
            catch {
                codepage = 'utf8';
            }
        }
        return codepage;
    }
    return '';
}
export default getCodepage;
