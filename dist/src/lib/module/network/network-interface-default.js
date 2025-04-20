"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultNetworkInterface = getDefaultNetworkInterface;
exports.networkInterfaceDefault = networkInterfaceDefault;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const util = tslib_1.__importStar(require("../../util"));
const platform_1 = require("../../util/platform");
const network_interfaces_1 = require("./network-interfaces");
// Cache variable for default interface
let _default_iface = '';
/**
 * Get default network interface
 * @param options Optional parameters
 * @returns Default network interface
 */
async function getDefaultNetworkInterface(options = {}) {
    const platform = (0, platform_1.getPlatformFlagsFromOptions)(options);
    let ifacename = '';
    let ifacenameFirst = '';
    try {
        // let ifaces = os.networkInterfaces();
        const ifaces = [];
        let scopeid = 9999;
        // fallback - "first" external interface (sorted by scopeid)
        for (const [dev, details] of Object.entries(ifaces)) {
            if (details) {
                for (const detail of details) {
                    if (detail && detail.internal === false) {
                        ifacenameFirst = ifacenameFirst || dev; // fallback if no scopeid
                        if (detail.scopeid && detail.scopeid < scopeid) {
                            ifacename = dev;
                            scopeid = detail.scopeid;
                        }
                    }
                }
            }
        }
        ifacename = ifacename || ifacenameFirst || '';
        if (platform._windows) {
            let defaultIp = '';
            const cmd = 'netstat -r';
            const result = await util.powerShell(cmd, options);
            const lines = result.toString().split('\r\n');
            // Find default gateway IP
            for (let line of lines) {
                line = line.replaceAll(/\s+/g, ' ').trim();
                if (line.includes('0.0.0.0 0.0.0.0') && !/[A-Za-z]/.test(line)) {
                    const parts = line.split(' ');
                    if (parts.length >= 5) {
                        // This is the interface IP address, not the gateway
                        defaultIp = parts.at(-2) || '';
                    }
                }
            }
            if (defaultIp) {
                // When using WinRM, we need to use networkInterfaces instead of os.networkInterfaces
                // Get all network interfaces from our own function
                const networkInterfacesResult = await (0, network_interfaces_1.networkInterfaces)(options);
                const interfaces = Array.isArray(networkInterfacesResult)
                    ? networkInterfacesResult
                    : [networkInterfacesResult];
                // Find the interface with matching IP
                for (const iface of interfaces) {
                    if (iface && iface.ip4 === defaultIp) {
                        ifacename = iface.iface;
                        break;
                    }
                }
            }
        }
        if (platform._linux) {
            const cmd = 'ip route 2> /dev/null | grep default';
            const result = (0, child_process_1.execSync)(cmd, util.execOptsLinux);
            const parts = result.toString().split('\n')[0].split(/\s+/);
            if (parts[0] === 'none' && parts[5]) {
                ifacename = parts[5];
            }
            else if (parts[4]) {
                ifacename = parts[4];
            }
            if (ifacename.includes(':')) {
                ifacename = ifacename.split(':')[1].trim();
            }
        }
        if (platform._darwin ||
            platform._freebsd ||
            platform._openbsd ||
            platform._netbsd ||
            platform._sunos) {
            let cmd = '';
            if (platform._linux) {
                cmd = "ip route 2> /dev/null | grep default | awk '{print $5}'";
            }
            if (platform._darwin) {
                cmd = "route -n get default 2>/dev/null | grep interface: | awk '{print $2}'";
            }
            if (platform._freebsd || platform._openbsd || platform._netbsd || platform._sunos) {
                cmd = 'route get 0.0.0.0 | grep interface:';
            }
            const result = (0, child_process_1.execSync)(cmd);
            ifacename = result.toString().split('\n')[0];
            if (ifacename.includes(':')) {
                ifacename = ifacename.split(':')[1].trim();
            }
        }
    }
    catch {
        util.noop();
    }
    if (ifacename) {
        _default_iface = ifacename;
    }
    return _default_iface;
}
/**
 * Get default network interface
 * @param options Optional parameters
 * @param callback Optional callback function
 * @returns Promise resolving to default network interface
 */
function networkInterfaceDefault(options = {}, callback) {
    const platform = (0, platform_1.getPlatformFlagsFromOptions)(options);
    return new Promise((resolve) => {
        process.nextTick(() => {
            if (options.winrm && platform._windows) {
                try {
                    const defaultCmd = 'Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Select-Object -First 1 | Select-Object InterfaceAlias | Format-List';
                    util
                        .powerShell(defaultCmd, options)
                        .then((stdout) => {
                        let result = '';
                        const lines = stdout
                            .toString()
                            .split(/\r?\n/)
                            .filter((line) => line.trim());
                        for (const line of lines) {
                            const parts = line.split(':');
                            if (parts.length >= 2 && parts[0].trim() === 'InterfaceAlias') {
                                result = parts[1].trim();
                                break;
                            }
                        }
                        if (callback && typeof callback === 'function') {
                            callback(result);
                        }
                        resolve(result);
                    })
                        .catch((error) => {
                        console.error('Error getting default network interface over WinRM:', error);
                        if (callback && typeof callback === 'function') {
                            callback('');
                        }
                        resolve('');
                    });
                }
                catch (error) {
                    console.error('Error in networkInterfaceDefault:', error);
                    if (callback && typeof callback === 'function') {
                        callback('');
                    }
                    resolve('');
                }
            }
            else {
                getDefaultNetworkInterface(options).then((result) => {
                    if (callback && typeof callback === 'function') {
                        callback(result);
                    }
                    resolve(result);
                });
            }
        });
    });
}
