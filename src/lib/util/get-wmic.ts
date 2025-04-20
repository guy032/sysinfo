import * as util from '.';

/**
 * Get the WMIC executable path
 *
 * @returns {string} Path to WMIC executable
 */
export async function getWmic(options = {}): Promise<string> {
  const stdout = await util.powerShell('Get-Command wmic | ConvertTo-Json -Compress', options);
  const stdoutStr = Array.isArray(stdout) ? stdout[0] : stdout;
  const wmicPath = JSON.parse(stdoutStr).Path;
  // CommandType     Name                                               Version    Source
  // -----------     ----                                               -------    ------
  // Application     WMIC.exe                                           10.0.26... C:\WINDOWS\System32\Wbem\WMIC.exe

  // Handle potential array return by extracting first element or using the string directly
  return Array.isArray(wmicPath) ? wmicPath[0] : wmicPath;
}

export default getWmic;
