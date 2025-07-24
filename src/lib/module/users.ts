import { exec, execSync } from 'child_process';

import * as util from '../util';
import { getPlatformFlagsFromOptions } from '../util/platform';

// Define interfaces
export interface UserOptions {
  platform?: string;
  [key: string]: any;
}

export interface UserInfo {
  user: string;
  tty: string;
  date: string;
  time: string;
  ip: string;
  command: string;
  sessionId?: string;
  sessionDetails?: SessionDetails;
  allSessions?: UserSession[];
  localUserDetails?: LocalUserDetails;
  loggedIn?: boolean; // Whether the user is currently logged in
}

export interface WhoUserInfo {
  user: string;
  tty: string;
  date: string;
  time: string;
  ip: string;
}

export interface WUserInfo {
  user: string;
  tty: string;
  ip: string;
  command: string;
}

export interface SessionDetails {
  domain: string;
  logonTime: string;
  authPackage: string;
  logonType: string;
  logonTypeDescription: string;
}

export interface UserSession {
  id: string;
  domain: string;
  logonTime: string;
  authPackage: string;
  logonType: string;
  logonTypeDescription: string;
  startTime: string;
  startTimeFormatted: string;
  endTime: string;
  endTimeFormatted: string;
  duration: string;
  status: string;
}

export interface QueryUserInfo {
  user: string;
  tty: string;
  date: string;
  time: string;
}

export interface LoginLogoffInfo {
  username: string;
  logonTime: string | null;
  logoffTime: string | null;
}

export interface SessionInfo {
  startTime: string;
  authPackage?: string;
  logonType?: string;
  logonTypeDescription?: string;
  endTime?: string | null;
}

export interface LoggedOnUserInfo {
  domain: string;
  user: string;
  authPackage?: string;
  logonType?: string;
  logonTypeDescription?: string;
  dateTime?: string;
}

export interface FormattedDate {
  isoString: string;
  formatted: string;
}

export interface LocalUserDetails {
  accountExpires?: string;
  description?: string;
  enabled?: boolean;
  fullName?: string;
  passwordChangeableDate?: string;
  passwordExpires?: string;
  passwordLastSet?: string;
  passwordRequired?: boolean;
  sid?: string;
  userMayChangePassword?: boolean;
  lastLogon?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Parse Linux user entries from who/w output
 * @param lines Output lines from who/w commands
 * @param phase Processing phase
 * @returns Array of user information objects
 */
function parseUsersLinux(lines: string[], phase: number): UserInfo[] {
  const result: UserInfo[] = [];
  const resultWho: WhoUserInfo[] = [];
  const resultW: Partial<WUserInfo> = {};
  let wFirst = true;
  const wHeader: string[] = [];
  const wPos: number[] = [];
  let whoLine: WhoUserInfo[] = [];

  let isWhopart = true;

  for (const line of lines) {
    if (line === '---') {
      isWhopart = false;
    } else {
      const l = line.replaceAll(/ +/g, ' ').split(' ');

      // who part
      if (isWhopart) {
        resultWho.push({
          user: l[0],
          tty: l[1],
          date: l[2],
          time: l[3],
          ip: l && l.length > 4 ? l[4].replaceAll('(', '').replaceAll(')', '') : '',
        });
      } else {
        // w part
        if (wFirst) {
          // header
          wHeader.push(...l);

          for (const item of wHeader) {
            wPos.push(line.indexOf(item));
          }

          wFirst = false;
        } else {
          // split by w_pos
          resultW.user = line.slice(wPos[0], wPos[1] - 1).trim();
          resultW.tty = line.slice(wPos[1], wPos[2] - 1).trim();
          resultW.ip = line
            .slice(wPos[2], wPos[3] - 1)
            .replaceAll('(', '')
            .replaceAll(')', '')
            .trim();
          resultW.command = line.slice(wPos[7], 1000).trim();
          // find corresponding 'who' line
          whoLine = resultWho.filter(
            (obj) => obj.user.slice(0, 8).trim() === resultW.user && obj.tty === resultW.tty,
          );

          if (whoLine.length === 1) {
            result.push({
              user: whoLine[0].user,
              tty: whoLine[0].tty,
              date: whoLine[0].date,
              time: whoLine[0].time,
              ip: whoLine[0].ip,
              command: resultW.command || '',
            });
          }
        }
      }
    }
  }

  if (result.length === 0 && phase === 2) {
    return resultWho.map((who) => ({
      user: who.user,
      tty: who.tty,
      date: who.date,
      time: who.time,
      ip: who.ip,
      command: '',
    }));
  }

  return result;
}

/**
 * Parse Darwin/macOS user entries from who/w output
 * @param lines Output lines from who/w commands
 * @returns Array of user information objects
 */
function parseUsersDarwin(lines: string[]): UserInfo[] {
  const result: UserInfo[] = [];
  const resultWho: WhoUserInfo[] = [];
  const resultW: Partial<WUserInfo> = {};
  let whoLine: WhoUserInfo[] = [];

  let isWhopart = true;

  for (const line of lines) {
    if (line === '---') {
      isWhopart = false;
    } else {
      const l = line.replaceAll(/ +/g, ' ').split(' ');

      // who part
      if (isWhopart) {
        const dt =
          String(new Date().getFullYear()) +
          '-' +
          (
            '0' +
            ('JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC'.indexOf(l[2].toUpperCase()) / 3 + 1)
          ).slice(-2) +
          '-' +
          ('0' + l[3]).slice(-2);

        try {
          if (new Date(dt) > new Date()) {
            const adjustedDt =
              String(new Date().getFullYear() - 1) +
              '-' +
              (
                '0' +
                ('JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC'.indexOf(l[2].toUpperCase()) / 3 + 1)
              ).slice(-2) +
              '-' +
              ('0' + l[3]).slice(-2);
            resultWho.push({
              user: l[0],
              tty: l[1],
              date: adjustedDt,
              time: l[4],
              ip: '',
            });
          } else {
            resultWho.push({
              user: l[0],
              tty: l[1],
              date: dt,
              time: l[4],
              ip: '',
            });
          }
        } catch {
          resultWho.push({
            user: l[0],
            tty: l[1],
            date: dt,
            time: l[4],
            ip: '',
          });
          util.noop();
        }
      } else {
        // w part
        // split by w_pos
        resultW.user = l[0];
        resultW.tty = l[1];
        resultW.ip = l[2] === '-' ? '' : l[2];
        resultW.command = l.slice(5, 1000).join(' ');
        // find corresponding 'who' line
        whoLine = resultWho.filter(
          (obj) =>
            obj.user.slice(0, 10) === resultW.user?.slice(0, 10) &&
            (obj.tty.slice(3, 1000) === resultW.tty || obj.tty === resultW.tty),
        );

        if (whoLine.length === 1) {
          result.push({
            user: whoLine[0].user,
            tty: whoLine[0].tty,
            date: whoLine[0].date,
            time: whoLine[0].time,
            ip: resultW.ip || '',
            command: resultW.command || '',
          });
        }
      }
    }
  }

  return result;
}

// Helper function to extract user ID from session ID
function getUserIdFromSessionId(sessionId: string): string {
  // This mapping needs to be established for your specific system
  // This is a simple implementation that assumes session ID = user ID
  return sessionId;
}

// Function to parse Microsoft JSON date format
function parseMsJsonDate(jsonDate: string | number): string {
  if (!jsonDate) {
    return '';
  }

  // Ensure jsonDate is a string before using match
  if (typeof jsonDate !== 'string') {
    return jsonDate.toString ? jsonDate.toString() : '';
  }

  // Check if it's in the Microsoft JSON date format: /Date(timestamp)/
  const matches = jsonDate.match(/\/Date\((\d+)\)\//);

  if (matches && matches[1]) {
    // Convert to ISO date string
    const date = new Date(Number.parseInt(matches[1], 10));

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return jsonDate;
}

/**
 * Parse Windows user information from query user command
 * @param lines Output lines from query user command
 * @returns Array of user information objects
 */
function parseWinUsersQuery(lines: string[]): QueryUserInfo[] {
  lines = lines.filter(Boolean);
  const result: QueryUserInfo[] = [];
  const header = lines[0];
  const headerDelimiter: number[] = [];

  if (header) {
    const start = header[0] === ' ' ? 1 : 0;
    headerDelimiter.push(start - 1);
    let nextSpace = 0;

    for (let i = start + 1; i < header.length; i++) {
      if (header[i] === ' ' && (header[i - 1] === ' ' || header[i - 1] === '.')) {
        nextSpace = i;
      } else {
        if (nextSpace) {
          headerDelimiter.push(nextSpace);
          nextSpace = 0;
        }
      }
    }

    // Add date and time to the query user results
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().slice(11, 19);

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const user = lines[i].slice(headerDelimiter[0] + 1, headerDelimiter[1]).trim() || '';
        const tty = lines[i].slice(headerDelimiter[1] + 1, headerDelimiter[2] - 2).trim() || '';

        result.push({
          user,
          tty,
          date: dateStr,
          time: timeStr,
        });
      }
    }
  }

  return result;
}

/**
 * Calculate duration between two timestamps
 * @param start Start timestamp
 * @param end End timestamp
 * @returns Formatted duration string
 */
function calculateDuration(start: string | number, end: string | number): string {
  if (!start) {
    return '';
  }

  try {
    let startDate: Date;
    let endDate: Date;

    // Handle Microsoft JSON date format pattern
    if (typeof start === 'string' && start.indexOf('/Date(') === 0) {
      const dateInteger = Number.parseInt(start.slice(6), 10);
      startDate = new Date(dateInteger);
    } else {
      startDate = new Date(start);
    }

    if (typeof end === 'string' && end.indexOf('/Date(') === 0) {
      const dateInteger = Number.parseInt(end.slice(6), 10);
      endDate = new Date(dateInteger);
    } else if (end) {
      endDate = new Date(end);
    } else {
      endDate = new Date();
    }

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return '';
    }

    // Calculate the difference in milliseconds
    const diff = endDate.getTime() - startDate.getTime();

    // Format the duration
    if (diff < 1000) {
      return '< 1 second';
    }

    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days} day${days > 1 ? 's' : ''}`);
    }

    if (hours > 0) {
      parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    }

    if (minutes > 0) {
      parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    }

    if (seconds > 0 && days === 0 && hours === 0) {
      parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    }

    return parts.join(', ');
  } catch {
    return '';
  }
}

/**
 * Format date value for display
 * @param dateValue Date value
 * @returns Formatted date object
 */
function formatDateDisplay(dateValue: string | number): FormattedDate {
  const result: FormattedDate = {
    isoString: '',
    formatted: '',
  };

  if (!dateValue) {
    return result;
  }

  try {
    let date: Date;

    // Handle Microsoft JSON date format pattern
    if (typeof dateValue === 'string' && dateValue.indexOf('/Date(') === 0) {
      const dateInteger = Number.parseInt(dateValue.slice(6), 10);
      date = new Date(dateInteger);
    } else {
      date = new Date(dateValue);
    }

    if (Number.isNaN(date.getTime())) {
      return result;
    }

    // ISO string format
    result.isoString = date.toISOString();

    // Human-readable format
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    // If it's today or yesterday, show a special format
    if (date.toDateString() === today.toDateString()) {
      result.formatted = `Today at ${date.toLocaleTimeString(undefined, options)}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      result.formatted = `Yesterday at ${date.toLocaleTimeString(undefined, options)}`;
    } else {
      // Full date and time
      result.formatted = date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    }

    return result;
  } catch {
    return result;
  }
}

/**
 * Check if two names fuzzy match
 * @param name1 First name
 * @param name2 Second name
 * @returns True if names fuzzy match
 */
function fuzzyMatch(name1: string, name2: string): boolean {
  name1 = name1.toLowerCase();
  name2 = name2.toLowerCase();
  let eq = 0;
  let len = name1.length;

  if (name2.length > len) {
    len = name2.length;
  }

  for (let i = 0; i < len; i++) {
    const c1 = name1[i] || '';
    const c2 = name2[i] || '';

    if (c1 === c2) {
      eq++;
    }
  }

  return len > 10 ? eq / len > 0.9 : len > 0 ? eq / len > 0.8 : false;
}

/**
 * Parse Windows user information from PowerShell output
 * @param userParts User data parts
 * @param userQuery Query user data
 * @returns Array of user information objects
 */
function parseWinUsers(
  userParts: string | string[],
  userQuery: QueryUserInfo[],
): Array<{ user: string; tty: string; date?: string; time?: string }> {
  const users: Array<{ user: string; tty: string; domain?: string; date?: string; time?: string }> =
    [];

  try {
    // Try to parse JSON data - there are two JSON objects here
    let userData: any = null;
    let sessionData: any = null;

    if (Array.isArray(userParts) && userParts.length >= 2) {
      try {
        userData = JSON.parse(userParts[0]);
      } catch {
        /* ignore */
      }

      try {
        sessionData = JSON.parse(userParts[1]);
      } catch {
        /* ignore */
      }
    } else if (typeof userParts === 'string') {
      try {
        const parts = userParts.split('\n');
        userData = JSON.parse(parts[0]);
        sessionData = JSON.parse(parts.length > 1 ? parts[1] : '{}');
      } catch {
        /* ignore */
      }
    }

    if (userData && userData.user && userData.domain) {
      // Single user response
      const sessionId = sessionData && sessionData.sessionid ? sessionData.sessionid : '';
      const quser = userQuery.filter((item) => fuzzyMatch(item.user, userData.user));

      // Copy date and time values from matching query user
      const dateStr = quser && quser[0] && quser[0].date ? quser[0].date : '';
      const timeStr = quser && quser[0] && quser[0].time ? quser[0].time : '';

      users.push({
        domain: userData.domain,
        user: userData.user,
        tty: quser && quser[0] && quser[0].tty ? quser[0].tty : sessionId,
        date: dateStr,
        time: timeStr,
      });
    }
  } catch {
    // Fallback to original text parsing if JSON parse fails
    if (Array.isArray(userParts)) {
      for (const user of userParts) {
        const lines = user.split('\r\n');

        const domain = util.getValue(lines, 'domain', ':', true);
        const username = util.getValue(lines, 'user', ':', true);
        const sessionid = util.getValue(lines, 'sessionid', ':', true);

        if (username) {
          const quser = userQuery.filter((item) => fuzzyMatch(item.user, username));
          // Copy date and time values from matching query user
          const dateStr = quser && quser[0] && quser[0].date ? quser[0].date : '';
          const timeStr = quser && quser[0] && quser[0].time ? quser[0].time : '';

          users.push({
            domain,
            user: username,
            tty: quser && quser[0] && quser[0].tty ? quser[0].tty : sessionid,
            date: dateStr,
            time: timeStr,
          });
        }
      }
    }
  }

  // If no users were found and we have query user data, use that
  if (users.length === 0 && userQuery && userQuery.length > 0) {
    for (const user of userQuery) {
      // Use date/time directly from query user if available
      users.push({
        user: user.user,
        tty: user.tty,
        date: user.date || '',
        time: user.time || '',
      });
    }
  }

  return users;
}

/**
 * Get logged in user information
 * @param options User options
 * @param callback Optional callback function
 * @returns Promise resolving to user information
 */
export function users(
  options: UserOptions = {},
  callback?: (data: UserInfo[]) => void,
): Promise<UserInfo[]> {
  const platform = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(() => {
      const result: UserInfo[] = [];

      // Linux
      if (platform._linux) {
        exec(
          'export LC_ALL=C; who --ips; echo "---"; w; unset LC_ALL | tail -n +2',
          (error, stdout) => {
            if (error) {
              if (callback) {
                callback(result);
              }

              resolve(result);
            } else {
              // lines / split
              let lines = stdout.toString().split('\n');
              const parsed = parseUsersLinux(lines, 1);

              if (parsed.length === 0) {
                exec('who; echo "---"; w | tail -n +2', (error, stdout) => {
                  if (error) {
                    if (callback) {
                      callback(result);
                    }

                    resolve(result);
                  } else {
                    // lines / split
                    lines = stdout.toString().split('\n');
                    const parsedFallback = parseUsersLinux(lines, 2);

                    if (callback) {
                      callback(parsedFallback);
                    }

                    resolve(parsedFallback);
                  }
                });
              } else {
                if (callback) {
                  callback(parsed);
                }

                resolve(parsed);
              }
            }
          },
        );
      }

      // FreeBSD, OpenBSD, NetBSD
      if (platform._freebsd || platform._openbsd || platform._netbsd) {
        exec('who; echo "---"; w -ih', (error, stdout) => {
          if (error) {
            if (callback) {
              callback(result);
            }

            resolve(result);
          } else {
            // lines / split
            const lines = stdout.toString().split('\n');
            const parsed = parseUsersDarwin(lines);

            if (callback) {
              callback(parsed);
            }

            resolve(parsed);
          }
        });
      }

      // SunOS
      if (platform._sunos) {
        exec('who; echo "---"; w -h', (error, stdout) => {
          if (error) {
            if (callback) {
              callback(result);
            }

            resolve(result);
          } else {
            // lines / split
            const lines = stdout.toString().split('\n');
            const parsed = parseUsersDarwin(lines);

            if (callback) {
              callback(parsed);
            }

            resolve(parsed);
          }
        });
      }

      // Darwin (macOS)
      if (platform._darwin) {
        exec('export LC_ALL=C; who; echo "---"; w -ih; unset LC_ALL', (error, stdout) => {
          if (error) {
            if (callback) {
              callback(result);
            }

            resolve(result);
          } else {
            // lines / split
            const lines = stdout.toString().split('\n');
            const parsed = parseUsersDarwin(lines);

            if (callback) {
              callback(parsed);
            }

            resolve(parsed);
          }
        });
      }

      // Windows
      if (platform._windows) {
        try {
          // Modified commands to output JSON with batching
          const batchSize = 250; // Number of items per batch
          let allSessions: any[] = [];
          let allLoggedOnUsers: any[] = [];
          let localUserData: any[] = [];

          const getSessionsBatched = (skip: number): Promise<void> =>
            new Promise((resolveSession) => {
              const sessionCmd = `Get-CimInstance Win32_LogonSession | Select-Object LogonId, StartTime | Select-Object -Skip ${skip} -First ${batchSize} | ConvertTo-Json -Compress`;
              util
                .powerShell(sessionCmd, options)
                .then((sessionData) => {
                  try {
                    const parsed = JSON.parse(sessionData.toString());
                    const items = Array.isArray(parsed) ? parsed : [parsed];

                    if (items.length > 0 && items[0] !== null) {
                      allSessions = [...allSessions, ...items];
                      // Continue with the next batch
                      getSessionsBatched(skip + batchSize).then(() => resolveSession());
                    } else {
                      resolveSession(); // No more data, finish
                    }
                  } catch {
                    // End of data or error parsing
                    resolveSession();
                  }
                })
                .catch(() => resolveSession());
            });

          const getLoggedOnUsersBatched = (skip: number): Promise<void> =>
            new Promise((resolveLogged) => {
              const loggedOnCmd = `Get-CimInstance Win32_LoggedOnUser | select antecedent,dependent | Select-Object -Skip ${skip} -First ${batchSize} | ConvertTo-Json -Compress`;
              util
                .powerShell(loggedOnCmd, options)
                .then((loggedData) => {
                  try {
                    const parsed = JSON.parse(loggedData.toString());
                    const items = Array.isArray(parsed) ? parsed : [parsed];

                    if (items.length > 0 && items[0] !== null) {
                      allLoggedOnUsers = [...allLoggedOnUsers, ...items];
                      // Continue with the next batch
                      getLoggedOnUsersBatched(skip + batchSize).then(() => resolveLogged());
                    } else {
                      resolveLogged(); // No more data, finish
                    }
                  } catch {
                    // End of data or error parsing
                    resolveLogged();
                  }
                })
                .catch(() => resolveLogged());
            });

          // First get all sessions and logged on users in batches
          Promise.all([getSessionsBatched(0), getLoggedOnUsersBatched(0)]).then(() => {
            // Get additional session details
            const sessionDetailsCmd = `$logonTypeMap = @{0 = 'System'; 2 = 'Interactive'; 3 = 'Network'; 4 = 'Batch'; 5 = 'Service'; 7 = 'Unlock'; 8 = 'NetworkCleartext'; 9 = 'NewCredentials'; 10 = 'RemoteInteractive'; 11 = 'CachedInteractive'; 12 = 'CachedRemoteInteractive'; 13 = 'CachedUnlock'}; Get-CimInstance Win32_LogonSession | ForEach-Object {$type = $_.LogonType; $typeDesc = if ($logonTypeMap.ContainsKey($type)) { $logonTypeMap[$type] } else { 'Unknown' }; $props = @{LogonId = $_.LogonId; AuthenticationPackage = $_.AuthenticationPackage; LogonType = $type; LogonTypeDesc = $typeDesc; StartTime = $_.StartTime;}; [PSCustomObject]$props} | ConvertTo-Json -Compress`;

            // Get logoff events from Windows Event Log
            const logoffEventsCmd = `try { $events = Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624,4634,4647} -MaxEvents 100 -ErrorAction Stop | Select-Object TimeCreated, Id, Properties; $logonEvents = @{}; $logoffEvents = @{}; foreach ($event in $events) { try { if ($event.Id -eq 4624) { $logonId = $event.Properties[7].Value.ToString(); $targetUser = $event.Properties[5].Value.ToString(); if (-not $logonEvents.ContainsKey($logonId)) { $logonEvents[$logonId] = @{ TimeCreated = $event.TimeCreated; UserName = $targetUser } } } elseif ($event.Id -eq 4634 -or $event.Id -eq 4647) { $logonId = $event.Properties[3].Value.ToString(); $targetUser = $event.Properties[1].Value.ToString(); $logoffEvents[$logonId] = @{ TimeCreated = $event.TimeCreated; UserName = $targetUser } } } catch { continue } }; $results = @(); foreach ($logonId in $logonEvents.Keys) { $entry = @{ LogonId = $logonId; UserName = $logonEvents[$logonId].UserName; LogonTime = $logonEvents[$logonId].TimeCreated; LogoffTime = if ($logoffEvents.ContainsKey($logonId)) { $logoffEvents[$logonId].TimeCreated } else { $null } }; $results += $entry }; foreach ($logonId in $logoffEvents.Keys) { if (-not $logonEvents.ContainsKey($logonId)) { $entry = @{ LogonId = $logonId; UserName = $logoffEvents[$logonId].UserName; LogonTime = $null; LogoffTime = $logoffEvents[$logonId].TimeCreated }; $results += $entry } }; $results | ConvertTo-Json -Compress } catch { Write-Output '[]' }`;

            // Add command to get local user data
            const localUserCmd = `Get-LocalUser | Select-Object * | ConvertTo-Json -Compress`;

            Promise.all([
              util.powerShell(sessionDetailsCmd, options),
              util.powerShell(logoffEventsCmd, options),
              util.powerShell(localUserCmd, options),
            ]).then(([sessionDetailsData, logoffEventsData, localUsersData]) => {
              // Process local user data
              try {
                const localUsers = JSON.parse(localUsersData.toString());
                localUserData = Array.isArray(localUsers) ? localUsers : [localUsers];
              } catch {
                localUserData = [];
              }

              // Now get the explorer processes (usually just one)
              const explorerCmd =
                '$process = (Get-CimInstance Win32_Process -Filter "name = \'explorer.exe\'"); Invoke-CimMethod -InputObject $process[0] -MethodName GetOwner | select user, domain | ConvertTo-Json -Compress; get-process -name explorer | select-object sessionid | ConvertTo-Json -Compress';
              util.powerShell(explorerCmd, options).then((explorerData) => {
                // Get query user data
                util.powerShell('query user', options).then((queryUserData) => {
                  // Process the collected data
                  if (allSessions.length > 0 && allLoggedOnUsers.length > 0) {
                    // Create sessions mapping with enhanced details
                    const sessions: Record<string, SessionInfo> = {};

                    for (const session of allSessions) {
                      if (session && session.LogonId) {
                        sessions[session.LogonId] = {
                          startTime: session.StartTime || '',
                        };
                      }
                    }

                    // Parse logoff events
                    const loginLogoffInfo: Record<string, LoginLogoffInfo> = {};

                    try {
                      const events = JSON.parse(logoffEventsData.toString());

                      if (Array.isArray(events)) {
                        for (const event of events) {
                          if (event && event.LogonId) {
                            loginLogoffInfo[event.LogonId] = {
                              username: event.UserName || '',
                              logonTime: event.LogonTime || null,
                              logoffTime: event.LogoffTime || null,
                            };
                          }
                        }
                      }
                    } catch {
                      // Ignore JSON parse error
                    }

                    // Add additional session details
                    try {
                      const sessionDetails = JSON.parse(sessionDetailsData.toString());
                      const detailsArray = Array.isArray(sessionDetails)
                        ? sessionDetails
                        : [sessionDetails];

                      for (const detail of detailsArray) {
                        if (detail && detail.LogonId) {
                          const id = String(detail.LogonId);

                          if (!sessions[id]) {
                            sessions[id] = {
                              startTime: '',
                            };
                          }

                          sessions[id].authPackage = detail.AuthenticationPackage || '';
                          sessions[id].logonType = detail.LogonType || '';

                          // Use the LogonTypeDesc directly from PowerShell if available
                          sessions[id].logonTypeDescription = detail.LogonTypeDesc || '';

                          if (detail.StartTime) {
                            sessions[id].startTime = detail.StartTime;
                          }

                          // Add logoff time if available
                          const userId = getUserIdFromSessionId(id);

                          if (userId && loginLogoffInfo[userId]) {
                            sessions[id].endTime = loginLogoffInfo[userId].logoffTime;
                          }
                        }
                      }
                    } catch {
                      // Ignore JSON parse error
                    }

                    // Create loggedons mapping
                    const loggedons: Record<string, LoggedOnUserInfo> = {};

                    for (const item of allLoggedOnUsers) {
                      if (item && item.dependent && item.antecedent) {
                        // Extract user and domain from antecedent string
                        const antecedentStr =
                          item.antecedent.CimInstanceProperties?.toString() || '';
                        const nameMatch = antecedentStr.match(/Name\s*=\s*"([^"]+)"/);
                        const domainMatch = antecedentStr.match(/Domain\s*=\s*"([^"]+)"/);

                        // Extract logon ID from dependent string
                        const dependentStr = item.dependent.CimInstanceProperties?.toString() || '';
                        const idMatch = dependentStr.match(/LogonId\s*=\s*"(\d+)"/);

                        const name = nameMatch ? nameMatch[1] : '';
                        const domain = domainMatch ? domainMatch[1] : '';
                        const id = idMatch ? idMatch[1] : '';

                        if (id) {
                          loggedons[id] = {
                            domain,
                            user: name,
                          };

                          // Add any available session details
                          if (sessions[id]) {
                            loggedons[id].authPackage = sessions[id].authPackage;
                            loggedons[id].logonType = sessions[id].logonType;
                            loggedons[id].logonTypeDescription = sessions[id].logonTypeDescription;
                          }
                        }
                      }
                    }

                    // Process explorer data
                    const userProcessData = explorerData || '';

                    // Process query user output - always text format
                    const queryUsers = parseWinUsersQuery(
                      typeof queryUserData === 'string'
                        ? queryUserData.split('\r\n')
                        : Array.isArray(queryUserData)
                          ? queryUserData
                          : [],
                    );

                    // Parse users from explorer data
                    let users: Array<{ user: string; tty: string; date?: string; time?: string }> =
                      [];

                    try {
                      users = parseWinUsers(userProcessData, queryUsers);
                    } catch {
                      users = parseWinUsers(
                        typeof userProcessData === 'string'
                          ? userProcessData.split(/\n\s*\n/)
                          : userProcessData || [],
                        queryUsers,
                      );
                    }

                    // Map date/time to each logged on user
                    for (const id in loggedons) {
                      if (Object.prototype.hasOwnProperty.call(loggedons, id)) {
                        const sessionData = Object.prototype.hasOwnProperty.call(sessions, id)
                          ? sessions[id]
                          : null;

                        if (loggedons[id] && sessionData && sessionData.startTime) {
                          loggedons[id].dateTime = parseMsJsonDate(sessionData.startTime);
                        }
                      }
                    }

                    // Create a map of local user details by username
                    const localUserMap: Record<string, LocalUserDetails> = {};

                    for (const localUser of localUserData) {
                      if (localUser && localUser.Name) {
                        localUserMap[localUser.Name.toLowerCase()] = {
                          accountExpires: localUser.AccountExpires,
                          description: localUser.Description,
                          enabled: localUser.Enabled,
                          fullName: localUser.FullName,
                          passwordChangeableDate: localUser.PasswordChangeableDate,
                          passwordExpires: localUser.PasswordExpires,
                          passwordLastSet: localUser.PasswordLastSet,
                          passwordRequired: localUser.PasswordRequired,
                          sid: localUser.SID,
                          userMayChangePassword: localUser.UserMayChangePassword,
                          lastLogon: localUser.LastLogon,
                          name: localUser.Name,
                        };
                      }
                    }

                    // Create final user list with date/time information
                    for (const user of users) {
                      let dateTime = '';
                      let matchedSessionId = '';
                      const allUserSessions: UserSession[] = [];

                      // Collect all sessions for this user
                      for (const id in loggedons) {
                        if (Object.prototype.hasOwnProperty.call(loggedons, id)) {
                          const loggedonUser = loggedons[id];

                          // Include sessions with exact or fuzzy name match
                          if (
                            loggedonUser.user === user.user ||
                            fuzzyMatch(loggedonUser.user, user.user)
                          ) {
                            const sessionData = Object.prototype.hasOwnProperty.call(sessions, id)
                              ? sessions[id]
                              : null;
                            const sessionTime = loggedonUser.dateTime || '';

                            // Keep track of the most recent session for primary sessionId/sessionDetails
                            if (!dateTime || dateTime < sessionTime) {
                              dateTime = sessionTime;
                              matchedSessionId = id;
                            }

                            // Add to all sessions array
                            const formattedStartTime = formatDateDisplay(
                              sessionData && sessionData.startTime ? sessionData.startTime : '',
                            );
                            const formattedEndTime = formatDateDisplay(
                              sessionData && sessionData.endTime ? sessionData.endTime : '',
                            );

                            allUserSessions.push({
                              id,
                              domain: loggedonUser.domain || '',
                              logonTime: sessionTime,
                              authPackage: loggedonUser.authPackage || '',
                              logonType: loggedonUser.logonType || '',
                              logonTypeDescription: loggedonUser.logonTypeDescription || '',
                              // Add detailed timing information
                              startTime: formattedStartTime.isoString,
                              startTimeFormatted: formattedStartTime.formatted,
                              endTime: formattedEndTime.isoString,
                              endTimeFormatted: formattedEndTime.formatted,
                              // Calculate duration
                              duration: calculateDuration(
                                sessionData && sessionData.startTime ? sessionData.startTime : '',
                                sessionData && sessionData.endTime ? sessionData.endTime : '',
                              ),
                              // Add status for clarity
                              status: sessionData && sessionData.endTime ? 'Ended' : 'Active',
                            });
                          }
                        }
                      }

                      // Sort sessions by date (most recent first)
                      allUserSessions.sort((a, b) => {
                        // Convert to dates for comparison if possible
                        let dateA = new Date(a.logonTime || 0);
                        let dateB = new Date(b.logonTime || 0);

                        // Handle invalid dates
                        if (Number.isNaN(dateA.getTime())) {
                          dateA = new Date(0);
                        }

                        if (Number.isNaN(dateB.getTime())) {
                          dateB = new Date(0);
                        }

                        return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
                      });

                      // If no direct match found, try using most recent session from allUserSessions
                      if (!dateTime && allUserSessions.length > 0) {
                        dateTime = allUserSessions[0].logonTime;
                        matchedSessionId = allUserSessions[0].id;
                      }

                      // If still no match, use the most recent session time from any user
                      if (!dateTime && Object.keys(sessions).length > 0) {
                        let latestTime = 0;
                        let latestId = '';

                        for (const id in sessions) {
                          if (Object.prototype.hasOwnProperty.call(sessions, id)) {
                            // Get the timestamp from startTime
                            let timestamp = 0;
                            const sessionData = sessions[id];

                            if (sessionData && sessionData.startTime) {
                              if (typeof sessionData.startTime === 'string') {
                                const matches = sessionData.startTime.match(/\/Date\((\d+)\)\//);

                                if (matches && matches[1]) {
                                  timestamp = Number.parseInt(matches[1], 10);
                                }
                              } else if (typeof sessionData.startTime === 'number') {
                                timestamp = sessionData.startTime;
                              }
                            }

                            if (timestamp > latestTime) {
                              latestTime = timestamp;
                              latestId = id;
                            }
                          }
                        }

                        if (latestId) {
                          const sessionData = sessions[latestId];
                          dateTime =
                            sessionData && sessionData.startTime
                              ? parseMsJsonDate(sessionData.startTime)
                              : '';
                          matchedSessionId = latestId;
                        }
                      }

                      let dateStr = '';
                      let timeStr = '';

                      // First try to use date/time from the user object directly
                      if (user.date && user.time) {
                        dateStr = user.date;
                        timeStr = user.time;
                      } else if (dateTime) {
                        try {
                          // For ISO dates, just extract the parts directly
                          if (dateTime.includes('T') && dateTime.includes('Z')) {
                            dateStr = dateTime.slice(0, 10);
                            timeStr = dateTime.slice(11, 19);
                          } else {
                            // Try to parse the date
                            const dateObj = new Date(dateTime);

                            if (Number.isNaN(dateObj.getTime())) {
                              // Handle invalid date format by trying to extract parts
                              if (typeof dateTime === 'string') {
                                // Try to extract date parts if it's in a standard format
                                const dateParts = dateTime.match(
                                  /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/,
                                );

                                if (dateParts) {
                                  dateStr = `${dateParts[1]}-${String(dateParts[2]).padStart(
                                    2,
                                    '0',
                                  )}-${String(dateParts[3]).padStart(2, '0')}`;
                                }

                                // Try to extract time parts
                                const timeParts = dateTime.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})/);

                                if (timeParts) {
                                  timeStr = `${String(timeParts[1]).padStart(2, '0')}:${String(
                                    timeParts[2],
                                  ).padStart(2, '0')}:${String(timeParts[3]).padStart(2, '0')}`;
                                }
                              }
                            } else {
                              dateStr = dateObj.toISOString().slice(0, 10);
                              timeStr = dateObj.toISOString().slice(11, 19);
                            }
                          }
                        } catch {
                          // In case of any error, leave date empty
                          dateStr = '';
                          timeStr = '';
                        }
                      }

                      // Find matching local user details
                      const localUserDetails =
                        localUserData.find(
                          (lu) =>
                            lu && lu.Name && lu.Name.toLowerCase() === user.user.toLowerCase(),
                        ) || undefined;

                      result.push({
                        user: user.user,
                        tty: user.tty,
                        date: dateStr,
                        time: timeStr,
                        ip: '',
                        command: '',
                        sessionId: matchedSessionId || '',
                        sessionDetails:
                          matchedSessionId && loggedons[matchedSessionId]
                            ? {
                                domain: loggedons[matchedSessionId].domain || '',
                                logonTime: loggedons[matchedSessionId].dateTime || '',
                                authPackage: loggedons[matchedSessionId].authPackage || '',
                                logonType: loggedons[matchedSessionId].logonType || '',
                                logonTypeDescription:
                                  loggedons[matchedSessionId].logonTypeDescription || '',
                              }
                            : {
                                domain: '',
                                logonTime: '',
                                authPackage: '',
                                logonType: '',
                                logonTypeDescription: '',
                              },
                        allSessions: allUserSessions,
                        localUserDetails,
                        loggedIn: dateTime !== '',
                      });
                    }
                  }

                  // If result is empty, use the query user data directly
                  if (result.length === 0 && queryUserData) {
                    const queryUsers = parseWinUsersQuery(
                      typeof queryUserData === 'string'
                        ? queryUserData.split('\r\n')
                        : Array.isArray(queryUserData)
                          ? queryUserData
                          : [],
                    );

                    if (queryUsers.length > 0) {
                      // Create date/time using ISO format
                      const now = new Date();
                      const dateStr = now.toISOString().slice(0, 10);
                      const timeStr = now.toISOString().slice(11, 19);

                      for (const user of queryUsers) {
                        // Find matching local user details
                        const localUserDetails =
                          localUserData.find(
                            (lu) =>
                              lu && lu.Name && lu.Name.toLowerCase() === user.user.toLowerCase(),
                          ) || undefined;

                        result.push({
                          user: user.user,
                          tty: user.tty,
                          date: dateStr,
                          time: timeStr,
                          ip: '',
                          command: '',
                          sessionId: '',
                          sessionDetails: {
                            domain: '',
                            logonTime: '',
                            authPackage: '',
                            logonType: '',
                            logonTypeDescription: '',
                          },
                          allSessions: [],
                          localUserDetails: localUserDetails
                            ? {
                                accountExpires: localUserDetails.AccountExpires,
                                description: localUserDetails.Description,
                                enabled: localUserDetails.Enabled,
                                fullName: localUserDetails.FullName,
                                passwordChangeableDate: localUserDetails.PasswordChangeableDate,
                                passwordExpires: localUserDetails.PasswordExpires,
                                passwordLastSet: localUserDetails.PasswordLastSet,
                                passwordRequired: localUserDetails.PasswordRequired,
                                sid: localUserDetails.SID,
                                userMayChangePassword: localUserDetails.UserMayChangePassword,
                                lastLogon: localUserDetails.LastLogon,
                                name: localUserDetails.Name,
                              }
                            : undefined,
                          loggedIn: false,
                        });
                      }
                    }
                  }

                  // After processing logged-in users, add all local users that weren't included yet
                  if (localUserData && localUserData.length > 0) {
                    // Create a set of usernames already in the result
                    const existingUsers = new Set(result.map((user) => user.user.toLowerCase()));

                    // Add local users that aren't in the result yet
                    for (const localUser of localUserData) {
                      if (
                        localUser &&
                        localUser.Name &&
                        !existingUsers.has(localUser.Name.toLowerCase())
                      ) {
                        result.push({
                          user: localUser.Name,
                          tty: '',
                          date: '',
                          time: '',
                          ip: '',
                          command: '',
                          sessionId: '',
                          sessionDetails: {
                            domain: '',
                            logonTime: '',
                            authPackage: '',
                            logonType: '',
                            logonTypeDescription: '',
                          },
                          allSessions: [],
                          localUserDetails: {
                            accountExpires: localUser.AccountExpires,
                            description: localUser.Description,
                            enabled: localUser.Enabled,
                            fullName: localUser.FullName,
                            passwordChangeableDate: localUser.PasswordChangeableDate,
                            passwordExpires: localUser.PasswordExpires,
                            passwordLastSet: localUser.PasswordLastSet,
                            passwordRequired: localUser.PasswordRequired,
                            sid: localUser.SID,
                            userMayChangePassword: localUser.UserMayChangePassword,
                            lastLogon: localUser.LastLogon,
                            name: localUser.Name,
                          },
                          loggedIn: false,
                        });
                      }
                    }
                  }

                  if (callback) {
                    callback(result);
                  }

                  resolve(result);
                });
              });
            });
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
