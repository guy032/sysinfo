import * as fs from 'fs';
import path from 'path';

import * as util from './util';

/**
 * GPS location data interface
 */
export interface GpsData {
  latitude?: number;
  longitude?: number;
  status?: string;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  timestamp?: string;
  error?: boolean;
  message?: string;
  [key: string]: any;
}

/**
 * Options for GPS retrieval
 */
export interface GpsOptions {
  winrm?: any;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  platform?: string;
  [key: string]: any;
}

/**
 * Callback function type for GPS data
 */
type GpsCallback = (data: GpsData) => void;

/**
 * Get the path to the PowerShell script
 * @returns The absolute path to the GPS PowerShell script
 */
function getGpsScriptPath(): string {
  // Calculate the path to the PowerShell script relative to this file
  return path.resolve(__dirname, '../powershell/gps.ps1');
}

/**
 * Get current GPS/location of the system
 *
 * @param {GpsOptions} options - options for WinRM if used remotely
 * @param {GpsCallback} callback - callback function
 * @returns {Promise<GpsData>} - GPS data containing latitude and longitude
 */
export function gps(options: GpsOptions = {}, callback?: GpsCallback): Promise<GpsData> {
  let result: GpsData = {};

  return new Promise((resolve) => {
    process.nextTick(() => {
      try {
        // Get the path to the PowerShell script file
        const scriptPath = getGpsScriptPath();

        // For WinRM connections, we need to inline the script content
        // For local execution, we can simply reference the file
        let command: string;

        if (options.winrm) {
          // When using WinRM, we need to send the script content directly
          // Read the script file and convert it to a single line
          const scriptContent = fs.readFileSync(scriptPath, 'utf8');
          command = scriptContent
            .replaceAll(/\r?\n/g, ' ') // Replace newlines with spaces
            .replaceAll(/\s+/g, ' ') // Normalize spaces
            .trim(); // Remove leading/trailing spaces
        } else {
          // For local execution, we can reference the script file
          command = `& "${scriptPath}"`;
        }

        util
          .powerShell(command, options)
          .then((stdout) => {
            // Convert to string if it's an array
            const output = Array.isArray(stdout) ? stdout.join('\n') : stdout;

            if (output && output.trim()) {
              try {
                // Use output (which is definitely a string) instead of stdout
                const cleanedOutput = output.replaceAll(/:\s*NaN/g, ': null');
                result = JSON.parse(cleanedOutput);
              } catch (error) {
                console.error('Error parsing GPS data:', error);
                console.error('Raw GPS data:', output);
                // Try to clean the output in case there are NaN values
                result = { error: true, message: 'Failed to parse GPS data', raw: output };
              }
            } else {
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
      } catch (error) {
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
