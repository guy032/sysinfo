import path from 'path';

import * as util from '../util';
import type { PlatformFlags } from '../util/platform';
import { getPlatformFlagsFromOptions } from '../util/platform';

/**
 * GPS location data interface
 */
export interface IGpsData {
  latitude?: number | null;
  longitude?: number | null;
  status?: string;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  timestamp?: string | null;
  error?: boolean;
  message?: string;
  [key: string]: any;
}

/**
 * Options for GPS retrieval
 */
export interface IGpsOptions {
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
type IGpsCallback = (data: IGpsData) => void;

/**
 * Get the path to the PowerShell script
 * @returns The absolute path to the GPS PowerShell script
 */
function getGpsScriptPath(): string {
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
export function gps(options: IGpsOptions = {}, callback?: IGpsCallback): Promise<IGpsData> {
  // Get platform flags from options
  const platform: PlatformFlags = getPlatformFlagsFromOptions(options);

  let result: IGpsData = {};

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
                // Check for common timeout/error patterns before parsing JSON
                if (
                  output.includes('status: timeout') ||
                  output.includes('Location services timed out')
                ) {
                  result = {
                    latitude: null,
                    longitude: null,
                    status: 'timeout',
                    accuracy: null,
                    altitude: null,
                    altitudeAccuracy: null,
                    timestamp: null,
                  };
                } else if (
                  output.includes('status: disabled') ||
                  output.includes('Location services disabled')
                ) {
                  result = {
                    latitude: null,
                    longitude: null,
                    status: 'disabled',
                    accuracy: null,
                    altitude: null,
                    altitudeAccuracy: null,
                    timestamp: null,
                  };
                } else if (
                  output.includes('status: error') ||
                  output.includes('Location services error')
                ) {
                  result = {
                    latitude: null,
                    longitude: null,
                    status: 'error',
                    accuracy: null,
                    altitude: null,
                    altitudeAccuracy: null,
                    timestamp: null,
                  };
                } else {
                  // Try to parse as JSON
                  const cleanedOutput = output.replaceAll(/:\s*NaN/g, ': null');
                  result = JSON.parse(cleanedOutput);
                }
              } catch (error) {
                console.error('Error parsing GPS data:', error);
                console.error('Raw GPS data:', output);
                // Return a proper GPS object structure instead of generic error
                result = {
                  latitude: null,
                  longitude: null,
                  status: 'error',
                  accuracy: null,
                  altitude: null,
                  altitudeAccuracy: null,
                  timestamp: null,
                  error: true,
                  message: 'Failed to parse GPS data',
                };
              }
            } else {
              result = {
                latitude: null,
                longitude: null,
                status: 'no_data',
                accuracy: null,
                altitude: null,
                altitudeAccuracy: null,
                timestamp: null,
              };
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
