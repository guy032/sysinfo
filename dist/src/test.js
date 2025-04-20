"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const nodejs_winrm_1 = tslib_1.__importDefault(require("nodejs-winrm"));
const util_1 = require("util");
const lib_1 = require("./promise/lib");
dotenv_1.default.config();
// Get WinRM connection parameters from environment variables
const host = process.env.WINRM_HOST || process.env.HOST || '';
const port = Number.parseInt(process.env.WINRM_PORT || process.env.PORT || '5985', 10) || 5985;
const username = process.env.WINRM_USERNAME || process.env.USERNAME || '';
const password = process.env.WINRM_PASSWORD || process.env.PASSWORD || '';
// Configure which tests to run
const testsToRun = {
    gps: false,
    battery: false,
    audio: false,
    bluetooth: false,
    usb: false,
    internet: false,
    printers: false,
    osinfo: false,
    processes: false,
    services: false,
    wifi: false,
    graphics: false,
    memory: false,
    network: false,
    system: false,
    users: false,
    cpu: false,
    filesystem: false,
    files: true,
    // screenshot: false,
};
// Max number of concurrent tasks
const MAX_CONCURRENT_TASKS = 5;
// todo: add windows scheduled tasks
// todo: add windows updates
// todo: add windows event logs
// todo: add windows firewall (rules, status, etc.)
// virtualbox: true,
// docker: true,
// vmware: true (optional to cover all virtualization platforms),
// Create a timeout wrapper for promises
const withTimeout = (promise, name, timeoutMs = 1_200_000) => {
    let timeoutId;
    const startTime = Date.now();
    // Set the name property on the promise for tracking
    promise.name = name;
    // Create a promise that resolves to null after the timeout
    const timeoutPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => {
            const elapsedTime = Date.now() - startTime;
            console.error(`⏱️ Timeout: ${name} took longer than ${timeoutMs}ms (${(elapsedTime / 1000).toFixed(1)}s elapsed)`);
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
            .catch((error) => {
            clearTimeout(timeoutId); // Clear the timeout when promise rejects
            const elapsedTime = Date.now() - startTime;
            console.error(`❌ Error in ${name} after ${(elapsedTime / 1000).toFixed(1)}s:`, error.message);
            return null; // Return null instead of rejecting to allow Promise.all to continue
        }),
        timeoutPromise,
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
    const maxExecutionTime = 3_600_000; // 1 hour maximum execution time
    const executionTimeout = setTimeout(() => {
        console.error(`\n⏱️ GLOBAL TIMEOUT: Overall execution exceeded ${maxExecutionTime / 60_000} minutes`);
        console.log(`\n==========================================`);
        console.log(`🏁 Force completing after timeout with ${succeededTasks.length}/${tasks.length} tasks completed`);
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
                const taskName = task.name || 'Unknown task';
                console.log(`   - ${taskName}`);
            }
        }
        console.log(`==========================================`);
        // Display results for completed tasks
        console.log('Partial results:');
        console.log((0, util_1.inspect)(results, { depth: 5, colors: true }));
        // Force exit the process
        process.exit(1);
    }, maxExecutionTime);
    // Setup a progress reporting interval
    const progressInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        console.log(`\n📊 Progress update: ${succeededTasks.length}/${tasks.length} tasks completed, ${pendingTasks.length} pending after ${(elapsedTime / 60_000).toFixed(1)} minutes`);
    }, 300_000); // Status update every 5 minutes
    try {
        while (pendingTasks.length > 0) {
            const batch = pendingTasks.splice(0, MAX_CONCURRENT_TASKS);
            console.log(`\n🔄 Processing batch #${batchNumber} with ${batch.length} tasks (${pendingTasks.length} remaining)`);
            const batchStartTime = Date.now();
            // Add names to any unnamed tasks for better tracking
            for (const [index, task] of batch.entries()) {
                if (!task.name) {
                    task.name = `Task-${results.length + index + 1}`;
                }
            }
            // Wait for current batch to complete before starting next batch
            const batchResults = await Promise.all(batch);
            // Track successes and failures
            for (const [i, batchResult] of batchResults.entries()) {
                if (batchResult === null) {
                    failedTasks.push(batch[i].name || `Task #${results.length + i + 1}`);
                }
                else {
                    succeededTasks.push(batch[i].name || `Task #${results.length + i + 1}`);
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
    }
    finally {
        // Clean up timers regardless of outcome
        clearTimeout(executionTimeout);
        clearInterval(progressInterval);
    }
    return results;
}
// Creates a task from a function and saves its result to the results object
function createTask(fn, name, resultKey, results, options) {
    return withTimeout(fn(options).then((data) => {
        results[resultKey] = data;
        return data;
    }), name);
}
// Task definitions grouped by category
const taskDefinitions = {
    filesystem: [
        { fn: lib_1.diskLayout, name: 'diskLayout', resultKey: 'diskLayout' },
        { fn: lib_1.blockDevices, name: 'blockDevices', resultKey: 'blockDevices' },
        { fn: lib_1.fsSize, name: 'fsSize', resultKey: 'fsSize' },
        { fn: lib_1.fsStats, name: 'fsStats', resultKey: 'fsStats' },
        { fn: lib_1.fsOpenFiles, name: 'fsOpenFiles', resultKey: 'fsOpenFiles' },
    ],
    battery: [{ fn: lib_1.battery, name: 'batteryInfo', resultKey: 'batteryInfo' }],
    wifi: [
        { fn: lib_1.wifiNetworks, name: 'wifiNetworks', resultKey: 'wifiNetworks' },
        { fn: lib_1.wifiInterfaces, name: 'wifiInterfaces', resultKey: 'wifiInterfaces' },
        { fn: lib_1.wifiConnections, name: 'wifiConnections', resultKey: 'wifiConnections' },
    ],
    audio: [{ fn: lib_1.audio, name: 'audio', resultKey: 'audio' }],
    bluetooth: [{ fn: lib_1.bluetoothDevices, name: 'bluetooth', resultKey: 'bluetoothDevices' }],
    cpu: [{ fn: lib_1.cpu, name: 'cpu', resultKey: 'cpu' }],
    graphics: [{ fn: lib_1.graphics, name: 'graphics', resultKey: 'graphics' }],
    internet: [{ fn: lib_1.inetLatency, name: 'inetLatency', resultKey: 'inetLatency' }],
    memory: [
        { fn: lib_1.mem, name: 'mem', resultKey: 'mem' },
        { fn: lib_1.memLayout, name: 'memLayout', resultKey: 'memLayout' },
    ],
    network: [
        { fn: lib_1.networkStats, name: 'networkStats', resultKey: 'networkStats' },
        {
            fn: lib_1.networkGatewayDefault,
            name: 'networkGatewayDefault',
            resultKey: 'networkGatewayDefault',
        },
        { fn: lib_1.networkInterfaces, name: 'networkInterfaces', resultKey: 'networkInterfaces' },
        { fn: lib_1.networkConnections, name: 'networkConnections', resultKey: 'networkConnections' },
        {
            fn: lib_1.networkInterfaceDefault,
            name: 'defaultNetworkInterface',
            resultKey: 'defaultNetworkInterface',
        },
    ],
    osinfo: [
        { fn: lib_1.time, name: 'time', resultKey: 'time' },
        { fn: lib_1.osInfo, name: 'osInfo', resultKey: 'osInfo' },
        { fn: lib_1.shell, name: 'shell', resultKey: 'shell' },
        { fn: lib_1.uuid, name: 'uuid', resultKey: 'uuid' },
        { fn: lib_1.applications, name: 'applications', resultKey: 'applications' },
    ],
    printers: [{ fn: lib_1.printer, name: 'printers', resultKey: 'printers' }],
    system: [
        { fn: lib_1.baseboard, name: 'baseboard', resultKey: 'baseboard' },
        { fn: lib_1.system, name: 'system', resultKey: 'system' },
        { fn: lib_1.chassis, name: 'chassis', resultKey: 'chassis' },
        { fn: lib_1.bios, name: 'bios', resultKey: 'bios' },
    ],
    usb: [{ fn: lib_1.usb, name: 'usb', resultKey: 'usb' }],
    users: [{ fn: lib_1.users, name: 'users', resultKey: 'users' }],
    gps: [{ fn: lib_1.gps, name: 'gps', resultKey: 'gps' }],
    processes: [{ fn: lib_1.processes, name: 'processes', resultKey: 'processes' }],
    services: [{ fn: lib_1.services, name: 'services', resultKey: 'services' }],
    files: [{ fn: lib_1.files, name: 'files', resultKey: 'files' }],
};
// Update the main function to include better error handling
(async () => {
    const options = {
        winrm: nodejs_winrm_1.default,
        host,
        port,
        username,
        password,
    };
    const results = {};
    const tasks = [];
    // Generate tasks based on configuration
    for (const [category, enabled] of Object.entries(testsToRun)) {
        if (enabled) {
            const categoryTasks = taskDefinitions[category];
            for (const task of categoryTasks) {
                tasks.push(createTask(task.fn, task.name, task.resultKey, results, options));
            }
        }
    }
    try {
        // Run tasks with controlled concurrency
        await processBatches(tasks);
        // Display results
        console.log((0, util_1.inspect)(results, { depth: 5, colors: true }));
        console.log(JSON.stringify(results));
    }
    catch (error) {
        console.error('Error in batch processing:', error);
    }
})();
