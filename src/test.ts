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
  bluetoothDevices as getBluetoothDevices,
  chassis as getChassis,
  cpu as getCpu,
  diskLayout as getDiskLayout,
  files as getFiles,
  fsOpenFiles as getFsOpenFiles,
  fsSize as getFsSize,
  fsStats as getFsStats,
  gps as getGps,
  graphics as getGraphics,
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
} from './promise/lib';
dotenv.config();

// todo: add currentLoad missing
// todo: add fullLoad missing

// Type definitions
interface IWinRMOptions {
  winrm: any;
  host: string;
  port: number;
  username: string;
  password: string;
  skipSpeedMeasurement?: boolean;
}

interface ITestConfig {
  filesystem: boolean;
  osinfo: boolean;
  processes: boolean;
  services: boolean;
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
  files?: boolean;
  // screenshot?: boolean;
}

type ResultsData = Record<string, any>;
type TaskFunction = (options: IWinRMOptions) => Promise<any>;
interface ITaskDefinition {
  fn: TaskFunction;
  name: string;
  resultKey: string;
}

// Get WinRM connection parameters from environment variables
const host = process.env.WINRM_HOST || process.env.HOST || '';
const port = Number.parseInt(process.env.WINRM_PORT || process.env.PORT || '5985', 10) || 5985;
const username = process.env.WINRM_USERNAME || process.env.USERNAME || '';
const password = process.env.WINRM_PASSWORD || process.env.PASSWORD || '';

// Configure which tests to run
const testsToRun: ITestConfig = {
  gps: true,
  battery: true,
  audio: true,
  bluetooth: true,
  usb: true,
  internet: true,
  printers: true,
  osinfo: true,
  processes: true,
  services: true,
  wifi: true,
  graphics: true,
  memory: true,
  network: true,
  system: true,
  users: true,
  cpu: true,
  filesystem: false,
  files: false,
  // screenshot: false,
};

// Max number of concurrent tasks - optimized for WinRM
const MAX_CONCURRENT_TASKS = 10; // Slightly reduced to prevent overwhelming WinRM service

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
  timeoutMs = 300_000, // Reduced from 20 minutes to 5 minutes
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

// Process tasks with controlled concurrency using a semaphore-like approach
async function processTasksWithConcurrency<T>(
  tasks: Array<Promise<T | null>>,
): Promise<Array<T | null>> {
  const results: Array<T | null> = Array.from({ length: tasks.length });
  const failedTasks: string[] = [];
  const succeededTasks: string[] = [];
  const taskTimings: Array<{ name: string; duration: number }> = [];
  let completedCount = 0;

  const startTime = Date.now();

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

    console.log(`==========================================`);

    process.exit(1);
  }, maxExecutionTime);

  // Setup a progress reporting interval
  const progressInterval = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    console.log(
      `\n📊 Progress update: ${completedCount}/${tasks.length} tasks completed after ${(elapsedTime / 1000).toFixed(1)}s`,
    );
  }, 10_000); // Status update every 10 seconds for faster feedback

  console.log(
    `\n🚀 Starting ${tasks.length} tasks with max ${MAX_CONCURRENT_TASKS} concurrent executions`,
  );

  // Create a semaphore to limit concurrency
  let activeTasks = 0;
  const taskQueue: Array<() => void> = [];

  const executeTask = async (taskIndex: number) => {
    const task = tasks[taskIndex];
    const taskName = (task as any).name || `Task-${taskIndex + 1}`;
    const taskStartTime = Date.now();

    try {
      const result = await task;
      const taskDuration = Date.now() - taskStartTime;

      results[taskIndex] = result;
      taskTimings.push({ name: String(taskName), duration: taskDuration });

      if (result === null) {
        failedTasks.push(String(taskName));
      } else {
        succeededTasks.push(String(taskName));
      }
    } catch (error) {
      const taskDuration = Date.now() - taskStartTime;
      console.error(`❌ Unexpected error in ${String(taskName)}:`, error);
      results[taskIndex] = null;
      failedTasks.push(String(taskName));
      taskTimings.push({ name: String(taskName), duration: taskDuration });
    }

    completedCount++;
    activeTasks--;

    // Start next queued task if any
    if (taskQueue.length > 0) {
      const nextTask = taskQueue.shift()!;
      nextTask();
    }
  };

  // Create promises for all tasks with concurrency control
  const taskPromises: Array<Promise<void>> = [];

  for (let i = 0; i < tasks.length; i++) {
    const taskPromise = new Promise<void>((resolve) => {
      const startTask = () => {
        activeTasks++;
        executeTask(i).finally(resolve);
      };

      if (activeTasks < MAX_CONCURRENT_TASKS) {
        startTask();
      } else {
        taskQueue.push(startTask);
      }
    });

    taskPromises.push(taskPromise);
  }

  try {
    // Wait for all tasks to complete
    await Promise.all(taskPromises);

    // Final summary
    const totalElapsed = Date.now() - startTime;
    console.log(`\n==========================================`);
    console.log(`🏁 All ${tasks.length} tasks completed in ${(totalElapsed / 1000).toFixed(1)}s`);
    console.log(`✅ Succeeded: ${succeededTasks.length} tasks`);
    console.log(`❌ Failed: ${failedTasks.length} tasks`);

    // Sort tasks by duration (longest first) and display timing information
    const sortedTimings = taskTimings.sort((a, b) => b.duration - a.duration);
    console.log(`\n⏱️ Task execution times (sorted by duration):`);

    for (const timing of sortedTimings) {
      const status = failedTasks.includes(timing.name) ? '❌' : '✅';
      const percentage = ((timing.duration / totalElapsed) * 100).toFixed(1);
      console.log(
        `   ${status} ${timing.name}: ${(timing.duration / 1000).toFixed(1)}s (${percentage}%)`,
      );
    }

    // Additional timing statistics
    if (taskTimings.length > 0) {
      const durations = taskTimings.map((t) => t.duration);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      console.log(`\n📊 Timing Statistics:`);
      console.log(`   Average task time: ${(avgDuration / 1000).toFixed(1)}s`);
      console.log(`   Slowest task: ${(maxDuration / 1000).toFixed(1)}s`);
      console.log(`   Fastest task: ${(minDuration / 1000).toFixed(1)}s`);
      console.log(`   Time range: ${((maxDuration - minDuration) / 1000).toFixed(1)}s spread`);
    }

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

// Creates a task from a function and saves its result to the results object
function createTask(
  fn: TaskFunction,
  name: string,
  resultKey: string,
  results: ResultsData,
  options: IWinRMOptions,
): Promise<unknown> {
  const promise = withTimeout(
    fn(options).then((data) => {
      results[resultKey] = data;

      return data;
    }),
    name,
  );

  // Ensure the name is accessible on the promise
  (promise as any).name = name;

  return promise;
}

// Task definitions grouped by category
const taskDefinitions: Record<keyof ITestConfig, ITaskDefinition[]> = {
  filesystem: [
    { fn: getDiskLayout, name: 'diskLayout', resultKey: 'diskLayout' },
    { fn: getBlockDevices, name: 'blockDevices', resultKey: 'blockDevices' },
    { fn: getFsSize, name: 'fsSize', resultKey: 'fsSize' },
    { fn: getFsStats, name: 'fsStats', resultKey: 'fsStats' },
    { fn: getFsOpenFiles, name: 'fsOpenFiles', resultKey: 'fsOpenFiles' },
  ],
  battery: [{ fn: getBatteryInfo, name: 'batteryInfo', resultKey: 'batteryInfo' }],
  wifi: [
    { fn: getWifiNetworks, name: 'wifiNetworks', resultKey: 'wifiNetworks' },
    { fn: getWifiInterfaces, name: 'wifiInterfaces', resultKey: 'wifiInterfaces' },
    { fn: getWifiConnections, name: 'wifiConnections', resultKey: 'wifiConnections' },
  ],
  audio: [{ fn: getAudio, name: 'audio', resultKey: 'audio' }],
  bluetooth: [{ fn: getBluetoothDevices, name: 'bluetooth', resultKey: 'bluetoothDevices' }],
  cpu: [{ fn: getCpu, name: 'cpu', resultKey: 'cpu' }],
  graphics: [{ fn: getGraphics, name: 'graphics', resultKey: 'graphics' }],
  internet: [{ fn: getInetLatency, name: 'inetLatency', resultKey: 'inetLatency' }],
  memory: [
    { fn: getMem, name: 'mem', resultKey: 'mem' },
    { fn: getMemLayout, name: 'memLayout', resultKey: 'memLayout' },
  ],
  network: [
    { fn: getNetworkStats, name: 'networkStats', resultKey: 'networkStats' },
    {
      fn: getNetworkGatewayDefault,
      name: 'networkGatewayDefault',
      resultKey: 'networkGatewayDefault',
    },
    { fn: getNetworkInterfaces, name: 'networkInterfaces', resultKey: 'networkInterfaces' },
    { fn: getNetworkConnections, name: 'networkConnections', resultKey: 'networkConnections' },
    {
      fn: getNetworkInterfaceDefault,
      name: 'defaultNetworkInterface',
      resultKey: 'defaultNetworkInterface',
    },
  ],
  osinfo: [
    { fn: getTime, name: 'time', resultKey: 'time' },
    { fn: getOsInfo, name: 'osInfo', resultKey: 'osInfo' },
    { fn: getShell, name: 'shell', resultKey: 'shell' },
    { fn: getUuid, name: 'uuid', resultKey: 'uuid' },
    { fn: getApplications, name: 'applications', resultKey: 'applications' },
  ],
  printers: [{ fn: getPrinter, name: 'printers', resultKey: 'printers' }],
  system: [
    { fn: getBaseboard, name: 'baseboard', resultKey: 'baseboard' },
    { fn: getSystem, name: 'system', resultKey: 'system' },
    { fn: getChassis, name: 'chassis', resultKey: 'chassis' },
    { fn: getBios, name: 'bios', resultKey: 'bios' },
  ],
  usb: [{ fn: getUsb, name: 'usb', resultKey: 'usb' }],
  users: [{ fn: getUsers, name: 'users', resultKey: 'users' }],
  gps: [{ fn: getGps, name: 'gps', resultKey: 'gps' }],
  processes: [{ fn: getProcesses, name: 'processes', resultKey: 'processes' }],
  services: [{ fn: getServices, name: 'services', resultKey: 'services' }],
  files: [{ fn: getFiles, name: 'files', resultKey: 'files' }],
};

// Update the main function to include better error handling
(async () => {
  const options: IWinRMOptions = {
    winrm,
    host,
    port,
    username,
    password,
    // Enable fast mode for network stats (skips speed measurements)
    skipSpeedMeasurement: true,
  };

  const results: ResultsData = {};
  const tasks: Array<Promise<unknown>> = [];

  // Generate tasks based on configuration
  for (const [category, enabled] of Object.entries(testsToRun)) {
    if (enabled) {
      const categoryTasks = taskDefinitions[category as keyof ITestConfig];

      for (const task of categoryTasks) {
        tasks.push(createTask(task.fn, task.name, task.resultKey, results, options));
      }
    }
  }

  try {
    // Run tasks with controlled concurrency
    await processTasksWithConcurrency(tasks);

    // Display results
    // console.log(inspect(results, { depth: 5, colors: true }));
    // console.log(JSON.stringify(results));
  } catch (error) {
    console.error('Error in task processing:', error);
  }
})();
