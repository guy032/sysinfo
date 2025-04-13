const util = require('util');
const winrm = require('nodejs-winrm');
const {
  battery: getBatteryInfo,
  wifiNetworks: getWifiNetworks,
  wifiInterfaces: getWifiInterfaces,
  wifiConnections: getWifiConnections,
  audio: getAudio,
  bluetoothDevices: getBluetoothDevices,
  cpu: getCpu,
  graphics: getGraphics,
  diskLayout: getDiskLayout,
  blockDevices: getBlockDevices,
  fsSize: getFsSize,
  inetLatency: getInetLatency,
  mem: getMem,
  memLayout: getMemLayout,
  networkInterfaces: getNetworkInterfaces,
  networkStats: getNetworkStats,
  networkGatewayDefault: getNetworkGatewayDefault,
  networkInterfaceDefault: getNetworkInterfaceDefault,
  networkConnections: getNetworkConnections,
  osInfo: getOsInfo,
  versions: getVersions,
  shell: getShell,
  uuid: getUuid,
  time: getTime,
  printer: getPrinter,
  system: getSystem,
  baseboard: getBaseboard,
  chassis: getChassis,
  bios: getBios,
  usb: getUsb,
  users: getUsers,
  gps: getGps,
  processes: getProcesses,
  services: getServices,
} = require('./systeminformation/promise/lib');

require('dotenv').config();

// Get WinRM connection parameters from environment variables
const host = process.env.WINRM_HOST || process.env.HOST;
const port = parseInt(process.env.WINRM_PORT || process.env.PORT, 10) || 5985;
const username = process.env.WINRM_USERNAME || process.env.USERNAME;
const password = process.env.WINRM_PASSWORD || process.env.PASSWORD;

// Configure which tests to run
const testsToRun = {
  filesystem: true,
  osinfo: true,
  processes: true,
  battery: true,
  wifi: true,
  audio: true,
  bluetooth: true,
  cpu: true,
  graphics: true,
  internet: true,
  memory: true,
  network: true,
  printers: true,
  system: true,
  usb: true,
  gps: true,
  users: true,
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
const withTimeout = (promise, name, timeoutMs = 1200000) => {
  let timeoutId;
  
  const startTime = Date.now();
  
  // Set the name property on the promise for tracking
  promise.name = name;
  
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise(resolve => {
    timeoutId = setTimeout(() => {
      const elapsedTime = Date.now() - startTime;
      console.error(`⏱️ Timeout: ${name} took longer than ${timeoutMs}ms (${(elapsedTime/1000).toFixed(1)}s elapsed)`);
      resolve(null);
    }, timeoutMs);
  });
  
  // Race the original promise against the timeout
  return Promise.race([
    promise.then(data => {
      clearTimeout(timeoutId); // Clear the timeout when promise resolves
      return data;
    }).catch(err => {
      clearTimeout(timeoutId); // Clear the timeout when promise rejects
      const elapsedTime = Date.now() - startTime;
      console.error(`❌ Error in ${name} after ${(elapsedTime/1000).toFixed(1)}s:`, err.message);
      return null; // Return null instead of rejecting to allow Promise.all to continue
    }),
    timeoutPromise
  ]);
};

// Process tasks in batches with limited concurrency
async function processBatches(tasks) {
  const results = [];
  const pendingTasks = [...tasks];
  const failedTasks = [];
  const succeededTasks = [];
  
  const startTime = Date.now();
  let batchNumber = 1;
  
  // Set a global timeout for the entire process
  const maxExecutionTime = 3600000; // 1 hour maximum execution time
  const executionTimeout = setTimeout(() => {
    console.error(`\n⏱️ GLOBAL TIMEOUT: Overall execution exceeded ${maxExecutionTime/60000} minutes`);
    console.log(`\n==========================================`);
    console.log(`🏁 Force completing after timeout with ${succeededTasks.length}/${tasks.length} tasks completed`);
    console.log(`✅ Succeeded: ${succeededTasks.length} tasks`);
    console.log(`❌ Failed/Pending: ${tasks.length - succeededTasks.length} tasks`);
    
    if (failedTasks.length > 0) {
      console.log(`\n❌ Failed tasks:`);
      failedTasks.forEach(task => console.log(`   - ${task}`));
    }
    
    if (pendingTasks.length > 0) {
      console.log(`\n⏳ Pending tasks:`);
      pendingTasks.forEach(task => {
        const taskName = task.name || "Unknown task";
        console.log(`   - ${taskName}`);
      });
    }
    
    console.log(`==========================================`);
    
    // Display results for completed tasks
    console.log('Partial results:');
    console.log(util.inspect(results, {depth: 5, colors: true}));
    
    // Force exit the process
    process.exit(1);
  }, maxExecutionTime);
  
  // Setup a progress reporting interval
  const progressInterval = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    console.log(`\n📊 Progress update: ${succeededTasks.length}/${tasks.length} tasks completed, ${pendingTasks.length} pending after ${(elapsedTime/60000).toFixed(1)} minutes`);
  }, 300000); // Status update every 5 minutes
  
  try {
    while (pendingTasks.length > 0) {
      const batch = pendingTasks.splice(0, MAX_CONCURRENT_TASKS);
      console.log(`\n🔄 Processing batch #${batchNumber} with ${batch.length} tasks (${pendingTasks.length} remaining)`);
      const batchStartTime = Date.now();
      
      // Add names to any unnamed tasks for better tracking
      batch.forEach((task, index) => {
        if (!task.name) {
          task.name = `Task-${results.length + index + 1}`;
        }
      });
      
      // Wait for current batch to complete before starting next batch
      const batchResults = await Promise.all(batch);
      
      // Track successes and failures
      for (let i = 0; i < batchResults.length; i++) {
        if (batchResults[i] === null) {
          failedTasks.push(batch[i].name || `Task #${results.length + i + 1}`);
        } else {
          succeededTasks.push(batch[i].name || `Task #${results.length + i + 1}`);
        }
      }
      
      results.push(...batchResults);
      
      // Batch summary
      const batchElapsed = Date.now() - batchStartTime;
      console.log(`✅ Batch #${batchNumber} completed in ${(batchElapsed/1000).toFixed(1)}s`);
      batchNumber++;
    }
    
    // Final summary
    const totalElapsed = Date.now() - startTime;
    console.log(`\n==========================================`);
    console.log(`🏁 All ${tasks.length} tasks completed in ${(totalElapsed/1000).toFixed(1)}s`);
    console.log(`✅ Succeeded: ${succeededTasks.length} tasks`);
    console.log(`❌ Failed: ${failedTasks.length} tasks`);
    
    if (failedTasks.length > 0) {
      console.log(`\n❌ Failed tasks:`);
      failedTasks.forEach(task => console.log(`   - ${task}`));
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
  const options = {
    winrm,
    host,
    port,
    username,
    password
  };

  const tasks = [];
  const results = {};

  // Battery
  if (testsToRun.battery) {
    tasks.push(withTimeout(getBatteryInfo(options).then(data => results.batteryInfo = data), 'batteryInfo'));
  }

  // Wifi
  if (testsToRun.wifi) {
    tasks.push(withTimeout(getWifiNetworks(options).then(data => results.wifiNetworks = data), 'wifiNetworks'));
    tasks.push(withTimeout(getWifiInterfaces(options).then(data => results.wifiInterfaces = data), 'wifiInterfaces'));
    tasks.push(withTimeout(getWifiConnections(options).then(data => results.wifiConnections = data), 'wifiConnections'));
  }

  // Audio
  if (testsToRun.audio) {
    tasks.push(withTimeout(getAudio(options).then(data => results.audio = data), 'audio'));
  }

  // Bluetooth
  if (testsToRun.bluetooth) {
    tasks.push(withTimeout(getBluetoothDevices(options).then(data => results.bluetoothDevices = data), 'bluetoothDevices'));
  }

  // CPU
  if (testsToRun.cpu) {
    tasks.push(withTimeout(getCpu(options).then(data => results.cpu = data), 'cpu'));
  }

  // Graphics
  if (testsToRun.graphics) {
    tasks.push(withTimeout(getGraphics(options).then(data => results.graphics = data), 'graphics'));
  }

  // Filesystem
  if (testsToRun.filesystem) {
    tasks.push(withTimeout(getDiskLayout(options).then(data => results.diskLayout = data), 'diskLayout'));
    tasks.push(withTimeout(getBlockDevices(options).then(data => results.blockDevices = data), 'blockDevices'));
    tasks.push(withTimeout(getFsSize(options).then(data => results.fsSize = data), 'fsSize'));
  }

  // Internet
  if (testsToRun.internet) {
    tasks.push(withTimeout(getInetLatency(options).then(data => results.inetLatency = data), 'inetLatency'));
  }

  // Memory
  if (testsToRun.memory) {
    tasks.push(withTimeout(getMem(options).then(data => results.mem = data), 'mem'));
    tasks.push(withTimeout(getMemLayout(options).then(data => results.memLayout = data), 'memLayout'));
  }

  // Network
  if (testsToRun.network) {
    tasks.push(withTimeout(getNetworkStats(options).then(data => results.networkStats = data), 'networkStats'));
    tasks.push(withTimeout(getNetworkInterfaceDefault(options).then(data => results.networkInterfaceDefault = data), 'networkInterfaceDefault'));
    tasks.push(withTimeout(getNetworkGatewayDefault(options).then(data => results.networkGatewayDefault = data), 'networkGatewayDefault'));
    tasks.push(withTimeout(getNetworkInterfaces(options).then(data => results.networkInterfaces = data), 'networkInterfaces'));
    tasks.push(withTimeout(getNetworkConnections(options).then(data => results.networkConnections = data), 'networkConnections'));
  }

  // OS
  if (testsToRun.osinfo) {
    tasks.push(withTimeout(getTime(options).then(data => results.time = data), 'time'));
    tasks.push(withTimeout(getOsInfo(options).then(data => results.osInfo = data), 'osInfo'));
    tasks.push(withTimeout(getVersions(options).then(data => results.versions = data), 'versions'));
    tasks.push(withTimeout(getShell(options).then(data => results.shell = data), 'shell'));
    tasks.push(withTimeout(getUuid(options).then(data => results.uuid = data), 'uuid'));
  }

  // Printers
  if (testsToRun.printers) {
    tasks.push(withTimeout(getPrinter(options).then(data => results.printers = data), 'printers'));
  }

  // System
  if (testsToRun.system) {
    tasks.push(withTimeout(getBaseboard(options).then(data => results.baseboard = data), 'baseboard'));
    tasks.push(withTimeout(getSystem(options).then(data => results.system = data), 'system'));
    tasks.push(withTimeout(getChassis(options).then(data => results.chassis = data), 'chassis'));
    tasks.push(withTimeout(getBios(options).then(data => results.bios = data), 'bios'));
  }

  // USB
  if (testsToRun.usb) {
    tasks.push(withTimeout(getUsb(options).then(data => results.usb = data), 'usb'));
  }

  // Users
  if (testsToRun.users) {
    tasks.push(withTimeout(getUsers(options).then(data => results.users = data), 'users'));
  }

  // GPS
  if (testsToRun.gps) {
    tasks.push(withTimeout(getGps(options).then(data => results.gps = data), 'gps'));
  }

  // Processes
  if (testsToRun.processes) {
    tasks.push(withTimeout(getProcesses(options).then(data => results.processes = data), 'processes', 180000)); // 3 minute timeout
    tasks.push(withTimeout(getServices(options).then(data => results.services = data), 'services'));
  }

  // Screenshot
  if (testsToRun.screenshot) {
    tasks.push(withTimeout(getScreenshot(options).then(data => results.screenshot = data), 'screenshot'));
  }

  try {
    // Run tasks with controlled concurrency
    await processBatches(tasks);

    // Display results
    console.log(util.inspect(results, {depth: 5, colors: true}));
  } catch (err) {
    console.error('Error in batch processing:', err);
  }
})()
