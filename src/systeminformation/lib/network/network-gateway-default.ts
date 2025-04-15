import { exec } from 'child_process';

import * as util from '../util';
import { getPlatformFlagsFromOptions } from '../util/platform';

/**
 * Get default network gateway
 * @param options Optional parameters
 * @param callback Optional callback function
 * @returns Promise resolving to gateway address string
 */
export function networkGatewayDefault(
  options: any = {},
  callback?: (data: string) => void,
): Promise<string> {
  return new Promise((resolve) => {
    process.nextTick(() => {
      const platform = getPlatformFlagsFromOptions(options);
      let result = '';

      if (util.isFunction(options) && !callback) {
        callback = options as unknown as (data: string) => void;
        options = {};
      }

      if (platform._linux || platform._freebsd || platform._openbsd || platform._netbsd) {
        const cmd = 'ip route get 1';

        try {
          exec(cmd, { maxBuffer: 1024 * 20_000 }, function (error, stdout) {
            if (!error) {
              const lines = stdout.toString().split('\n');
              const line = lines && lines.length > 0 ? lines[0] : '';
              const parts = line.split(' ');

              if (parts && parts.length > 0) {
                const viaIndex = parts.indexOf('via');

                if (viaIndex >= 0 && parts.length >= viaIndex + 2) {
                  result = parts[viaIndex + 1];
                }
              }
            }

            if (callback) {
              callback(result);
            }

            resolve(result);
          });
        } catch {
          if (callback) {
            callback(result);
          }

          resolve(result);
        }
      } else if (platform._darwin) {
        const cmd = 'route -n get default';

        try {
          exec(cmd, { maxBuffer: 1024 * 20_000 }, function (error, stdout) {
            if (error) {
              exec('netstat -rn', { maxBuffer: 1024 * 20_000 }, function (error, stdout) {
                if (!error) {
                  const lines = stdout
                    .toString()
                    .split('\n')
                    .filter((line) => line.includes('default'));

                  if (lines.length > 0) {
                    const parts = lines[0].trim().split(/\s+/);

                    if (parts.length > 1) {
                      result = parts[1];
                    }
                  }
                }

                if (callback) {
                  callback(result);
                }

                resolve(result);
              });
            } else {
              const lines = stdout
                .toString()
                .split('\n')
                .map((line) => line.trim());

              for (const line of lines) {
                if (line.startsWith('gateway:')) {
                  result = line.split('gateway:')[1].trim();
                  break;
                }
              }

              if (result) {
                if (callback) {
                  callback(result);
                }

                resolve(result);
              } else {
                exec('netstat -rn', { maxBuffer: 1024 * 20_000 }, function (error, stdout) {
                  if (!error) {
                    const lines = stdout
                      .toString()
                      .split('\n')
                      .filter((line) => line.includes('default'));

                    if (lines.length > 0) {
                      const parts = lines[0].trim().split(/\s+/);

                      if (parts.length > 1) {
                        result = parts[1];
                      }
                    }
                  }

                  if (callback) {
                    callback(result);
                  }

                  resolve(result);
                });
              }
            }
          });
        } catch {
          if (callback) {
            callback(result);
          }

          resolve(result);
        }
      } else if (platform._windows) {
        util
          .powerShell(
            'Get-NetRoute -DestinationPrefix 0.0.0.0/0 | Select-Object -ExpandProperty NextHop',
            options,
          )
          .then((stdout) => {
            const lines = stdout.toString().split('\r\n');

            for (const line of lines) {
              if (line && line.trim()) {
                result = line.trim();
                break;
              }
            }

            if (callback) {
              callback(result);
            }

            resolve(result);
          })
          .catch(() => {
            if (callback) {
              callback(result);
            }

            resolve(result);
          });
      } else {
        if (callback) {
          callback(result);
        }

        resolve(result);
      }
    });
  });
}
