// ==================================================================================
// processes.ts
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 10. Processes
// ----------------------------------------------------------------------------------
import { exec } from 'child_process';
import path from 'path';
import * as util from '../util';
import { getPlatformFlagsFromOptions } from '../util/platform';
const _processes_cpu = {
    all: 0,
    all_utime: 0,
    all_stime: 0,
    list: {},
    ms: 0,
    result: {},
};
const _winStatusValues = {
    0: 'unknown',
    1: 'other',
    2: 'ready',
    3: 'running',
    4: 'blocked',
    5: 'suspended blocked',
    6: 'suspended ready',
    7: 'terminated',
    8: 'stopped',
    9: 'growing',
};
// Helper function to parse Unix time format
function parseTimeUnix(time) {
    let result = time;
    const parts = time.replaceAll(/ +/g, ' ').split(' ');
    if (parts.length === 5) {
        result =
            parts[4] +
                '-' +
                ('0' +
                    ('JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC'.indexOf(parts[1].toUpperCase()) / 3 + 1)).slice(-2) +
                '-' +
                ('0' + parts[2]).slice(-2) +
                ' ' +
                parts[3];
    }
    return result;
}
// Helper function to parse elapsed time
function parseElapsedTime(etime) {
    let current = new Date();
    current = new Date(current.getTime() - current.getTimezoneOffset() * 60_000);
    const elapsed = etime.split('-');
    const timeIndex = elapsed.length - 1;
    const days = timeIndex > 0 ? Number.parseInt(elapsed[timeIndex - 1], 10) : 0;
    const timeStr = elapsed[timeIndex].split(':');
    const hours = timeStr.length === 3 ? Number.parseInt(timeStr[0] || '0', 10) : 0;
    const mins = Number.parseInt(timeStr[timeStr.length === 3 ? 1 : 0] || '0', 10);
    const secs = Number.parseInt(timeStr[timeStr.length === 3 ? 2 : 1] || '0', 10);
    const ms = (((days * 24 + hours) * 60 + mins) * 60 + secs) * 1000;
    let res = new Date(current.getTime());
    let result = res.toISOString().slice(0, 10) + ' ' + res.toISOString().slice(11, 19);
    try {
        res = new Date(current.getTime() - ms);
        result = res.toISOString().slice(0, 10) + ' ' + res.toISOString().slice(11, 19);
    }
    catch {
        util.noop();
    }
    return result;
}
// Helper function to calculate Windows process stats
function calcProcStatWin(procStat, all, _cpu_old) {
    // calc
    let cpuu = 0;
    let cpus = 0;
    if (_cpu_old.all > 0 && _cpu_old.list[procStat.pid]) {
        cpuu = ((procStat.utime - _cpu_old.list[procStat.pid].utime) / (all - _cpu_old.all)) * 100; // user
        cpus = ((procStat.stime - _cpu_old.list[procStat.pid].stime) / (all - _cpu_old.all)) * 100; // system
    }
    else {
        cpuu = (procStat.utime / all) * 100; // user
        cpus = (procStat.stime / all) * 100; // system
    }
    return {
        pid: procStat.pid,
        utime: procStat.utime,
        stime: procStat.stime,
        cpuu: cpuu > 0 ? cpuu : 0,
        cpus: cpus > 0 ? cpus : 0,
    };
}
// Helper function to parse /proc/stat in Linux
function parseProcStat(line) {
    const parts = line.replaceAll(/ +/g, ' ').split(' ');
    const user = parts.length >= 2 ? Number.parseInt(parts[1], 10) : 0;
    const nice = parts.length >= 3 ? Number.parseInt(parts[2], 10) : 0;
    const system = parts.length >= 4 ? Number.parseInt(parts[3], 10) : 0;
    const idle = parts.length >= 5 ? Number.parseInt(parts[4], 10) : 0;
    const iowait = parts.length >= 6 ? Number.parseInt(parts[5], 10) : 0;
    const irq = parts.length >= 7 ? Number.parseInt(parts[6], 10) : 0;
    const softirq = parts.length >= 8 ? Number.parseInt(parts[7], 10) : 0;
    const steal = parts.length >= 9 ? Number.parseInt(parts[8], 10) : 0;
    const guest = parts.length >= 10 ? Number.parseInt(parts[9], 10) : 0;
    const guest_nice = parts.length >= 11 ? Number.parseInt(parts[10], 10) : 0;
    return user + nice + system + idle + iowait + irq + softirq + steal + guest + guest_nice;
}
// Helper function to calculate Linux process stats
function calcProcStatLinux(line, all, _cpu_old) {
    const statparts = line.replaceAll(/ +/g, ' ').split(')');
    if (statparts.length >= 2) {
        const parts = statparts[1].split(' ');
        if (parts.length >= 16) {
            const pid = Number.parseInt(statparts[0].split(' ')[0], 10);
            const utime = Number.parseInt(parts[12], 10);
            const stime = Number.parseInt(parts[13], 10);
            const cutime = Number.parseInt(parts[14], 10);
            const cstime = Number.parseInt(parts[15], 10);
            // calc
            let cpuu = 0;
            let cpus = 0;
            if (_cpu_old.all > 0 && _cpu_old.list[pid]) {
                cpuu =
                    ((utime + cutime - _cpu_old.list[pid].utime - _cpu_old.list[pid].cutime) /
                        (all - _cpu_old.all)) *
                        100; // user
                cpus =
                    ((stime + cstime - _cpu_old.list[pid].stime - _cpu_old.list[pid].cstime) /
                        (all - _cpu_old.all)) *
                        100; // system
            }
            else {
                cpuu = ((utime + cutime) / all) * 100; // user
                cpus = ((stime + cstime) / all) * 100; // system
            }
            return {
                pid,
                utime,
                stime,
                cutime,
                cstime,
                cpuu,
                cpus,
            };
        }
    }
    return {
        pid: 0,
        utime: 0,
        stime: 0,
        cutime: 0,
        cstime: 0,
        cpuu: 0,
        cpus: 0,
    };
}
// Helper function to get process name from command
function getName(command = '') {
    let result = command.split(' ')[0];
    if (result.slice(-1) === ':') {
        result = result.slice(0, Math.max(0, result.length - 1));
    }
    if (result.slice(0, 1) !== '[') {
        const parts = result.split('/');
        result = Number.isNaN(Number.parseInt(parts.at(-1) || '', 10)) ? parts.at(-1) || '' : parts[0];
    }
    return result;
}
// Function to parse a command string
function parseCommand(fullCommand) {
    let command = '';
    let params = '';
    let path = '';
    if (!fullCommand) {
        return { command, params, path };
    }
    // Check for paths
    if (fullCommand[0] === '/') {
        const parts = fullCommand.split(' ');
        path = parts[0];
        command = path.split('/').pop() || '';
        params = parts.slice(1).join(' ');
    }
    else {
        const parts = fullCommand.split(' ');
        command = parts[0];
        params = parts.slice(1).join(' ');
    }
    return { command, params, path };
}
// Function to get state name from state code
function getStateFromCode(code) {
    if (!code) {
        return 'unknown';
    }
    switch (code) {
        case 'R': {
            return 'running';
        }
        case 'S': {
            return 'sleeping';
        }
        case 'T': {
            return 'stopped';
        }
        case 'W': {
            return 'paging';
        }
        case 'X': {
            return 'dead';
        }
        case 'Z': {
            return 'zombie';
        }
        case 'D': {
            return 'disk-sleep';
        }
        case 'U': {
            return 'blocked';
        }
        default: {
            return 'unknown';
        }
    }
}
/**
 * Get the path to the PowerShell script
 */
function getProcessesScriptPath() {
    return path.resolve(__dirname, '../../powershell/processes.ps1');
}
/**
 * Helper function to fetch all processes with pagination
 */
async function fetchAllProcesses(options = {}) {
    const allProcesses = [];
    let skip = 0;
    const batchSize = 100;
    let totalCount = 0;
    let hasMoreData = true;
    // Get the script path
    const scriptPath = getProcessesScriptPath();
    // Keep fetching until we have all processes
    while (hasMoreData) {
        try {
            // Execute the script with pagination parameters
            options.batch = {
                skip,
                batchSize,
            };
            const batchResult = await util.executeScript(scriptPath, options);
            // Parse the batch results
            const batchData = JSON.parse(Array.isArray(batchResult) ? batchResult.join('') : batchResult);
            // Extract the items and metadata
            const items = batchData.Items || [];
            totalCount = batchData.TotalCount || 0;
            // Add processes from this batch to our collection
            if (Array.isArray(items)) {
                allProcesses.push(...items);
            }
            // Determine if we need to fetch more batches
            skip += batchSize;
            if (skip >= totalCount || items.length === 0) {
                hasMoreData = false;
            }
        }
        catch (error) {
            console.error(`Error fetching processes batch starting at ${skip}:`, error);
            hasMoreData = false; // Stop on error
            break;
        }
    }
    return allProcesses;
}
// Helper function to parse a process line
function parseProcessLine(line, parsedHead, platformFlags) {
    let offset = 0;
    let offset2 = 0;
    // Helper to extract column value
    function getColumnValue(i, defaultVal = '') {
        if (!parsedHead[i]) {
            return defaultVal;
        }
        offset = offset2;
        offset2 = line.slice(parsedHead[i].to + offset).indexOf(' ');
        offset2 = offset2 >= 0 ? offset2 : 10_000;
        return line.slice(parsedHead[i].from + offset, parsedHead[i].to + offset2);
    }
    try {
        // Extract basic process information
        const pid = Number.parseInt(getColumnValue(1), 10);
        const ppid = Number.parseInt(getColumnValue(2), 10);
        const cpu = Number.parseFloat(getColumnValue(3)) || 0;
        const mem = Number.parseFloat(getColumnValue(4)) || 0;
        const priority = Number.parseInt(getColumnValue(5), 10);
        const vsz = Number.parseInt(getColumnValue(6), 10);
        const rss = Number.parseInt(getColumnValue(7), 10);
        const nice = Number.parseInt(getColumnValue(8), 10);
        // Get elapsed time and convert to start time
        const etime = getColumnValue(9);
        const started = parseElapsedTime(etime);
        // Get state and convert to readable format
        const stateCode = getColumnValue(10).trim()[0] || '';
        const state = getStateFromCode(stateCode);
        // Get TTY, user and command info
        let tty = getColumnValue(11).trim();
        if (tty === '?' || tty === '??') {
            tty = '';
        }
        const user = getColumnValue(12).trim();
        const fullCommand = getColumnValue(13).trim();
        // Parse command parts
        let command = '';
        let params = '';
        let cmdPath = '';
        if (fullCommand) {
            const { command: cmd, params: cmdParams, path: cmdPth } = parseCommand(fullCommand);
            command = cmd;
            params = cmdParams;
            cmdPath = cmdPth;
        }
        // Return the structured process info
        return {
            pid,
            parentPid: ppid,
            name: getName(command),
            cpu,
            cpuu: 0,
            cpus: 0,
            mem,
            priority,
            memVsz: vsz,
            memRss: rss,
            nice,
            started,
            state,
            tty,
            user,
            command,
            params,
            path: cmdPath,
            // Additional properties for CPU calculation
            utime: 0,
            stime: 0,
        };
    }
    catch {
        return null;
    }
}
// Function to calculate CPU stats for Linux processes
async function calculateLinuxCPUStats(result) {
    return new Promise((resolve) => {
        // Prepare command to get process stats
        let cmd = 'cat /proc/stat | grep "cpu "';
        // Add commands to get stats for each PID
        for (const proc of result.list) {
            if (proc.pid) {
                cmd += `;cat /proc/${proc.pid}/stat`;
            }
        }
        // Execute the command
        exec(cmd, { maxBuffer: 1024 * 20_000 }, (error, stdout) => {
            if (!error) {
                const lines = stdout.toString().split('\n');
                const all = parseProcStat(lines.shift() || '');
                // Process each line for CPU stats
                for (const line of lines) {
                    if (line) {
                        const procStats = calcProcStatLinux(line, all, _processes_cpu);
                        if (procStats.pid) {
                            // Find the process in the result list
                            const listPos = result.list.findIndex((e) => e.pid === procStats.pid);
                            if (listPos >= 0) {
                                result.list[listPos].cpu += procStats.cpuu + procStats.cpus;
                                result.list[listPos].cpuu = procStats.cpuu;
                                result.list[listPos].cpus = procStats.cpus;
                                result.list[listPos].utime = procStats.utime;
                                result.list[listPos].stime = procStats.stime;
                            }
                        }
                    }
                }
            }
            resolve(result);
        });
    });
}
// Helper function to get processes on Windows
async function getWindowsProcesses(options, result) {
    try {
        // Get all processes using our new paginated function
        const processes = await fetchAllProcesses(options);
        if (!processes || processes.length === 0) {
            return result;
        }
        // Calculate CPU usage and populate the result
        result.list = processes;
        result.all = processes.length;
        result.running = processes.filter((p) => p.state === 'running').length;
        result.blocked = processes.filter((p) => p.state === 'blocked').length;
        result.unknown = processes.filter((p) => p.state === 'unknown').length;
        result.sleeping = result.all - result.running - result.blocked - result.unknown;
        // Now that we have process data, calculate CPU statistics
        let allcpuu = 0;
        let allcpus = 0;
        const list_new = {};
        // Sum up all CPU times
        for (const proc of processes) {
            if (proc.utime && proc.stime) {
                allcpuu += Number(proc.utime);
                allcpus += Number(proc.stime);
            }
        }
        // Calculate percentages for each process
        for (const proc of processes) {
            if (proc.utime && proc.stime) {
                const procStat = {
                    pid: proc.pid,
                    utime: Number(proc.utime),
                    stime: Number(proc.stime),
                };
                const resultProcess = calcProcStatWin(procStat, allcpuu + allcpus, _processes_cpu);
                proc.cpu = resultProcess.cpuu + resultProcess.cpus;
                proc.cpuu = resultProcess.cpuu;
                proc.cpus = resultProcess.cpus;
                proc.utime = resultProcess.utime;
                proc.stime = resultProcess.stime;
                // Save values for next calculation
                list_new[proc.pid] = {
                    cpuu: resultProcess.cpuu,
                    cpus: resultProcess.cpus,
                    utime: resultProcess.utime,
                    stime: resultProcess.stime,
                };
            }
        }
        // Store values for next run
        _processes_cpu.all = allcpuu + allcpus;
        _processes_cpu.all_utime = allcpuu;
        _processes_cpu.all_stime = allcpus;
        _processes_cpu.list = { ...list_new };
        _processes_cpu.ms = Date.now();
        _processes_cpu.result = { ...result };
        return result;
    }
    catch (error) {
        console.error('Error getting Windows processes:', error);
        return result;
    }
}
// Helper function for Unix-like systems
async function getUnixProcesses(platformFlags, result) {
    return new Promise((resolve) => {
        // Build appropriate command for the platform
        let cmd = '';
        // Build appropriate command for the platform
        if (platformFlags._linux) {
            cmd =
                'export LC_ALL=C; ps -axo pid:11,ppid:11,pcpu:6,pmem:6,pri:5,vsz:11,rss:11,ni:5,etime:30,state:5,tty:15,user:20,command; unset LC_ALL';
        }
        else if (platformFlags._freebsd || platformFlags._openbsd || platformFlags._netbsd) {
            cmd =
                'export LC_ALL=C; ps -axo pid,ppid,pcpu,pmem,pri,vsz,rss,ni,etime,state,tty,user,command; unset LC_ALL';
        }
        else if (platformFlags._darwin) {
            cmd =
                'ps -axo pid,ppid,pcpu,pmem,pri,vsz=temp_title_1,rss=temp_title_2,nice,etime=temp_title_3,state,tty,user,command -r';
        }
        else if (platformFlags._sunos) {
            cmd = 'ps -Ao pid,ppid,pcpu,pmem,pri,vsz,rss,nice,stime,s,tty,user,comm';
        }
        // Execute the command
        if (cmd) {
            exec(cmd, { maxBuffer: 1024 * 20_000 }, (error, stdout) => {
                if (error) {
                    resolve(result);
                    return;
                }
                // Parse the output
                const lines = stdout.toString().split('\n');
                if (lines.length > 1) {
                    const head = lines[0];
                    const parsedHead = util.parseHead([head]);
                    lines.shift();
                    // Process each line into result
                    for (const line of lines) {
                        if (line.trim() !== '') {
                            const processInfo = parseProcessLine(line, parsedHead, platformFlags);
                            if (processInfo) {
                                result.list.push(processInfo);
                            }
                        }
                    }
                    // Update summary counts
                    result.all = result.list.length;
                    result.running = result.list.filter((e) => e.state === 'running').length;
                    result.blocked = result.list.filter((e) => e.state === 'blocked').length;
                    result.sleeping = result.list.filter((e) => e.state === 'sleeping').length;
                    // For Linux, calculate additional CPU stats
                    if (platformFlags._linux) {
                        calculateLinuxCPUStats(result).then(resolve);
                        return;
                    }
                }
                resolve(result);
            });
        }
        else {
            resolve(result);
        }
    });
}
// Main function to get process information
export function processes(options = {}, callback) {
    const platformFlags = getPlatformFlagsFromOptions(options);
    // Initialize result object
    const result = {
        all: 0,
        running: 0,
        blocked: 0,
        sleeping: 0,
        unknown: 0,
        list: [],
    };
    return new Promise((resolve) => {
        process.nextTick(() => {
            // First, check for valid platform
            if (Object.keys(platformFlags).length === 0) {
                if (callback) {
                    callback(result);
                }
                resolve(result);
                return;
            }
            if (platformFlags._windows) {
                // Get Windows processes
                getWindowsProcesses(options, result)
                    .then((resultData) => {
                    if (callback) {
                        callback(resultData);
                    }
                    resolve(resultData);
                })
                    .catch(() => {
                    resolve(result);
                });
            }
            else if (platformFlags._linux ||
                platformFlags._freebsd ||
                platformFlags._openbsd ||
                platformFlags._netbsd ||
                platformFlags._darwin ||
                platformFlags._sunos) {
                // Get Unix-like processes
                getUnixProcesses(platformFlags, result)
                    .then((resultData) => {
                    if (callback) {
                        callback(resultData);
                    }
                    resolve(resultData);
                })
                    .catch(() => {
                    resolve(result);
                });
            }
            else {
                // Unsupported platform
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
        });
    });
}
