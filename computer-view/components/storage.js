import { formatBytes } from '../utils.js';
import { getVendorLogo } from './vendors.js';

/**
 * Creates storage cards for disk information using a compact layout
 * @param {Array} diskData - Array of disk information
 * @param {Array} fsData - Array of filesystem information
 * @returns {string} HTML string for the storage cards
 */
function createStorageCard(diskData, fsData) {
    if (!diskData || diskData.length === 0) return '';
    
    // Create a container that spans 2 columns
    let html = '<div style="grid-column: span 2; display: grid; grid-template-columns: repeat(1, 1fr); gap: 15px;">';
    
    // Create a card for each disk
    diskData.forEach(disk => {
        // Try to find matching file system by matching device path or size
        const matchingFs = fsData ? fsData.find(fs => 
            (fs.mount && fs.mount.includes(disk.device)) || 
            (Math.abs(fs.size - disk.size) / disk.size < 0.05) // Size within 5% tolerance
        ) : null;
        
        // Calculate usage if file system data is available
        let usedPercent = 0;
        let availablePercent = 0;
        let usedSpace = '';
        let availableSpace = '';
        let totalSpace = formatBytes(disk.size);
        
        if (matchingFs) {
            usedPercent = Math.round((matchingFs.used / matchingFs.size) * 100);
            availablePercent = 100 - usedPercent;
            usedSpace = formatBytes(matchingFs.used);
            availableSpace = formatBytes(matchingFs.available);
        }
        
        // Get vendor information and logo
        let vendorName = disk.vendor || '';
        
        // Extract vendor from name if not explicitly provided
        if ((!vendorName || vendorName.trim() === '') && disk.name) {
            // Special case for SK hynix drives
            if (disk.name.toLowerCase().includes('hynix') || disk.name.toLowerCase().includes('sk hynix')) {
                vendorName = 'SK hynix';
            } else {
                const nameParts = disk.name.split(' ');
                if (nameParts.length > 1) {
                    // Common vendor names that might appear in the device name
                    const possibleVendors = ['Samsung', 'Intel', 'Crucial', 'Kingston', 'SanDisk', 'WD', 
                        'Western Digital', 'Seagate', 'Toshiba', 'Micron', 'SK hynix', 'Hynix'];
                    
                    for (const vendor of possibleVendors) {
                        if (disk.name.toLowerCase().includes(vendor.toLowerCase())) {
                            vendorName = vendor;
                            break;
                        }
                    }
                }
            }
        }
        
        // For SK hynix NVMe drives, ensure we set the correct vendor name
        if (disk.name && disk.name.toLowerCase().includes('nvme') && 
            (disk.name.toLowerCase().includes('hynix') || disk.name.toLowerCase().includes('sk'))) {
            vendorName = 'SK hynix';
        }
        
        // Get vendor logo
        const vendorLogo = getVendorLogo(vendorName);
        
        // Fallback to a direct URL for SK Hynix if needed
        const skHynixLogoUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/SK_Hynix.svg/1200px-SK_Hynix.svg.png';
        const logoUrl = (vendorName === 'SK hynix' && !vendorLogo) ? skHynixLogoUrl : vendorLogo;
        
        // Determine drive type
        const isSSD = disk.type && (
            disk.type.toLowerCase().includes('ssd') || 
            disk.name && disk.name.toLowerCase().includes('nvme')
        );
        
        // Check if this is a SK hynix NVMe drive to use the specific image
        const isSkHynix = (disk.name && disk.name.toLowerCase().includes('hynix')) || 
                       (disk.vendor && disk.vendor.toLowerCase().includes('hynix'));
        
        // Select appropriate image based on drive type
        let storageImageUrl = '';
        if (isSkHynix && disk.name && disk.name.includes('PC611')) {
            storageImageUrl = 'https://anyitparts.com/wp-content/uploads/2020/12/0MXTT.jpg';
        } else if (isSSD) {
            storageImageUrl = 'https://m.media-amazon.com/images/I/71fZDkZPUdL._AC_SL1500_.jpg'; // Generic SSD image
        } else {
            storageImageUrl = 'https://m.media-amazon.com/images/I/71I9Z6ZoqOL._AC_SL1500_.jpg'; // Generic HDD image
        }
        
        // Format capabilities as a list if available
        let capabilitiesHtml = '';
        if (disk.capabilities && Array.isArray(disk.capabilities) && disk.capabilities.length > 0) {
            capabilitiesHtml = `
                <div>
                    <div style="font-size: 11px; font-weight: 600; color: #27ae60; margin-bottom: 4px; border-bottom: 1px solid #eee; padding-bottom: 2px;">
                        Capabilities
                    </div>
                    <div style="font-size: 11px; display: flex; flex-wrap: wrap; gap: 10px;">
                        ${disk.capabilities.map(cap => `<span style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px; border: 1px solid #eee;">${cap}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Add usage information to the disk object for visualization
        if (matchingFs) {
            // Calculate usage percentage
            disk.usedPercent = Math.round((matchingFs.used / matchingFs.size) * 100);
            disk.used = matchingFs.used;
            disk.available = matchingFs.available;
        } else if (usedPercent > 0) {
            // If we already calculated usage percent at the top of the function
            disk.usedPercent = usedPercent;
            disk.usedPercentDisplay = `${usedPercent}% used`;
        }
        
        // Check for read/write speed data
        const hasReadWriteSpeeds = disk.readSpeed || disk.writeSpeed;
        
        // Check for file handles data
        const hasFileHandles = disk.fileHandles;
        
        // Create a more compact card layout
        let cardHtml = `
            <div style="
                background: white;
                color: #333;
                border-radius: 10px;
                box-shadow: 0 3px 15px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1);
                overflow: hidden;
                height: 100%;
                display: flex;
                flex-direction: column;
                border: 1px solid #f0f0f0;
            ">
                <!-- Redesigned header with better visual hierarchy -->
                <div style="
                    background: linear-gradient(135deg, #f8fcfa, #e8f4ee);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="display: flex; padding: 12px 15px; position: relative; z-index: 2;">
                        <!-- Drive image on the left -->
                        <div style="
                            width: 50px;
                            height: 50px;
                            margin-right: 15px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 6px;
                            overflow: hidden;
                            background: rgba(255,255,255,0.6);
                            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                        ">
                            <img src="${storageImageUrl}" 
                                 alt="${isSSD ? 'SSD Drive' : 'HDD Drive'}" 
                                 style="max-width: 90%; max-height: 90%; object-fit: contain;" 
                                 onerror="this.style.display='none'" />
                        </div>
                        
                        <!-- Drive name and info section -->
                        <div style="flex-grow: 1;">
                            <div style="
                                font-size: 15px;
                                font-weight: 600;
                                color: #1e8a4e;
                                margin-bottom: 3px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                ${disk.name || 'Storage Device'}
                                ${disk.name && disk.name.includes('SK hynix') || disk.name && disk.name.includes('PC611') ? `
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/SK_Hynix.svg/1200px-SK_Hynix.svg.png" 
                                     alt="SK hynix" 
                                     style="height: 20px; width: auto; max-width: 50px; object-fit: contain;"
                                     onerror="this.style.display='none'" />
                                ` : logoUrl ? `
                                <img src="${logoUrl}" 
                                     alt="${vendorName}" 
                                     style="height: 20px; width: auto; max-width: 50px; object-fit: contain;"
                                     onerror="this.style.display='none'" />
                                ` : ''}
                            </div>
                            
                            <!-- Capacity indicator with modern styling -->
                            <div style="display: flex; align-items: center; margin-top: 4px;">
                                <div style="font-size: 20px; font-weight: 700; color: #333; margin-right: 10px;">${formatBytes(disk.size, 0)}</div>
                                ${matchingFs ? `
                                <div style="
                                    display: flex; 
                                    align-items: center;
                                    background: ${usedPercent > 90 ? 'rgba(220,53,69,0.1)' : usedPercent > 75 ? 'rgba(255,193,7,0.1)' : 'rgba(40,167,69,0.1)'};
                                    padding: 3px 8px;
                                    border-radius: 12px;
                                    margin-left: auto;
                                ">
                                    <span style="
                                        color: ${usedPercent > 90 ? '#dc3545' : usedPercent > 75 ? '#d68c00' : '#28a745'};
                                        font-size: 14px;
                                        font-weight: 600;
                                    ">${usedPercent}%</span>
                                    <span style="
                                        color: #666;
                                        font-size: 12px;
                                        margin-left: 4px;
                                    ">used</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Type indicator -->
                        <div style="
                            background: #f0f7f3;
                            padding: 5px 10px;
                            border-radius: 6px;
                            margin-left: 5px;
                            border: 1px solid rgba(30, 138, 78, 0.1);
                        ">
                            <div style="font-size: 11px; color: #666; text-align: center;">Type</div>
                            <div style="font-weight: 600; font-size: 13px; color: #1e8a4e; text-align: center;">${isSSD ? 'SSD' : 'HDD'}</div>
                        </div>
                    </div>
                    
                    <!-- Progress bar for storage usage -->
                    ${matchingFs ? `
                    <div style="height: 6px; width: 100%; background-color: #f0f0f0; overflow: hidden;">
                        <div style="
                            height: 100%;
                            width: ${usedPercent}%;
                            background: ${usedPercent > 90 ? 
                                'linear-gradient(90deg, #ff9f87, #dc3545)' : 
                                usedPercent > 75 ? 
                                'linear-gradient(90deg, #ffda8a, #ffc107)' : 
                                'linear-gradient(90deg, #8fe9af, #28a745)'};
                        "></div>
                    </div>
                    ` : ''}
                    
                    <!-- Key specs with modern styling -->
                    <div style="
                        display: flex;
                        padding: 10px 15px;
                        border-top: 1px solid rgba(0,0,0,0.04);
                        background: rgba(255,255,255,0.5);
                        font-size: 12px;
                        color: #555;
                    ">
                        <!-- Left info -->
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 3px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="color: #888;">Device:</span>
                                <span style="font-weight: 500; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">
                                    ${(disk.device && disk.device !== '') ? `${disk.device}` : 'PHYSICALDRIVE0'}
                                </span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="color: #888;">Interface:</span>
                                <span style="font-weight: 500; color: #444;">
                                    ${disk.interfaceType || disk.type || 'SCSI'}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Right info -->
                        <div style="display: flex; flex-direction: column; gap: 3px; margin-left: 15px;">
                            ${matchingFs ? `
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="color: #888;">Available:</span>
                                <span style="font-weight: 500; color: #444;">${availableSpace}</span>
                            </div>
                            ` : ''}
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="color: #888;">Status:</span>
                                <span style="font-weight: 500; color: ${disk.smartStatus && disk.smartStatus.toLowerCase() !== 'ok' ? '#dc3545' : '#28a745'};">
                                    ${disk.smartStatus || 'Ok'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Main content with all details -->
                <div style="padding: 15px; flex: 1; display: flex; flex-direction: column; gap: 15px; font-size: 12px;">
                    <!-- Quick specs (Serial/Firmware/Partitions) -->
                    <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #666;">
                        ${disk.serialNum ? `<div>S/N: <span style="font-weight: 500;">${disk.serialNum}</span></div>` : ''}
                        ${disk.firmwareRevision ? `<div>FW: <span style="font-weight: 500;">${disk.firmwareRevision}</span></div>` : ''}
                        ${disk.partitions ? `<div>Partitions: <span style="font-weight: 500;">${disk.partitions}</span></div>` : ''}
                        ${disk.model ? `<div>Model: <span style="font-weight: 500;">${disk.model}</span></div>` : ''}
                    </div>
                    
                    <!-- Combined Disk Activity and File Handles in same row -->
                    ${(disk.readSpeed || disk.writeSpeed || disk.fileHandles) ? `
                    <div style="grid-column: span 3; margin-bottom: 2px;">
                        <div style="font-size: 13px; font-weight: 600; color: #27ae60; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                            Disk Activity
                        </div>
                        <div style="display: flex; gap: 20px;">
                            <!-- Read/Write Speed if available -->
                            ${disk.readSpeed || disk.writeSpeed ? `
                            <div style="flex: 1; display: flex; justify-content: space-between; gap: 15px;">
                                ${disk.readSpeed ? `
                                <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Read Speed</div>
                                    <div style="position: relative; width: 100%; max-width: 120px;">
                                        <svg viewBox="0 0 100 50" style="width: 100%;">
                                            <!-- Gauge background -->
                                            <path d="M 10 40 A 40 40 0 0 1 90 40" stroke="#f3f3f3" stroke-width="8" fill="none" />
                                            
                                            <!-- Gauge color markers -->
                                            <path d="M 10 40 A 40 40 0 0 1 30 15" stroke="#dc3545" stroke-width="8" fill="none" stroke-linecap="round" />
                                            <path d="M 30 15 A 40 40 0 0 1 50 8" stroke="#ffc107" stroke-width="8" fill="none" stroke-linecap="round" />
                                            <path d="M 50 8 A 40 40 0 0 1 90 40" stroke="#28a745" stroke-width="8" fill="none" stroke-linecap="round" />
                                            
                                            <!-- Gauge needle - calculated based on speed value -->
                                            <line x1="50" y1="40" x2="${50 + 30 * Math.cos(Math.PI * 0.3)}" y2="${40 - 30 * Math.sin(Math.PI * 0.3)}" 
                                                stroke="#666" stroke-width="2" />
                                            <circle cx="50" cy="40" r="3" fill="#666" />
                                        </svg>
                                    </div>
                                    <div style="font-size: 16px; font-weight: bold; color: #333; margin-top: 5px;">${disk.readSpeed}</div>
                                </div>
                                ` : ''}
                                
                                ${disk.writeSpeed ? `
                                <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Write Speed</div>
                                    <div style="position: relative; width: 100%; max-width: 120px;">
                                        <svg viewBox="0 0 100 50" style="width: 100%;">
                                            <!-- Gauge background -->
                                            <path d="M 10 40 A 40 40 0 0 1 90 40" stroke="#f3f3f3" stroke-width="8" fill="none" />
                                            
                                            <!-- Gauge color markers -->
                                            <path d="M 10 40 A 40 40 0 0 1 30 15" stroke="#dc3545" stroke-width="8" fill="none" stroke-linecap="round" />
                                            <path d="M 30 15 A 40 40 0 0 1 50 8" stroke="#ffc107" stroke-width="8" fill="none" stroke-linecap="round" />
                                            <path d="M 50 8 A 40 40 0 0 1 90 40" stroke="#28a745" stroke-width="8" fill="none" stroke-linecap="round" />
                                            
                                            <!-- Gauge needle - we'll place this at approximately 80% for the example -->
                                            <line x1="50" y1="40" x2="${50 + 30 * Math.cos(Math.PI * 0.8)}" y2="${40 - 30 * Math.sin(Math.PI * 0.8)}" 
                                                stroke="#666" stroke-width="2" />
                                            <circle cx="50" cy="40" r="3" fill="#666" />
                                        </svg>
                                    </div>
                                    <div style="font-size: 16px; font-weight: bold; color: #333; margin-top: 5px;">${disk.writeSpeed}</div>
                                </div>
                                ` : ''}
                            </div>
                            ` : ''}
                            
                            <!-- File Handles visualization if available -->
                            ${disk.fileHandles ? `
                            <div style="flex: 1; display: flex; align-items: center; gap: 20px; flex-direction: column;">
                                <div style="font-size: 12px; color: #666; margin-bottom: 5px; align-self: center;">Open File Handlers</div>
                                <!-- Circular percentage visualization -->
                                <div style="position: relative; width: 80px; height: 80px;">
                                    <svg width="80" height="80" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="transparent" stroke="#f3f3f3" stroke-width="10"></circle>
                                        <circle cx="50" cy="50" r="45" fill="transparent" stroke="#28a745" stroke-width="10" 
                                                stroke-dasharray="${2 * Math.PI * 45}" 
                                                stroke-dashoffset="${2 * Math.PI * 45 * (1 - (disk.fileHandles.allocated / disk.fileHandles.max || 0) / 100)}" 
                                                transform="rotate(-90 50 50)"></circle>
                                        <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="bold" fill="#28a745">
                                            ${Math.round((disk.fileHandles.allocated / disk.fileHandles.max) * 100)}%
                                        </text>
                                        <text x="50" y="70" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#666">Used</text>
                                    </svg>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- All details sections -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 15px; font-size: 12px;">
                        <!-- Basic Information -->
                        <div style="grid-column: span 3; margin-bottom: 2px;">
                            <div style="font-size: 13px; font-weight: 600; color: #27ae60; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                                Basic Information
                            </div>
                        </div>
                        
                        <div><span style="color: #666;">Type:</span> <span style="font-weight: 500;">${isSSD ? 'Solid State Drive (SSD)' : 'HDD'}</span></div>
                        <div><span style="color: #666;">Interface:</span> <span style="font-weight: 500;">${disk.interfaceType || disk.type || 'SCSI'}</span></div>
                        
                        ${matchingFs && matchingFs.mount ? `
                        <div><span style="color: #666;">Mount Point:</span> <span style="font-weight: 500;">${matchingFs.mount}</span></div>
                        ` : ''}
                        
                        ${matchingFs && matchingFs.type ? `
                        <div><span style="color: #666;">File System:</span> <span style="font-weight: 500;">${matchingFs.type}</span></div>
                        ` : ''}
                        
                        ${matchingFs && matchingFs.serialNum ? `
                        <div><span style="color: #666;">FS Serial:</span> <span style="font-weight: 500;">${matchingFs.serialNum}</span></div>
                        ` : ''}
                        
                        ${matchingFs && matchingFs.fs ? `
                        <div><span style="color: #666;">FS Name:</span> <span style="font-weight: 500;">${matchingFs.fs}</span></div>
                        ` : ''}
                        
                        ${matchingFs && matchingFs.rw !== undefined ? `
                        <div><span style="color: #666;">Read/Write:</span> <span style="font-weight: 500;">${matchingFs.rw ? 'Yes' : 'No'}</span></div>
                        ` : ''}
                        
                        <!-- Technical Details -->
                        <div style="grid-column: span 3; margin-top: 6px; margin-bottom: 2px;">
                            <div style="font-size: 13px; font-weight: 600; color: #27ae60; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                                Technical Details
                            </div>
                        </div>
                        
                        ${disk.bytesPerSector ? `
                        <div><span style="color: #666;">Bytes Per Sector:</span> <span style="font-weight: 500;">${disk.bytesPerSector}</span></div>
                        ` : ''}
                        
                        ${disk.busType ? `
                        <div><span style="color: #666;">Bus Type:</span> <span style="font-weight: 500;">${disk.busType}</span></div>
                        ` : ''}
                        
                        ${disk.systemName ? `
                        <div><span style="color: #666;">System Name:</span> <span style="font-weight: 500;">${disk.systemName}</span></div>
                        ` : ''}
                        
                        ${disk.description ? `
                        <div><span style="color: #666;">Description:</span> <span style="font-weight: 500;">${disk.description}</span></div>
                        ` : ''}
                        
                        ${disk.pnpDeviceId ? `
                        <div style="grid-column: span 3;">
                            <span style="color: #666;">PnP Device ID:</span>
                            <span style="font-weight: 500; font-family: monospace; font-size: 10px; background: #f8f9fa; padding: 1px 3px; border-radius: 2px; display: block; margin-top: 1px; overflow-wrap: break-word;">
                                ${disk.pnpDeviceId}
                            </span>
                        </div>
                        ` : ''}
                        
                        <!-- Disk Geometry & Capabilities visualization -->
                        ${(disk.totalCylinders || disk.totalHeads || disk.totalSectors || disk.tracksPerCylinder || disk.sectorsPerTrack || disk.totalTracks) ? 
                            createCompactGeometryVisualization(disk) : ''}
                    </div>
                </div>
            </div>
        `;
        
        html += `<div style="grid-column: span 1;">${cardHtml}</div>`;
    });
    
    html += '</div>';
    return html;
}

/**
 * Creates a compact visualization of the disk geometry for embedding in the storage card
 * @param {Object} disk - Disk information object
 * @returns {string} HTML string for the compact geometry visualization
 */
function createCompactGeometryVisualization(disk) {
    if (!disk || (!disk.totalCylinders && !disk.totalHeads && !disk.totalSectors)) return '';
    
    const { totalCylinders, totalHeads, totalSectors, tracksPerCylinder, sectorsPerTrack, totalTracks, capabilities } = disk;
    
    // Calculate the usage percentage based on device or find from matchingFs
    // Get usage from the filesystem data or set a default
    let usedPercent = 0;
    
    // Check if we have the size property
    if (disk.size) {
        if (disk.used) {
            usedPercent = Math.round((disk.used / disk.size) * 100);
        } else if (disk.usedPercentDisplay) {
            // If it comes as a percentage string like "87% used"
            const percentMatch = disk.usedPercentDisplay.match(/(\d+)%/);
            if (percentMatch && percentMatch[1]) {
                usedPercent = parseInt(percentMatch[1]);
            }
        } else if (disk.available) {
            // Calculate from available space
            const used = disk.size - disk.available;
            usedPercent = Math.round((used / disk.size) * 100);
        }
    }
    
    // Determine color based on usage percentage
    const getUsageColor = (percent) => {
        if (percent < 60) return '#28a745'; // Green for low usage
        if (percent < 80) return '#ffc107'; // Yellow for moderate usage
        return '#dc3545'; // Red for high usage
    };
    
    const usageColor = getUsageColor(usedPercent);
    
    // Create a compact SVG-based visualization
    const html = `
    <div style="grid-column: span 3; margin-top: 12px; margin-bottom: 4px;">
        <div style="font-size: 13px; font-weight: 600; color: #27ae60; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
            Disk Geometry & Capabilities
        </div>
    </div>
    
    <div style="grid-column: span 3; display: flex; gap: 15px; margin-bottom: 12px;">
        <!-- Key metrics in a compact form -->
        <div style="flex: 1; font-size: 12px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 15px;">
                ${totalCylinders ? `
                <div>
                    <div style="color: #27ae60; font-weight: 600; margin-bottom: 2px;">Cylinders</div>
                    <div style="font-weight: 500; font-size: 13px;">${totalCylinders.toLocaleString()}</div>
                </div>` : ''}
                
                ${totalHeads ? `
                <div>
                    <div style="color: #3498db; font-weight: 600; margin-bottom: 2px;">Heads</div>
                    <div style="font-weight: 500; font-size: 13px;">${totalHeads.toLocaleString()}</div>
                </div>` : ''}
                
                ${totalSectors ? `
                <div>
                    <div style="color: #e74c3c; font-weight: 600; margin-bottom: 2px;">Sectors</div>
                    <div style="font-weight: 500; font-size: 13px;">${totalSectors.toLocaleString()}</div>
                </div>` : ''}
                
                ${tracksPerCylinder ? `
                <div>
                    <div style="color: #666; font-weight: 600; margin-bottom: 2px;">Tracks/Cyl</div>
                    <div style="font-weight: 500; font-size: 13px;">${tracksPerCylinder.toLocaleString()}</div>
                </div>` : ''}
                
                ${sectorsPerTrack ? `
                <div>
                    <div style="color: #666; font-weight: 600; margin-bottom: 2px;">Sectors/Track</div>
                    <div style="font-weight: 500; font-size: 13px;">${sectorsPerTrack.toLocaleString()}</div>
                </div>` : ''}
                
                ${totalTracks ? `
                <div>
                    <div style="color: #666; font-weight: 600; margin-bottom: 2px;">Total Tracks</div>
                    <div style="font-weight: 500; font-size: 13px;">${totalTracks.toLocaleString()}</div>
                </div>` : ''}
            </div>
            
            <!-- Capabilities as badges -->
            ${capabilities && Array.isArray(capabilities) && capabilities.length > 0 ? `
            <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
                ${capabilities.map(cap => 
                `<span style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px; font-size: 11px; border: 1px solid #eee; font-weight: 500;">${cap}</span>`
                ).join('')}
            </div>` : ''}
        </div>
        
        <!-- Mini visualization with usage indicator -->
        <div style="width: 130px; height: 130px; position: relative;">
            <svg width="100%" height="100%" viewBox="0 0 130 130" style="overflow: visible;">
                <!-- Disk base -->
                <circle cx="65" cy="65" r="55" fill="#f5f5f5" stroke="#ddd" stroke-width="1" />
                
                <!-- Usage visualization as a filled arc -->
                ${usedPercent > 0 ? `
                <path d="M 65 10 A 55 55 0 ${usedPercent >= 50 ? 1 : 0} 1 ${
                    65 + 55 * Math.sin(2 * Math.PI * usedPercent / 100)
                } ${
                    65 - 55 * Math.cos(2 * Math.PI * usedPercent / 100)
                } L 65 65 Z"
                fill="${usageColor}" opacity="0.3" />
                ` : ''}
                
                <!-- Drive hub -->
                <circle cx="65" cy="65" r="16" fill="#e0e0e0" stroke="#ccc" stroke-width="1" />
                <circle cx="65" cy="65" r="5" fill="white" stroke="#ccc" stroke-width="1" />
                
                <!-- Cylinders representation (concentric circles) -->
                <circle cx="65" cy="65" r="27" fill="none" stroke="#27ae60" stroke-width="1.5" opacity="0.7" />
                <circle cx="65" cy="65" r="38" fill="none" stroke="#27ae60" stroke-width="1.5" opacity="0.7" />
                <circle cx="65" cy="65" r="49" fill="none" stroke="#27ae60" stroke-width="1.5" opacity="0.7" />
                
                <!-- Tracks (radial lines) -->
                <line x1="65" y1="65" x2="65" y2="10" stroke="#3498db" stroke-width="1.5" opacity="0.7" />
                <line x1="65" y1="65" x2="65" y2="120" stroke="#3498db" stroke-width="1.5" opacity="0.7" />
                <line x1="65" y1="65" x2="10" y2="65" stroke="#3498db" stroke-width="1.5" opacity="0.7" />
                <line x1="65" y1="65" x2="120" y2="65" stroke="#3498db" stroke-width="1.5" opacity="0.7" />
                <line x1="65" y1="65" x2="29" y2="29" stroke="#3498db" stroke-width="1.5" opacity="0.7" />
                <line x1="65" y1="65" x2="101" y2="29" stroke="#3498db" stroke-width="1.5" opacity="0.7" />
                <line x1="65" y1="65" x2="29" y2="101" stroke="#3498db" stroke-width="1.5" opacity="0.7" />
                <line x1="65" y1="65" x2="101" y2="101" stroke="#3498db" stroke-width="1.5" opacity="0.7" />
                
                <!-- Sectors (arcs) -->
                <path d="M 65 65 L 92 38 A 38 38 0 0 1 106 65 Z" fill="#e74c3c" opacity="0.25" />
                <path d="M 65 65 L 106 65 A 38 38 0 0 1 92 92 Z" fill="#e74c3c" opacity="0.25" />
                <path d="M 65 65 L 92 92 A 38 38 0 0 1 65 106 Z" fill="#e74c3c" opacity="0.25" />
                <path d="M 65 65 L 65 106 A 38 38 0 0 1 38 92 Z" fill="#e74c3c" opacity="0.25" />
                <path d="M 65 65 L 38 92 A 38 38 0 0 1 24 65 Z" fill="#e74c3c" opacity="0.25" />
                <path d="M 65 65 L 24 65 A 38 38 0 0 1 38 38 Z" fill="#e74c3c" opacity="0.25" />
                <path d="M 65 65 L 38 38 A 38 38 0 0 1 65 24 Z" fill="#e74c3c" opacity="0.25" />
                <path d="M 65 65 L 65 24 A 38 38 0 0 1 92 38 Z" fill="#e74c3c" opacity="0.25" />
                
                <!-- Usage percentage label -->
                ${usedPercent > 0 ? `
                <g>
                    <circle cx="65" cy="20" r="12" fill="white" stroke="${usageColor}" stroke-width="1" />
                    <text x="65" y="23" text-anchor="middle" font-size="10" font-weight="bold" fill="${usageColor}">${usedPercent}%</text>
                </g>
                ` : ''}
            </svg>
        </div>
    </div>
    `;
    
    return html;
}

export { createStorageCard };