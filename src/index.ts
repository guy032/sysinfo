import dotenv from 'dotenv';
import winrm from 'nodejs-winrm';
import { inspect } from 'util';

import {
  applications as getApplications,
  audio as getAudio,
  baseboard as getBaseboard,
  battery as getBatteryInfo,
  bios as getBios,
  blockDevices as getBlockDevices,
  chassis as getChassis,
  cpu as getCpu,
  diskLayout as getDiskLayout,
  fsSize as getFsSize,
  gps as getGps,
  graphics as getGraphics,
  hardwareDevices as getHardwareDevices,
  inetLatency as getInetLatency,
  mem as getMem,
  memLayout as getMemLayout,
  networkConnections as getNetworkConnections,
  networkGatewayDefault as getNetworkGatewayDefault,
  networkInterfaceDefault as getNetworkInterfaceDefault,
  networkInterfaces as getNetworkInterfaces,
  networkStats as getNetworkStats,
  osInfo as getOsInfo,
  printer as getPrinter,
  processes as getProcesses,
  services as getServices,
  shell as getShell,
  system as getSystem,
  time as getTime,
  usb as getUsb,
  users as getUsers,
  uuid as getUuid,
  wifiConnections as getWifiConnections,
  wifiInterfaces as getWifiInterfaces,
  wifiNetworks as getWifiNetworks,
} from './systeminformation/promise/lib';
dotenv.config();

// todo: add currentLoad missing
// todo: add fullLoad missing

// Type definitions
interface WinRMOptions {
  winrm: any;
  host: string;
  port: number;
  username: string;
  password: string;
}

interface TestConfig {
  filesystem: boolean;
  osinfo: boolean;
  processes: boolean;
  battery: boolean;
  wifi: boolean;
  audio: boolean;
  bluetooth: boolean;
  cpu: boolean;
  graphics: boolean;
  internet: boolean;
  memory: boolean;
  network: boolean;
  printers: boolean;
  system: boolean;
  usb: boolean;
  gps: boolean;
  users: boolean;
  screenshot?: boolean;
}

type ResultsData = Record<string, any>;

// Get WinRM connection parameters from environment variables
const host = process.env.WINRM_HOST || process.env.HOST || '';
const port = Number.parseInt(process.env.WINRM_PORT || process.env.PORT || '5985', 10) || 5985;
const username = process.env.WINRM_USERNAME || process.env.USERNAME || '';
const password = process.env.WINRM_PASSWORD || process.env.PASSWORD || '';

// Configure which tests to run
const testsToRun: TestConfig = {
  gps: false,
  battery: false,
  audio: false,
  bluetooth: false,
  filesystem: true,

  osinfo: false,
  processes: false,
  wifi: false,
  cpu: false,
  graphics: false,
  internet: false,
  memory: false,
  network: false,
  printers: false,
  system: false,
  usb: false,
  users: false,
};

// Max number of concurrent tasks
const MAX_CONCURRENT_TASKS = 10;

// todo: add windows scheduled tasks
// todo: add windows updates
// todo: add windows event logs
// todo: add windows firewall (rules, status, etc.)
// virtualbox: true,
// docker: true,
// vmware: true (optional to cover all virtualization platforms),

// Create a timeout wrapper for promises
const withTimeout = <T>(
  promise: Promise<T>,
  name: string,
  timeoutMs = 1_200_000,
): Promise<T | null> => {
  let timeoutId: NodeJS.Timeout;

  const startTime = Date.now();

  // Set the name property on the promise for tracking
  (promise as any).name = name;

  // Create a promise that resolves to null after the timeout
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => {
      const elapsedTime = Date.now() - startTime;
      console.error(
        `⏱️ Timeout: ${name} took longer than ${timeoutMs}ms (${(elapsedTime / 1000).toFixed(1)}s elapsed)`,
      );
      resolve(null);
    }, timeoutMs);
  });

  // Race the original promise against the timeout
  return Promise.race([
    promise
      .then((data) => {
        clearTimeout(timeoutId); // Clear the timeout when promise resolves

        return data;
      })
      .catch((error: Error) => {
        clearTimeout(timeoutId); // Clear the timeout when promise rejects
        const elapsedTime = Date.now() - startTime;
        console.error(
          `❌ Error in ${name} after ${(elapsedTime / 1000).toFixed(1)}s:`,
          error.message,
        );

        return null; // Return null instead of rejecting to allow Promise.all to continue
      }),
    timeoutPromise,
  ]);
};

// Process tasks in batches with limited concurrency
async function processBatches<T>(tasks: Array<Promise<T | null>>): Promise<Array<T | null>> {
  const results: Array<T | null> = [];
  const pendingTasks = [...tasks];
  const failedTasks: string[] = [];
  const succeededTasks: string[] = [];

  const startTime = Date.now();
  let batchNumber = 1;

  // Set a global timeout for the entire process
  const maxExecutionTime = 3_600_000; // 1 hour maximum execution time
  const executionTimeout = setTimeout(() => {
    console.error(
      `\n⏱️ GLOBAL TIMEOUT: Overall execution exceeded ${maxExecutionTime / 60_000} minutes`,
    );
    console.log(`\n==========================================`);
    console.log(
      `🏁 Force completing after timeout with ${succeededTasks.length}/${tasks.length} tasks completed`,
    );
    console.log(`✅ Succeeded: ${succeededTasks.length} tasks`);
    console.log(`❌ Failed/Pending: ${tasks.length - succeededTasks.length} tasks`);

    if (failedTasks.length > 0) {
      console.log(`\n❌ Failed tasks:`);

      for (const task of failedTasks) {
        console.log(`   - ${task}`);
      }
    }

    if (pendingTasks.length > 0) {
      console.log(`\n⏳ Pending tasks:`);

      for (const task of pendingTasks) {
        const taskName = (task as any).name || 'Unknown task';
        console.log(`   - ${taskName}`);
      }
    }

    console.log(`==========================================`);

    // Display results for completed tasks
    console.log('Partial results:');
    console.log(inspect(results, { depth: 5, colors: true }));

    // Force exit the process
    process.exit(1);
  }, maxExecutionTime);

  // Setup a progress reporting interval
  const progressInterval = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    console.log(
      `\n📊 Progress update: ${succeededTasks.length}/${tasks.length} tasks completed, ${pendingTasks.length} pending after ${(elapsedTime / 60_000).toFixed(1)} minutes`,
    );
  }, 300_000); // Status update every 5 minutes

  try {
    while (pendingTasks.length > 0) {
      const batch = pendingTasks.splice(0, MAX_CONCURRENT_TASKS);
      console.log(
        `\n🔄 Processing batch #${batchNumber} with ${batch.length} tasks (${pendingTasks.length} remaining)`,
      );
      const batchStartTime = Date.now();

      // Add names to any unnamed tasks for better tracking
      for (const [index, task] of batch.entries()) {
        if (!(task as any).name) {
          (task as any).name = `Task-${results.length + index + 1}`;
        }
      }

      // Wait for current batch to complete before starting next batch
      const batchResults = await Promise.all(batch);

      // Track successes and failures
      for (const [i, batchResult] of batchResults.entries()) {
        if (batchResult === null) {
          failedTasks.push((batch[i] as any).name || `Task #${results.length + i + 1}`);
        } else {
          succeededTasks.push((batch[i] as any).name || `Task #${results.length + i + 1}`);
        }
      }

      results.push(...batchResults);

      // Batch summary
      const batchElapsed = Date.now() - batchStartTime;
      console.log(`✅ Batch #${batchNumber} completed in ${(batchElapsed / 1000).toFixed(1)}s`);
      batchNumber++;
    }

    // Final summary
    const totalElapsed = Date.now() - startTime;
    console.log(`\n==========================================`);
    console.log(`🏁 All ${tasks.length} tasks completed in ${(totalElapsed / 1000).toFixed(1)}s`);
    console.log(`✅ Succeeded: ${succeededTasks.length} tasks`);
    console.log(`❌ Failed: ${failedTasks.length} tasks`);

    if (failedTasks.length > 0) {
      console.log(`\n❌ Failed tasks:`);

      for (const task of failedTasks) {
        console.log(`   - ${task}`);
      }
    }

    console.log(`==========================================`);
  } finally {
    // Clean up timers regardless of outcome
    clearTimeout(executionTimeout);
    clearInterval(progressInterval);
  }

  return results;
}

// Update the main function to include better error handling
(async () => {
  const options: WinRMOptions = {
    winrm,
    host,
    port,
    username,
    password,
  };

  // Use a type that accepts any data but not 'any'
  const tasks: Array<Promise<unknown>> = [];
  const results: ResultsData = {};

  // Battery
  if (testsToRun.battery) {
    tasks.push(
      withTimeout(
        getBatteryInfo(options).then((data) => {
          results.batteryInfo = data;

          return data;
        }),
        'batteryInfo',
      ),
    );
  }

  // Wifi
  if (testsToRun.wifi) {
    const wifiTasks = [
      withTimeout(
        getWifiNetworks(options).then((data) => {
          results.wifiNetworks = data;

          return data;
        }),
        'wifiNetworks',
      ),
      withTimeout(
        getWifiInterfaces(options).then((data) => {
          results.wifiInterfaces = data;

          return data;
        }),
        'wifiInterfaces',
      ),
      withTimeout(
        getWifiConnections(options).then((data) => {
          results.wifiConnections = data;

          return data;
        }),
        'wifiConnections',
      ),
    ];
    tasks.push(...wifiTasks);
  }

  // Audio
  if (testsToRun.audio) {
    tasks.push(
      withTimeout(
        getAudio(options).then((data) => {
          results.audio = data;

          return data;
        }),
        'audio',
      ),
    );
  }

  // Bluetooth
  if (testsToRun.bluetooth) {
    tasks.push(
      withTimeout(
        getHardwareDevices(options).then((data) => {
          results.hardwareDevices = data;

          return data;
        }),
        'hardwareDevices',
      ),
    );
  }

  // CPU
  if (testsToRun.cpu) {
    tasks.push(
      withTimeout(
        getCpu(options).then((data) => {
          results.cpu = data;

          return data;
        }),
        'cpu',
      ),
    );
  }

  // Graphics
  if (testsToRun.graphics) {
    tasks.push(
      withTimeout(
        getGraphics(options).then((data) => {
          results.graphics = data;

          return data;
        }),
        'graphics',
      ),
    );
  }

  // Filesystem
  if (testsToRun.filesystem) {
    const filesystemTasks = [
      withTimeout(
        getDiskLayout(options).then((data) => {
          results.diskLayout = data;

          return data;
        }),
        'diskLayout',
      ),
      withTimeout(
        getBlockDevices(options).then((data) => {
          results.blockDevices = data;

          return data;
        }),
        'blockDevices',
      ),
      withTimeout(
        getFsSize(options).then((data) => {
          results.fsSize = data;

          return data;
        }),
        'fsSize',
      ),
    ];
    tasks.push(...filesystemTasks);
  }

  // Internet
  if (testsToRun.internet) {
    tasks.push(
      withTimeout(
        getInetLatency(options).then((data) => {
          results.inetLatency = data;

          return data;
        }),
        'inetLatency',
      ),
    );
  }

  // Memory
  if (testsToRun.memory) {
    const memoryTasks = [
      withTimeout(
        getMem(options).then((data) => {
          results.mem = data;

          return data;
        }),
        'mem',
      ),
      withTimeout(
        getMemLayout(options).then((data) => {
          results.memLayout = data;

          return data;
        }),
        'memLayout',
      ),
    ];
    tasks.push(...memoryTasks);
  }

  // Network
  if (testsToRun.network) {
    const networkTasks = [
      withTimeout(
        getNetworkStats(options).then((data) => {
          results.networkStats = data;

          return data;
        }),
        'networkStats',
      ),
      withTimeout(
        getNetworkInterfaceDefault(options).then((data) => {
          results.networkInterfaceDefault = data;

          return data;
        }),
        'networkInterfaceDefault',
      ),
      withTimeout(
        getNetworkGatewayDefault(options).then((data) => {
          results.networkGatewayDefault = data;

          return data;
        }),
        'networkGatewayDefault',
      ),
      withTimeout(
        getNetworkInterfaces(options).then((data) => {
          results.networkInterfaces = data;

          return data;
        }),
        'networkInterfaces',
      ),
      withTimeout(
        getNetworkConnections(options).then((data) => {
          results.networkConnections = data;

          return data;
        }),
        'networkConnections',
      ),
    ];
    tasks.push(...networkTasks);
  }

  // OS
  if (testsToRun.osinfo) {
    const osTasks = [
      withTimeout(
        getTime(options).then((data) => {
          results.time = data;

          return data;
        }),
        'time',
      ),
      withTimeout(
        getOsInfo(options).then((data) => {
          results.osInfo = data;

          return data;
        }),
        'osInfo',
      ),
      withTimeout(
        getApplications(options).then((data) => {
          results.applications = data;

          return data;
        }),
        'applications',
      ),
      withTimeout(
        getShell(options).then((data) => {
          results.shell = data;

          return data;
        }),
        'shell',
      ),
      withTimeout(
        getUuid(options).then((data) => {
          results.uuid = data;

          return data;
        }),
        'uuid',
      ),
    ];
    tasks.push(...osTasks);
  }

  // Printers
  if (testsToRun.printers) {
    tasks.push(
      withTimeout(
        getPrinter(options).then((data) => {
          results.printers = data;

          return data;
        }),
        'printers',
      ),
    );
  }

  // System
  if (testsToRun.system) {
    const systemTasks = [
      withTimeout(
        getBaseboard(options).then((data) => {
          results.baseboard = data;

          return data;
        }),
        'baseboard',
      ),
      withTimeout(
        getSystem(options).then((data) => {
          results.system = data;

          return data;
        }),
        'system',
      ),
      withTimeout(
        getChassis(options).then((data) => {
          results.chassis = data;

          return data;
        }),
        'chassis',
      ),
      withTimeout(
        getBios(options).then((data) => {
          results.bios = data;

          return data;
        }),
        'bios',
      ),
    ];
    tasks.push(...systemTasks);
  }

  // USB
  if (testsToRun.usb) {
    tasks.push(
      withTimeout(
        getUsb(options).then((data) => {
          results.usb = data;

          return data;
        }),
        'usb',
      ),
    );
  }

  // Users
  if (testsToRun.users) {
    tasks.push(
      withTimeout(
        getUsers(options).then((data) => {
          results.users = data;

          return data;
        }),
        'users',
      ),
    );
  }

  // GPS
  if (testsToRun.gps) {
    tasks.push(
      withTimeout(
        getGps(options).then((data) => {
          results.gps = data;

          return data;
        }),
        'gps',
      ),
    );
  }

  // Processes
  if (testsToRun.processes) {
    const processTasks = [
      withTimeout(
        getProcesses(options).then((data) => {
          results.processes = data;

          return data;
        }),
        'processes',
        180_000,
      ), // 3 minute timeout
      withTimeout(
        getServices(options).then((data) => {
          results.services = data;

          return data;
        }),
        'services',
      ),
    ];
    tasks.push(...processTasks);
  }

  // Screenshot - commented out as the function is not imported
  /*
  if (testsToRun.screenshot) {
    tasks.push(
      withTimeout(
        getScreenshot(options).then((data) => {
          results.screenshot = data;
          return data;
        }),
        'screenshot',
      ),
    );
  }
  */

  try {
    // Run tasks with controlled concurrency
    await processBatches(tasks);

    // Display results
    console.log(inspect(results, { depth: 5, colors: true }));
  } catch (error) {
    console.error('Error in batch processing:', error);
  }
})();
