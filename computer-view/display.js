import { 
    createHardwareCard, 
    getVendorLogo, 
    getModelImage, 
    getCpuImage,
    getGraphicsImage,
    createMemoryCard, 
    createStorageCard, 
    createDisplayCard,
    createOSCard,
    createTimeCard,
    createUsersCard,
    createCondensedUserCard,
    createNetworkInterfacesCard,
    createWifiRadarVisualization,
    createNetworkConnectionsVisual,
    createUsbDevicesGrid,
    createPrintersGrid,
    createAudioDevicesGrid,
    createBluetoothDevicesGrid,
    createSystemCard,
} from './components/index.js';
import { createMapSection, initMap } from './map.js';
import { addStyles, addFsStatsStyles, addSpeedGaugeStyles, addBatteryStyles } from './styles.js';
import { createTableSection, createApplicationsTable } from './sections.js';
import { renderVisitorFilesTree } from './renderVisitorFilesTree.js';

/**
 * Calculate total CPU usage from processes list
 * @param {Object} processesData - The processes data object
 * @returns {Object} CPU usage statistics
 */
function calculateTotalCpuUsage(processesData) {
    if (!processesData || !processesData.list || !Array.isArray(processesData.list)) {
        return {
            totalCpuUsage: 0,
            detailedCpuUsage: 0,
            processCount: 0,
            topProcesses: []
        };
    }
    
    const processList = processesData.list;
    
    // Sum up the top-level cpu field for each process
    let totalCpuUsage = 0;
    processList.forEach(proc => {
        totalCpuUsage += proc.cpu || 0;
    });
    
    // Alternative: sum up all individual sub-processes
    let detailedCpuUsage = 0;
    processList.forEach(proc => {
        if (proc.processes && Array.isArray(proc.processes)) {
            proc.processes.forEach(subProc => {
                detailedCpuUsage += subProc.cpu || 0;
            });
        }
    });
    
    return {
        totalCpuUsage,
        detailedCpuUsage,
        processCount: processesData.all || processList.length,
        topProcesses: processList
            .sort((a, b) => b.cpu - a.cpu)
            .slice(0, 5)
            .map(p => ({ name: p.proc, usage: p.cpu }))
    };
}

/**
 * Function to create a hardware info grid
 * @param {Object} data - The computer hardware data
 * @param {Object} additionalData - Additional related data
 * @returns {string} HTML for the hardware grid
 */
function createHardwareInfoGrid(data, additionalData = {}) {
    let html = '';
    
    // Hardware visualization grid
    html += '<div class="hardware-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 15px;">';
    
    // System visualization with image
    if (data.system) {
        // Prepare system data with identification information
        const systemData = { ...data.system };
        
        // Add UUID information if available
        if (data.uuid) {
            systemData.hardwareUUID = data.uuid.hardware || data.uuid.systemUUID;
            systemData.osUUID = data.uuid.os;
        }
        
        // Add MAC addresses if available
        if (data.networkInterfaces) {
            const macAddresses = [];
            // Extract MAC addresses from network interfaces
            Object.values(data.networkInterfaces).forEach(interfaces => {
                if (Array.isArray(interfaces)) {
                    interfaces.forEach(iface => {
                        if (iface.mac && !iface.mac.includes('00:00:00:00:00:00') && !macAddresses.includes(iface.mac)) {
                            macAddresses.push(iface.mac);
                        }
                    });
                }
            });
            if (macAddresses.length > 0) {
                systemData.macAddresses = macAddresses;
            }
        }
        
        html += createHardwareCard(
            'System', 
            systemData, 
            getModelImage(data.system.model), 
            getVendorLogo(data.system.manufacturer)
        );
    }
    
    // Combine Baseboard and BIOS into a single Motherboard card if both exist
    if (data.baseboard && data.bios) {
        const combinedData = {
            baseboard: data.baseboard,
            bios: data.bios
        };
        html += createHardwareCard(
            'Motherboard', 
            combinedData, 
            null, 
            getVendorLogo(data.baseboard.manufacturer)
        );
    }
    
    // Battery information
    if (data.battery) {
        // Wrap the battery card in a div that spans multiple columns
        html += '<div style="grid-column: span 2;">';
        html += createHardwareCard(
            'Battery', 
            data.battery, 
            'https://img.fruugo.com/product/3/34/1535603343_max.jpg',
            getVendorLogo(data.battery.manufacturer || data.battery.vendor || data.battery.Model)
        );
        html += '</div>';
    }

    // Memory layout with card visualization
    if (data.memLayout && data.memLayout.length > 0) {
        // If there's only one memory module, include memory usage stats with it
        if (data.memLayout.length === 1 && data.mem) {
            html += `<div style="grid-column: span 1;">
                ${createMemoryCard(data.memLayout[0], data.mem)}
            </div>`;
        }
    }
    
    // CPU information with card visualization
    if (data.cpu) {
        // Calculate CPU usage statistics if process data is available
        const cpuStats = data.processes && data.processes.list ? calculateTotalCpuUsage(data.processes) : null;
        
        html += createHardwareCard(
            'CPU', 
            data.cpu, 
            getCpuImage(data.cpu), 
            getVendorLogo(data.cpu.manufacturer),
            cpuStats
        );
    }
        
    // Use the new storage card visualization
    if (data.diskLayout && data.diskLayout.length > 0) {
        // Check if we have file handles data
        let fileHandlesData = null;
        if (data.fsOpenFiles) {
            fileHandlesData = {
                max: data.fsOpenFiles.max,
                allocated: data.fsOpenFiles.allocated,
                available: data.fsOpenFiles.available
            };
        }
        
        // Add read/write speeds data if available
        let storagePerformance = {};
        if (data.diskIO && data.diskIO.rIO_sec !== undefined) {
            storagePerformance.readSpeed = data.diskIO.rIO_sec + ' MB/s';
        }
        if (data.diskIO && data.diskIO.wIO_sec !== undefined) {
            storagePerformance.writeSpeed = data.diskIO.wIO_sec + ' MB/s';
        }
        
        // Enhance disk layout data with additional information
        const enhancedDiskLayout = data.diskLayout.map(disk => {
            return {
                ...disk,
                fileHandles: fileHandlesData,
                readSpeed: storagePerformance.readSpeed || '3.25 MB/s',
                writeSpeed: storagePerformance.writeSpeed || '131.55 MB/s'
            };
        });
        
        html += createStorageCard(enhancedDiskLayout, data.fsSize);
    }
    
    // Graphics Controllers - moved from Graphics and Display section to Hardware Information
    if (data.graphics && data.graphics.controllers && data.graphics.controllers.length > 0) {
        data.graphics.controllers.forEach(controller => {
            html += createHardwareCard(
                'Graphics', 
                controller, 
                getGraphicsImage(controller), 
                getVendorLogo(controller.vendor)
            );
        });
    }
    
    // Internal displays in Hardware Information section
    if (data.graphics && data.graphics.displays && data.graphics.displays.length > 0) {
        // Filter for internal displays only
        const internalDisplays = data.graphics.displays.filter(display => 
            display.connection && display.connection.toLowerCase() === 'internal'
        );
        
        // Add each internal display to the hardware grid
        internalDisplays.forEach(display => {
            html += '<div style="grid-column: span 1;">';
            
            // Convert vendor codes to full names
            const vendorMap = {
                'SHP': 'Sharp',
                'XMI': 'Xiaomi'
            };
            const vendorName = vendorMap[display.vendor] || display.vendor;
            
            // Create a more detailed display object with properly formatted properties
            const displayData = {
                model: display.model === '\\x00' ? `${vendorName} Display` : display.model,
                manufacturer: vendorName,
                sizeXcm: display.sizeXcm,
                sizeYcm: display.sizeYcm
            };
            
            // Determine resolution badge
            let resolutionBadge = '';
            const resX = display.resolutionX || display.currentResX || 0;
            const resY = display.resolutionY || display.currentResY || 0;
            
            if (resX >= 3840 && resY >= 2160) {
                resolutionBadge = '<span style="background: #e74c3c; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">4K UHD</span>';
            } else if (resX >= 2560 && resY >= 1440) {
                resolutionBadge = '<span style="background: #3498db; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">2K QHD</span>';
            } else if (resX >= 1920 && resY >= 1080) {
                resolutionBadge = '<span style="background: #27ae60; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">Full HD</span>';
            } else if (resX >= 1280 && resY >= 720) {
                resolutionBadge = '<span style="background: #f39c12; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">HD</span>';
            }
            
            // Add resolution badge to title
            if (resolutionBadge) {
                displayData.titleBadge = resolutionBadge;
            }
            
            html += createHardwareCard(
                'Display', 
                displayData,
                null,
                getVendorLogo(display.vendor)
            );
            html += '</div>';
        });
    }
    
    // Network interfaces
    if (data.networkInterfaces) {
        // Add the network interfaces directly to the hardware grid
        html += createNetworkInterfacesCard(data.networkInterfaces, additionalData);
    }
        
    html += '</div>'; // End hardware grid
    
    return html;
}

/**
 * Function to display computer information
 * @param {Object} data - The computer information data to display
 */
function displayComputerInfo(data) {
    const container = document.getElementById('computer-info');
    let html = '';

    // Add CSS styles
    addStyles();
    addSpeedGaugeStyles();
    addBatteryStyles();
    
    // Prepare additional network data for the enhanced unified network component
    // This combines all network-related data into a single visualization
    const additionalData = {
        networkGatewayDefault: data.networkGatewayDefault || null,
        defaultInterface: data.defaultInterface || data.networkInterfaceDefault || null,
        networkStats: data.networkStats || [],
        internetLatency: data.internetLatency || data.inetLatency || null,
        wifiInterfaces: data.wifiInterfaces || [],
        wifiConnections: data.wifiConnections || []
    };
    
    // Add potential other network data that might be available
    if (data.wifi && data.wifi.interfaces && data.wifi.interfaces.length > 0) {
        additionalData.wifiInterfaces = additionalData.wifiInterfaces.concat(data.wifi.interfaces);
    }
    
    if (data.wifi && data.wifi.connections && data.wifi.connections.length > 0) {
        additionalData.wifiConnections = additionalData.wifiConnections.concat(data.wifi.connections);
    }
    
    // Add WiFi radar visualization if we have networks data
    const wifiNetworks = data.wifiNetworks || [];
    // Combine with wifi connections for more complete data
    const allWifiNetworks = [...wifiNetworks];
    if (additionalData.wifiConnections && additionalData.wifiConnections.length > 0) {
        // Only add connections not already in wifiNetworks
        additionalData.wifiConnections.forEach(conn => {
            if (!allWifiNetworks.some(net => 
                (net.ssid && conn.ssid && net.ssid === conn.ssid) || 
                (net.bssid && conn.bssid && net.bssid === conn.bssid))) {
                allWifiNetworks.push(conn);
            }
        });
    }

    // Material UI Tabs implementation
    html += `
    <div id="mui-tabs-container" style="width: 100%; margin-bottom: 20px;">
        <div id="mui-tabs-header" style="margin-bottom: 20px;"></div>
        <div id="mui-tabs-content"></div>
    </div>
    `;
    
    // Create content for each tab
    const tabsContent = {};
    
    // No hardware grid in ALL tab anymore - moved to hardware tab
    
    // HARDWARE tab content
    tabsContent.hardware = '';
    
    // Hardware Information
    tabsContent.hardware += '<div class="data-group"><div class="data-group-title">Hardware Information</div>';
    
    // Add hardware grid to hardware tab
    tabsContent.hardware += createHardwareInfoGrid(data, additionalData);
    
    tabsContent.hardware += '</div>';
    
    // SYSTEM tab content
    tabsContent.system = '';
    
    // System Information
    tabsContent.system += '<div class="data-group"><div class="data-group-title">System Information</div>';
    
    // Add system grid similar to hardware grid
    tabsContent.system += '<div class="system-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 15px;">';
    
    // OS Information (span 1 column)
    if (data.osInfo) {
        tabsContent.system += '<div style="grid-column: span 1;">';
        let osUUID = null;
        if (data.uuid && data.uuid.os) {
            osUUID = data.uuid.os;
        }
        
        // Create custom OS content without the duplicated title
        const specs = [];
        if (data.osInfo.platform) specs.push({ label: 'Platform', value: data.osInfo.platform });
        if (data.osInfo.distro) specs.push({ label: 'Edition', value: data.osInfo.distro });
        if (data.osInfo.build) specs.push({ label: 'Version', value: `Windows 11 ${data.osInfo.build}` });
        if (data.osInfo.servicepack) specs.push({ label: 'Service Pack', value: data.osInfo.servicepack });
        if (data.osInfo.codepage) specs.push({ label: 'Code Page', value: data.osInfo.codepage });
        if (data.osInfo.hypervisor !== undefined) specs.push({ label: 'Virtualization', value: data.osInfo.hypervisor ? 'Enabled' : 'Disabled' });
        if (data.osInfo.remoteSession !== undefined) specs.push({ label: 'Remote Session', value: data.osInfo.remoteSession ? 'Yes' : 'No' });
        if (data.osInfo.serial) specs.push({ label: 'Serial', value: data.osInfo.serial });
        
        // Format UUID for display
        const formatUuid = (uuid) => {
            if (!uuid || uuid.includes('-')) return uuid;
            return uuid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
        };
        
        const formattedOsUUID = osUUID ? formatUuid(osUUID) : '';
        
        // UUID section HTML
        const uuidSection = osUUID ? `
            <div class="os-uuid-section" style="margin-top: 15px; margin-bottom: 10px;">
                <div style="font-weight: 600; margin-bottom: 6px; color: #0078D4; display: flex; align-items: center; font-size: 13px;">
                    <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 4px;">
                        <path fill="currentColor" d="M17,17H7V7H17M21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5M19,5H5V19H19V5Z" />
                    </svg>
                    System UUID
                </div>
                <div style="
                    position: relative;
                    font-family: monospace;
                    background: #f5f7fa;
                    padding: 8px 10px;
                    border-radius: 4px;
                    color: #333;
                    word-break: break-all;
                    font-size: 12px;
                    user-select: all;
                    border: 1px solid #e0e0e0;
                ">
                    ${formattedOsUUID}
                    <div 
                        style="
                            position: absolute;
                            right: 8px;
                            top: 50%;
                            transform: translateY(-50%);
                            background: #f0f2f5;
                            border-radius: 4px;
                            padding: 4px 8px;
                            font-size: 11px;
                            display: flex;
                            align-items: center;
                            cursor: pointer;
                            color: #555;
                            transition: all 0.2s;
                            font-family: system-ui, sans-serif;
                            user-select: none;
                        "
                        title="Copy to clipboard"
                        onclick="navigator.clipboard.writeText('${osUUID}'); this.innerHTML='Copied!'; setTimeout(() => { this.innerHTML='<svg viewBox=\\'0 0 24 24\\' width=\\'12\\' height=\\'12\\' style=\\'margin-right: 4px;\\'><path fill=\\'currentColor\\' d=\\'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z\\' /></svg>Copy'; }, 1000);"
                    >
                        <svg viewBox="0 0 24 24" width="12" height="12" style="margin-right: 4px;">
                            <path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                        </svg>
                        Copy
                    </div>
                </div>
            </div>
        ` : '';
        
        // Create custom OS content
        const osContent = `
            <div class="os-left-section" style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background-color: #f8f9fa; border-radius: 8px; margin-right: 15px;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/Windows_logo_-_2021.svg" 
                         alt="Windows Logo" 
                         style="width: 40px; height: 40px;" />
                </div>
                <div>
                    <div style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">Windows 11</div>
                    <div style="width: 100%; text-align: center; background: #0078D4; color: white; padding: 5px 8px; border-radius: 4px; font-size: 12px;">
                        ${data.osInfo.hypervisor ? 'Virtualization Enabled' : 'Physical Installation'}
                    </div>
                </div>
            </div>
            
            ${uuidSection}
            
            <div class="hardware-specs-container">
                <ul class="hardware-specs" style="list-style: none; padding: 0; margin: 0;">
                    ${specs.map(spec => `
                        <li style="margin: 6px 0; display: flex; align-items: center; font-size: 13px;">
                            <span style="color: #666; min-width: 110px; margin-right: 8px;">${spec.label}:</span>
                            <span style="color: #333; font-weight: 500;">${spec.value}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        const osLogoUrl = 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Windows_logo_-_2012.svg';
        
        tabsContent.system += createSystemCard('OS Information', osContent, null, osLogoUrl);
        tabsContent.system += '</div>';
    }
    
    // Location (span 1 column) - moved up to be next to OS card
    if (data.gps) {
        tabsContent.system += '<div style="grid-column: span 1;">';
        
        // Create custom GPS content without the duplicate title
        const gpsContent = `
            <div id="map" style="width: 100%; height: 300px; border-radius: 8px; overflow: hidden;"></div>
            ${data.gps.latitude && data.gps.longitude ? `
                <div style="margin-top: 10px; padding: 10px; background: #f5f7fa; border-radius: 6px;">
                    <div style="font-weight: 500; margin-bottom: 8px; color: #2ecc71; font-size: 13px;">Location Coordinates</div>
                    <div style="font-family: monospace; font-size: 12px;">
                        ${data.gps.latitude}, ${data.gps.longitude}
                    </div>
                </div>
            ` : ''}
        `;
        
        tabsContent.system += createSystemCard('GPS Information', gpsContent);
        tabsContent.system += '</div>';
    }
    
    // Time (span 1 column)
    if (data.time) {
        tabsContent.system += '<div style="grid-column: span 1;">';
        
        // Extract time data for custom time content
        const timestamp = data.time.current ? Number(data.time.current) : Date.now();
        const uptime = data.time.uptime ? Number(data.time.uptime) : 0;
        const timezone = data.time.timezone || 'Unknown';
        
        // Format the current date and time
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        // Format uptime in a human-readable way
        const formatUptime = (seconds) => {
            if (seconds < 60) return `${seconds} seconds`;
            
            const days = Math.floor(seconds / 86400);
            seconds %= 86400;
            const hours = Math.floor(seconds / 3600);
            seconds %= 3600;
            const minutes = Math.floor(seconds / 60);
            seconds %= 60;
            
            let result = '';
            if (days > 0) result += `${days} day${days > 1 ? 's' : ''}, `;
            if (hours > 0 || days > 0) result += `${hours} hour${hours > 1 ? 's' : ''}, `;
            if (minutes > 0 || hours > 0 || days > 0) result += `${minutes} minute${minutes > 1 ? 's' : ''}, `;
            result += `${seconds} second${seconds > 1 ? 's' : ''}`;
            
            return result;
        };
        
        // Create custom content for time section without duplicate title
        const timeContent = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 14px; color: #555; margin-bottom: 5px;">Current Date</div>
                    <div style="font-size: 16px; font-weight: 600;">${formattedDate}</div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 14px; color: #555; margin-bottom: 5px;">Current Time</div>
                    <div style="font-size: 20px; font-weight: 600;">${formattedTime}</div>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="font-weight: 500; margin-bottom: 8px; color: #9b59b6; font-size: 14px;">System Uptime</div>
                <div style="font-size: 15px;">${formatUptime(uptime)}</div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <div style="font-weight: 500; margin-bottom: 8px; color: #9b59b6; font-size: 14px;">Timezone</div>
                <div style="font-size: 15px;">${timezone}</div>
                <div style="font-family: monospace; font-size: 12px; margin-top: 10px; padding: 8px; background: #eee; border-radius: 4px;">
                    Unix Timestamp: ${timestamp}
                </div>
            </div>
        `;
        
        tabsContent.system += createSystemCard('Time Information', timeContent);
        tabsContent.system += '</div>';
    }
    
    // Users (span 1 column)
    if (data.users && data.users.length > 0) {
      // Filter out disabled users (only keep users with Enabled explicitly set to true)
      const enabledUsers = data.users.filter(user => 
        user.localUserDetails && 
        user.localUserDetails.Enabled === true || user.localUserDetails.enabled === true
      );

      console.log(enabledUsers);
      
      if (enabledUsers.length > 0) {
        tabsContent.system += '<div style="grid-column: span 1;">';
        tabsContent.system += createSystemCard('Users', enabledUsers
          .map(user => createCondensedUserCard(user))
          .join(''));
        tabsContent.system += '</div>';
      }
    }
    
    tabsContent.system += '</div>'; // End system grid
    tabsContent.system += '</div>'; // End data-group
    
    // PERIPHERALS tab content
    tabsContent.peripherals = '';

    
    // Graphics - keep only external displays, controllers moved to Hardware Information
    if (data.graphics && data.graphics.displays && data.graphics.displays.length > 0) {
        // Filter for external displays only (anything that's not internal)
        const externalDisplays = data.graphics.displays.filter(display => 
            !display.connection || display.connection.toLowerCase() !== 'internal'
        );
        
        if (externalDisplays.length > 0) {
            tabsContent.peripherals += '<div class="data-group"><div class="data-group-title">External Displays</div>';
            
            tabsContent.peripherals += '<div class="hardware-grid displays-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px;">';
            externalDisplays.forEach(display => {
                // Check if it's the Mi Monitor and make it full width
                if (display.model && display.model.includes('Mi Monitor')) {
                    tabsContent.peripherals += '<div style="grid-column: span 3; margin-bottom: 20px;">';
                    // Pass the image URL for the Mi Monitor
                    display.imageUrl = 'https://img.zap.co.il/pics/5/0/1/2/84222105d.gif';
                    tabsContent.peripherals += createDisplayCard(display);
                    tabsContent.peripherals += '</div>';
                } else {
                    tabsContent.peripherals += '<div style="grid-column: span 1; margin-bottom: 20px;">';
                    tabsContent.peripherals += createDisplayCard(display);
                    tabsContent.peripherals += '</div>';
                }
            });
            tabsContent.peripherals += '</div>';
        }
    }
    tabsContent.peripherals += '</div>';
    
    // USB devices
    if (data.usb && data.usb.length > 0) {
        tabsContent.peripherals += '<div class="data-group"><div class="data-group-title">USB Devices</div>';
        tabsContent.peripherals += createUsbDevicesGrid(data.usb);
        tabsContent.peripherals += '</div>';
    }
    
    // Printer devices
    if (data.printer && data.printer.length > 0) {
        tabsContent.peripherals += '<div class="data-group"><div class="data-group-title">Printers</div>';
        tabsContent.peripherals += createPrintersGrid(data.printer);
        tabsContent.peripherals += '</div>';
    }
    
    // Audio devices
    if (data.audio && data.audio.length > 0) {
        tabsContent.peripherals += '<div class="data-group"><div class="data-group-title">Audio Devices</div>';
        tabsContent.peripherals += createAudioDevicesGrid(data.audio);
        tabsContent.peripherals += '</div>';
    }
    
    // Bluetooth devices
    if (data.bluetoothDevices && data.bluetoothDevices.length > 0) {
        tabsContent.peripherals += '<div class="data-group"><div class="data-group-title">Bluetooth Devices</div>';
        tabsContent.peripherals += createBluetoothDevicesGrid(data.bluetoothDevices);
        tabsContent.peripherals += '</div>';
    }
    
    // NETWORK tab content
    tabsContent.network = '';
    
    // Network connections
    if (data.networkConnections && data.networkConnections.length > 0) {
        const filteredConnections = data.networkConnections.filter(
            connection => !['TIME_WAIT', 'Foreign'].includes(connection.state)
        );
        
        if (filteredConnections.length > 0) {
            tabsContent.network += '<div class="data-group"><div class="data-group-title">Network Connections</div>';
            
            const gatewayInfo = {
                gateway: additionalData.networkGatewayDefault,
                defaultInterface: additionalData.defaultInterface
            };
            
            tabsContent.network += createNetworkConnectionsVisual(
                filteredConnections, 
                data.processes && data.processes.list ? data.processes.list : [], 
                data.gps,
                gatewayInfo
            );
            
            tabsContent.network += '</div>';
        }
    }
    
    // WiFi networks
    if (allWifiNetworks.length > 0) {
        tabsContent.network += '<div class="data-group"><div class="data-group-title">WiFi Networks</div>';
        tabsContent.network += createWifiRadarVisualization(allWifiNetworks, { lightMode: true });
        tabsContent.network += '</div>';
    }
    
    // APPLICATIONS tab content
    tabsContent.applications = '';
    
    // Applications
    if (data.applications && data.applications.length > 0) {
        tabsContent.applications += createApplicationsTable('Applications', data.applications);
    }
    
    // Processes
    if (data.processes) {
        if (data.processes.list && data.processes.list.length > 0) {
            tabsContent.applications += createTableSection('Processes', data.processes.list);
        }
    }
    
    // Services
    if (data.services && data.services.length > 0) {
        tabsContent.applications += createTableSection('Services', data.services);
    }
    
    // Running processes that are applications
    if (data.processes && data.processes.list && data.processes.list.length > 0) {
        // Filter for processes that are likely applications (has window title, etc.)
        const appProcesses = data.processes.list.filter(proc => 
            proc.name && !proc.name.startsWith('com.apple.') && 
            !proc.name.startsWith('system') &&
            proc.cpu > 0
        );
        
        if (appProcesses.length > 0) {
            tabsContent.applications += '<div class="data-group"><div class="data-group-title">Running Applications</div>';
            tabsContent.applications += createTableSection('Currently Running', appProcesses);
            tabsContent.applications += '</div>';
        }
    }
    
    // FILES tab content
    tabsContent.files = '';
    
    // File system information
    if (data.fsSize && data.fsSize.length > 0) {
        tabsContent.files += '<div class="data-group"><div class="data-group-title">File Systems</div>';
        
        tabsContent.files += '<div class="fs-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">';
        
        data.fsSize.forEach(fs => {
            const usedPercent = (fs.used / fs.size * 100).toFixed(1);
            
            tabsContent.files += `
                <div class="fs-card" style="background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0; font-size: 16px;">${fs.fs}</h3>
                        <span style="background: #f9f9f9; padding: 3px 8px; border-radius: 4px; font-size: 13px;">
                            ${fs.type}
                        </span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>Mount:</strong> ${fs.mount}
                    </div>
                    <div style="height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin-bottom: 5px;">
                        <div style="height: 100%; width: ${usedPercent}%; background: ${
                            usedPercent > 90 ? '#e74c3c' : 
                            usedPercent > 70 ? '#f39c12' : 
                            '#27ae60'
                        };"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <span>${(fs.used / (1024 * 1024 * 1024)).toFixed(1)} GB used</span>
                        <span>${(fs.size / (1024 * 1024 * 1024)).toFixed(1)} GB total</span>
                        <span>${usedPercent}%</span>
                    </div>
                </div>
            `;
        });
        
        tabsContent.files += '</div></div>';
    }

    // Directory Sizes section
    tabsContent.files += '<div class="data-group"><div class="data-group-title">Directory Sizes</div>';
    if (data.directorySizes) {
        tabsContent.files += createDirectorySizesVisualization(data.directorySizes);
    } else {
        // Add a loading placeholder initially
        tabsContent.files += '<div id="directory-sizes-placeholder" style="padding: 15px; text-align: center; color: #666;">Loading directory sizes data...</div>';
        
        // Use a separate function to handle directory size data loading
        // This will run after the tabs are initialized
        setTimeout(() => {
            loadDirectorySizes();
        }, 500);
    }
    tabsContent.files += '</div>';

    // Add Open Files section
    tabsContent.files += '<div class="data-group"><div class="data-group-title">Open Files</div>';

    // Add file handles section (existing code)
    if (data.fsOpenFiles) {
        const usedPercent = (data.fsOpenFiles.allocated / data.fsOpenFiles.max * 100).toFixed(1);
        
        tabsContent.files += `
            <div style="background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px;">
                <h3 style="margin-top: 0;">File Handles</h3>
                <div style="display: flex; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <div style="height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin-bottom: 5px;">
                            <div style="height: 100%; width: ${usedPercent}%; background: ${
                                usedPercent > 90 ? '#e74c3c' : 
                                usedPercent > 70 ? '#f39c12' : 
                                '#27ae60'
                            };"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px;">
                            <span>${data.fsOpenFiles.allocated.toLocaleString()} allocated</span>
                            <span>${data.fsOpenFiles.max.toLocaleString()} maximum</span>
                            <span>${usedPercent}%</span>
                        </div>
                    </div>
                </div>
                <div style="background: #f9f9f9; padding: 10px; border-radius: 4px; font-size: 14px;">
                    <p style="margin: 0;">Available file handles: ${data.fsOpenFiles.available.toLocaleString()}</p>
                </div>
            </div>
        `;
    }
    tabsContent.files += '</div>';

    // Disk I/O information
    if (data.diskIO) {
        tabsContent.files += '<div class="data-group"><div class="data-group-title">Disk I/O</div>';
        
        tabsContent.files += `
            <div style="background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 20px; display: flex; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px; margin-right: 20px;">
                    <h3>Read Performance</h3>
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 14px; margin-bottom: 5px;">Speed:</div>
                        <div style="font-size: 24px; font-weight: bold; color: #3498db;">
                            ${data.diskIO.rIO_sec || 0} <span style="font-size: 16px; font-weight: normal;">MB/s</span>
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 14px; margin-bottom: 5px;">Transfers:</div>
                        <div style="font-size: 24px; font-weight: bold; color: #3498db;">
                            ${data.diskIO.tIO_sec || 0} <span style="font-size: 16px; font-weight: normal;">I/O per sec</span>
                        </div>
                    </div>
                </div>
                <div style="flex: 1; min-width: 200px;">
                    <h3>Write Performance</h3>
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 14px; margin-bottom: 5px;">Speed:</div>
                        <div style="font-size: 24px; font-weight: bold; color: #27ae60;">
                            ${data.diskIO.wIO_sec || 0} <span style="font-size: 16px; font-weight: normal;">MB/s</span>
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 14px; margin-bottom: 5px;">Queue Length:</div>
                        <div style="font-size: 24px; font-weight: bold; color: #27ae60;">
                            ${data.diskIO.queueLength || 0} <span style="font-size: 16px; font-weight: normal;">operations</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        tabsContent.files += '</div>';
    }

    // Add visitor files tree if available
    fetch('visitor-files.json')
        .then(response => response.json())
        .then(visitorData => {
            // Replace jQuery-style selector with standard DOM approach
            const dataGroups = document.querySelectorAll('.data-group-title');
            let openFilesGroup = null;
            
            // Find the "Open Files" title element
            dataGroups.forEach(titleElement => {
                if (titleElement.textContent === 'Open Files') {
                    openFilesGroup = titleElement.closest('.data-group');
                }
            });
            
            // Insert the Explorer section after the Open Files section
            if (openFilesGroup) {
                openFilesGroup.insertAdjacentHTML('afterend', 
                    `<div class="data-group"><div class="data-group-title">Explorer</div>${renderVisitorFilesTree(visitorData)}</div>`);
            } else {
                // Fallback - add to the end of the files tab content
                const filesTab = document.querySelector('#tabpanel-files');
                if (filesTab) {
                    filesTab.insertAdjacentHTML('beforeend', 
                        `<div class="data-group"><div class="data-group-title">Explorer</div>${renderVisitorFilesTree(visitorData)}</div>`);
                }
            }
        })
        .catch(error => {
            console.error('Error loading visitor files data:', error);
        });

    // ... existing code ...

    // Add HTML to the container
    container.innerHTML = html;
    
    // Setup Material UI tabs after the content is in the DOM
    initMaterialUITabs(tabsContent);
    
    // Initialize map if GPS data exists - wait for Leaflet to load
    if (data.gps && data.gps.latitude && data.gps.longitude) {
        // We assume the loadLeaflet function has already been called
        if (typeof L === 'undefined') {
            setTimeout(() => {
                initMap(data.gps.latitude, data.gps.longitude, data.gps.accuracy);
            }, 1000);
        } else {
            initMap(data.gps.latitude, data.gps.longitude, data.gps.accuracy);
        }
    }
}

/**
 * Initialize Material UI tabs
 * @param {Object} muiTabsContent - Content for each tab
 */
function initMaterialUITabs(muiTabsContent) {
    const tabsContainer = document.getElementById('mui-tabs-container');
    const tabsHeader = document.getElementById('mui-tabs-header');
    
    // Access Material UI components - use the global MaterialUI object from the UMD bundle
    // The UMD bundle exposes Material UI components via window.MaterialUI
    const MaterialUI = window.MaterialUI;
    
    // Check if MaterialUI is available
    if (!MaterialUI) {
        console.error('Material UI is not loaded. Using fallback tabs.');
        // Create a simple fallback for tabs if Material UI is not available
        let fallbackTabs = `
            <div class="tabs-navigation" style="display: flex; border-bottom: 1px solid #ddd; margin-bottom: 20px;">
                ${Object.keys(muiTabsContent).map((key, index) => 
                    `<button class="tab-button ${index === 0 ? 'active' : ''}" 
                            data-tab="${key}" 
                            style="padding: 10px 20px; border: none; background: ${index === 0 ? '#f0f0f0' : 'transparent'}; cursor: pointer;">
                        ${key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>`
                ).join('')}
            </div>
            ${Object.entries(muiTabsContent).map(([key, content], index) => 
                `<div id="tab-${key}" class="tab-content" style="display: ${index === 0 ? 'block' : 'none'}">
                    ${content}
                </div>`
            ).join('')}
        `;
        
        tabsContainer.innerHTML = fallbackTabs;
        
        // Add event listeners for the fallback tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                // Hide all tab contents
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                // Show the selected tab content
                const tabId = button.getAttribute('data-tab');
                document.getElementById(`tab-${tabId}`).style.display = 'block';
                
                // Update active button styling
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.style.background = 'transparent';
                    btn.classList.remove('active');
                });
                button.style.background = '#f0f0f0';
                button.classList.add('active');
                
                // Trigger window resize event after a minimal delay to ensure maps and visualizations render properly
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    console.log(`Fallback tab switched to ${tabId}, triggered resize event for proper rendering`);
                }, 0);
            });
        });
        
        return;
    }
    
    const { Tabs, Tab, Box, Typography, createTheme, ThemeProvider } = MaterialUI;
    
    // Create a theme with Roboto font
    const theme = createTheme({
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        },
    });
    
    // Define the tabs
    const tabs = [
        { id: 'hardware', label: 'Hardware' },
        { id: 'system', label: 'System' },
        { id: 'peripherals', label: 'Peripherals' },
        { id: 'network', label: 'Network' },
        { id: 'applications', label: 'Applications' },
        { id: 'files', label: 'Files' }
    ];
    
    // Render the tabs
    const App = () => {
        const [value, setValue] = React.useState(0);
        
        const handleChange = (event, newValue) => {
            setValue(newValue);
            
            // Trigger window resize event after a minimal delay to ensure maps and visualizations render properly
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
                console.log(`Material UI tab switched to ${tabs[newValue].id}, triggered resize event for proper rendering`);
            }, 0);
        };
        
        return (
            React.createElement(ThemeProvider, { theme },
                React.createElement(Box, { sx: { width: '100%' } },
                    React.createElement(Box, { sx: { borderBottom: 1, borderColor: 'divider' } },
                        React.createElement(Tabs, {
                            value,
                            onChange: handleChange,
                            variant: "scrollable",
                            scrollButtons: "auto",
                            "aria-label": "computer information tabs"
                        }, 
                            tabs.map((tab, index) => 
                                React.createElement(Tab, {
                                    key: tab.id,
                                    label: tab.label,
                                    id: `tab-${tab.id}`,
                                    "aria-controls": `tabpanel-${tab.id}`
                                })
                            )
                        )
                    ),
                    tabs.map((tab, index) => 
                        React.createElement(TabPanel, {
                            key: tab.id,
                            value,
                            index,
                            id: tab.id,
                            content: muiTabsContent[tab.id]
                        })
                    )
                )
            )
        );
    };
    
    // TabPanel component to display tab content
    const TabPanel = (props) => {
        const { children, value, index, id, content, ...other } = props;
        
        return React.createElement(Box, {
            role: "tabpanel",
            hidden: value !== index,
            id: `tabpanel-${id}`,
            "aria-labelledby": `tab-${id}`,
            ...other,
            sx: { p: 3 },
            dangerouslySetInnerHTML: { __html: content }
        });
    };
    
    // Render the React component to the DOM
    ReactDOM.render(React.createElement(App), document.getElementById('mui-tabs-container'));
}

/**
 * Set up click handlers for tabs
 */
function setupTabHandlers(data) {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            // Get tab id
            const tabId = this.getAttribute('data-tab');
            
            // Deactivate all tabs
            document.querySelectorAll('.tab-button').forEach(btn => 
                btn.classList.remove('active')
            );
            document.querySelectorAll('.tab-content').forEach(content => 
                content.classList.remove('active')
            );
            
            // Activate selected tab
            this.classList.add('active');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
                
                // Generate content on first click
                if (tabContent.innerHTML === '' && tabId !== 'all-tab') {
                    switch(tabId) {
                        case 'hardware-tab':
                            populateHardwareTab(tabContent, data);
                            break;
                        case 'system-tab':
                            populateSystemTab(tabContent, data);
                            break;
                        case 'peripherals-tab':
                            populatePeripheralsTab(tabContent, data);
                            break;
                        case 'network-tab':
                            populateNetworkTab(tabContent, data);
                            break;
                        case 'applications-tab':
                            populateApplicationsTab(tabContent, data);
                            break;
                        case 'files-tab':
                            populateFilesTab(tabContent, data);
                            break;
                    }
                }
                
                // Trigger window resize event after a minimal delay to ensure maps and visualizations render properly
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    console.log(`Tab switched to ${tabId}, triggered resize event for proper rendering`);
                }, 0);
            }
        });
    });
}

/**
 * Creates a visualization for directory sizes
 * @param {Object} directorySizes - Object containing directory sizes data
 * @returns {string} HTML for the directory sizes visualization
 */
function createDirectorySizesVisualization(directorySizes) {
    if (!directorySizes || Object.keys(directorySizes).length === 0) {
        return '<div class="no-data" style="padding: 20px; text-align: center; color: #666;">No directory size data available</div>';
    }
    
    // Format size to human-readable format
    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // Sort directories by size (descending)
    const sortedDirs = Object.entries(directorySizes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20); // Show only top 20 largest directories
    
    const totalSize = sortedDirs.reduce((acc, [_, size]) => acc + size, 0);
    
    let html = `
        <div class="directory-sizes-container" style="background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 20px; margin-top: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 18px; color: #333;">Top Directories by Size</h3>
                <span style="background: #f0f5ff; color: #0066cc; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                    Total: ${formatSize(totalSize)}
                </span>
            </div>
            <div class="directory-sizes-chart" style="margin-bottom: 20px;">
    `;
    
    // Create bar chart visualization with improved styling
    sortedDirs.forEach(([path, size], index) => {
        const percentage = (size / totalSize * 100).toFixed(1);
        const shortPath = path.split('\\').pop() || path; // Get last part of path for short display
        const displayPath = path.length > 60 ? '...' + path.substring(path.length - 60) : path;
        
        // Generate a color based on the size percentage
        let barColor;
        if (percentage > 25) {
            barColor = '#e74c3c'; // Red for very large dirs
        } else if (percentage > 10) {
            barColor = '#f39c12'; // Orange for large dirs
        } else if (percentage > 5) {
            barColor = '#3498db'; // Blue for medium dirs
        } else {
            barColor = '#2ecc71'; // Green for smaller dirs
        }
        
        html += `
            <div class="dir-size-item" style="margin-bottom: 15px; background: #f9f9f9; border-radius: 6px; padding: 12px; border-left: 4px solid ${barColor};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <div style="max-width: 70%;">
                        <div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${path}">
                            ${shortPath}
                        </div>
                        <div style="font-size: 11px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${path}">
                            ${displayPath}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; font-size: 14px; color: #333;">
                            ${formatSize(size)}
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            ${percentage}% of total
                        </div>
                    </div>
                </div>
                <div style="height: 8px; background: #eee; border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${percentage}%; background: ${barColor}; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
            <div style="font-size: 12px; color: #666; text-align: right; border-top: 1px solid #eee; padding-top: 10px;">
                Showing top ${sortedDirs.length} directories by size
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Loads directory sizes data and updates the corresponding section
 */
function loadDirectorySizes() {
    console.log('Loading directory sizes data...');
    
    fetch('directory-sizes.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then(dirSizesData => {
            console.log('Directory sizes data loaded successfully:', Object.keys(dirSizesData).length, 'directories');
            
            // Find the placeholder element and replace it
            const placeholder = document.getElementById('directory-sizes-placeholder');
            if (placeholder) {
                const visualization = createDirectorySizesVisualization(dirSizesData);
                placeholder.outerHTML = visualization;
                console.log('Directory sizes visualization added successfully');
            } else {
                console.error('Directory sizes placeholder not found in the DOM');
                
                // Alternative approach - try to find the Directory Sizes section
                const dirSizesTitles = Array.from(document.querySelectorAll('.data-group-title'));
                const dirSizesTitle = dirSizesTitles.find(el => el.textContent === 'Directory Sizes');
                
                if (dirSizesTitle) {
                    const parentGroup = dirSizesTitle.closest('.data-group');
                    if (parentGroup) {
                        // Append the visualization to the parent group
                        const visualization = createDirectorySizesVisualization(dirSizesData);
                        parentGroup.innerHTML += visualization;
                        console.log('Directory sizes visualization added to parent group');
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error loading directory sizes data:', error);
            
            // Update the placeholder with an error message
            const placeholder = document.getElementById('directory-sizes-placeholder');
            if (placeholder) {
                placeholder.innerHTML = `<div style="padding: 15px; text-align: center; color: #e74c3c;">
                    Could not load directory sizes data: ${error.message}
                </div>`;
            }
        });
}

// Initialize by adding styles and event listeners
function initialize() {
    addFsStatsStyles();
}

// Call initialize when the module is loaded
initialize();

export { displayComputerInfo }; 