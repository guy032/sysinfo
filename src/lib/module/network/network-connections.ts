import { exec } from 'child_process';

import * as util from '../../util';
import { getPlatformFlagsFromOptions } from '../../util/platform';

interface NetworkConnection {
  protocol: string;
  localAddress: string;
  localPort: string;
  peerAddress: string;
  peerPort: string;
  state: string | null;
  pid: number | null;
  process?: string;
}

/**
 * Get process name from process list
 * @param processes List of processes
 * @param pid Process ID
 * @returns Process name
 */
function getProcessName(processes: string[], pid: number): string {
  let cmd = '';

  for (const line of processes) {
    const parts = line.split(' ');
    const id = Number.parseInt(parts[0], 10) || -1;

    if (id === pid) {
      parts.shift();
      cmd = parts.join(' ').split(':')[0];
    }
  }

  cmd = cmd.split(' -')[0];
  cmd = cmd.split(' /')[0];

  return cmd;
}

/**
 * Get network connections (sockets)
 * @param options Optional parameters
 * @param callback Optional callback function
 * @returns Promise resolving to network connections
 */
export function networkConnections(
  options: any = {},
  callback?: (connections: NetworkConnection[]) => void,
): Promise<NetworkConnection[]> {
  const platform = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(() => {
      const result: NetworkConnection[] = [];

      if (platform._linux || platform._freebsd || platform._openbsd || platform._netbsd) {
        let cmd =
          'export LC_ALL=C; netstat -tunap | grep "ESTABLISHED\\|SYN_SENT\\|SYN_RECV\\|FIN_WAIT1\\|FIN_WAIT2\\|TIME_WAIT\\|CLOSE\\|CLOSE_WAIT\\|LAST_ACK\\|LISTEN\\|CLOSING\\|UNKNOWN"; unset LC_ALL';

        if (platform._freebsd || platform._openbsd || platform._netbsd) {
          cmd =
            'export LC_ALL=C; netstat -na | grep "ESTABLISHED\\|SYN_SENT\\|SYN_RECV\\|FIN_WAIT1\\|FIN_WAIT2\\|TIME_WAIT\\|CLOSE\\|CLOSE_WAIT\\|LAST_ACK\\|LISTEN\\|CLOSING\\|UNKNOWN"; unset LC_ALL';
        }

        exec(cmd, { maxBuffer: 1024 * 20_000 }, function (error, stdout) {
          const lines = stdout.toString().split('\n');

          if (!error && (lines.length > 1 || lines[0] !== '')) {
            for (const line of lines) {
              const lineParts = line.replaceAll(/ +/g, ' ').split(' ');

              if (lineParts.length >= 7) {
                let localip = lineParts[3];
                let localport = '';
                const localaddress = lineParts[3].split(':');

                if (localaddress.length > 1) {
                  localport = localaddress.at(-1) || '';
                  localaddress.pop();
                  localip = localaddress.join(':');
                }

                let peerip = lineParts[4];
                let peerport = '';
                const peeraddress = lineParts[4].split(':');

                if (peeraddress.length > 1) {
                  peerport = peeraddress.at(-1) || '';
                  peeraddress.pop();
                  peerip = peeraddress.join(':');
                }

                const connstate = lineParts[5];
                const proc = lineParts[6].split('/');

                if (connstate) {
                  result.push({
                    protocol: lineParts[0],
                    localAddress: localip,
                    localPort: localport,
                    peerAddress: peerip,
                    peerPort: peerport,
                    state: connstate,
                    pid: proc[0] && proc[0] !== '-' ? Number.parseInt(proc[0], 10) : null,
                    process: proc[1] ? proc[1].split(' ')[0].split(':')[0] : '',
                  });
                }
              }
            }

            if (callback) {
              callback(result);
            }

            resolve(result);
          } else {
            cmd =
              'ss -tunap | grep "ESTAB\\|SYN-SENT\\|SYN-RECV\\|FIN-WAIT1\\|FIN-WAIT2\\|TIME-WAIT\\|CLOSE\\|CLOSE-WAIT\\|LAST-ACK\\|LISTEN\\|CLOSING"';
            exec(cmd, { maxBuffer: 1024 * 20_000 }, function (error, stdout) {
              if (!error) {
                const lines = stdout.toString().split('\n');

                for (const line of lines) {
                  const lineParts = line.replaceAll(/ +/g, ' ').split(' ');

                  if (lineParts.length >= 6) {
                    let localip = lineParts[4];
                    let localport = '';
                    const localaddress = lineParts[4].split(':');

                    if (localaddress.length > 1) {
                      localport = localaddress.at(-1) || '';
                      localaddress.pop();
                      localip = localaddress.join(':');
                    }

                    let peerip = lineParts[5];
                    let peerport = '';
                    const peeraddress = lineParts[5].split(':');

                    if (peeraddress.length > 1) {
                      peerport = peeraddress.at(-1) || '';
                      peeraddress.pop();
                      peerip = peeraddress.join(':');
                    }

                    let connstate = lineParts[1];

                    if (connstate === 'ESTAB') {
                      connstate = 'ESTABLISHED';
                    }

                    if (connstate === 'TIME-WAIT') {
                      connstate = 'TIME_WAIT';
                    }

                    let pid: number | null = null;
                    let process = '';

                    if (lineParts.length >= 7 && lineParts[6].includes('users:')) {
                      const proc = lineParts[6]
                        .replace('users:(("', '')
                        .replaceAll('"', '')
                        .split(',');

                      if (proc.length > 2) {
                        process = proc[0].split(' ')[0].split(':')[0];
                        pid = Number.parseInt(proc[1], 10);
                      }
                    }

                    if (connstate) {
                      result.push({
                        protocol: lineParts[0],
                        localAddress: localip,
                        localPort: localport,
                        peerAddress: peerip,
                        peerPort: peerport,
                        state: connstate,
                        pid,
                        process,
                      });
                    }
                  }
                }
              }

              if (callback) {
                callback(result);
              }

              resolve(result);
            });
          }
        });
      }

      if (platform._darwin) {
        const cmd =
          'netstat -natvln | head -n2; netstat -natvln | grep "tcp4\\|tcp6\\|udp4\\|udp6"';
        const states =
          'ESTABLISHED|SYN_SENT|SYN_RECV|FIN_WAIT1|FIN_WAIT_1|FIN_WAIT2|FIN_WAIT_2|TIME_WAIT|CLOSE|CLOSE_WAIT|LAST_ACK|LISTEN|CLOSING|UNKNOWN'.split(
            '|',
          );
        exec(cmd, { maxBuffer: 1024 * 20_000 }, function (error, stdout) {
          if (!error) {
            exec('ps -axo pid,command', { maxBuffer: 1024 * 20_000 }, function (err2, stdout2) {
              let processes = stdout2.toString().split('\n');
              processes = processes.map((line) => line.trim().replaceAll(/ +/g, ' '));
              const lines = stdout.toString().split('\n');
              lines.shift();
              let pidPos = 8;

              if (lines.length > 1 && lines[0].indexOf('pid') > 0) {
                const header = (lines.shift() || '')
                  .replaceAll(' Address', '_Address')
                  .replaceAll(/ +/g, ' ')
                  .split(' ');
                pidPos = header.indexOf('pid');
              }

              for (const line of lines) {
                const lineParts = line.replaceAll(/ +/g, ' ').split(' ');

                if (lineParts.length >= 8) {
                  let localip = lineParts[3];
                  let localport = '';
                  const localaddress = lineParts[3].split('.');

                  if (localaddress.length > 1) {
                    localport = localaddress.at(-1) || '';
                    localaddress.pop();
                    localip = localaddress.join('.');
                  }

                  let peerip = lineParts[4];
                  let peerport = '';
                  const peeraddress = lineParts[4].split('.');

                  if (peeraddress.length > 1) {
                    peerport = peeraddress.at(-1) || '';
                    peeraddress.pop();
                    peerip = peeraddress.join('.');
                  }

                  const hasState = states.includes(lineParts[5]);
                  const connstate = hasState ? lineParts[5] : 'UNKNOWN';
                  const pid = Number.parseInt(lineParts[pidPos + (hasState ? 0 : -1)], 10);

                  if (connstate) {
                    result.push({
                      protocol: lineParts[0],
                      localAddress: localip,
                      localPort: localport,
                      peerAddress: peerip,
                      peerPort: peerport,
                      state: connstate,
                      pid,
                      process: getProcessName(processes, pid),
                    });
                  }
                }
              }

              if (callback) {
                callback(result);
              }

              resolve(result);
            });
          }
        });
      }

      if (platform._windows) {
        const cmd = 'netstat -nao';

        try {
          util.powerShell(cmd, options).then((stdout) => {
            if (stdout) {
              const lines = stdout.toString().split('\r\n');

              for (const line of lines) {
                const lineParts = line.trim().replaceAll(/ +/g, ' ').split(' ');

                if (lineParts.length >= 4) {
                  let localip = lineParts[1];
                  let localport = '';
                  const localaddress = lineParts[1].split(':');

                  if (localaddress.length > 1) {
                    localport = localaddress.at(-1) || '';
                    localaddress.pop();
                    localip = localaddress.join(':');
                  }

                  localip = localip.replaceAll('[', '').replaceAll(']', '');
                  let peerip = lineParts[2];
                  let peerport = '';
                  const peeraddress = lineParts[2].split(':');

                  if (peeraddress.length > 1) {
                    peerport = peeraddress.at(-1) || '';
                    peeraddress.pop();
                    peerip = peeraddress.join(':');
                  }

                  peerip = peerip.replaceAll('[', '').replaceAll(']', '');
                  const pid = util.toInt(lineParts[4]);
                  let connstate = lineParts[3];

                  if (connstate === 'HERGESTELLT') {
                    connstate = 'ESTABLISHED';
                  }

                  if (connstate.startsWith('ABH')) {
                    connstate = 'LISTEN';
                  }

                  if (connstate === 'SCHLIESSEN_WARTEN') {
                    connstate = 'CLOSE_WAIT';
                  }

                  if (connstate === 'WARTEND') {
                    connstate = 'TIME_WAIT';
                  }

                  if (connstate === 'SYN_GESENDET') {
                    connstate = 'SYN_SENT';
                  }

                  if (connstate === 'LISTENING') {
                    connstate = 'LISTEN';
                  }

                  if (connstate === 'SYN_RECEIVED') {
                    connstate = 'SYN_RECV';
                  }

                  if (connstate === 'FIN_WAIT_1') {
                    connstate = 'FIN_WAIT1';
                  }

                  if (connstate === 'FIN_WAIT_2') {
                    connstate = 'FIN_WAIT2';
                  }

                  if (lineParts[0].toLowerCase() !== 'udp' && connstate) {
                    result.push({
                      protocol: lineParts[0].toLowerCase(),
                      localAddress: localip,
                      localPort: localport,
                      peerAddress: peerip,
                      peerPort: peerport,
                      state: connstate,
                      pid,
                    });
                  } else if (lineParts[0].toLowerCase() === 'udp') {
                    result.push({
                      protocol: lineParts[0].toLowerCase(),
                      localAddress: localip,
                      localPort: localport,
                      peerAddress: peerip,
                      peerPort: peerport,
                      state: null,
                      pid: Number.parseInt(lineParts[3], 10),
                    });
                  }
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
      }
    });
  });
}
