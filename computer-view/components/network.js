/**
 * Creates an astonishing visualization for network interfaces
 * This enhanced component integrates multiple network-related data sources:
 * - Network interfaces (primary data)
 * - Default gateway
 * - Default interface
 * - Network statistics (traffic, errors)
 * - Internet latency
 * - WiFi interfaces details
 * - WiFi connection information
 * 
 * The component displays a summary section with key network information,
 * followed by detailed cards for each network interface with their stats.
 * 
 * @param {Array} interfaces - Array of network interface objects
 * @param {Object} additionalData - Additional network data (gateway, default interface, statistics, latency, wifi interfaces, connections)
 * @returns {string} HTML string for the network interfaces component
 */
function createNetworkInterfacesCard(interfaces, additionalData = {}) {
    if (!interfaces) return '';
    
    // Create a container that spans 2 columns with dynamic height to match storage card
    let html = '<div style="grid-column: span 2; display: flex; flex-direction: column; gap: 15px;">';
    
    // Flatten interfaces from all types - handle both object and array formats
    const allInterfaces = [];
    
    // Check if interfaces is an object with type keys or directly an array
    if (Array.isArray(interfaces)) {
        // Direct array format
        allInterfaces.push(...interfaces);
    } else if (typeof interfaces === 'object') {
        // Object with type keys format (e.g. {wired: [...], wireless: [...]})
        Object.keys(interfaces).forEach(type => {
            if (Array.isArray(interfaces[type])) {
                interfaces[type].forEach(iface => {
                    // Add the interface type as a property if not already present
                    if (!iface.type) iface.type = type;
                    allInterfaces.push(iface);
                });
            }
        });
    }
    
    // If no interfaces found, return empty string
    if (allInterfaces.length === 0) return '';
    
    // Sort interfaces by active status first, then by name
    allInterfaces.sort((a, b) => {
        // Active interfaces first
        if (a.operstate === 'up' && b.operstate !== 'up') return -1;
        if (a.operstate !== 'up' && b.operstate === 'up') return 1;
        
        // Then sort by name
        return (a.iface || '').localeCompare(b.iface || '');
    });
    
    // Filter out loopback interfaces
    const visibleInterfaces = allInterfaces.filter(iface => iface.type !== 'loopback');
    
    // Create a card for each interface
    visibleInterfaces.forEach(iface => {
        // Determine if the interface is active
        const isActive = iface.operstate === 'up';
        
        // Determine if traffic statistics exist and have non-zero values
        const rx_bytes = iface.rx_bytes || iface.rxBytes || iface.rxbytes || 0;
        const tx_bytes = iface.tx_bytes || iface.txBytes || iface.txbytes || 0;
        const hasTraffic = rx_bytes > 0 || tx_bytes > 0;
        
        // Determine if errors exist
        const rx_errors = iface.rx_errors || iface.rxErrors || iface.rxerrors || 0;
        const tx_errors = iface.tx_errors || iface.txErrors || iface.txerrors || 0;
        const hasErrors = rx_errors > 0 || tx_errors > 0;
        
        // Get network type (Wireless, Wired, Virtual, etc.)
        let networkType = 'Wired';
        if (iface.type === 'wireless' || iface.type === 'wifi') networkType = 'Wireless';
        else if (iface.type.includes('virtual')) networkType = 'Virtual';
        else if (iface.type.includes('bluetooth')) networkType = 'Bluetooth';
        
        // Determine the header color based on connection status
        const headerBgColor = getStatusColor(iface.operstate);
        
        // Check if this is a wifi interface and find matching data
        let wifiConnection = null;
        if (networkType === 'Wireless' && additionalData.wifiConnections) {
            wifiConnection = additionalData.wifiConnections.find(conn => 
                conn.iface === iface.iface || 
                conn.interface === iface.iface ||
                (conn.mac && iface.mac && conn.mac.toLowerCase() === iface.mac.toLowerCase())
            );
        }
        
        // Create a more compact card layout with flex-grow to fill available height
        let cardHtml = `
            <div style="
                background: white;
                color: #333;
                border-radius: 10px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.08);
                overflow: hidden;
                border: 1px solid #f0f0f0;
                margin-top: 0;
                display: flex;
                flex-direction: column;
                flex: 1;
            ">
                <!-- Compact header with name and icon at very top -->
                <div style="
                    background: linear-gradient(135deg, ${headerBgColor}10, ${headerBgColor}20);
                    position: relative;
                    border-bottom: 2px solid ${headerBgColor};
                    padding: 8px 12px 6px 12px;
                ">
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    ">
                        <!-- Left side with name and status -->
                        <div style="display: flex; align-items: center; gap: 6px; margin-right: auto;">
                            <!-- Interface name with icon -->
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <!-- Interface name -->
                                <div style="font-size: 14px; font-weight: 600; color: #2c3e50; margin-right: 5px;">
                                    ${iface.iface || 'Unknown'}
                                </div>
                            </div>
                            
                            <!-- Status indicator -->
                            <div style="display: flex; align-items: center; gap: 3px;">
                                <span style="
                                    width: 8px; 
                                    height: 8px; 
                                    border-radius: 50%; 
                                    background-color: ${isActive ? '#27ae60' : '#e74c3c'};
                                    display: inline-block;
                                "></span>
                                <span style="font-size: 12px; color: ${isActive ? '#27ae60' : '#e74c3c'}; font-weight: 500; line-height: 1;">
                                    ${capitalize(iface.operstate || 'Unknown')}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Right side with speed and type -->
                        <div style="display: flex; align-items: center; gap: 8px;">                            
                            <!-- Upload/Download speeds for Wireless -->
                            ${networkType === 'Wireless' && wifiConnection && wifiConnection.txRate ? `
                            <div style="
                                display: flex;
                                gap: 4px;
                            ">
                                <!-- Upload speed -->
                                <div style="
                                    background: #fff8f3;
                                    padding: 4px 8px;
                                    border-radius: 8px;
                                    border: 1px solid #fee2d5;
                                    text-align: center;
                                    white-space: nowrap;
                                ">
                                    <div style="font-size: 12px; color: #f97316; display: flex; align-items: center; gap: 3px; font-weight: 500;">
                                        <svg viewBox="0 0 24 24" width="14" height="14">
                                            <path fill="#f97316" d="M7,15L12,10L17,15H7Z" />
                                        </svg>
                                        ${wifiConnection.txRate} Mbps
                                    </div>
                                </div>
                                
                                <!-- Download speed -->
                                ${wifiConnection.rxRate ? `
                                <div style="
                                    background: #f0fbf5;
                                    padding: 4px 8px;
                                    border-radius: 8px;
                                    border: 1px solid #dcf5e6;
                                    text-align: center;
                                    white-space: nowrap;
                                ">
                                    <div style="font-size: 12px; color: #22c55e; display: flex; align-items: center; gap: 3px; font-weight: 500;">
                                        <svg viewBox="0 0 24 24" width="14" height="14">
                                            <path fill="#22c55e" d="M7,10L12,15L17,10H7Z" />
                                        </svg>
                                        ${wifiConnection.rxRate} Mbps
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                            ` : iface.speed ? `
                            <div style="
                                background: #f8f9fa;
                                padding: 2px 6px;
                                border-radius: 8px;
                                border: 1px solid #eee;
                                text-align: center;
                                white-space: nowrap;
                            ">
                                <div style="font-size: 13px; font-weight: 600; color: ${getSpeedColor(iface.speed, networkType)}">
                                    ${iface.speed} Mbps
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- Interface type -->
                            <div style="
                                background: #f0f7f3;
                                padding: 2px 6px;
                                border-radius: 6px;
                                border: 1px solid rgba(30, 138, 78, 0.1);
                                text-align: center;
                                white-space: nowrap;
                            ">
                                <div style="font-size: 11px; color: #1e8a4e; font-weight: 500;">${networkType}</div>
                            </div>
                            
                            <!-- DHCP status badge -->
                            <div style="
                                background: ${iface.dhcp ? 'rgba(39, 174, 96, 0.1)' : 'rgba(189, 195, 199, 0.1)'};
                                padding: 2px 6px;
                                border-radius: 6px;
                                border: 1px solid ${iface.dhcp ? 'rgba(39, 174, 96, 0.2)' : 'rgba(189, 195, 199, 0.2)'};
                                text-align: center;
                                white-space: nowrap;
                                margin-left: 2px;
                            ">
                                <div style="font-size: 11px; color: ${iface.dhcp ? '#27ae60' : '#7f8c8d'}; font-weight: 500;">DHCP ${iface.dhcp ? '✓' : '✗'}</div>
                            </div>
                            
                            <!-- Signal strength bars for Wireless -->
                            ${networkType === 'Wireless' && wifiConnection ? `
                            <div style="
                                display: flex;
                                align-items: flex-end;
                                height: 16px;
                                gap: 2px;
                                margin-left: 6px;
                                padding-bottom: 2px;
                            ">
                                ${generateSignalBars(wifiConnection.signalLevel || wifiConnection.signal)}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${iface.ifaceName && iface.ifaceName !== iface.iface ? `
                    <!-- Enhanced adapter description with better styling similar to storage card -->
                    <div style="
                        background: linear-gradient(135deg, #f8fcfa, #e8f4ee);
                        padding: 8px 12px;
                        border-radius: 6px;
                        margin-top: 5px;
                        border: 1px solid rgba(30, 138, 78, 0.1);
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <!-- WiFi 6 logo for AX1650 cards -->
                        ${iface.ifaceName && iface.ifaceName.includes('AX1650') ? `
                        <div style="
                            width: 36px;
                            height: 36px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 4px;
                            overflow: hidden;
                            background: white;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                        ">
                            <img src="https://down-my.img.susercontent.com/file/c0a8da7fafa171eabdca2e7293a16418" 
                                 style="max-width: 90%; max-height: 90%; object-fit: contain;" 
                                 alt="WiFi 6 Logo" />
                        </div>
                        ` : ''}
                        
                        <!-- Adapter model name -->
                        <div>
                            <div style="font-size: 13px; font-weight: 600; color: #1e8a4e;">
                                ${iface.ifaceName}
                            </div>
                            ${networkType === 'Wireless' ? `
                            <div style="font-size: 11px; color: #7f8c8d; margin-top: 2px;">
                                ${iface.mac || ''}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Compact body with horizontal layout - no scrolling -->
                <div style="padding: 8px 12px; font-size: 12px; display: flex; flex-wrap: wrap; gap: 15px; flex: 1;">
                    <!-- Left column: Basic info and IP Configuration -->
                    <div style="flex: 1; min-width: 250px;">
                        <!-- MAC in a single row -->
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <div><span style="color: #666;">MAC:</span> <span style="font-family: monospace;">${iface.mac || '-'}</span></div>
                        </div>
                        
                        <!-- IP Configuration -->
                        <div>
                            <div style="font-weight: 600; color: #27ae60; margin-bottom: 3px; font-size: 11px;">IP Configuration</div>
                            
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                ${iface.ip4 ? `
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #666; width: 80px;">IPv4:</span>
                                    <span style="font-family: monospace; font-size: 11px; background: #f8f9fa; padding: 2px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${iface.ip4}${iface.ip4_subnet ? ' /' + iface.ip4_subnet.split('/')[1] : ''}
                                    </span>
                                </div>
                                ` : ''}
                                
                                ${iface.ip6 ? `
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #666; width: 80px;">IPv6:</span>
                                    <span style="font-family: monospace; font-size: 11px; background: #f8f9fa; padding: 2px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${formatIPv6(iface.ip6)}
                                    </span>
                                </div>
                                ` : ''}
                                
                                ${iface.dns && iface.dns.length > 0 && iface.dns[0] !== '-' ? `
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #666; width: 80px;">DNS:</span>
                                    <span style="font-family: monospace; font-size: 11px; background: #f8f9fa; padding: 2px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${iface.dns[0]}
                                    </span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Middle column: Traffic Statistics -->
                    ${isActive && hasTraffic ? `
                    <div style="flex: 1; min-width: 200px;">
                        <div style="font-weight: 600; color: #27ae60; margin-bottom: 3px; font-size: 11px;">Traffic Statistics</div>
                        
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;">
                            <div>
                                <div style="color: #666; font-size: 10px;">Received</div>
                                <div style="font-weight: 500;">${formatBytes(rx_bytes)}</div>
                            </div>
                            
                            <div>
                                <div style="color: #666; font-size: 10px;">Transmitted</div>
                                <div style="font-weight: 500;">${formatBytes(tx_bytes)}</div>
                            </div>
                            
                            ${hasErrors ? `
                            <div>
                                <div style="color: #666; font-size: 10px;">Rx Errors</div>
                                <div style="font-weight: 500; color: ${rx_errors > 0 ? '#e74c3c' : '#666'};">${rx_errors}</div>
                            </div>
                            
                            <div>
                                <div style="color: #666; font-size: 10px;">Tx Errors</div>
                                <div style="font-weight: 500; color: ${tx_errors > 0 ? '#e74c3c' : '#666'};">${tx_errors}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Right column: WiFi Connection details -->
                    ${wifiConnection ? `
                    <div style="flex: 1; min-width: 250px;">
                        <div style="font-weight: 600; color: #27ae60; margin-bottom: 3px; font-size: 11px;">WiFi Connection</div>
                        
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-bottom: 0;">
                            ${wifiConnection.ssid ? `
                            <div>
                                <div style="color: #666; font-size: 10px;">SSID</div>
                                <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${wifiConnection.ssid}</div>
                            </div>
                            ` : ''}
                            
                            ${wifiConnection.security ? `
                            <div>
                                <div style="color: #666; font-size: 10px;">Security</div>
                                <div style="font-weight: 500;">${wifiConnection.security}</div>
                            </div>
                            ` : ''}
                            
                            ${wifiConnection.channel ? `
                            <div>
                                <div style="color: #666; font-size: 10px;">Channel</div>
                                <div style="font-weight: 500;">${wifiConnection.channel}</div>
                            </div>
                            ` : ''}
                            
                            ${wifiConnection.frequency ? `
                            <div>
                                <div style="color: #666; font-size: 10px;">Frequency</div>
                                <div style="font-weight: 500;">${wifiConnection.frequency} MHz</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add card to the grid - each card dynamically fills available space
        html += cardHtml;
    });

    html += '</div>';
    return html;
}

/**
 * Convert WiFi signal strength in dBm to quality percentage
 */
function getWifiQuality(signal) {
    if (!signal || isNaN(parseInt(signal))) return 0;
    const signalNum = parseInt(signal);
    
    // WiFi signal is typically between -30 (excellent) and -90 (poor)
    if (signalNum >= -50) return 100;
    if (signalNum >= -60) return 80;
    if (signalNum >= -70) return 60;
    if (signalNum >= -80) return 40;
    if (signalNum >= -90) return 20;
    return 0;
}

/**
 * Get color based on connection state
 * @param {string} state - Connection state
 * @returns {string} CSS color
 */
function getStatusColor(state) {
    // We now use a minimal white background with colored status indicators
    return "#ffffff";
}

/**
 * Get color based on connection speed
 * @param {number} speed - Connection speed in Mbps
 * @param {string} type - Connection type
 * @returns {string} CSS color
 */
function getSpeedColor(speed, type) {
    if (speed <= 0) return '#9E9E9E';
    
    // Different thresholds based on connection type
    const isWireless = type === 'wireless';
    const isWired = type === 'wired';
    
    if (isWireless) {
        if (speed >= 300) return '#4CAF50';
        if (speed >= 100) return '#8BC34A';
        if (speed >= 50) return '#CDDC39';
        if (speed >= 20) return '#FFC107';
        if (speed >= 10) return '#FF9800';
        return '#F44336';
    } else if (isWired) {
        if (speed >= 1000) return '#4CAF50';
        if (speed >= 500) return '#8BC34A';
        if (speed >= 100) return '#CDDC39';
        if (speed >= 50) return '#FFC107';
        if (speed >= 10) return '#FF9800';
        return '#F44336';
    } else {
        if (speed >= 100) return '#4CAF50';
        if (speed >= 50) return '#8BC34A';
        if (speed >= 10) return '#FFC107';
        return '#F44336';
    }
}

/**
 * Get reliability color based on carrier changes
 * @param {number} changes - Number of carrier changes
 * @returns {string} CSS color
 */
function getReliabilityColor(changes) {
    if (changes === 0) return '#4CAF50';
    if (changes < 5) return '#8BC34A';
    if (changes < 10) return '#FFC107';
    if (changes < 20) return '#FF9800';
    return '#F44336';
}

/**
 * Get CSS class for speed visualization
 * @param {number} speed - Connection speed in Mbps
 * @returns {string} CSS class
 */
function getSpeedClass(speed) {
    if (speed >= 1000) return 'speed-gigabit';
    if (speed >= 100) return 'speed-fast';
    if (speed >= 10) return 'speed-medium';
    if (speed > 0) return 'speed-slow';
    return 'speed-none';
}

/**
 * Format IPv6 address for better display
 * @param {string} ipv6 - IPv6 address
 * @returns {string} Formatted IPv6 address
 */
function formatIPv6(ipv6) {
    if (ipv6 === '-' || !ipv6) return '-';
    
    // If it's already formatted, return as is
    if (ipv6.includes(':')) return ipv6;
    
    // Try to format unformatted IPv6 (this is simplified)
    try {
        // Insert colons every 4 characters
        return ipv6.match(/.{1,4}/g).join(':');
    } catch (e) {
        return ipv6;
    }
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Format bytes to a human-readable string
 * @param {number} bytes - The bytes to format
 * @returns {string} Formatted bytes
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate signal bars based on signal strength (dBm)
 * @param {number} signalLevel - Signal strength in dBm
 * @returns {string} HTML for signal bars
 */
function generateSignalBars(signalLevel) {
    // Convert dBm to quality percentage
    // Typical range: -30 (excellent) to -90 (poor)
    const signal = parseInt(signalLevel);
    if (isNaN(signal)) return '<div class="signal-bar inactive" style="height:10%"></div>'.repeat(5);
    
    let quality = 0;
    if (signal >= -50) quality = 100;
    else if (signal >= -60) quality = 80;
    else if (signal >= -70) quality = 60;
    else if (signal >= -80) quality = 40;
    else quality = 20;
    
    // Get color based on signal quality
    const barColor = getQualityColor(quality);
    
    let bars = '';
    for (let i = 1; i <= 4; i++) {
        const barQuality = i * 25;
        const barHeight = Math.min(i * 3 + 4, 16) + 'px';
        const barWidth = '3px';
        const barStyle = quality >= barQuality 
            ? `height:${barHeight};width:${barWidth};background-color:${barColor};border-radius:1px;`
            : `height:${barHeight};width:${barWidth};background-color:#e0e0e0;border-radius:1px;`;
        
        bars += `<div style="${barStyle}"></div>`;
    }
    return bars;
}

/**
 * Get color based on connection quality
 * @param {number} quality - Connection quality (0-100)
 * @returns {string} CSS color
 */
function getQualityColor(quality) {
    if (quality >= 80) return "#22c55e"; // green-500
    if (quality >= 60) return "#84cc16"; // lime-500
    if (quality >= 40) return "#eab308"; // yellow-500
    if (quality >= 20) return "#f97316"; // orange-500
    return "#ef4444"; // red-500
}

/**
 * Get the vendor name from a BSSID/MAC address
 * @param {string} bssid - BSSID/MAC address
 * @returns {string} Vendor name
 */
function getVendorFromBSSID(bssid) {
    if (!bssid || bssid === '-') return '';
    
    try {
        // Use the library to get vendor information
        const vendor = macOuiLookup.getVendor(bssid);
        if (vendor) {
            return vendor;
        }
        
        // Fallback to showing the OUI if the lookup fails or library is not available
        const normalizedBSSID = bssid.toLowerCase().replace(/[^a-f0-9]/g, '');
        const oui = normalizedBSSID.substring(0, 6);
        return `OUI: ${oui.toUpperCase()}`;
    } catch (e) {
        // If there's any error, just return the OUI
        const normalizedBSSID = bssid.toLowerCase().replace(/[^a-f0-9]/g, '');
        const oui = normalizedBSSID.substring(0, 6);
        return `OUI: ${oui.toUpperCase()}`;
    }
}

/**
 * Append WiFi details to the interface card
 */
function appendWifiDetails(interfaceCard, interfaceData) {
    if (!interfaceData.wifi) return;
    
    const wifiDetails = document.createElement('div');
    wifiDetails.className = 'mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs';
    
    // SSID
    const ssidLabel = document.createElement('span');
    ssidLabel.className = 'text-gray-500';
    ssidLabel.textContent = 'SSID:';
    wifiDetails.appendChild(ssidLabel);
    
    const ssidValue = document.createElement('span');
    ssidValue.className = 'font-medium';
    ssidValue.textContent = interfaceData.wifi.ssid || 'N/A';
    wifiDetails.appendChild(ssidValue);
    
    // Security
    const securityLabel = document.createElement('span');
    securityLabel.className = 'text-gray-500';
    securityLabel.textContent = 'Security:';
    wifiDetails.appendChild(securityLabel);
    
    const securityValue = document.createElement('span');
    securityValue.className = 'font-medium';
    securityValue.textContent = interfaceData.wifi.security || 'N/A';
    wifiDetails.appendChild(securityValue);
    
    // Signal Strength
    const signalLabel = document.createElement('span');
    signalLabel.className = 'text-gray-500';
    signalLabel.textContent = 'Signal:';
    wifiDetails.appendChild(signalLabel);
    
    const signalValue = document.createElement('span');
    signalValue.className = 'font-medium';
    
    const signalStrength = interfaceData.wifi.signal || 'N/A';
    const quality = getWifiQuality(signalStrength);
    const qualityColor = getQualityColor(quality);
    
    signalValue.innerHTML = `${signalStrength} dBm <span class="ml-1 text-xs font-medium" style="color: ${qualityColor}">(${quality}%)</span>`;
    wifiDetails.appendChild(signalValue);
    
    // Signal Quality Progress Bar
    const qualityLabel = document.createElement('span');
    qualityLabel.className = 'text-gray-500';
    qualityLabel.textContent = 'Quality:';
    wifiDetails.appendChild(qualityLabel);
    
    const qualityContainer = document.createElement('div');
    qualityContainer.className = 'flex items-center';
    
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'h-1.5 rounded-full';
    progressBar.style.width = `${quality}%`;
    progressBar.style.backgroundColor = qualityColor;
    
    progressBarContainer.appendChild(progressBar);
    qualityContainer.appendChild(progressBarContainer);
    wifiDetails.appendChild(qualityContainer);
    
    // Channel
    const channelLabel = document.createElement('span');
    channelLabel.className = 'text-gray-500';
    channelLabel.textContent = 'Channel:';
    wifiDetails.appendChild(channelLabel);
    
    const channelValue = document.createElement('span');
    channelValue.className = 'font-medium';
    channelValue.textContent = interfaceData.wifi.channel || 'N/A';
    wifiDetails.appendChild(channelValue);
    
    // Frequency
    const freqLabel = document.createElement('span');
    freqLabel.className = 'text-gray-500';
    freqLabel.textContent = 'Frequency:';
    wifiDetails.appendChild(freqLabel);
    
    const freqValue = document.createElement('span');
    freqValue.className = 'font-medium';
    freqValue.textContent = interfaceData.wifi.frequency ? `${interfaceData.wifi.frequency} GHz` : 'N/A';
    wifiDetails.appendChild(freqValue);
    
    // Upload Speed (TX Rate)
    const uploadLabel = document.createElement('span');
    uploadLabel.className = 'text-gray-500';
    uploadLabel.innerHTML = '<span style="display: inline-flex; align-items: center;">' +
        '<svg viewBox="0 0 24 24" width="10" height="10" style="margin-right: 3px;">' +
        '<path fill="#f97316" d="M7,15L12,10L17,15H7Z" />' +
        '</svg>Upload:</span>';
    wifiDetails.appendChild(uploadLabel);
    
    const uploadValue = document.createElement('span');
    uploadValue.className = 'font-medium';
    uploadValue.textContent = interfaceData.wifi.txrate ? `${interfaceData.wifi.txrate} Mbps` : 'N/A';
    wifiDetails.appendChild(uploadValue);
    
    // Download Speed (RX Rate)
    if (interfaceData.wifi.rxrate) {
        const downloadLabel = document.createElement('span');
        downloadLabel.className = 'text-gray-500';
        downloadLabel.innerHTML = '<span style="display: inline-flex; align-items: center;">' +
            '<svg viewBox="0 0 24 24" width="10" height="10" style="margin-right: 3px;">' +
            '<path fill="#22c55e" d="M7,10L12,15L17,10H7Z" />' +
            '</svg>Download:</span>';
        wifiDetails.appendChild(downloadLabel);
        
        const downloadValue = document.createElement('span');
        downloadValue.className = 'font-medium';
        downloadValue.textContent = `${interfaceData.wifi.rxrate} Mbps`;
        wifiDetails.appendChild(downloadValue);
    }
    
    interfaceCard.appendChild(wifiDetails);
}

export { createNetworkInterfacesCard, getVendorFromBSSID };