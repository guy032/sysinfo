// ==================================================================================
// services.ts
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 10. Services
// ----------------------------------------------------------------------------------

import { exec, execSync } from 'child_process';
import path from 'path';

import * as util from './util';
import { getPlatformFlagsFromOptions } from './util/platform';

// Define options interface for processes functions
export interface ProcessesOptions {
  winrm?: any;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  platform?: string;
  [key: string]: any;
}

// Define interfaces for services information
export interface ServiceInfo {
  name: string;
  running: boolean;
  startmode: string;
  pids?: number[];
  cpu?: number;
  mem?: number;
  path?: string;
}

// Internal CPU tracking for services
const _services_cpu = {
  all: 0,
  all_utime: 0,
  all_stime: 0,
  list: {} as Record<string, any>,
  ms: 0,
  result: {} as Record<string, any>,
};

// Helper function to parse /proc/stat in Linux
function parseProcStat(line: string): { all: number; idle: number } {
  const parts = line.replaceAll(/ +/g, ' ').split(' ');
  const idle = Number.parseInt(parts[4], 10);

  const all = parts
    .slice(1)
    .map((val) => Number.parseInt(val, 10))
    .reduce((prev, curr) => prev + curr, 0);

  return {
    all,
    idle,
  };
}

// Helper function to calculate CPU stats in Linux
function calcProcStatLinux(
  line: string,
  all: { all: number; idle: number },
  _services_cpu: any,
): any {
  const statparts = line.replaceAll(/ +/g, ' ').split(' ');
  const pid = statparts[0];

  if (pid && _services_cpu.list[pid]) {
    const proctime = Number.parseInt(statparts[13], 10) + Number.parseInt(statparts[14], 10);
    const starttime = Number.parseInt(statparts[21], 10);
    const utime = Number.parseInt(statparts[13], 10);
    const stime = Number.parseInt(statparts[14], 10);
    const cutime = Number.parseInt(statparts[15], 10);
    const cstime = Number.parseInt(statparts[16], 10);

    // time diff in seconds
    const seconds = _services_cpu.ms / 1000;

    // calc
    if (proctime && all.all) {
      _services_cpu.list[pid].cpuu = ((utime - _services_cpu.list[pid].utime) * 100) / all.all;
      _services_cpu.list[pid].cpus = ((stime - _services_cpu.list[pid].stime) * 100) / all.all;
    } else {
      _services_cpu.list[pid].cpuu = 0;
      _services_cpu.list[pid].cpus = 0;
    }

    const processUptime = 0;

    return {
      pid,
      utime,
      stime,
      cutime,
      cstime,
      cpuu: _services_cpu.list[pid].cpuu,
      cpus: _services_cpu.list[pid].cpus,
      starttime,
      processUptime,
    };
  }

  return {
    pid: 0,
    cpuu: 0,
    cpus: 0,
    utime: 0,
    stime: 0,
    cutime: 0,
    cstime: 0,
  };
}

/**
 * Get the path to the PowerShell script
 */
function getServicesScriptPath(): string {
  return path.resolve(__dirname, '../powershell/services.ps1');
}

/**
 * Helper function to fetch all services with pagination
 */
async function fetchAllServices(
  options: ProcessesOptions = {},
  serviceNames: string[] = [],
): Promise<ServiceInfo[]> {
  const allServices: ServiceInfo[] = [];
  let skip = 0;
  const batchSize = 100;
  let totalCount = 0;
  let hasMoreData = true;

  // Get the script path
  const scriptPath = getServicesScriptPath();

  // Keep fetching until we have all services
  while (hasMoreData) {
    try {
      // Execute the script with pagination parameters
      options.batch = {
        skip,
        batchSize,
        serviceNames: serviceNames.join(','),
      };
      const batchResult = await util.executeScript(scriptPath, options);

      // Parse the batch results
      const batchData = JSON.parse(Array.isArray(batchResult) ? batchResult.join('') : batchResult);

      // Extract the items and metadata
      const items = batchData.Items || [];
      totalCount = batchData.TotalCount || 0;

      // Add services from this batch to our collection
      if (Array.isArray(items)) {
        allServices.push(...items);
      }

      // Determine if we need to fetch more batches
      skip += batchSize;

      if (skip >= totalCount || items.length === 0) {
        hasMoreData = false;
      }
    } catch (error) {
      console.error(`Error fetching services batch starting at ${skip}:`, error);
      hasMoreData = false; // Stop on error
      break;
    }
  }

  return allServices;
}

/**
 * Get service names for Linux/Unix systems
 */
function getLinuxServicesNames(srvString: string): string[] {
  const srvs: string[] = [];

  try {
    const tmpsrv = execSync(
      'systemctl --all --type=service --no-legend 2> /dev/null',
      util.execOptsLinux,
    )
      .toString()
      .split('\n');

    for (const s of tmpsrv) {
      const name = s.split('.service')[0];

      if (name && !s.includes(' not-found ')) {
        srvs.push(name.trim());
      }
    }

    return srvs;
  } catch {
    try {
      let srvString = '';
      const tmpsrv = execSync('service --status-all 2> /dev/null', util.execOptsLinux)
        .toString()
        .split('\n');

      for (const s of tmpsrv) {
        const parts = s.split(']');

        if (parts.length === 2) {
          srvString += (srvString === '' ? '' : '|') + parts[1].trim();
        }
      }

      return srvString.split('|');
    } catch {
      try {
        const srvStr = execSync('ls /etc/init.d/ -m 2> /dev/null', util.execOptsLinux)
          .toString()
          .split('\n')
          .join('');
        let srvString = '';

        if (srvStr) {
          const tmpsrv = srvStr.split(',');

          for (const s of tmpsrv) {
            const name = s.trim();

            if (name) {
              srvString += (srvString === '' ? '' : '|') + name;
            }
          }

          return srvString.split('|');
        }
      } catch {
        // Do nothing
      }

      return [];
    }
  }
}

/**
 * Process service information for Linux/Unix
 */
function processUnixServiceInfo(stdout: string, srvs: string[], platformFlags: any): ServiceInfo[] {
  const result: ServiceInfo[] = [];
  const lines = stdout.replaceAll(/ +/g, ' ').replaceAll(/,+/g, '.').split('\n');

  for (const srv of srvs) {
    const ps = platformFlags._darwin
      ? lines.filter((e) => e.toLowerCase().includes(srv))
      : lines.filter(
          (e) =>
            e.toLowerCase().includes(' ' + srv.toLowerCase() + ':') ||
            e.toLowerCase().includes('/' + srv.toLowerCase()),
        );

    const pids: number[] = [];

    for (const p of ps) {
      const pid = p.trim().split(' ')[2];

      if (pid) {
        pids.push(Number.parseInt(pid, 10));
      }
    }

    result.push({
      name: srv,
      running: ps.length > 0,
      startmode: '',
      pids,
      cpu: Number.parseFloat(
        ps.reduce((pv, cv) => pv + Number.parseFloat(cv.trim().split(' ')[0]), 0).toFixed(2),
      ),
      mem: Number.parseFloat(
        ps.reduce((pv, cv) => pv + Number.parseFloat(cv.trim().split(' ')[1]), 0).toFixed(2),
      ),
    });
  }

  return result;
}

/**
 * Calculate accurate CPU usage for Linux services
 */
function calculateLinuxCpuUsage(result: ServiceInfo[]): Promise<ServiceInfo[]> {
  return new Promise((resolve) => {
    // Build command to get process stats
    let cmd = 'cat /proc/stat | grep "cpu "';

    for (const element of result) {
      if (element.pids) {
        for (const pid of element.pids) {
          cmd += `;cat /proc/${pid}/stat`;
        }
      }
    }

    exec(cmd, { maxBuffer: 1024 * 20_000 }, (error, stdout) => {
      if (error) {
        resolve(result);

        return;
      }

      const curr_processes = stdout.toString().split('\n');
      // first line (all - /proc/stat)
      const all = parseProcStat(curr_processes.shift() || '');

      // Process each line of stats
      const list_new: Record<string, any> = {};

      for (const element of curr_processes) {
        if (!element) {
          continue;
        }

        const procStats = calcProcStatLinux(element, all, _services_cpu);

        if (!procStats.pid) {
          continue;
        }

        // Find the service that owns this PID
        let listPos = -1;

        for (const [i, element_] of result.entries()) {
          if (!element_.pids) {
            continue;
          }

          for (const pid of element_.pids) {
            if (pid === Number.parseInt(procStats.pid as string, 10)) {
              listPos = i;
              break;
            }
          }

          if (listPos >= 0) {
            break;
          }
        }

        // Add CPU usage to the service
        if (listPos >= 0 && listPos < result.length) {
          const svc = result[listPos];
          const cpuValue = (procStats.cpuu as number) + (procStats.cpus as number);
          svc.cpu = (svc.cpu || 0) + cpuValue;
        }

        // Save values for future calculations
        list_new[procStats.pid as string] = {
          cpuu: procStats.cpuu,
          cpus: procStats.cpus,
          utime: procStats.utime,
          stime: procStats.stime,
          cutime: procStats.cutime,
          cstime: procStats.cstime,
        };
      }

      // Store values for next calculation
      _services_cpu.all = all.all;
      _services_cpu.list = { ...list_new };
      _services_cpu.ms = Date.now() - _services_cpu.ms;
      _services_cpu.result = { ...result };

      resolve(result);
    });
  });
}

/**
 * Handle service discovery for Unix-like systems
 */
async function getUnixServices(srvs: string[], platformFlags: any): Promise<ServiceInfo[]> {
  // macOS doesn't support * service enumeration
  if (platformFlags._darwin && srvs.length === 1 && srvs[0] === '*') {
    return [];
  }

  // Find the args for process listing
  const args = platformFlags._darwin
    ? ['-caxo', 'pcpu,pmem,pid,command']
    : ['-axo', 'pcpu,pmem,pid,command'];

  // Execute PS command
  const stdout = await util.execSafe('ps', args);

  if (!stdout) {
    // Try simpler approach
    const simpleArgs = ['-o', 'comm'];
    const simpleOut = await util.execSafe('ps', simpleArgs);

    if (simpleOut) {
      const lines = simpleOut.replaceAll(/ +/g, ' ').replaceAll(/,+/g, '.').split('\n');

      return srvs.map((srv) => ({
        name: srv,
        running: lines.some((e) => e.includes(srv)),
        startmode: '',
      }));
    }

    return srvs.map((srv) => ({
      name: srv,
      running: false,
      startmode: '',
    }));
  }

  // Process results from PS command
  const result = processUnixServiceInfo(stdout, srvs, platformFlags);

  // For Linux, calculate accurate CPU usage
  if (platformFlags._linux) {
    return calculateLinuxCpuUsage(result);
  }

  return result;
}

/**
 * Get services information
 * @param options - Options for retrieving service information
 * @param srv - Comma separated service names or * for all services
 * @param callback - Optional callback function
 * @returns Promise resolving to an array of service information
 */
export function services(
  options: ProcessesOptions = {},
  srv: string | ((data: ServiceInfo[]) => void) = '*',
  callback?: (data: ServiceInfo[]) => void,
): Promise<ServiceInfo[]> {
  const platformFlags = getPlatformFlagsFromOptions(options);

  // fallback - if only callback is given
  if (typeof srv === 'function') {
    callback = srv;
    srv = '*';
  }

  return new Promise((resolve) => {
    process.nextTick(() => {
      if (typeof srv !== 'string') {
        if (callback) {
          callback([]);
        }

        return resolve([]);
      }

      // Normalize service names
      let srvString = srv.trim().toLowerCase().replaceAll(', ', '|').replaceAll(/,+/g, '|');

      if (srvString === '') {
        srvString = '*';
      }

      if (util.isPrototypePolluted() && srvString !== '*') {
        srvString = '------';
      }

      // Get array of service names
      let srvs = srvString.split('|');
      const result: ServiceInfo[] = [];

      // Handle platform-specific logic
      const handleComplete = (serviceResults: ServiceInfo[]) => {
        if (callback) {
          callback(serviceResults);
        }

        resolve(serviceResults);
      };

      // For Linux/Unix systems
      if (
        platformFlags._linux ||
        platformFlags._freebsd ||
        platformFlags._openbsd ||
        platformFlags._netbsd ||
        platformFlags._darwin
      ) {
        // For Linux/*nix systems, get all services if requested
        if (
          (platformFlags._linux ||
            platformFlags._freebsd ||
            platformFlags._openbsd ||
            platformFlags._netbsd) &&
          srvString === '*'
        ) {
          srvs = getLinuxServicesNames(srvString);
        }

        if (srvString !== '' && srvs.length > 0) {
          getUnixServices(srvs, platformFlags).then(handleComplete);
        } else {
          handleComplete([]);
        }
      }
      // For Windows
      else if (platformFlags._windows) {
        try {
          // Use the pagination approach
          fetchAllServices(options, srvs)
            .then(handleComplete)
            .catch((error) => {
              console.error('Error retrieving Windows services:', error);
              handleComplete([]);
            });
        } catch (error) {
          console.error('Error in services function:', error);
          handleComplete([]);
        }
      } else {
        // Unsupported platform
        handleComplete([]);
      }
    });
  });
}
