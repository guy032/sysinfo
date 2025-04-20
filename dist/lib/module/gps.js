import path from 'path';
import * as util from '../util';
import { getPlatformFlagsFromOptions } from '../util/platform';
/**
 * Get the path to the PowerShell script
 * @returns The absolute path to the GPS PowerShell script
 */
function getGpsScriptPath() {
    // Calculate the path to the PowerShell script relative to this file
    return path.resolve(__dirname, '../../powershell/gps.ps1');
}
/**
 * Get current GPS/location of the system
 *
 * @param {IGpsOptions} options - options for WinRM if used remotely
 * @param {IGpsCallback} callback - callback function
 * @returns {Promise<IGpsData>} - GPS data containing latitude and longitude
 */
export function gps(options = {}, callback) {
    // Get platform flags from options
    const platform = getPlatformFlagsFromOptions(options);
    let result = {};
    return new Promise((resolve) => {
        process.nextTick(() => {
            try {
                // Only proceed with Windows platforms
                if (!platform._windows) {
                    result = { error: true, message: 'GPS data only available on Windows platforms' };
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                    return;
                }
                // Get the path to the PowerShell script file
                const scriptPath = getGpsScriptPath();
                // Execute the PowerShell script using the centralized utility function
                util
                    .executeScript(scriptPath, options)
                    .then((stdout) => {
                    // Convert to string if it's an array
                    const output = Array.isArray(stdout) ? stdout.join('\n') : stdout;
                    if (output && output.trim()) {
                        try {
                            // Use output (which is definitely a string) instead of stdout
                            const cleanedOutput = output.replaceAll(/:\s*NaN/g, ': null');
                            result = JSON.parse(cleanedOutput);
                        }
                        catch (error) {
                            console.error('Error parsing GPS data:', error);
                            console.error('Raw GPS data:', output);
                            // Try to clean the output in case there are NaN values
                            result = { error: true, message: 'Failed to parse GPS data', raw: output };
                        }
                    }
                    else {
                        result = { error: true, message: 'No GPS data returned' };
                    }
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                })
                    .catch((error) => {
                    console.error('GPS command error:', error);
                    result = {
                        error: true,
                        message: 'Failed to retrieve GPS data',
                        errorDetails: error instanceof Error ? error.message : String(error),
                    };
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                });
            }
            catch (error) {
                console.error('GPS error:', error);
                result = { error: true, message: error instanceof Error ? error.message : 'Unknown error' };
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
        });
    });
}
