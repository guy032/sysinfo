/**
 * Create WinRM parameters from options
 */
function createWinRMParams(opts) {
    if (!opts.winrm || !opts.host || !opts.username || !opts.password) {
        throw new Error('Invalid WinRM options: missing required parameters');
    }
    const port = opts.port || 5985;
    const auth = 'Basic ' + Buffer.from(opts.username + ':' + opts.password, 'utf8').toString('base64');
    return {
        host: opts.host,
        port,
        path: '/wsman',
        auth,
    };
}
/**
 * Wrap a promise with timeout
 */
async function withTimeout(promise, timeoutMs, name) {
    return new Promise((resolve) => {
        let settled = false;
        const startTime = Date.now();
        // Create timeout
        const timeoutId = setTimeout(() => {
            if (settled) {
                return;
            }
            settled = true;
            console.error(`[WinRM] TIMEOUT: ${name} timed out after ${timeoutMs / 1000}s`);
            resolve({ result: null, timedOut: true });
        }, timeoutMs);
        // Execute the promise
        promise
            .then((result) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeoutId);
            resolve({ result, timedOut: false });
        })
            .catch((error) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeoutId);
            resolve({ result: null, timedOut: false, error });
        });
    });
}
/**
 * Helper to safely clean up a shell
 */
async function cleanupShell(winrm, params) {
    if (!params.shellId) {
        return;
    }
    try {
        await winrm.shell.doDeleteShell(params);
    }
    catch (error) {
        console.error(`[WinRM] Failed to close shell ${params.shellId}: ${error.message}`);
        // Ignore cleanup errors
    }
}
/**
 * Execute a command in a WinRM shell and handle all lifecycle operations
 */
async function executeInShell(winrm, params, command, options = {}) {
    const shellTimeout = options.shellTimeout || 1_800_000; // 30 minutes default
    const cmdTimeout = options.cmdTimeout || 600_000; // 10 minutes default
    const startTime = Date.now();
    let shellCreated = false;
    try {
        // Create the shell
        const shellResult = await withTimeout(winrm.shell.doCreateShell(params), shellTimeout, 'Shell creation');
        if (shellResult.timedOut) {
            return '';
        }
        if (shellResult.error) {
            throw shellResult.error;
        }
        if (shellResult.result) {
            params.shellId = shellResult.result;
            shellCreated = true;
        }
        else {
            return ''; // No shell ID received
        }
        // Prepare the command
        let cmdToExecute = command;
        let delimiter = '';
        if (options.withDelimiters) {
            // Add a unique identifier to each command's output to ensure we can separate responses
            const cmdId = Math.random().toString(36).slice(2, 12);
            delimiter = `###CMD_OUTPUT_${cmdId}###`;
            // Add echo statements before and after the command to clearly delimit the output
            cmdToExecute = `Write-Output "${delimiter}START"; try { ${command} } catch { Write-Output "ERROR: $_" }; Write-Output "${delimiter}END"`;
        }
        // Set up the command
        params.command = `powershell -Command "${cmdToExecute}"`;
        // console.log('params.command', params.command);
        // Execute the command
        const execResult = await withTimeout(winrm.command.doExecuteCommand(params), cmdTimeout, 'Command execution');
        if (execResult.timedOut) {
            await cleanupShell(winrm, params);
            return '';
        }
        if (execResult.error) {
            await cleanupShell(winrm, params);
            throw execResult.error;
        }
        if (execResult.result) {
            params.commandId = execResult.result;
        }
        else {
            await cleanupShell(winrm, params);
            return ''; // No command ID received
        }
        // Get the output
        const outputResult = await withTimeout(winrm.command.doReceiveOutput(params), cmdTimeout, 'Receive output');
        // console.log('outputResult', outputResult);
        // Always cleanup the shell
        await cleanupShell(winrm, params);
        if (outputResult.timedOut) {
            return '';
        }
        if (outputResult.error) {
            throw outputResult.error;
        }
        let result = outputResult.result || '';
        // Process delimiters if needed
        if (options.withDelimiters && delimiter) {
            const startMarker = `${delimiter}START`;
            const endMarker = `${delimiter}END`;
            const startIdx = result.indexOf(startMarker);
            const endIdx = result.indexOf(endMarker);
            if (startIdx !== -1 && endIdx !== -1) {
                // Extract only the part between our delimiters
                result = result.slice(startIdx + startMarker.length, endIdx).trim();
            }
        }
        return result;
    }
    catch (error) {
        console.error(`[WinRM] Error in shell ${params.shellId || 'unknown'}: ${error.message} after ${Date.now() - startTime}ms`);
        // Make sure to clean up the shell if it was created
        if (shellCreated) {
            await cleanupShell(winrm, params);
        }
        throw error;
    }
}
/**
 * Execute a batch of commands in a single WinRM shell
 */
export async function winRMSingleShell(cmds, opts) {
    // Check required parameters
    if (!Array.isArray(cmds) || cmds.length === 0) {
        throw new Error('Invalid parameters for WinRM single shell execution: commands required');
    }
    try {
        const params = createWinRMParams(opts);
        const shellTimeout = opts.shellTimeout || 1_800_000;
        const cmdTimeout = opts.cmdTimeout || 600_000;
        // Create a single shell
        const shellResult = await withTimeout(opts.winrm.shell.doCreateShell(params), shellTimeout, 'Shell creation');
        if (shellResult.timedOut || shellResult.error || !shellResult.result) {
            return Array.from({ length: cmds.length }).fill('');
        }
        params.shellId = shellResult.result;
        const results = [];
        // Process all commands sequentially in the same shell
        for (let i = 0; i < cmds.length; i++) {
            const cmd = cmds[i];
            try {
                // Add a unique identifier to each command's output
                const cmdId = Math.random().toString(36).slice(2, 12);
                const delimiter = `###CMD_OUTPUT_${cmdId}###`;
                const wrappedCmd = `Write-Output "${delimiter}START"; try { ${cmd} } catch { Write-Output "ERROR: $_" }; Write-Output "${delimiter}END"`;
                // Set command
                params.command = `powershell -Command "${wrappedCmd}"`;
                // Execute command
                const execResult = await withTimeout(opts.winrm.command.doExecuteCommand(params), cmdTimeout, `Command ${i + 1}/${cmds.length}`);
                if (execResult.timedOut || execResult.error || !execResult.result) {
                    results.push('');
                    continue;
                }
                params.commandId = execResult.result;
                // Get output
                const outputResult = await withTimeout(opts.winrm.command.doReceiveOutput(params), cmdTimeout, `Output ${i + 1}/${cmds.length}`);
                let result = '';
                if (!outputResult.timedOut && !outputResult.error) {
                    result = outputResult.result || '';
                    // Extract content between delimiters
                    const startMarker = `${delimiter}START`;
                    const endMarker = `${delimiter}END`;
                    const startIdx = result.indexOf(startMarker);
                    const endIdx = result.indexOf(endMarker);
                    if (startIdx !== -1 && endIdx !== -1) {
                        result = result.slice(startIdx + startMarker.length, endIdx).trim();
                    }
                }
                results.push(result);
            }
            catch (error) {
                console.error(`[WinRM] Error executing command ${i + 1}/${cmds.length}: ${error.message}`);
                results.push('');
            }
        }
        // Close the shell
        await cleanupShell(opts.winrm, params);
        return results;
    }
    catch (error) {
        console.error(`[WinRM] Error in batch execution: ${error.message}`);
        return Array.from({ length: cmds.length }).fill('');
    }
}
/**
 * Execute a batch of commands in parallel using WinRM
 */
export function winRMBatch(cmds, opts) {
    // Check required parameters
    if (!Array.isArray(cmds) || cmds.length === 0) {
        return Promise.reject(new Error('Invalid parameters for WinRM batch execution'));
    }
    try {
        // Validate options
        if (!opts.winrm || !opts.host || !opts.username || !opts.password) {
            return Promise.reject(new Error('Invalid WinRM options: missing required parameters'));
        }
        const port = opts.port || 5985;
        // Execute all commands in parallel
        return Promise.all(cmds.map((cmd) => opts.winrm.runPowershell(cmd, opts.host, opts.username, opts.password, port)));
    }
    catch (error) {
        console.error(`[WinRM] Error preparing batch execution: ${error.message}`);
        return Promise.resolve(Array.from({ length: cmds.length }).fill(''));
    }
}
/**
 * Execute a single command with WinRM, optimized for workload processing
 */
export function winRMWorkload(cmd, opts) {
    if (!cmd || cmd.trim() === '') {
        return Promise.resolve('');
    }
    try {
        const params = createWinRMParams(opts);
        const timeout = opts.timeout || 600_000;
        return executeInShell(opts.winrm, params, cmd, {
            cmdTimeout: timeout,
            shellTimeout: timeout,
        });
    }
    catch (error) {
        console.error(`[WinRM] Error preparing workload: ${error.message}`);
        return Promise.resolve('');
    }
}
/**
 * Execute a single command with WinRM
 */
export async function executeSingleCommand(cmd, opts) {
    if (!cmd || cmd.trim() === '') {
        return '';
    }
    try {
        const params = createWinRMParams(opts);
        return await executeInShell(opts.winrm, params, cmd, {
            withDelimiters: false, // Direct command execution
        });
    }
    catch (error) {
        console.error(`[WinRM] Error executing single command: ${error.message}`);
        throw error; // Rethrow to maintain original behavior
    }
}
