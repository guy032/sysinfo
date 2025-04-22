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
    createNetworkInterfacesCard,
    createWifiRadarVisualization,
    createNetworkConnectionsVisual,
    createUsbDevicesGrid,
    createPrintersGrid,
    createAudioDevicesGrid,
    createBluetoothDevicesGrid,
} from './components/index.js';
import { createMapSection, initMap } from './map.js';
import { addStyles, addFsStatsStyles, addSpeedGaugeStyles, addBatteryStyles } from './styles.js';
import { createTableSection, createApplicationsTable } from './sections.js';

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
    html += '<div class="hardware-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 15px;">';
    
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
        
        tabsContent.system += createOSCard(data.osInfo, osUUID);
        tabsContent.system += '</div>';
    }
    
    // Location (span 1 column) - moved up to be next to OS card
    if (data.gps) {
        tabsContent.system += '<div style="grid-column: span 1;">';
        tabsContent.system += createMapSection('GPS Information', data.gps);
        tabsContent.system += '</div>';
    }
    
    // Time and Users side by side
    // Time (span 1 column)
    if (data.time) {
        tabsContent.system += '<div style="grid-column: span 1;">';
        tabsContent.system += createTimeCard(data.time);
        tabsContent.system += '</div>';
    }
    
    // Users (span 1 column)
    if (data.users && data.users.length > 0) {
        tabsContent.system += '<div style="grid-column: span 1;">';
        tabsContent.system += createUsersCard(data.users);
        tabsContent.system += '</div>';
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
    
    // Open files information
    if (data.fsOpenFiles) {
        tabsContent.files += '<div class="data-group"><div class="data-group-title">Open Files</div>';
        
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
        
        tabsContent.files += '</div>';
    }
    
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

// Initialize by adding styles and event listeners
function initialize() {
    addFsStatsStyles();
}

// Call initialize when the module is loaded
initialize();

export { displayComputerInfo }; 