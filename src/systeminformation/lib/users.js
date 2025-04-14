'use strict';
// @ts-check
// ==================================================================================
// users.js
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 11. Users/Sessions
// ----------------------------------------------------------------------------------

const exec = require('child_process').exec;
const util = require('./util');

let _platform = process.platform;
let _linux, _darwin, _windows, _freebsd, _openbsd, _netbsd, _sunos;

function setPlatform(platform) {
  _platform = platform || process.platform;
  _linux = (_platform === 'linux' || _platform === 'android');
  _darwin = (_platform === 'darwin');
  _windows = (_platform === 'win32');
  _freebsd = (_platform === 'freebsd');
  _openbsd = (_platform === 'openbsd');
  _netbsd = (_platform === 'netbsd');
  _sunos = (_platform === 'sunos');
}

setPlatform(_platform);

function parseUsersLinux(lines, phase) {
  let result = [];
  let result_who = [];
  let result_w = {};
  let w_first = true;
  let w_header = [];
  let w_pos = [];
  let who_line = {};

  let is_whopart = true;
  lines.forEach(function (line) {
    if (line === '---') {
      is_whopart = false;
    } else {
      let l = line.replace(/ +/g, ' ').split(' ');

      // who part
      if (is_whopart) {
        result_who.push({
          user: l[0],
          tty: l[1],
          date: l[2],
          time: l[3],
          ip: (l && l.length > 4) ? l[4].replace(/\(/g, '').replace(/\)/g, '') : ''
        });
      } else {
        // w part
        if (w_first) {    // header
          w_header = l;
          w_header.forEach(function (item) {
            w_pos.push(line.indexOf(item));
          });
          w_first = false;
        } else {
          // split by w_pos
          result_w.user = line.substring(w_pos[0], w_pos[1] - 1).trim();
          result_w.tty = line.substring(w_pos[1], w_pos[2] - 1).trim();
          result_w.ip = line.substring(w_pos[2], w_pos[3] - 1).replace(/\(/g, '').replace(/\)/g, '').trim();
          result_w.command = line.substring(w_pos[7], 1000).trim();
          // find corresponding 'who' line
          who_line = result_who.filter(function (obj) {
            return (obj.user.substring(0, 8).trim() === result_w.user && obj.tty === result_w.tty);
          });
          if (who_line.length === 1) {
            result.push({
              user: who_line[0].user,
              tty: who_line[0].tty,
              date: who_line[0].date,
              time: who_line[0].time,
              ip: who_line[0].ip,
              command: result_w.command
            });
          }
        }
      }
    }
  });
  if (result.length === 0 && phase === 2) {
    return result_who;
  } else {
    return result;
  }
}

function parseUsersDarwin(lines) {
  let result = [];
  let result_who = [];
  let result_w = {};
  let who_line = {};

  let is_whopart = true;
  lines.forEach(function (line) {
    if (line === '---') {
      is_whopart = false;
    } else {
      let l = line.replace(/ +/g, ' ').split(' ');

      // who part
      if (is_whopart) {
        let dt = ('' + new Date().getFullYear()) + '-' + ('0' + ('JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC'.indexOf(l[2].toUpperCase()) / 3 + 1)).slice(-2) + '-' + ('0' + l[3]).slice(-2);
        try {
          if (new Date(dt) > new Date) {
            dt = ('' + (new Date().getFullYear() - 1)) + '-' + ('0' + ('JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC'.indexOf(l[2].toUpperCase()) / 3 + 1)).slice(-2) + '-' + ('0' + l[3]).slice(-2);
          }
        } catch {
          util.noop();
        }
        result_who.push({
          user: l[0],
          tty: l[1],
          date: dt,
          time: l[4],
        });
      } else {
        // w part
        // split by w_pos
        result_w.user = l[0];
        result_w.tty = l[1];
        result_w.ip = (l[2] !== '-') ? l[2] : '';
        result_w.command = l.slice(5, 1000).join(' ');
        // find corresponding 'who' line
        who_line = result_who.filter(function (obj) {
          return (obj.user.substring(0, 10) === result_w.user.substring(0, 10) && (obj.tty.substring(3, 1000) === result_w.tty || obj.tty === result_w.tty));
        });
        if (who_line.length === 1) {
          result.push({
            user: who_line[0].user,
            tty: who_line[0].tty,
            date: who_line[0].date,
            time: who_line[0].time,
            ip: result_w.ip,
            command: result_w.command
          });
        }
      }
    }
  });
  return result;
}

function users(options = {}, callback) {
  if (options.platform) setPlatform(options.platform);

  return new Promise((resolve) => {
    process.nextTick(() => {
      let result = [];

      // linux
      if (_linux) {
        exec('export LC_ALL=C; who --ips; echo "---"; w; unset LC_ALL | tail -n +2', function (error, stdout) {
          if (!error) {
            // lines / split
            let lines = stdout.toString().split('\n');
            result = parseUsersLinux(lines, 1);
            if (result.length === 0) {
              exec('who; echo "---"; w | tail -n +2', function (error, stdout) {
                if (!error) {
                  // lines / split
                  lines = stdout.toString().split('\n');
                  result = parseUsersLinux(lines, 2);
                }
                if (callback) { callback(result); }
                resolve(result);
              });
            } else {
              if (callback) { callback(result); }
              resolve(result);
            }
          } else {
            if (callback) { callback(result); }
            resolve(result);
          }
        });
      }
      if (_freebsd || _openbsd || _netbsd) {
        exec('who; echo "---"; w -ih', function (error, stdout) {
          if (!error) {
            // lines / split
            let lines = stdout.toString().split('\n');
            result = parseUsersDarwin(lines);
          }
          if (callback) { callback(result); }
          resolve(result);
        });
      }
      if (_sunos) {
        exec('who; echo "---"; w -h', function (error, stdout) {
          if (!error) {
            // lines / split
            let lines = stdout.toString().split('\n');
            result = parseUsersDarwin(lines);
          }
          if (callback) { callback(result); }
          resolve(result);
        });
      }

      if (_darwin) {
        exec('export LC_ALL=C; who; echo "---"; w -ih; unset LC_ALL', function (error, stdout) {
          if (!error) {
            // lines / split
            let lines = stdout.toString().split('\n');
            result = parseUsersDarwin(lines);
          }
          if (callback) { callback(result); }
          resolve(result);
        });
      }
      if (_windows) {
        try {
          // Modified commands to output JSON with batching
          const batchSize = 250; // Number of items per batch
          let allSessions = [];
          let allLoggedOnUsers = [];
          
          const getSessionsBatched = (skip) => {
            return new Promise((resolveSession) => {
              const sessionCmd = `Get-CimInstance Win32_LogonSession | Select-Object LogonId, StartTime | Select-Object -Skip ${skip} -First ${batchSize} | ConvertTo-Json -Compress`;
              util.powerShell(sessionCmd, options).then((sessionData) => {
                try {
                  const parsed = JSON.parse(sessionData);
                  const items = Array.isArray(parsed) ? parsed : [parsed];
                  if (items.length > 0 && items[0] !== null) {
                    allSessions = allSessions.concat(items);
                    // Continue with the next batch
                    getSessionsBatched(skip + batchSize).then(() => resolveSession());
                  } else {
                    resolveSession(); // No more data, finish
                  }
                } catch (e) {
                  // End of data or error parsing
                  resolveSession();
                }
              }).catch(() => resolveSession());
            });
          };
          
          const getLoggedOnUsersBatched = (skip) => {
            return new Promise((resolveLogged) => {
              const loggedOnCmd = `Get-CimInstance Win32_LoggedOnUser | select antecedent,dependent | Select-Object -Skip ${skip} -First ${batchSize} | ConvertTo-Json -Compress`;
              util.powerShell(loggedOnCmd, options).then((loggedData) => {
                try {
                  const parsed = JSON.parse(loggedData);
                  const items = Array.isArray(parsed) ? parsed : [parsed];
                  if (items.length > 0 && items[0] !== null) {
                    allLoggedOnUsers = allLoggedOnUsers.concat(items);
                    // Continue with the next batch
                    getLoggedOnUsersBatched(skip + batchSize).then(() => resolveLogged());
                  } else {
                    resolveLogged(); // No more data, finish
                  }
                } catch (e) {
                  // End of data or error parsing
                  resolveLogged();
                }
              }).catch(() => resolveLogged());
            });
          };
          
          // First get all sessions and logged on users in batches
          Promise.all([
            getSessionsBatched(0),
            getLoggedOnUsersBatched(0)
          ]).then(() => {
            // Get additional session details
            const sessionDetailsCmd = `$logonTypeMap = @{0 = 'System'; 2 = 'Interactive'; 3 = 'Network'; 4 = 'Batch'; 5 = 'Service'; 7 = 'Unlock'; 8 = 'NetworkCleartext'; 9 = 'NewCredentials'; 10 = 'RemoteInteractive'; 11 = 'CachedInteractive'; 12 = 'CachedRemoteInteractive'; 13 = 'CachedUnlock'}; Get-CimInstance Win32_LogonSession | ForEach-Object {$type = $_.LogonType; $typeDesc = if ($logonTypeMap.ContainsKey($type)) { $logonTypeMap[$type] } else { 'Unknown' }; $props = @{LogonId = $_.LogonId; AuthenticationPackage = $_.AuthenticationPackage; LogonType = $type; LogonTypeDesc = $typeDesc; StartTime = $_.StartTime;}; [PSCustomObject]$props} | ConvertTo-Json -Compress`;
            
            // Get logoff events from Windows Event Log
            const logoffEventsCmd = `try { $events = Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624,4634,4647} -MaxEvents 100 -ErrorAction Stop | Select-Object TimeCreated, Id, Properties; $logonEvents = @{}; $logoffEvents = @{}; foreach ($event in $events) { try { if ($event.Id -eq 4624) { $logonId = $event.Properties[7].Value.ToString(); $targetUser = $event.Properties[5].Value.ToString(); if (-not $logonEvents.ContainsKey($logonId)) { $logonEvents[$logonId] = @{ TimeCreated = $event.TimeCreated; UserName = $targetUser } } } elseif ($event.Id -eq 4634 -or $event.Id -eq 4647) { $logonId = $event.Properties[3].Value.ToString(); $targetUser = $event.Properties[1].Value.ToString(); $logoffEvents[$logonId] = @{ TimeCreated = $event.TimeCreated; UserName = $targetUser } } } catch { continue } }; $results = @(); foreach ($logonId in $logonEvents.Keys) { $entry = @{ LogonId = $logonId; UserName = $logonEvents[$logonId].UserName; LogonTime = $logonEvents[$logonId].TimeCreated; LogoffTime = if ($logoffEvents.ContainsKey($logonId)) { $logoffEvents[$logonId].TimeCreated } else { $null } }; $results += $entry }; foreach ($logonId in $logoffEvents.Keys) { if (-not $logonEvents.ContainsKey($logonId)) { $entry = @{ LogonId = $logonId; UserName = $logoffEvents[$logonId].UserName; LogonTime = $null; LogoffTime = $logoffEvents[$logonId].TimeCreated }; $results += $entry } }; $results | ConvertTo-Json -Compress } catch { Write-Output '[]' }`;
            
            Promise.all([
              util.powerShell(sessionDetailsCmd, options),
              util.powerShell(logoffEventsCmd, options)
            ]).then(([sessionDetailsData, logoffEventsData]) => {
              // Now get the explorer processes (usually just one)
              const explorerCmd = '$process = (Get-CimInstance Win32_Process -Filter "name = \'explorer.exe\'"); Invoke-CimMethod -InputObject $process[0] -MethodName GetOwner | select user, domain | ConvertTo-Json -Compress; get-process -name explorer | select-object sessionid | ConvertTo-Json -Compress';
              util.powerShell(explorerCmd, options).then((explorerData) => {
                // Get query user data
                util.powerShell('query user', options).then((queryUserData) => {
                  // Process the collected data
                  if (allSessions.length && allLoggedOnUsers.length) {
                    // Create sessions mapping with enhanced details
                    let sessions = {};
                    allSessions.forEach(session => {
                      if (session && session.LogonId) {
                        sessions[session.LogonId] = {
                          startTime: session.StartTime || ''
                        };
                      }
                    });
                    
                    // Parse logoff events
                    let loginLogoffInfo = {};
                    try {
                      const events = JSON.parse(logoffEventsData);
                      if (Array.isArray(events)) {
                        events.forEach(event => {
                          if (event && event.LogonId) {
                            loginLogoffInfo[event.LogonId] = {
                              username: event.UserName || '',
                              logonTime: event.LogonTime || null,
                              logoffTime: event.LogoffTime || null
                            };
                          }
                        });
                      }
                    } catch (e) {
                      // Ignore JSON parse error
                    }
                    
                    // Add additional session details
                    try {
                      const sessionDetails = JSON.parse(sessionDetailsData);
                      const detailsArray = Array.isArray(sessionDetails) ? sessionDetails : [sessionDetails];
                      
                      detailsArray.forEach(detail => {
                        if (detail && detail.LogonId) {
                          const id = String(detail.LogonId);
                          if (!sessions[id]) {
                            sessions[id] = {};
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
                      });
                    } catch (e) {
                      // Ignore JSON parse error
                    }
                    
                    // Helper function to extract user ID from session ID
                    function getUserIdFromSessionId(sessionId) {
                      // This mapping needs to be established for your specific system
                      // This is a simple implementation that assumes session ID = user ID
                      return sessionId;
                    }
                    
                    // Function to parse Microsoft JSON date format
                    function parseMsJsonDate(jsonDate) {
                      if (!jsonDate) return '';
                      
                      // Ensure jsonDate is a string before using match
                      if (typeof jsonDate !== 'string') {
                        return jsonDate.toString ? jsonDate.toString() : '';
                      }
                      
                      // Check if it's in the Microsoft JSON date format: /Date(timestamp)/
                      const matches = jsonDate.match(/\/Date\((\d+)\)\//);
                      if (matches && matches[1]) {
                        // Convert to ISO date string
                        const date = new Date(parseInt(matches[1], 10));
                        if (!isNaN(date.getTime())) {
                          return date.toISOString();
                        }
                      }
                      return jsonDate;
                    }

                    // Create loggedons mapping
                    let loggedons = {};
                    allLoggedOnUsers.forEach(item => {
                      if (item && item.dependent && item.antecedent) {
                        // Extract user and domain from antecedent string
                        const antecedentStr = item.antecedent.CimInstanceProperties.toString();
                        const nameMatch = antecedentStr.match(/Name\s*=\s*"([^"]+)"/);
                        const domainMatch = antecedentStr.match(/Domain\s*=\s*"([^"]+)"/);
                        
                        // Extract logon ID from dependent string
                        const dependentStr = item.dependent.CimInstanceProperties.toString();
                        const idMatch = dependentStr.match(/LogonId\s*=\s*\"([0-9]+)\"/);
                        
                        const name = nameMatch ? nameMatch[1] : '';
                        const domain = domainMatch ? domainMatch[1] : '';
                        const id = idMatch ? idMatch[1] : '';
                        
                        if (id) {
                          loggedons[id] = {
                            domain,
                            user: name
                          };
                          // Add any available session details
                          if (sessions[id]) {
                            loggedons[id].authPackage = sessions[id].authPackage;
                            loggedons[id].logonType = sessions[id].logonType;
                            loggedons[id].logonTypeDescription = sessions[id].logonTypeDescription;
                          }
                        }
                      }
                    });
                    
                    // Process explorer data
                    const userProcessData = explorerData || '';
                    
                    // Process query user output - always text format
                    const queryUser = parseWinUsersQuery((queryUserData || '').split('\r\n'));
                    
                    // Parse users from explorer data
                    let users = [];
                    try {
                      users = parseWinUsers(userProcessData, queryUser);
                    } catch (e) {
                      users = parseWinUsers((userProcessData || '').split(/\n\s*\n/), queryUser);
                    }
                    
                    // Map date/time to each logged on user
                    for (let id in loggedons) {
                      if ({}.hasOwnProperty.call(loggedons, id)) {
                        const sessionData = {}.hasOwnProperty.call(sessions, id) ? sessions[id] : null;
                        loggedons[id].dateTime = sessionData && sessionData.startTime ? 
                          parseMsJsonDate(sessionData.startTime) : '';
                      }
                    }
                    
                    // Create final user list with date/time information
                    users.forEach(user => {
                      let dateTime = '';
                      let matchedSessionId = '';
                      let allUserSessions = [];
                      
                      // Collect all sessions for this user
                      for (let id in loggedons) {
                        if ({}.hasOwnProperty.call(loggedons, id)) {
                          const loggedonUser = loggedons[id];
                          
                          // Include sessions with exact or fuzzy name match
                          if (loggedonUser.user === user.user || fuzzyMatch(loggedonUser.user, user.user)) {
                            const sessionData = {}.hasOwnProperty.call(sessions, id) ? sessions[id] : null;
                            const sessionTime = loggedonUser.dateTime || '';
                            
                            // Keep track of the most recent session for primary sessionId/sessionDetails
                            if (!dateTime || dateTime < sessionTime) {
                              dateTime = sessionTime;
                              matchedSessionId = id;
                            }
                            
                            // Add to all sessions array
                            const formattedStartTime = formatDateDisplay(sessionData && sessionData.startTime ? sessionData.startTime : '');
                            const formattedEndTime = formatDateDisplay(sessionData && sessionData.endTime ? sessionData.endTime : '');
                            
                            allUserSessions.push({
                              id: id,
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
                                sessionData && sessionData.endTime ? sessionData.endTime : ''
                              ),
                              // Add status for clarity
                              status: sessionData && sessionData.endTime ? 'Ended' : 'Active'
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
                        if (isNaN(dateA.getTime())) dateA = new Date(0);
                        if (isNaN(dateB.getTime())) dateB = new Date(0);
                        
                        return dateB - dateA; // Descending order (newest first)
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
                        
                        for (let id in sessions) {
                          if ({}.hasOwnProperty.call(sessions, id)) {
                            // Get the timestamp from startTime
                            let timestamp = 0;
                            const sessionData = sessions[id];
                            
                            if (sessionData && sessionData.startTime) {
                              if (typeof sessionData.startTime === 'string') {
                                const matches = sessionData.startTime.match(/\/Date\((\d+)\)\//);
                                if (matches && matches[1]) {
                                  timestamp = parseInt(matches[1], 10);
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
                          dateTime = sessionData && sessionData.startTime ? 
                            parseMsJsonDate(sessionData.startTime) : '';
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
                            dateStr = dateTime.substring(0, 10);
                            timeStr = dateTime.substring(11, 19);
                          } else {
                            // Try to parse the date
                            const dateObj = new Date(dateTime);
                            if (!isNaN(dateObj.getTime())) {
                              dateStr = dateObj.toISOString().substring(0, 10);
                              timeStr = dateObj.toISOString().substring(11, 19);
                            } else {
                              // Handle invalid date format by trying to extract parts
                              if (typeof dateTime === 'string') {
                                // Try to extract date parts if it's in a standard format
                                const dateParts = dateTime.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
                                if (dateParts) {
                                  dateStr = `${dateParts[1]}-${String(dateParts[2]).padStart(2, '0')}-${String(dateParts[3]).padStart(2, '0')}`;
                                }
                                
                                // Try to extract time parts
                                const timeParts = dateTime.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})/);
                                if (timeParts) {
                                  timeStr = `${String(timeParts[1]).padStart(2, '0')}:${String(timeParts[2]).padStart(2, '0')}:${String(timeParts[3]).padStart(2, '0')}`;
                                }
                              }
                            }
                          }
                        } catch (e) {
                          // In case of any error, leave date empty
                          dateStr = '';
                          timeStr = '';
                        }
                      }
      
                      result.push({
                        user: user.user,
                        tty: user.tty,
                        date: dateStr,
                        time: timeStr,
                        ip: '',
                        command: '',
                        sessionId: matchedSessionId || '',
                        sessionDetails: matchedSessionId && loggedons[matchedSessionId] ? {
                          domain: loggedons[matchedSessionId].domain || '',
                          logonTime: loggedons[matchedSessionId].dateTime || '',
                          authPackage: loggedons[matchedSessionId].authPackage || '',
                          logonType: loggedons[matchedSessionId].logonType || '',
                          logonTypeDescription: loggedons[matchedSessionId].logonTypeDescription || ''
                        } : {},
                        allSessions: allUserSessions
                      });
                    });
                  }
                  
                  // If result is empty, use the query user data directly
                  if (result.length === 0 && queryUserData) {
                    const queryUsers = parseWinUsersQuery((queryUserData || '').split('\r\n'));
                    if (queryUsers.length > 0) {
                      // Create date/time using ISO format
                      const now = new Date();
                      const dateStr = now.toISOString().substring(0, 10);
                      const timeStr = now.toISOString().substring(11, 19);
                      
                      queryUsers.forEach(user => {
                        result.push({
                          user: user.user,
                          tty: user.tty,
                          date: dateStr,
                          time: timeStr,
                          ip: '',
                          command: '',
                          sessionId: '',
                          sessionDetails: {},
                          allSessions: []
                        });
                      });
                    }
                  }
                  
                  if (callback) { callback(result); }
                  resolve(result);
                });
              });
            });
          });
        } catch (e) {
          if (callback) { callback(result); }
          resolve(result);
        }
      }
    });
  });
}

function fuzzyMatch(name1, name2) {
  name1 = name1.toLowerCase();
  name2 = name2.toLowerCase();
  let eq = 0;
  let len = name1.length;
  if (name2.length > len) { len = name2.length; }

  for (let i = 0; i < len; i++) {
    const c1 = name1[i] || '';
    const c2 = name2[i] || '';
    if (c1 === c2) { eq++; }
  }
  return (len > 10 ? eq / len > 0.9 : (len > 0 ? eq / len > 0.8 : false));
}

function parseWinUsers(userParts, userQuery) {
  const users = [];
  
  try {
    // Try to parse JSON data - there are two JSON objects here
    let userData = null;
    let sessionData = null;
    
    if (Array.isArray(userParts) && userParts.length >= 2) {
      try { userData = JSON.parse(userParts[0]); } catch(e) { /* ignore */ }
      try { sessionData = JSON.parse(userParts[1]); } catch(e) { /* ignore */ }
    } else if (typeof userParts === 'string') {
      try { 
        const parts = userParts.split('\n');
        userData = JSON.parse(parts[0]); 
        sessionData = JSON.parse(parts.length > 1 ? parts[1] : '{}');
      } catch(e) { /* ignore */ }
    }
    
    if (userData && userData.user && userData.domain) {
      // Single user response
      const sessionId = sessionData && sessionData.sessionid ? sessionData.sessionid : '';
      const quser = userQuery.filter(item => fuzzyMatch(item.user, userData.user));
      
      // Copy date and time values from matching query user
      const dateStr = quser && quser[0] && quser[0].date ? quser[0].date : '';
      const timeStr = quser && quser[0] && quser[0].time ? quser[0].time : '';
      
      users.push({
        domain: userData.domain,
        user: userData.user,
        tty: quser && quser[0] && quser[0].tty ? quser[0].tty : sessionId,
        date: dateStr,
        time: timeStr
      });
    }
  } catch (e) {
    // Fallback to original text parsing if JSON parse fails
    if (Array.isArray(userParts)) {
      userParts.forEach(user => {
        const lines = user.split('\r\n');

        const domain = util.getValue(lines, 'domain', ':', true);
        const username = util.getValue(lines, 'user', ':', true);
        const sessionid = util.getValue(lines, 'sessionid', ':', true);

        if (username) {
          const quser = userQuery.filter(item => fuzzyMatch(item.user, username));
          // Copy date and time values from matching query user
          const dateStr = quser && quser[0] && quser[0].date ? quser[0].date : '';
          const timeStr = quser && quser[0] && quser[0].time ? quser[0].time : '';
          
          users.push({
            domain,
            user: username,
            tty: quser && quser[0] && quser[0].tty ? quser[0].tty : sessionid,
            date: dateStr,
            time: timeStr
          });
        }
      });
    }
  }
  
  // If no users were found and we have query user data, use that
  if (users.length === 0 && userQuery && userQuery.length) {
    userQuery.forEach(user => {
      // Use date/time directly from query user if available
      users.push({
        user: user.user,
        tty: user.tty,
        date: user.date || '',
        time: user.time || '',
        ip: '',
        command: '',
        sessionId: '',
        sessionDetails: {},
        allSessions: []
      });
    });
  }

  return users;
}

function parseWinUsersQuery(lines) {
  lines = lines.filter(item => item);
  let result = [];
  const header = lines[0];
  const headerDelimiter = [];
  if (header) {
    const start = (header[0] === ' ') ? 1 : 0;
    headerDelimiter.push(start - 1);
    let nextSpace = 0;
    for (let i = start + 1; i < header.length; i++) {
      if (header[i] === ' ' && ((header[i - 1] === ' ') || (header[i - 1] === '.'))) {
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
    const dateStr = now.toISOString().substring(0, 10);
    const timeStr = now.toISOString().substring(11, 19);
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const user = lines[i].substring(headerDelimiter[0] + 1, headerDelimiter[1]).trim() || '';
        const tty = lines[i].substring(headerDelimiter[1] + 1, headerDelimiter[2] - 2).trim() || '';
        result.push({
          user: user,
          tty: tty,
          date: dateStr,
          time: timeStr
        });
      }
    }
  }
  return result;
}

function calculateDuration(start, end) {
  try {
    let startTime = null;
    let endTime = null;
    
    // Parse start time
    if (start) {
      if (typeof start === 'string' && start.includes('/Date(')) {
        const matches = start.match(/\/Date\((\d+)\)\//);
        if (matches && matches[1]) {
          startTime = new Date(parseInt(matches[1], 10));
        }
      } else {
        startTime = new Date(start);
      }
    }
    
    // Parse end time or use current time for active sessions
    if (end) {
      endTime = new Date(end);
    } else if (startTime) {
      // Session still active, use current time
      endTime = new Date();
    }
    
    // Calculate duration in seconds if both times are valid
    if (startTime && endTime && !isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
      const durationMs = endTime - startTime;
      const durationSec = Math.floor(durationMs / 1000);
      
      // Format as HH:MM:SS
      const hours = Math.floor(durationSec / 3600);
      const minutes = Math.floor((durationSec % 3600) / 60);
      const seconds = durationSec % 60;
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  } catch (e) {
    // Ignore errors in duration calculation
  }
  
  return '';
}

// Add to all sessions array
function formatDateDisplay(dateValue) {
  let result = {
    isoString: '',
    formatted: ''
  };
  
  try {
    let dateObj = null;
    
    // Handle Microsoft JSON date format
    if (typeof dateValue === 'string' && dateValue.includes('/Date(')) {
      const matches = dateValue.match(/\/Date\((\d+)\)\//);
      if (matches && matches[1]) {
        dateObj = new Date(parseInt(matches[1], 10));
      }
    } else if (dateValue) {
      // Handle other date formats
      dateObj = new Date(dateValue);
    }
    
    if (dateObj && !isNaN(dateObj.getTime())) {
      // ISO format (for compatibility)
      result.isoString = dateObj.toISOString();
      
      // User-friendly format: YYYY-MM-DD HH:MM:SS
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      
      result.formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  } catch (e) {
    // Ignore date formatting errors
  }
  
  return result;
}

exports.users = users;
