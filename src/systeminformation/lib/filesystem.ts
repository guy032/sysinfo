import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import path from 'path';

import * as util from './util';
import { getPlatformFlagsFromOptions } from './util/platform';

// Define interfaces for the module
export interface FSOptions {
  platform?: string;
  [key: string]: any;
}

export interface FSMount {
  fs: string;
  type: string;
  size: number;
  used: number;
  available: number;
  use: number;
  mount: string;
  rw: boolean | null;
  serialNum?: string;
}

export interface FSOpenFiles {
  max: number | null;
  allocated: number | null;
  available: number | null;
}

export interface BlockDevice {
  device?: string;
  type: string;
  name: string;
  vendor?: string;
  size: number;
  bytesPerSector?: number | null;
  totalCylinders?: number | null;
  totalHeads?: number | null;
  totalSectors?: number | null;
  totalTracks?: number | null;
  tracksPerCylinder?: number | null;
  sectorsPerTrack?: number | null;
  firmwareRevision?: string;
  serialNum?: string;
  interfaceType?: string;
  smartStatus?: string;
  temperature?: number | null;
  smartData?: any;
  identifier?: string;
  fstype?: string;
  mount?: string | null;
  physical?: string | boolean;
  removable?: boolean | null;
  protocol?: string | null;
  group?: string;
  uuid?: string;
  label?: string;
  model?: string;
  serial?: string;
  partitions?: number;
  signature?: string;
  capabilities?: string[];
  description?: string;
  pnpDeviceId?: string;
  busType?: string;
  port?: number;
  logicalUnit?: number;
  targetId?: number;
  systemName?: string;
}

export interface DiskLayout {
  device: string;
  type: string;
  name: string;
  vendor: string;
  size: number;
  bytesPerSector: number;
  totalCylinders: number;
  totalHeads: number;
  totalTracks: number;
  totalSectors: number;
  tracksPerCylinder: number;
  sectorsPerTrack: number;
  firmwareRevision: string;
  serialNum: string;
  interfaceType: string;
  smartStatus: string;
  temperature?: number;
  partitions?: number;
  pnpDeviceId?: string;
  description?: string;
  busType?: string;
  port?: number;
  logicalUnit?: number;
  targetId?: number;
  capabilities?: string[];
  systemName?: string;
}

export interface FSStats {
  rx: number;
  wx: number;
  tx: number;
  rx_sec: number | null;
  wx_sec: number | null;
  tx_sec: number | null;
  ms: number;
}

export interface DiskIO {
  name?: string;
  rIO?: number;
  wIO?: number;
  tIO?: number;
  rIO_sec?: number;
  wIO_sec?: number;
  tIO_sec?: number;
  rx?: number;
  wx?: number;
  tx?: number;
  rx_sec?: number;
  wx_sec?: number;
  tx_sec?: number;
  rx_sectors?: number;
  wx_sectors?: number;
  tx_sectors?: number;
  ms?: number;
  qms?: number;
  rWaitTime?: number;
  wWaitTime?: number;
  tWaitTime?: number;
  rWaitPercent?: number;
  wWaitPercent?: number;
  tWaitPercent?: number;
  tms?: number;
}

interface DiskIOSummary {
  bytes_read?: number;
  bytes_write?: number;
  bytes_overall?: number;
  timestamp?: number;
}

// Cache objects
const _fs_speed: {
  bytes_read?: number;
  bytes_write?: number;
  bytes_overall?: number;
  ms?: number;
  last_ms?: number;
  rx_sec?: number | null;
  wx_sec?: number | null;
  tx_sec?: number | null;
} = {};

// Helper functions
function getInterfaceType(interfaceType: string): string {
  interfaceType = interfaceType.toLowerCase();

  if (interfaceType.includes('nvme')) {
    return 'NVMe';
  } else if (interfaceType.includes('pcie')) {
    return 'PCIe';
  } else if (interfaceType.includes('sata')) {
    return 'SATA';
  } else if (interfaceType.includes('ide')) {
    return 'IDE';
  } else if (interfaceType.includes('usb')) {
    return 'USB';
  } else if (interfaceType.includes('apple')) {
    return 'Apple';
  } else if (interfaceType.includes('virtual')) {
    return 'Virtual';
  } else if (interfaceType.includes('firewire')) {
    return 'Firewire';
  } else if (interfaceType.includes('sd') || interfaceType.includes('mmc')) {
    return 'SD';
  } else if (interfaceType.includes('scsi')) {
    return 'SCSI';
  }

  return interfaceType.toUpperCase();
}

const _disk_io: {
  rIO?: number;
  wIO?: number;
  rIO_sec?: number | null;
  wIO_sec?: number | null;
  tIO_sec?: number | null;
  rWaitTime?: number;
  wWaitTime?: number;
  tWaitTime?: number;
  rWaitPercent?: number | null;
  wWaitPercent?: number | null;
  tWaitPercent?: number | null;
  ms?: number;
  summary?: DiskIOSummary;
  [key: string]: any;
} = {};

const _diskIOCache: Record<
  string,
  {
    rIO: number;
    wIO: number;
    tIO: number;
    rWaitTime: number;
    wWaitTime: number;
    tWaitTime: number;
    rIOPS: number;
    wIOPS: number;
    tIOPS: number;
    ms: number;
    rx?: number;
    wx?: number;
    tx?: number;
  }
> = {};

// Function to get path to the PowerShell script
function getFsStatsScriptPath(): string {
  return path.resolve(__dirname, '../powershell/fsStats.ps1');
}

// Add function to get path to the fsOpenFiles PowerShell script
function getFsOpenFilesScriptPath(): string {
  return path.resolve(__dirname, '../powershell/fsOpenFiles.ps1');
}

// Add function to get path to the disksIO PowerShell script
function getDisksIOScriptPath(): string {
  return path.resolve(__dirname, '../powershell/disksIO.ps1');
}

/**
 * Calculates filesystem usage
 */
export function fsSize(
  options?: FSOptions,
  callback?: (data: FSMount[]) => void,
): Promise<FSMount[]> {
  const { _linux, _freebsd, _openbsd, _netbsd, _darwin, _sunos, _windows } =
    getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(async () => {
      const data: FSMount[] = [];

      if (_windows) {
        const wmicPath = await util.getWmic(options);
        const cmd =
          wmicPath +
          ' logicaldisk get Caption,FileSystem,FreeSpace,Size,VolumeSerialNumber,Description';
        const stdout = await util.powerShell(cmd, options);
        const lines = stdout
          .toString()
          .split('\r\n')
          .filter((line) => line.trim() !== '')
          .filter((line, idx) => idx > 0);

        for (const line of lines) {
          if (line !== '') {
            const lineArray = line.trim().split(/\s\s+/);
            // Fields: Caption, FileSystem, FreeSpace, Size, VolumeSerialNumber, Description
            data.push({
              fs: lineArray[0], // Caption (C:)
              type: lineArray[2], // FileSystem (NTFS)
              size: lineArray[4] ? Number.parseInt(lineArray[4], 10) : 0, // Size
              used:
                lineArray[3] && lineArray[4]
                  ? Number.parseInt(lineArray[4], 10) - Number.parseInt(lineArray[3], 10)
                  : 0,
              available: lineArray[3] ? Number.parseInt(lineArray[3], 10) : 0, // FreeSpace
              use:
                lineArray[3] && lineArray[4]
                  ? Number.parseFloat(
                      (
                        (100 *
                          (Number.parseInt(lineArray[4], 10) - Number.parseInt(lineArray[3], 10))) /
                        Number.parseInt(lineArray[4], 10)
                      ).toFixed(2),
                    )
                  : 0,
              mount: lineArray[0],
              rw: true,
              serialNum: lineArray[5] || '',
            });
          }
        }

        if (callback) {
          callback(data);
        }

        resolve(data);
      } else if (_linux || _freebsd || _openbsd || _netbsd) {
        const cmd = `df -kPT`;

        exec(cmd, { maxBuffer: 1024 * 1024 }, (error, stdout) => {
          if (!error) {
            const lines = stdout.toString().split('\n');
            const hd_lines = fs.existsSync('/proc/mounts')
              ? fs.readFileSync('/proc/mounts', { encoding: 'utf8' }).split('\n')
              : [];

            for (const line of lines) {
              if (line !== '') {
                const lineArray = line.replaceAll(/ +/g, ' ').split(' ');

                if (
                  lineArray &&
                  lineArray[0].toLowerCase() !== 'filesystem' &&
                  lineArray[0].startsWith('/')
                ) {
                  const fs_type = lineArray[1];
                  const fs_used = Number.parseInt(lineArray[3], 10) * 1024;
                  const fs_size = Number.parseInt(lineArray[2], 10) * 1024;
                  const fs_mount = lineArray[6] || '';
                  let rw: boolean | null = null;

                  for (const item of hd_lines) {
                    if (item !== '') {
                      const hd_line = item.split(' ');

                      if (hd_line[1] === fs_mount) {
                        rw = !hd_line[3].startsWith('ro');
                      }
                    }
                  }

                  data.push({
                    fs: lineArray[0],
                    type: fs_type,
                    size: fs_size,
                    used: fs_used,
                    available: fs_size - fs_used,
                    use: Number.parseFloat(((100 * fs_used) / fs_size).toFixed(2)),
                    mount: fs_mount,
                    rw,
                    serialNum: lineArray[5] || '',
                  });
                }
              }
            }
          }

          if (data.length === 0 && _darwin) {
            const cmd = `df -kPl`;

            try {
              const dfdata = execSync(cmd, { maxBuffer: 1024 * 1024 });
              const lines = dfdata.toString().split('\n');

              for (const line of lines) {
                if (line !== '') {
                  const lineArray = line.replaceAll(/ +/g, ' ').split(' ');

                  if (
                    lineArray &&
                    lineArray[0].toLowerCase() !== 'filesystem' &&
                    lineArray[0].startsWith('/')
                  ) {
                    data.push({
                      fs: lineArray[0],
                      type: '',
                      size: Number.parseInt(lineArray[1], 10) * 1024,
                      used: Number.parseInt(lineArray[2], 10) * 1024,
                      available: Number.parseInt(lineArray[3], 10) * 1024,
                      use: Number.parseFloat(lineArray[4].replaceAll('%', '')),
                      mount: lineArray[8],
                      rw: null,
                      serialNum: lineArray[5] || '',
                    });
                  }
                }
              }
            } catch {
              util.noop();
            }
          }

          if (data.length === 0 && _sunos) {
            // not tested
            exec('df -kl', { maxBuffer: 1024 * 1024 }, function (error, stdout) {
              if (!error) {
                const lines = stdout.toString().split('\n');

                for (const line of lines) {
                  if (line !== '') {
                    const lineArray = line.replaceAll(/ +/g, ' ').split(' ');

                    if (lineArray && lineArray[0].toLowerCase() !== 'filesystem') {
                      data.push({
                        fs: lineArray[0],
                        type: '',
                        size: Number.parseInt(lineArray[1], 10) * 1024,
                        used: Number.parseInt(lineArray[2], 10) * 1024,
                        available: Number.parseInt(lineArray[3], 10) * 1024,
                        use: Number.parseFloat(lineArray[4].replaceAll('%', '')),
                        mount: lineArray[5],
                        rw: null,
                        serialNum: lineArray[5] || '',
                      });
                    }
                  }
                }
              }

              if (callback) {
                callback(data);
              }

              resolve(data);
            });
          }

          if (_darwin) {
            exec('df -kPl', { maxBuffer: 1024 * 1024 }, function (error, stdout) {
              if (!error) {
                const lines = stdout.toString().split('\n');

                for (const line of lines) {
                  if (line !== '') {
                    const lineArray = line.replaceAll(/ +/g, ' ').split(' ');

                    if (lineArray && lineArray[0].toLowerCase() !== 'filesystem') {
                      data.push({
                        fs: lineArray[0],
                        type: '',
                        size: Number.parseInt(lineArray[1], 10) * 1024,
                        used: Number.parseInt(lineArray[2], 10) * 1024,
                        available: Number.parseInt(lineArray[3], 10) * 1024,
                        use: Number.parseFloat(lineArray[4].replaceAll('%', '')),
                        mount: lineArray[8],
                        rw: null,
                        serialNum: lineArray[5] || '',
                      });
                    }
                  }
                }
              }

              if (callback) {
                callback(data);
              }

              resolve(data);
            });
          }
        });
      } else if (_sunos) {
        // not tested
        exec('df -kl', { maxBuffer: 1024 * 1024 }, function (error, stdout) {
          if (!error) {
            const lines = stdout.toString().split('\n');

            for (const line of lines) {
              if (line !== '') {
                const lineArray = line.replaceAll(/ +/g, ' ').split(' ');

                if (lineArray && lineArray[0].toLowerCase() !== 'filesystem') {
                  data.push({
                    fs: lineArray[0],
                    type: '',
                    size: Number.parseInt(lineArray[1], 10) * 1024,
                    used: Number.parseInt(lineArray[2], 10) * 1024,
                    available: Number.parseInt(lineArray[3], 10) * 1024,
                    use: Number.parseFloat(lineArray[4].replaceAll('%', '')),
                    mount: lineArray[5],
                    rw: null,
                    serialNum: lineArray[5] || '',
                  });
                }
              }
            }
          }

          if (callback) {
            callback(data);
          }

          resolve(data);
        });
      }
    });
  });
}

export function fsOpenFiles(
  options?: FSOptions,
  callback?: (data: FSOpenFiles) => void,
): Promise<FSOpenFiles> {
  const { _linux, _darwin, _windows } = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(async () => {
      const result: FSOpenFiles = {
        max: null,
        allocated: null,
        available: null,
      };

      if (_linux) {
        if (fs.existsSync('/proc/sys/fs/file-nr')) {
          const lines = fs.readFileSync('/proc/sys/fs/file-nr', { encoding: 'utf8' }).split('\n');

          if (lines[0]) {
            const parts = lines[0].replaceAll(/\s+/g, ' ').split(' ');

            if (parts.length >= 3) {
              result.allocated = Number.parseInt(parts[0], 10);
              result.available = Number.parseInt(parts[1], 10);
              result.max = Number.parseInt(parts[2], 10);

              if (!result.available) {
                result.available = result.max - result.allocated;
              }
            }
          }
        }

        if (result.allocated === null && fs.existsSync('/proc/sys/fs/file-max')) {
          const lines = fs.readFileSync('/proc/sys/fs/file-max', { encoding: 'utf8' }).split('\n');

          if (lines[0]) {
            result.max = Number.parseInt(lines[0], 10);
          }
        }

        if (result.allocated === null && fs.existsSync('/proc/sys/fs/inode-nr')) {
          const lines = fs.readFileSync('/proc/sys/fs/inode-nr', { encoding: 'utf8' }).split('\n');

          if (lines[0]) {
            const parts = lines[0].replaceAll(/\s+/g, ' ').split(' ');

            if (parts.length >= 2) {
              result.allocated = Number.parseInt(parts[0], 10);
              result.available = Number.parseInt(parts[1], 10);

              if (result.max === null) {
                result.max = result.allocated + result.available;
              }
            }
          }
        }

        if (result.allocated === null) {
          const cmd = 'lsof -n | wc -l';

          try {
            result.allocated = Number.parseInt(
              execSync(cmd, { maxBuffer: 1024 * 1024 }).toString(),
              10,
            );
          } catch {
            util.noop();
          }
        }
      }

      if (_darwin) {
        const cmd = 'sysctl -a | grep kern.num';

        try {
          const lines = execSync(cmd, { maxBuffer: 1024 * 1024 })
            .toString()
            .split('\n');

          for (const line of lines) {
            if (line.includes('kern.num')) {
              const parts = line.replaceAll(/ +/g, ' ').split(' ');

              if (parts.length >= 2) {
                if (parts[0].indexOf('openfiles') > 0) {
                  result.allocated = Number.parseInt(parts[1], 10);
                }

                if (parts[0].indexOf('maxfiles') > 0) {
                  result.max = Number.parseInt(parts[1], 10);
                }
              }
            }
          }

          if (result.max && result.allocated) {
            result.available = result.max - result.allocated;
          }
        } catch {
          util.noop();
        }
      }

      if (_windows) {
        try {
          // Get the path to the PowerShell script
          const scriptPath = getFsOpenFilesScriptPath();

          // Execute the PowerShell script
          const stdout = await util.executeScript(scriptPath, options);

          // Convert array to string if needed
          const output = Array.isArray(stdout) ? stdout.join('\n') : stdout;

          if (output && output.trim()) {
            try {
              // Parse the JSON output
              const statsObj = JSON.parse(output);

              result.max = statsObj.max;
              result.allocated = statsObj.allocated;
              result.available = statsObj.available;
            } catch (error) {
              console.error('Error parsing open files JSON:', error);
            }
          }
        } catch (error) {
          console.error('Error retrieving open files information:', error);
        }
      }

      if (callback) {
        callback(result);
      }

      resolve(result);
    });
  });
}

export function blockDevices(
  options?: FSOptions,
  callback?: (data: BlockDevice[]) => void,
): Promise<BlockDevice[]> {
  const { _linux, _darwin, _windows } = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(async () => {
      const result: BlockDevice[] = [];

      if (_linux) {
        let cmd = 'lsblk -ablJO 2>/dev/null';

        try {
          let parts: { blockdevices: any[] } = { blockdevices: [] };
          const data = execSync(cmd, { maxBuffer: 1024 * 1024 }).toString();

          try {
            parts = JSON.parse(data);
          } catch {
            util.noop();
          }

          if (parts && parts.blockdevices) {
            for (const blockdevice of parts.blockdevices) {
              if (blockdevice.type !== 'part') {
                const size = blockdevice.size > 0 ? Number.parseInt(blockdevice.size, 10) : 0;
                result.push({
                  name: blockdevice.name,
                  identifier: blockdevice.name,
                  type: blockdevice.type,
                  fstype: blockdevice.fstype,
                  mount: blockdevice.mountpoint,
                  size,
                  physical: blockdevice.type === 'disk',
                  uuid: blockdevice.uuid,
                  label: blockdevice.label,
                  model: blockdevice.model,
                  serial: blockdevice.serial,
                  removable: blockdevice.rm,
                  protocol: blockdevice.tran,
                });
              }
            }
          }
        } catch {
          util.noop();
        }

        if (result.length === 0) {
          cmd = 'lsblk -nrS -o NAME,TRAN,TYPE';

          try {
            for (const line of execSync(cmd, { maxBuffer: 1024 * 1024 })
              .toString()
              .trim()
              .split('\n')) {
              const parts = line.trim().split(' ');

              if (parts.length >= 3 && parts[1] && parts[1].length > 0) {
                result.push({
                  name: parts[0],
                  identifier: parts[0],
                  type: parts[2],
                  fstype: '',
                  mount: '',
                  size: 0,
                  physical: parts[2] === 'disk' || parts[2] === 'rom',
                  uuid: '',
                  label: '',
                  model: '',
                  serial: '',
                  removable: null,
                  protocol: parts[1],
                });
              }
            }
          } catch {
            util.noop();
          }
        }
      }

      if (_darwin) {
        try {
          const lines = execSync('diskutil info -all', { maxBuffer: 1024 * 1024 })
            .toString()
            .split('\n');
          let diskGroup: string[] = [];
          let lineArray: any[] = [];
          let hdCount = 0;

          for (const line of lines) {
            if (
              !line.startsWith(' ') &&
              !line.startsWith('\t') &&
              lineArray.length > 0 &&
              diskGroup.length > 0
            ) {
              const deviceName = diskGroup[0].trim();
              const MediaName = diskGroup.join('\n').includes('Media Name:')
                ? util.getValue(diskGroup, 'Media Name')
                : '';
              const status = diskGroup.join('\n').includes('SMART Status')
                ? util.getValue(diskGroup, 'SMART Status', ':')
                : 'unknown';
              const type =
                MediaName.includes('SSD') ||
                MediaName.includes('Solid State') ||
                MediaName.includes('Flash')
                  ? 'SSD'
                  : 'HD';
              const partitions = diskGroup.join('\n').includes('Partition Count: ')
                ? util.getValue(diskGroup, 'Partition Count', ':')
                : '';

              if (deviceName) {
                const isHD =
                  deviceName.startsWith('/dev/disk') &&
                  partitions &&
                  diskGroup.join('\n').includes('Internal: ');
                const isInternal = diskGroup.join('\n').includes('Internal: ')
                  ? util.getValue(diskGroup, 'Internal', ':').trim()
                  : false;

                if ((isHD || hdCount === 0) && isInternal === 'Yes') {
                  const size = diskGroup.join('\n').includes('Disk Size: ')
                    ? util.getValue(diskGroup, 'Disk Size', ':')
                    : '';

                  if (size.includes('(')) {
                    hdCount++;
                    let sizeStr = size.match(/\(([^)]+)\)/)?.[1] || '';
                    sizeStr = sizeStr.replaceAll("'", '');
                    sizeStr = sizeStr.replaceAll(',', '');
                    sizeStr = sizeStr.replaceAll(' bytes', '');
                    const sizeValue = Number.parseInt(sizeStr, 10);
                    const protocol = diskGroup.join('\n').includes('Protocol: ')
                      ? util.getValue(diskGroup, 'Protocol', ':').trim()
                      : '';
                    const device = diskGroup.join('\n').includes('Device / Media Name:')
                      ? util.getValue(diskGroup, 'Device / Media Name')
                      : '';
                    const smartStatus = status
                      ? status === 'Verified'
                        ? 'Ok'
                        : status
                      : 'unknown';
                    result.push({
                      device: deviceName,
                      type,
                      name: device || MediaName || deviceName,
                      vendor: '',
                      size: sizeValue,
                      bytesPerSector: 0,
                      totalCylinders: 0,
                      totalHeads: 0,
                      totalTracks: 0,
                      totalSectors: 0,
                      tracksPerCylinder: 0,
                      sectorsPerTrack: 0,
                      firmwareRevision: '',
                      serialNum: diskGroup.join('\n').includes('Serial Number:')
                        ? util.getValue(diskGroup, 'Serial Number', ':')
                        : '',
                      interfaceType: protocol,
                      smartStatus,
                    });
                  }
                }
              }

              lineArray = [];
              diskGroup = [];
            }

            if (
              (line.startsWith('/dev/disk') && !line.trim().startsWith('/dev/disk0s')) ||
              diskGroup.length > 0
            ) {
              diskGroup.push(line);
            }
          }
        } catch {
          util.noop();
        }
      }

      if (_windows) {
        try {
          const wmicPath = await util.getWmic(options);
          const cmd = wmicPath + ' diskdrive get /value';
          const stdout = await util.powerShell(cmd, options);

          // Process the entire output as one disk if no clear separation
          const diskInfo: Record<string, string> = {};

          // Split by lines and process each line
          const lines = stdout.toString().split('\n');

          for (const line of lines) {
            const trimmedLine = line.trim().replaceAll('\r', '');

            // Skip empty lines
            if (trimmedLine === '') {
              continue;
            }

            // Parse key=value pair
            const parts = trimmedLine.split('=');

            if (parts.length >= 2) {
              const key = parts[0].trim();
              const value = parts.slice(1).join('=').trim();
              diskInfo[key] = value;
            }
          }

          // After processing all lines, create a disk entry if we have data
          if (Object.keys(diskInfo).length > 0) {
            const deviceId =
              diskInfo.DeviceID?.replace(/\\\\.\\|\\\\?\\|\\\\.\\PhysicalDrive/g, '').trim() || '';
            const size = Number.parseInt(diskInfo.Size || '0', 10);
            const model = diskInfo.Model?.trim() || '';
            const caption = diskInfo.Caption?.trim() || '';
            const mediaType = diskInfo.MediaType?.trim() || '';
            const interfaceType = diskInfo.InterfaceType?.trim() || '';
            const manufacturer = diskInfo.Manufacturer?.trim() || '';

            if (size > 0) {
              const diskLayoutEntry: DiskLayout = {
                device: deviceId,
                type:
                  mediaType?.toLowerCase().includes('ssd') ||
                  model.toLowerCase().includes('ssd') ||
                  caption.toLowerCase().includes('ssd') ||
                  model.toLowerCase().includes('nvme')
                    ? 'SSD'
                    : 'HD',
                name: caption || model,
                vendor: manufacturer,
                size,
                bytesPerSector: Number.parseInt(diskInfo.BytesPerSector || '0', 10),
                totalCylinders: Number.parseInt(diskInfo.TotalCylinders || '0', 10),
                totalHeads: Number.parseInt(diskInfo.TotalHeads || '0', 10),
                totalSectors: Number.parseInt(diskInfo.TotalSectors || '0', 10),
                tracksPerCylinder: Number.parseInt(diskInfo.TracksPerCylinder || '0', 10),
                sectorsPerTrack: Number.parseInt(diskInfo.SectorsPerTrack || '0', 10),
                totalTracks: Number.parseInt(diskInfo.TotalTracks || '0', 10),
                firmwareRevision: diskInfo.FirmwareRevision || '',
                serialNum: diskInfo.SerialNumber || '',
                interfaceType: getInterfaceType(interfaceType),
                smartStatus:
                  diskInfo.Status?.trim() === 'OK' ? 'Ok' : diskInfo.Status?.trim() || 'unknown',
                // Additional properties
                partitions: Number.parseInt(diskInfo.Partitions || '0', 10) || undefined,
                pnpDeviceId: diskInfo.PNPDeviceID || undefined,
                description: diskInfo.Description || undefined,
                busType: diskInfo.SCSIBus ? 'SCSI' : undefined,
                port: Number.parseInt(diskInfo.SCSIPort || '0', 10) || undefined,
                logicalUnit: Number.parseInt(diskInfo.SCSILogicalUnit || '0', 10) || undefined,
                targetId: Number.parseInt(diskInfo.SCSITargetId || '0', 10) || undefined,
                capabilities: diskInfo.CapabilityDescriptions
                  ? diskInfo.CapabilityDescriptions.replaceAll(/[{}]/g, '') // Remove curly braces
                      .split(',')
                      .map((item) => item.trim().replaceAll(/^"|"$/g, '')) // Remove surrounding quotes
                      .filter(Boolean) // Remove empty items
                  : undefined,
                systemName: diskInfo.SystemName || undefined,
              };

              result.push(diskLayoutEntry);
            }
          }
        } catch (error) {
          console.error('Error parsing disk layout information:', error);
          util.noop();
        }
      }

      if (callback) {
        callback(result);
      }

      resolve(result);
    });
  });
}

export function fsStats(
  options?: FSOptions,
  callback?: (data: FSStats) => void,
): Promise<FSStats | null> {
  const { _linux, _windows, _freebsd, _openbsd, _netbsd, _sunos } =
    getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(async () => {
      if (_freebsd || _openbsd || _netbsd || _sunos) {
        return resolve(null);
      }

      const result: FSStats = {
        rx: 0,
        wx: 0,
        tx: 0,
        rx_sec: null,
        wx_sec: null,
        tx_sec: null,
        ms: 0,
      };

      const now = Date.now();

      if (_linux) {
        // Calculate IO since system startup
        let totalRx = 0;
        let totalWx = 0;

        try {
          const cmd = 'cat /proc/diskstats';
          const data = execSync(cmd, { maxBuffer: 1024 * 1024 }).toString();

          if (data) {
            const lines = data.trim().split('\n');

            for (const line of lines) {
              const fields = line.trim().split(/\s+/);

              // fields: (1:major, 2:minor, 3:device, 4:reads, 5:readsMerged, 6:sectorsRead, 7:readTime, 8:writes, 9:writesMerged, 10:sectorsWritten, 11:writeTime, 12:currentIOS, 13:IOTime, 14:weightedIOTime)
              if (fields.length >= 14) {
                totalRx += Number.parseInt(fields[5], 10);
                totalWx += Number.parseInt(fields[9], 10);
              }
            }
          }
        } catch {
          util.noop();
        }

        // Calculate IO sector size (hard disk sector = 512 bytes)
        const sectorSize = 512;
        result.rx = totalRx * sectorSize;
        result.wx = totalWx * sectorSize;
        result.tx = result.rx + result.wx;

        // Calculate IO since last call

        if (_disk_io.summary && _disk_io.summary.timestamp) {
          result.rx_sec =
            ((result.rx - (_disk_io.summary.bytes_read ?? 0)) /
              (now - _disk_io.summary.timestamp)) *
            1000;
          result.wx_sec =
            ((result.wx - (_disk_io.summary.bytes_write ?? 0)) /
              (now - _disk_io.summary.timestamp)) *
            1000;
          result.tx_sec = result.rx_sec + result.wx_sec;
          result.ms = now - _disk_io.summary.timestamp;
        }

        _disk_io.summary = {
          bytes_read: result.rx,
          bytes_write: result.wx,
          bytes_overall: result.tx,
          timestamp: now,
        };
      }

      if (_windows) {
        try {
          // Get the path to the PowerShell script
          const scriptPath = getFsStatsScriptPath();

          // Execute the PowerShell script using the centralized utility function
          const stdout = await util.executeScript(scriptPath, options);

          // Convert array to string if needed
          const output = Array.isArray(stdout) ? stdout.join('\n') : stdout;

          if (output && output.trim()) {
            try {
              // Parse the JSON output
              const statsObj = JSON.parse(output);

              const readBytesPerSec = Number.parseFloat(statsObj.ReadBytesPerSec || 0);
              const writeBytesPerSec = Number.parseFloat(statsObj.WriteBytesPerSec || 0);

              // Since we can't directly get totals from Windows, we'll estimate based on rates
              // and store in our cache variables

              // Initialize cache if needed
              if (!_disk_io.summary) {
                _disk_io.summary = {
                  bytes_read: 0,
                  bytes_write: 0,
                  bytes_overall: 0,
                  timestamp: now - 1000, // Assume 1 second elapsed
                };
              }

              const elapsedSec = (now - (_disk_io.summary.timestamp || now - 1000)) / 1000;

              // Add the incremental bytes based on current rate and time elapsed
              const incrementalRead = readBytesPerSec * elapsedSec;
              const incrementalWrite = writeBytesPerSec * elapsedSec;

              // Accumulate total bytes
              const totalRx = (_disk_io.summary.bytes_read || 0) + incrementalRead;
              const totalWx = (_disk_io.summary.bytes_write || 0) + incrementalWrite;

              result.rx = totalRx;
              result.wx = totalWx;
              result.tx = result.rx + result.wx;
              result.rx_sec = readBytesPerSec;
              result.wx_sec = writeBytesPerSec;
              result.tx_sec = result.rx_sec + result.wx_sec;
              result.ms = now - (_disk_io.summary.timestamp || now - 1000);

              // Update cache
              _disk_io.summary = {
                bytes_read: totalRx,
                bytes_write: totalWx,
                bytes_overall: totalRx + totalWx,
                timestamp: now,
              };
            } catch (error) {
              console.error('Error parsing disk stats JSON:', error);
            }
          }
        } catch (error) {
          console.error('Error retrieving filesystem stats:', error);
          // If we failed, don't update timestamps so next attempt can work
        }
      }

      if (callback) {
        callback(result);
      }

      resolve(result);
    });
  });
}

function calcFsSpeed(
  rx: number,
  wx: number,
): {
  rx: number;
  wx: number;
  tx: number;
  rx_sec: number;
  wx_sec: number;
  tx_sec: number;
  ms: number;
} {
  const result: {
    rx: number;
    wx: number;
    tx: number;
    rx_sec: number;
    wx_sec: number;
    tx_sec: number;
    ms: number;
  } = {
    rx: 0,
    wx: 0,
    tx: 0,
    rx_sec: 0,
    wx_sec: 0,
    tx_sec: 0,
    ms: 0,
  };

  if (_fs_speed && _fs_speed.ms) {
    result.rx = rx;
    result.wx = wx;
    result.tx = result.rx + result.wx;
    result.ms = Date.now() - _fs_speed.ms;
    result.rx_sec = (result.rx - (_fs_speed.bytes_read ?? 0)) / (result.ms / 1000);
    result.wx_sec = (result.wx - (_fs_speed.bytes_write ?? 0)) / (result.ms / 1000);
    result.tx_sec = (result.rx_sec ?? 0) + (result.wx_sec ?? 0);
    _fs_speed.rx_sec = result.rx_sec;
    _fs_speed.wx_sec = result.wx_sec;
    _fs_speed.tx_sec = result.tx_sec;
    _fs_speed.bytes_read = result.rx;
    _fs_speed.bytes_write = result.wx;
    _fs_speed.bytes_overall = result.rx + result.wx;
    _fs_speed.ms = Date.now();
    _fs_speed.last_ms = result.ms;
  } else {
    result.rx = rx;
    result.wx = wx;
    result.tx = result.rx + result.wx;
    _fs_speed.rx_sec = 0;
    _fs_speed.wx_sec = 0;
    _fs_speed.tx_sec = 0;
    _fs_speed.bytes_read = result.rx;
    _fs_speed.bytes_write = result.wx;
    _fs_speed.bytes_overall = result.rx + result.wx;
    _fs_speed.ms = Date.now();
    _fs_speed.last_ms = 0;
  }

  return result;
}

export function disksIO(
  options?: FSOptions,
  callback?: (data: DiskIO[]) => void,
): Promise<DiskIO[]> {
  const { _linux, _darwin, _windows } = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(async () => {
      const result: DiskIO[] = [];

      if (_linux) {
        try {
          const cmd = 'cat /proc/diskstats';
          const data = execSync(cmd, { maxBuffer: 1024 * 1024 }).toString();
          const lines = data.trim().split('\n');

          for (const line of lines) {
            const fields = line.trim().split(/\s+/);

            if (fields.length >= 14 && !fields[2].includes('loop') && !fields[2].includes('ram')) {
              const device = fields[2];

              if (_disk_io[device] && _disk_io[device].timestamp) {
                result.push({
                  name: device,
                  rx_sectors: Number.parseInt(fields[5], 10),
                  rx: Number.parseInt(fields[5], 10) * 512,
                  wx_sectors: Number.parseInt(fields[9], 10),
                  wx: Number.parseInt(fields[9], 10) * 512,
                  tx_sectors: Number.parseInt(fields[5], 10) + Number.parseInt(fields[9], 10),
                  tx: (Number.parseInt(fields[5], 10) + Number.parseInt(fields[9], 10)) * 512,
                  ms: Date.now() - _disk_io[device].timestamp,
                  tms: Number.parseInt(fields[12], 10),
                  qms: Number.parseInt(fields[13], 10),
                  rIO: Number.parseInt(fields[3], 10),
                  wIO: Number.parseInt(fields[7], 10),
                  tIO: Number.parseInt(fields[3], 10) + Number.parseInt(fields[7], 10),
                });
              }

              _disk_io[device] = {
                rIO: Number.parseInt(fields[3], 10),
                wIO: Number.parseInt(fields[7], 10),
                tIO: Number.parseInt(fields[3], 10) + Number.parseInt(fields[7], 10),
                ms: Number.parseInt(fields[12], 10),
                qms: Number.parseInt(fields[13], 10),
                timestamp: Date.now(),
              };
            }
          }
        } catch {
          util.noop();
        }
      }

      if (_darwin) {
        try {
          const cmd = 'ioreg -c IOBlockStorageDriver -k Statistics -r -w0 | grep "" | sort';
          const data = execSync(cmd, { maxBuffer: 1024 * 1024 }).toString();
          const lines = data.trim().split('\n');
          let stats: any = {};
          const disk = '';

          for (const line of lines) {
            if (line.includes('"Statistics"')) {
              let disk = line.split('<')[0].trim();
              disk = disk.slice(0, disk.indexOf('"Statistics"')).trim();
              disk = disk.slice(disk.lastIndexOf('"') + 1).trim();
              stats = {};
            } else {
              if (line.includes('Operations')) {
                const parts = line.split('=');

                if (parts.length === 2) {
                  const value = Number.parseInt(parts[1].trim().replaceAll('"', ''), 10);

                  if (parts[0].toUpperCase().includes('READ')) {
                    stats.rIO = value;
                  }

                  if (parts[0].toUpperCase().includes('WRITE')) {
                    stats.wIO = value;
                  }
                }
              }

              if (line.includes('Bytes')) {
                const parts = line.split('=');

                if (parts.length === 2) {
                  const value = Number.parseInt(parts[1].trim().replaceAll('"', ''), 10);

                  if (parts[0].toUpperCase().includes('READ')) {
                    stats.rx = value;
                    stats.rx_sectors = value / 512;
                  }

                  if (parts[0].toUpperCase().includes('WRITE')) {
                    stats.wx = value;
                    stats.wx_sectors = value / 512;
                  }
                }
              }

              if (line.includes('ReadLatency') || line.includes('WriteLatency')) {
                const parts = line.split('=');

                if (parts.length === 2) {
                  const value = Number.parseInt(parts[1].trim().replaceAll('"', ''), 10);

                  if (parts[0].toUpperCase().includes('READ')) {
                    stats.rT = value;
                  }

                  if (parts[0].toUpperCase().includes('WRITE')) {
                    stats.wT = value;
                  }
                }
              }

              if (line.includes('}') && stats.rIO !== undefined) {
                if (_disk_io[disk] && _disk_io[disk].timestamp) {
                  result.push({
                    name: disk,
                    rx_sectors: stats.rx_sectors,
                    rx: stats.rx,
                    wx_sectors: stats.wx_sectors,
                    wx: stats.wx,
                    tx_sectors: stats.rx_sectors + stats.wx_sectors,
                    tx: stats.rx + stats.wx,
                    ms: Date.now() - _disk_io[disk].timestamp,
                    tms: Date.now() - _disk_io[disk].timestamp,
                    qms: 0,
                    rIO: stats.rIO,
                    wIO: stats.wIO,
                    tIO: stats.rIO + stats.wIO,
                  });
                }

                _disk_io[disk] = {
                  rIO: stats.rIO,
                  wIO: stats.wIO,
                  tIO: stats.rIO + stats.wIO,
                  rx: stats.rx,
                  wx: stats.wx,
                  tx: stats.rx + stats.wx,
                  ms: 0,
                  qms: 0,
                  timestamp: Date.now(),
                };
              }
            }
          }
        } catch {
          util.noop();
        }
      }

      if (_windows) {
        try {
          // Get the path to the PowerShell script
          const scriptPath = getDisksIOScriptPath();

          // Execute the PowerShell script
          const stdout = await util.executeScript(scriptPath, options);

          // Convert array to string if needed
          const output = Array.isArray(stdout) ? stdout.join('\n') : stdout;

          if (output && output.trim()) {
            try {
              // Parse the JSON output
              const disksData = JSON.parse(output);

              if (Array.isArray(disksData)) {
                const now = Date.now();

                // Process each disk
                for (const disk of disksData) {
                  const diskName = disk.name;

                  // Calculate rates if we have historical data
                  if (_diskIOCache[diskName]) {
                    const prevData = _diskIOCache[diskName];
                    const timeDiff = (now - prevData.ms) / 1000; // Convert to seconds

                    if (timeDiff > 0) {
                      // Calculate operations per second
                      const rIO_sec = (disk.rIO - prevData.rIO) / timeDiff;
                      const wIO_sec = (disk.wIO - prevData.wIO) / timeDiff;
                      const tIO_sec = rIO_sec + wIO_sec;
                      result.push({
                        name: diskName,
                        rIO: disk.rIO,
                        wIO: disk.wIO,
                        tIO: disk.tIO,
                        rIO_sec,
                        wIO_sec,
                        tIO_sec,
                        rx: disk.rB,
                        wx: disk.wB,
                        tx: disk.tB,
                        rx_sec: (disk.rB - (prevData.rx || 0)) / timeDiff,
                        wx_sec: (disk.wB - (prevData.wx || 0)) / timeDiff,
                        tx_sec: (disk.tB - (prevData.tx || 0)) / timeDiff,
                        ms: now - prevData.ms,
                        qms: disk.queue,
                        rWaitTime: disk.rWait,
                        wWaitTime: disk.wWait,
                        tWaitTime: disk.tWait,
                      });
                    }
                  }

                  // Update the cache
                  _diskIOCache[diskName] = {
                    rIO: disk.rIO,
                    wIO: disk.wIO,
                    tIO: disk.tIO,
                    rx: disk.rB,
                    wx: disk.wB,
                    tx: disk.tB,
                    rWaitTime: disk.rWait,
                    wWaitTime: disk.wWait,
                    tWaitTime: disk.tWait,
                    rIOPS: 0,
                    wIOPS: 0,
                    tIOPS: 0,
                    ms: now,
                  };
                }
              }
            } catch (error) {
              console.error('Error parsing disksIO JSON:', error);
            }
          }
        } catch (error) {
          console.error('Error retrieving disksIO information:', error);
        }
      }

      if (callback) {
        callback(result);
      }

      resolve(result);
    });
  });
}

export function diskLayout(
  options?: FSOptions,
  callback?: (data: DiskLayout[]) => void,
): Promise<DiskLayout[]> {
  const { _linux, _darwin, _windows } = getPlatformFlagsFromOptions(options);

  return new Promise((resolve) => {
    process.nextTick(async () => {
      const result: DiskLayout[] = [];

      if (_linux) {
        let cmd = 'lsblk -bo NAME,SIZE,ROTA,TYPE,TRAN,MODEL,SERIAL,REV 2>/dev/null';

        try {
          const data = execSync(cmd, { maxBuffer: 1024 * 1024 }).toString();
          const lines = data.trim().split('\n');

          for (const line of lines) {
            const fields = line.trim().split(/\s+/);

            if (fields.length >= 7 && fields[3] === 'disk' && !fields[0].includes('/')) {
              const size = Number.parseInt(fields[1], 10);
              const rota = fields[2] === '1';
              const isSSD = fields[0].startsWith('nvme') || !rota;
              result.push({
                device: fields[0],
                type: isSSD ? 'SSD' : 'HD',
                name: fields[5].trim().length > 0 ? fields[5] : '',
                vendor: '',
                size,
                bytesPerSector: 0,
                totalCylinders: 0,
                totalHeads: 0,
                totalTracks: 0,
                totalSectors: 0,
                tracksPerCylinder: 0,
                sectorsPerTrack: 0,
                firmwareRevision: fields[7] || '',
                serialNum: fields[6] || '',
                interfaceType: fields[4] === 'sata' ? 'SATA' : fields[4],
                smartStatus: 'unknown',
              });
            }
          }
        } catch {
          util.noop();
        }

        if (result.length === 0) {
          cmd = 'lsblk -bo name,size,rota,type';

          try {
            const data = execSync(cmd, { maxBuffer: 1024 * 1024 }).toString();
            const lines = data.trim().split('\n');

            for (const line of lines) {
              const fields = line.trim().split(/\s+/);

              if (fields.length >= 4 && fields[3] === 'disk' && !fields[0].includes('/')) {
                const size = Number.parseInt(fields[1], 10);
                const rota = fields[2] === '1';
                const isSSD = fields[0].startsWith('nvme') || !rota;
                result.push({
                  device: fields[0],
                  type: isSSD ? 'SSD' : 'HD',
                  name: '',
                  vendor: '',
                  size,
                  bytesPerSector: 0,
                  totalCylinders: 0,
                  totalHeads: 0,
                  totalTracks: 0,
                  totalSectors: 0,
                  tracksPerCylinder: 0,
                  sectorsPerTrack: 0,
                  firmwareRevision: '',
                  serialNum: '',
                  interfaceType: fields[0].startsWith('sd')
                    ? 'SATA'
                    : fields[0].startsWith('nvme')
                      ? 'PCIe'
                      : '',
                  smartStatus: 'unknown',
                });
              }
            }
          } catch {
            util.noop();
          }
        }
      }

      if (_darwin) {
        try {
          const lines = execSync('diskutil info -all', { maxBuffer: 1024 * 1024 })
            .toString()
            .split('\n');
          let diskGroup: string[] = [];
          let lineArray: any[] = [];
          let hdCount = 0;

          for (const line of lines) {
            if (
              !line.startsWith(' ') &&
              !line.startsWith('\t') &&
              lineArray.length > 0 &&
              diskGroup.length > 0
            ) {
              const deviceName = diskGroup[0].trim();
              const MediaName = diskGroup.join('\n').includes('Media Name:')
                ? util.getValue(diskGroup, 'Media Name')
                : '';
              const status = diskGroup.join('\n').includes('SMART Status')
                ? util.getValue(diskGroup, 'SMART Status', ':')
                : 'unknown';
              const type =
                MediaName.includes('SSD') ||
                MediaName.includes('Solid State') ||
                MediaName.includes('Flash')
                  ? 'SSD'
                  : 'HD';
              const partitions = diskGroup.join('\n').includes('Partition Count: ')
                ? util.getValue(diskGroup, 'Partition Count', ':')
                : '';

              if (deviceName) {
                const isHD =
                  deviceName.startsWith('/dev/disk') &&
                  partitions &&
                  diskGroup.join('\n').includes('Internal: ');
                const isInternal = diskGroup.join('\n').includes('Internal: ')
                  ? util.getValue(diskGroup, 'Internal', ':').trim()
                  : false;

                if ((isHD || hdCount === 0) && isInternal === 'Yes') {
                  const size = diskGroup.join('\n').includes('Disk Size: ')
                    ? util.getValue(diskGroup, 'Disk Size', ':')
                    : '';

                  if (size.includes('(')) {
                    hdCount++;
                    let sizeStr = size.match(/\(([^)]+)\)/)?.[1] || '';
                    sizeStr = sizeStr.replaceAll("'", '');
                    sizeStr = sizeStr.replaceAll(',', '');
                    sizeStr = sizeStr.replaceAll(' bytes', '');
                    const sizeValue = Number.parseInt(sizeStr, 10);
                    const protocol = diskGroup.join('\n').includes('Protocol: ')
                      ? util.getValue(diskGroup, 'Protocol', ':').trim()
                      : '';
                    const device = diskGroup.join('\n').includes('Device / Media Name:')
                      ? util.getValue(diskGroup, 'Device / Media Name')
                      : '';
                    const smartStatus = status
                      ? status === 'Verified'
                        ? 'Ok'
                        : status
                      : 'unknown';
                    result.push({
                      device: deviceName,
                      type,
                      name: device || MediaName || deviceName,
                      vendor: '',
                      size: sizeValue,
                      bytesPerSector: 0,
                      totalCylinders: 0,
                      totalHeads: 0,
                      totalTracks: 0,
                      totalSectors: 0,
                      tracksPerCylinder: 0,
                      sectorsPerTrack: 0,
                      firmwareRevision: '',
                      serialNum: diskGroup.join('\n').includes('Serial Number:')
                        ? util.getValue(diskGroup, 'Serial Number', ':')
                        : '',
                      interfaceType: protocol,
                      smartStatus,
                    });
                  }
                }
              }

              lineArray = [];
              diskGroup = [];
            }

            if (
              (line.startsWith('/dev/disk') && !line.trim().startsWith('/dev/disk0s')) ||
              diskGroup.length > 0
            ) {
              diskGroup.push(line);
            }
          }
        } catch {
          util.noop();
        }
      }

      if (_windows) {
        try {
          const wmic = await util.getWmic(options);
          const cmd = wmic + ' diskdrive get /value';
          const stdout = await util.powerShell(cmd, options);

          // Process the entire output as one disk if no clear separation
          const diskInfo: Record<string, string> = {};

          // Split by lines and process each line
          const lines = stdout.toString().split('\n');

          for (const line of lines) {
            const trimmedLine = line.trim().replaceAll('\r', '');

            // Skip empty lines
            if (trimmedLine === '') {
              continue;
            }

            // Parse key=value pair
            const parts = trimmedLine.split('=');

            if (parts.length >= 2) {
              const key = parts[0].trim();
              const value = parts.slice(1).join('=').trim();
              diskInfo[key] = value;
            }
          }

          // After processing all lines, create a disk entry if we have data
          if (Object.keys(diskInfo).length > 0) {
            const deviceId =
              diskInfo.DeviceID?.replace(/\\\\.\\|\\\\?\\|\\\\.\\PhysicalDrive/g, '').trim() || '';
            const size = Number.parseInt(diskInfo.Size || '0', 10);
            const model = diskInfo.Model?.trim() || '';
            const caption = diskInfo.Caption?.trim() || '';
            const mediaType = diskInfo.MediaType?.trim() || '';
            const interfaceType = diskInfo.InterfaceType?.trim() || '';
            const manufacturer = diskInfo.Manufacturer?.trim() || '';

            if (size > 0) {
              const diskLayoutEntry: DiskLayout = {
                device: deviceId,
                type:
                  mediaType?.toLowerCase().includes('ssd') ||
                  model.toLowerCase().includes('ssd') ||
                  caption.toLowerCase().includes('ssd') ||
                  model.toLowerCase().includes('nvme')
                    ? 'SSD'
                    : 'HD',
                name: caption || model,
                vendor: manufacturer,
                size,
                bytesPerSector: Number.parseInt(diskInfo.BytesPerSector || '0', 10),
                totalCylinders: Number.parseInt(diskInfo.TotalCylinders || '0', 10),
                totalHeads: Number.parseInt(diskInfo.TotalHeads || '0', 10),
                totalSectors: Number.parseInt(diskInfo.TotalSectors || '0', 10),
                tracksPerCylinder: Number.parseInt(diskInfo.TracksPerCylinder || '0', 10),
                sectorsPerTrack: Number.parseInt(diskInfo.SectorsPerTrack || '0', 10),
                totalTracks: Number.parseInt(diskInfo.TotalTracks || '0', 10),
                firmwareRevision: diskInfo.FirmwareRevision || '',
                serialNum: diskInfo.SerialNumber || '',
                interfaceType: getInterfaceType(interfaceType),
                smartStatus:
                  diskInfo.Status?.trim() === 'OK' ? 'Ok' : diskInfo.Status?.trim() || 'unknown',
                // Additional properties
                partitions: Number.parseInt(diskInfo.Partitions || '0', 10) || undefined,
                pnpDeviceId: diskInfo.PNPDeviceID || undefined,
                description: diskInfo.Description || undefined,
                busType: diskInfo.SCSIBus ? 'SCSI' : undefined,
                port: Number.parseInt(diskInfo.SCSIPort || '0', 10) || undefined,
                logicalUnit: Number.parseInt(diskInfo.SCSILogicalUnit || '0', 10) || undefined,
                targetId: Number.parseInt(diskInfo.SCSITargetId || '0', 10) || undefined,
                capabilities: diskInfo.CapabilityDescriptions
                  ? diskInfo.CapabilityDescriptions.replaceAll(/[{}]/g, '') // Remove curly braces
                      .split(',')
                      .map((item) => item.trim().replaceAll(/^"|"$/g, '')) // Remove surrounding quotes
                      .filter(Boolean) // Remove empty items
                  : undefined,
                systemName: diskInfo.SystemName || undefined,
              };

              result.push(diskLayoutEntry);
            }
          }
        } catch (error) {
          console.error('Error parsing disk layout information:', error);
          util.noop();
        }
      }

      if (callback) {
        callback(result);
      }

      resolve(result);
    });
  });
}
