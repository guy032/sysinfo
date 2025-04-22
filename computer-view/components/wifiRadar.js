// Import required functions
import { getVendorFromBSSID as networkGetVendorFromBSSID } from './network.js';

/**
 * Provides vendor information from a BSSID with error handling
 * @param {string} bssid - The BSSID/MAC address
 * @returns {string} Vendor information or OUI
 */
function getVendorFromBSSID(bssid) {
    if (!bssid) return '';
    
    try {
        // Use the imported function with error handling
        return networkGetVendorFromBSSID(bssid);
    } catch (e) {
        // Fallback to extracting OUI if the imported function fails
        try {
            const normalizedBSSID = bssid.toLowerCase().replace(/[^a-f0-9]/g, '');
            if (normalizedBSSID.length >= 6) {
                const oui = normalizedBSSID.substring(0, 6).toUpperCase();
                return `OUI: ${oui}`;
            }
        } catch (innerError) {
            console.error('Error processing BSSID:', innerError);
        }
    }
    
    return '';
}

/**
 * Creates a futuristic WiFi radar visualization based on signal strength
 * Displays WiFi networks as nodes at different distances from the center
 * based on their signal strength.
 * 
 * @param {Array} wifiNetworks - Array of WiFi networks with signal information
 * @param {Object} options - Visualization options
 * @param {boolean} options.lightMode - Whether to use light mode (default: false)
 * @returns {string} HTML string for the WiFi radar visualization component
 */
function createWifiRadarVisualization(wifiNetworks = [], options = {}) {
    if (!wifiNetworks || wifiNetworks.length === 0) return '';
    
    // Default to dark mode unless lightMode is explicitly true
    const lightMode = options.lightMode === true;
    
    // Generate unique ID for this radar instance
    const radarId = 'wifi-radar-' + Math.random().toString(36).substr(2, 9);
    
    // Initialize radar when the DOM is loaded
    initRadarOnLoad(radarId, wifiNetworks, lightMode);
    
    // Create and return the HTML string for the radar visualization
    return `
        <div class="wifi-radar-container ${lightMode ? 'light-mode' : ''}">
            <div class="wifi-radar-header">
                <h3>WiFi Networks Radar</h3>
                <div class="wifi-radar-legend">
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: #4CAF50;"></span>
                        <span class="legend-label">Excellent (> -55 dBm)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: #8BC34A;"></span>
                        <span class="legend-label">Good (> -67 dBm)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: #FFC107;"></span>
                        <span class="legend-label">Fair (> -75 dBm)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: #FF9800;"></span>
                        <span class="legend-label">Poor (> -85 dBm)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: #F44336;"></span>
                        <span class="legend-label">Weak (≤ -85 dBm)</span>
                    </div>
                </div>
            </div>
            <div class="wifi-radar-canvas-container">
                <canvas id="${radarId}" width="600" height="600"></canvas>
                <div class="wifi-radar-overlay">
                    <div class="radar-computer">
                        <svg viewBox="0 0 24 24" width="32" height="32">
                            <path fill="currentColor" d="M2,2V22H22V2H2M20,20H4V4H20V20M15.69,16.37L14.37,15.05L12,17.42L9.63,15.05L8.31,16.37L12,20.06L15.69,16.37M8.31,7.63L9.63,8.95L12,6.58L14.37,8.95L15.69,7.63L12,3.94L8.31,7.63Z" />
                        </svg>
                    </div>
                </div>
            </div>
            <div class="network-details-panel">
                <div class="panel-title">Network Details</div>
                <div id="${radarId}-details" class="panel-content">
                    <div class="panel-placeholder">Click on a network for details</div>
                </div>
            </div>
            
            <style>
                .wifi-radar-container {
                    height: 600px;
                    background: linear-gradient(to bottom, #1a1a2e, #16213e);
                    border-radius: 12px;
                    overflow: hidden;
                    padding: 20px;
                    margin-bottom: 25px;
                    color: #ffffff;
                    display: grid;
                    grid-template-columns: 1fr 300px;
                    grid-template-rows: auto 1fr;
                    grid-template-areas:
                        "header header"
                        "radar details";
                    gap: 20px;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                }
                
                .wifi-radar-container.light-mode {
                    background: linear-gradient(to bottom, #f0f5ff, #e6f0ff);
                    color: #333333;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }
                
                .wifi-radar-header {
                    grid-area: header;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                
                .light-mode .wifi-radar-header {
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                }
                
                .wifi-radar-header h3 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                    background: linear-gradient(45deg, #0ff, #00bfff);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0 0 10px rgba(0,255,255,0.3);
                }
                
                .light-mode .wifi-radar-header h3 {
                    background: linear-gradient(45deg, #0099ff, #3366ff);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0 0 5px rgba(0,127,255,0.2);
                }
                
                .wifi-radar-legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                }
                
                .legend-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 3px;
                    display: inline-block;
                }
                
                .legend-label {
                    color: rgba(255,255,255,0.8);
                }
                
                .light-mode .legend-label {
                    color: rgba(0,0,0,0.7);
                }
                
                .wifi-radar-canvas-container {
                    grid-area: radar;
                    position: relative;
                    background: rgba(0,0,0,0.2);
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: inset 0 0 20px rgba(0,191,255,0.1);
                }
                
                .light-mode .wifi-radar-canvas-container {
                    background: rgba(255,255,255,0.8);
                    box-shadow: inset 0 0 20px rgba(0,127,255,0.1), 0 0 0 1px rgba(0,0,0,0.1);
                }
                
                canvas[id^="wifi-radar-"] {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
                
                .wifi-radar-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
                
                .radar-computer {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 60px;
                    height: 60px;
                    background: rgba(0,127,255,0.2);
                    border: 2px solid rgba(0,191,255,0.6);
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 0 0 20px rgba(0,191,255,0.4);
                    animation: pulse 2s infinite;
                    color: #FFF;
                }
                
                .light-mode .radar-computer {
                    background: rgba(0,127,255,0.1);
                    border: 2px solid rgba(0,127,255,0.6);
                    box-shadow: 0 0 20px rgba(0,127,255,0.3);
                    color: #0066cc;
                }
                
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(0,191,255,0.5); }
                    70% { box-shadow: 0 0 0 15px rgba(0,191,255,0); }
                    100% { box-shadow: 0 0 0 0 rgba(0,191,255,0); }
                }
                
                .light-mode @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(0,127,255,0.5); }
                    70% { box-shadow: 0 0 0 15px rgba(0,127,255,0); }
                    100% { box-shadow: 0 0 0 0 rgba(0,127,255,0); }
                }
                
                .network-details-panel {
                    grid-area: details;
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                
                .light-mode .network-details-panel {
                    background: rgba(255,255,255,0.9);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05);
                }
                
                .panel-title {
                    background: rgba(0,127,255,0.2);
                    padding: 12px 15px;
                    font-weight: 600;
                    font-size: 16px;
                    color: #00bfff;
                    border-bottom: 1px solid rgba(0,191,255,0.2);
                }
                
                .light-mode .panel-title {
                    background: rgba(0,127,255,0.1);
                    color: #0066cc;
                    border-bottom: 1px solid rgba(0,127,255,0.2);
                }
                
                .panel-content {
                    padding: 15px;
                    overflow-y: auto;
                    flex: 1;
                }
                
                .panel-placeholder {
                    color: rgba(255,255,255,0.5);
                    text-align: center;
                    padding: 40px 0;
                }
                
                .light-mode .panel-placeholder {
                    color: rgba(0,0,0,0.4);
                }
                
                .network-detail-item {
                    background: rgba(255,255,255,0.1);
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 10px;
                    border-left: 3px solid;
                    transition: transform 0.2s;
                }
                
                .light-mode .network-detail-item {
                    background: rgba(0,0,0,0.03);
                }
                
                .network-detail-item:hover {
                    transform: translateX(5px);
                }
                
                .network-detail-name {
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 8px;
                }
                
                .network-detail-vendor {
                    font-size: 12px;
                    color: rgba(255,255,255,0.6);
                    margin-top: -6px;
                    margin-bottom: 8px;
                    font-style: italic;
                }
                
                .light-mode .network-detail-vendor {
                    color: rgba(0,0,0,0.5);
                }
                
                .network-detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                    font-size: 13px;
                }
                
                .detail-label {
                    color: rgba(255,255,255,0.6);
                }
                
                .light-mode .detail-label {
                    color: rgba(0,0,0,0.5);
                }
                
                .detail-value {
                    font-weight: 500;
                }
                
                .signal-bars {
                    display: flex;
                    align-items: flex-end;
                    height: 15px;
                    gap: 2px;
                }
                
                .signal-bar {
                    width: 4px;
                    background-color: currentColor;
                    border-radius: 1px;
                }
                
                .signal-bar.inactive {
                    background-color: rgba(255,255,255,0.2);
                }
                
                .light-mode .signal-bar.inactive {
                    background-color: rgba(0,0,0,0.1);
                }
                
                @media (max-width: 1024px) {
                    .wifi-radar-container {
                        grid-template-columns: 1fr;
                        grid-template-rows: auto 1fr auto;
                        grid-template-areas:
                            "header"
                            "radar"
                            "details";
                    }
                    
                    .network-details-panel {
                        height: 250px;
                    }
                }
                
                @media (max-width: 480px) {
                    .wifi-radar-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
            </style>
        </div>
    `;
}

/**
 * Initialize the radar visualization when DOM is loaded
 * @param {string} radarId - ID of the canvas element
 * @param {Array} wifiNetworks - Array of WiFi networks
 * @param {boolean} lightMode - Whether to use light mode
 */
function initRadarOnLoad(radarId, wifiNetworks, lightMode) {
    // Store data for this instance to make it accessible when DOM is ready
    if (!window._wifiRadarData) {
        window._wifiRadarData = {};
    }
    window._wifiRadarData[radarId] = {
        networks: wifiNetworks,
        lightMode: lightMode
    };
    
    // Initialize radar once DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initWifiRadar(radarId, wifiNetworks, lightMode);
        });
    } else {
        // If DOM is already loaded, initialize immediately
        setTimeout(() => {
            initWifiRadar(radarId, wifiNetworks, lightMode);
        }, 0);
    }
}

/**
 * Initialize WiFi radar visualization
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} networks - Array of WiFi networks
 * @param {boolean} lightMode - Whether to use light mode
 */
function initWifiRadar(canvasId, networks, lightMode) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const detailsPanel = document.getElementById(canvasId + '-details');
    if (!detailsPanel) {
        console.error('Details panel not found:', canvasId + '-details');
    }
    
    // Set canvas dimensions based on its display size to ensure proper click detection
    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        // Only resize if dimensions have changed
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
    };
    
    // Initial resize
    resizeCanvas();
    
    // Listen for window resize
    window.addEventListener('resize', resizeCanvas);
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Group networks by BSSID to avoid duplicates
    const groupedNetworks = [];
    const bssidGroups = {};
    
    /**
     * Determines if two BSSIDs are likely from the same physical device
     * @param {string} bssid1 - First BSSID
     * @param {string} bssid2 - Second BSSID
     * @returns {boolean} True if BSSIDs likely belong to the same physical device
     */
    const areRelatedBSSIDs = (bssid1, bssid2) => {
        if (!bssid1 || !bssid2) return false;
        
        // Normalize BSSID format (remove colons, dashes, etc.)
        const normalize = (bssid) => bssid.toLowerCase().replace(/[^a-f0-9]/g, '');
        
        const norm1 = normalize(bssid1);
        const norm2 = normalize(bssid2);
        
        // Check if one is empty or malformed
        if (norm1.length < 12 || norm2.length < 12) return false;
        
        // Compare the first 5 octets (10 hex chars) - ignore the last octet
        // This assumes the last octet is the one that changes for different radios/channels
        return norm1.substring(0, 10) === norm2.substring(0, 10);
    };
    
    /**
     * Finds a related BSSID group if one exists
     * @param {string} bssid - BSSID to find related group for
     * @returns {string|null} The key of related group, or null if none found
     */
    const findRelatedBSSIDGroup = (bssid) => {
        const keys = Object.keys(bssidGroups);
        for (const key of keys) {
            if (areRelatedBSSIDs(key, bssid)) {
                return key;
            }
        }
        return null;
    };
    
    /**
     * Get a normalized SSID from a network object
     * @param {Object} network - Network object
     * @returns {string} Normalized SSID or empty string
     */
    const getNormalizedSSID = (network) => {
        const ssid = network.ssid || network.name || '';
        return ssid.trim().toLowerCase(); 
    };
    
    // First pass: Group by SSID to handle cases where BSSID might be completely different
    const ssidGroups = {};
    
    networks.forEach(network => {
        const ssid = getNormalizedSSID(network);
        if (ssid && ssid !== '') {
            if (!ssidGroups[ssid]) {
                ssidGroups[ssid] = [];
            }
            ssidGroups[ssid].push(network);
        }
    });
    
    // Process networks, grouping by related BSSIDs
    networks.forEach(network => {
        const bssid = network.bssid || network.mac;
        const ssid = getNormalizedSSID(network);
        
        // If no BSSID/MAC, treat as individual network
        if (!bssid) {
            groupedNetworks.push({
                ...network,
                channels: [network.channel],
                variants: [network]
            });
            return;
        }
        
        // Check if we already have this BSSID group
        if (bssidGroups[bssid]) {
            // Add to existing group with exact BSSID match
            const existingGroup = bssidGroups[bssid];
            addToGroup(existingGroup, network);
        } else {
            // Look for a related BSSID group
            const relatedGroupKey = findRelatedBSSIDGroup(bssid);
            
            if (relatedGroupKey) {
                // If related BSSIDs exist, check that SSIDs match before grouping
                const relatedGroup = bssidGroups[relatedGroupKey];
                const relatedSSID = getNormalizedSSID(relatedGroup);
                
                if (ssid === relatedSSID) {
                    // Add to the related group since BSSIDs are related and SSIDs match
                    addToGroup(relatedGroup, network);
                } else {
                    // Create a new group if SSIDs don't match despite related BSSIDs
                    createNewGroup(network, bssid);
                }
            } else {
                // Create a new group as no related BSSIDs were found
                createNewGroup(network, bssid);
            }
        }
    });
    
    /**
     * Helper function to add a network to an existing group
     * @param {Object} group - The group to add to
     * @param {Object} network - The network to add
     */
    function addToGroup(group, network) {
        // Add channel if not already present
        if (network.channel && !group.channels.includes(network.channel)) {
            group.channels.push(network.channel);
        }
            
        // Add to variants
        group.variants.push(network);
            
        // Use the strongest signal for the group's signal level
        const existingSignal = parseInt(group.signal_level || group.signalLevel || -90);
        const newSignal = parseInt(network.signal_level || network.signalLevel || -90);
            
        if (newSignal > existingSignal) {
            group.signal_level = network.signal_level;
            group.signalLevel = network.signalLevel;
        }
    }
    
    /**
     * Helper function to create a new network group
     * @param {Object} network - The network to create a group for
     * @param {string} bssid - The BSSID key to use
     */
    function createNewGroup(network, bssid) {
        const baseNetwork = {
            ...network,
            channels: [network.channel],
            variants: [network]
        };
        bssidGroups[bssid] = baseNetwork;
        groupedNetworks.push(baseNetwork);
    }
    
    console.log(`Grouped ${networks.length} networks into ${groupedNetworks.length} unique access points`);
    
    // Process networks data - normalize signal levels
    const processedNetworks = groupedNetworks.map(network => {
        // Get signal level (handle different property names)
        const signalLevel = parseInt(network.signal_level || network.signalLevel || -90);
        
        // Calculate distance from center based on signal strength
        // Signal range: -30 (excellent) to -90 (poor)
        const normalizedSignal = Math.max(-90, Math.min(-30, signalLevel));
        const distance = mapRange(normalizedSignal, -30, -90, 0.15, 0.85); // As percentage of radius
        
        // Calculate color based on signal
        let color;
        if (signalLevel >= -55) color = '#4CAF50';
        else if (signalLevel >= -67) color = '#8BC34A';
        else if (signalLevel >= -75) color = '#FFC107';
        else if (signalLevel >= -85) color = '#FF9800';
        else color = '#F44336';
        
        // Generate a consistent angle for the network
        // Use MAC address or BSSID if available, otherwise SSID
        const identifier = network.mac || network.bssid || network.ssid || Math.random().toString();
        let hashValue = 0;
        for (let i = 0; i < identifier.length; i++) {
            hashValue = (hashValue << 5) - hashValue + identifier.charCodeAt(i);
        }
        const angle = Math.abs(hashValue % 360);
        
        // Size based on signal and number of channels
        const channelCount = network.channels?.length || 1;
        const baseSize = mapRange(signalLevel, -30, -90, 18, 8);
        const sizeBoost = Math.min(channelCount * 2, 10); // Cap the size boost
        
        return {
            ...network,
            signalLevel,
            distance,
            color,
            angle: angle * (Math.PI / 180), // Convert to radians
            size: baseSize + sizeBoost, // Node size based on signal + number of channels
            speed: mapRange(signalLevel, -30, -90, 0.0005, 0.0002) // Animation speed
        };
    });
    
    // Track animation state
    let animationFrame;
    let selectedNetwork = null;
    
    // Draw the radar
    function drawRadar() {
        // Check if canvas still exists (in case it was removed from DOM)
        if (!canvas.isConnected) {
            cancelAnimationFrame(animationFrame);
            return;
        }
        
        // Get current canvas dimensions
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) * 0.45;
        
        // Set colors based on mode
        const gridColor = lightMode ? 'rgba(0, 127, 255, 0.2)' : 'rgba(0, 191, 255, 0.3)';
        const sweepColor = lightMode ? 'rgba(0, 127, 255, 0.8)' : 'rgba(0, 255, 255, 0.6)';
        const glowColor1 = lightMode ? 'rgba(0, 127, 255, 0.05)' : 'rgba(0, 191, 255, 0.1)';
        const glowColor2 = lightMode ? 'rgba(0, 127, 255, 0)' : 'rgba(0, 191, 255, 0)';
        const lineColorActive = lightMode ? 'rgba(0, 127, 255, 0.6)' : 'rgba(255, 255, 255, 0.6)';
        const lineColorInactive = lightMode ? 'rgba(0, 127, 255, 0.2)' : 'rgba(255, 255, 255, 0.2)';
        const labelColor = lightMode ? '#333333' : '#FFFFFF';
        
        // Draw radar circles
        for (let i = 1; i <= 4; i++) {
            const radius = maxRadius * (i / 4);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Draw radar sweep
        const now = Date.now();
        const sweepAngle = (now / 3000) % (Math.PI * 2);
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(sweepAngle) * maxRadius,
            centerY + Math.sin(sweepAngle) * maxRadius
        );
        ctx.strokeStyle = sweepColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw the glow in sweep direction
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, maxRadius
        );
        gradient.addColorStop(0, glowColor1);
        gradient.addColorStop(1, glowColor2);
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, maxRadius, sweepAngle - 0.2, sweepAngle + 0.2);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw WiFi networks
        processedNetworks.forEach(network => {
            // Calculate position with slight movement
            const wobble = Math.sin(now * network.speed) * 0.02;
            const distance = network.distance + wobble;
            const x = centerX + Math.cos(network.angle) * (maxRadius * distance);
            const y = centerY + Math.sin(network.angle) * (maxRadius * distance);
            
            // Store position for interaction
            network.x = x;
            network.y = y;
            network.radius = network.size * 3; // Click detection radius
            
            // Draw connection line
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = network === selectedNetwork ? 
                lineColorActive : lineColorInactive;
            ctx.lineWidth = network === selectedNetwork ? 2 : 1;
            ctx.stroke();
            
            // Draw signal circles
            const glowSize = network.size * 2.5;
            const glowAlpha = 0.3 + Math.sin(now * 0.002) * 0.1;
            
            // Draw glow
            ctx.beginPath();
            ctx.arc(x, y, glowSize, 0, Math.PI * 2);
            
            // Prepare colors outside template literals
            const selectedFillStyle = 'rgba(255, 255, 255, ' + glowAlpha + ')';
            const networkFillStyle = 'rgba(' + hexToRgb(network.color) + ', ' + glowAlpha + ')';
            
            // Apply the appropriate color
            ctx.fillStyle = network === selectedNetwork ? selectedFillStyle : networkFillStyle;
            ctx.fill();
            
            // Draw network node
            ctx.beginPath();
            ctx.arc(x, y, network.size, 0, Math.PI * 2);
            ctx.fillStyle = network === selectedNetwork ? '#FFFFFF' : network.color;
            ctx.strokeStyle = lightMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = network === selectedNetwork ? 2 : 1;
            ctx.fill();
            ctx.stroke();
            
            // For networks with multiple channels, add inner rings
            if (network.channels && network.channels.length > 1) {
                const ringCount = Math.min(network.channels.length, 3); // Show up to 3 rings
                for (let i = 1; i <= ringCount; i++) {
                    const ringSize = network.size * (0.7 - (i * 0.15));
                    if (ringSize > 2) { // Only draw visible rings
                        ctx.beginPath();
                        ctx.arc(x, y, ringSize, 0, Math.PI * 2);
                        ctx.strokeStyle = network === selectedNetwork ? 
                            'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
                        if (lightMode) {
                            ctx.strokeStyle = network === selectedNetwork ? 
                                'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)';
                        }
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
            
            // Add SSID label for selected network or strong signals
            if (network === selectedNetwork || network.signalLevel > -67) {
                const ssid = network.ssid || network.name || 'Unknown';
                let label = ssid;
                
                // Show channel count for multi-channel networks
                if (network.channels && network.channels.length > 1) {
                    label += ` (${network.channels.length} ch)`;
                }
                
                ctx.font = network === selectedNetwork ? 
                    'bold 14px Arial' : '12px Arial';
                ctx.fillStyle = labelColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(label, x, y - glowSize - 5);
            }
        });
        
        // Continue animation
        animationFrame = requestAnimationFrame(drawRadar);
    }
    
    // Handle canvas click - prevent double click handling
    let isHandlingClick = false;
    
    // Debug info for click tracking
    let lastClickCoords = null;
    
    // Handle canvas click
    canvas.addEventListener('click', function(event) {
        // Prevent handling multiple clicks simultaneously
        if (isHandlingClick) return;
        isHandlingClick = true;
        
        try {
            // Get the current canvas bounds
            const rect = canvas.getBoundingClientRect();
            
            // Calculate click position relative to canvas
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            // Save for debugging
            lastClickCoords = { x: mouseX, y: mouseY };
            
            // Debug click position
            console.log('Click at:', mouseX, mouseY);
            
            // Check if a network was clicked
            let clickedNetwork = null;
            let closestDistance = Infinity;
            
            for (const network of processedNetworks) {
                if (!network.x || !network.y) continue;
                
                const dx = mouseX - network.x;
                const dy = mouseY - network.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Track the closest network within range
                if (distance <= network.radius && distance < closestDistance) {
                    clickedNetwork = network;
                    closestDistance = distance;
                }
            }
            
            if (clickedNetwork) {
                console.log('Clicked network:', clickedNetwork.ssid || clickedNetwork.name);
                
                // Toggle selection for the clicked network
                selectedNetwork = (selectedNetwork === clickedNetwork) ? null : clickedNetwork;
                
                // Update details panel if it exists
                if (detailsPanel) {
                    updateNetworkDetails(selectedNetwork, detailsPanel, lightMode);
                } else {
                    console.error('Details panel is null');
                }
            } else {
                console.log('No network clicked');
                selectedNetwork = null;
                if (detailsPanel) {
                    updateNetworkDetails(null, detailsPanel, lightMode);
                }
            }
        } finally {
            // Clear the flag after a short delay
            setTimeout(() => {
                isHandlingClick = false;
            }, 100);
        }
    });
    
    // Start animation
    drawRadar();
    
    // Stop animation when tab/window is not visible
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            cancelAnimationFrame(animationFrame);
        } else {
            animationFrame = requestAnimationFrame(drawRadar);
        }
    });
    
    // For debugging - add a globally accessible method to show state
    if (!window.wifiRadarDebug) {
        window.wifiRadarDebug = {};
    }
    window.wifiRadarDebug[canvasId] = {
        getNetworks: () => processedNetworks,
        getSelectedNetwork: () => selectedNetwork,
        getLastClick: () => lastClickCoords,
        showClickableAreas: () => {
            // Draw clickable areas for debugging
            ctx.save();
            processedNetworks.forEach(network => {
                if (network.x && network.y && network.radius) {
                    ctx.beginPath();
                    ctx.arc(network.x, network.y, network.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                    ctx.stroke();
                }
            });
            ctx.restore();
        }
    };
}

/**
 * Update the network details panel
 * @param {Object} network - The selected network data
 * @param {HTMLElement} panel - The panel element
 * @param {boolean} lightMode - Whether to use light mode
 */
function updateNetworkDetails(network, panel, lightMode) {
    if (!network) {
        panel.innerHTML = '<div class="panel-placeholder">Click on a network for details</div>';
        return;
    }
    
    const securityText = network.security || 
                         network.securityType || 
                         'Unknown';
    
    const frequency = network.frequency || 
                      network.freq || 
                      (network.channel > 14 ? '5 GHz' : '2.4 GHz');
    
    const signalBars = generateSignalBars(network.signalLevel, network.color);
    
    panel.innerHTML = createNetworkDetailHTML(network, securityText, frequency, signalBars);
}

/**
 * Create HTML for network details
 */
function createNetworkDetailHTML(network, securityText, frequency, signalBars) {
    let html = '<div class="network-detail-item" style="border-left-color: ' + network.color + '">';
    html += '<div class="network-detail-name">' + (network.ssid || network.name || 'Unknown') + '</div>';
    
    // Add vendor information based on BSSID
    const bssid = network.bssid || network.mac;
    if (bssid) {
        const vendor = getVendorFromBSSID(bssid);
        if (vendor && vendor !== '') {
            html += `<div class="network-detail-vendor">${vendor}</div>`;
        }
    }
    
    // Signal
    html += '<div class="network-detail-row">';
    html += '<span class="detail-label">Signal</span>';
    html += '<span class="detail-value">' + network.signalLevel + ' dBm</span>';
    html += '</div>';
    
    // Strength
    html += '<div class="network-detail-row">';
    html += '<span class="detail-label">Strength</span>';
    html += '<span class="detail-value">';
    html += '<div class="signal-bars" style="color: ' + network.color + '">' + signalBars + '</div>';
    html += '</span>';
    html += '</div>';
    
    // Channels (show multiple if present)
    if (network.channels && network.channels.length > 0) {
        html += '<div class="network-detail-row">';
        html += '<span class="detail-label">Channels</span>';
        html += '<span class="detail-value">' + network.channels.sort((a, b) => a - b).join(', ') + '</span>';
        html += '</div>';
        
        // Determine band based on channels
        html += '<div class="network-detail-row">';
        html += '<span class="detail-label">Band</span>';
        
        // Check if the network has channels on different bands
        const has2GHz = network.channels.some(ch => ch <= 14);
        const has5GHz = network.channels.some(ch => ch > 14);
        
        if (has2GHz && has5GHz) {
            html += '<span class="detail-value">2.4 & 5 GHz</span>';
        } else if (has5GHz) {
            html += '<span class="detail-value">5 GHz</span>';
        } else {
            html += '<span class="detail-value">2.4 GHz</span>';
        }
        
        html += '</div>';
    } else {
        // Single channel and band (legacy support)
        html += '<div class="network-detail-row">';
        html += '<span class="detail-label">Channel</span>';
        html += '<span class="detail-value">' + (network.channel || 'Unknown') + '</span>';
        html += '</div>';
        
        html += '<div class="network-detail-row">';
        html += '<span class="detail-label">Band</span>';
        html += '<span class="detail-value">' + frequency + '</span>';
        html += '</div>';
    }
    
    // Security
    html += '<div class="network-detail-row">';
    html += '<span class="detail-label">Security</span>';
    html += '<span class="detail-value">' + securityText + '</span>';
    html += '</div>';
    
    // BSSID (if available)
    if (network.bssid) {
        html += '<div class="network-detail-row">';
        html += '<span class="detail-label">BSSID</span>';
        html += '<span class="detail-value" style="font-family: monospace; font-size: 12px;">' + network.bssid + '</span>';
        html += '</div>';
    }
    
    // Quality (if available)
    if (network.quality) {
        html += '<div class="network-detail-row">';
        html += '<span class="detail-label">Quality</span>';
        html += '<span class="detail-value">' + network.quality + '/100</span>';
        html += '</div>';
    }
    
    // Show variants information if there are multiple instances
    if (network.variants && network.variants.length > 1) {
        html += '<div class="network-variant-section">';
        html += '<div class="variant-title">Available on multiple channels</div>';
        
        network.variants.forEach((variant, index) => {
            const channel = variant.channel || 'Unknown';
            const signal = variant.signal_level || variant.signalLevel || '-';
            const variantBssid = variant.bssid || variant.mac || '';
            
            html += '<div class="network-variant">';
            html += '<span class="variant-channel">Channel ' + channel + '</span>';
            html += '<span class="variant-signal">' + signal + ' dBm</span>';
            html += '</div>';
            
            // Show BSSID for each variant if different from main
            if (variantBssid && variantBssid !== network.bssid && variantBssid !== network.mac) {
                html += '<div class="network-variant-bssid">' + variantBssid + '</div>';
            }
        });
        
        html += '</div>';
        
        // Add styles for variants section
        html += '<style>';
        html += '.network-variant-section { margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; }';
        html += '.light-mode .network-variant-section { border-top-color: rgba(0,0,0,0.1); }';
        html += '.variant-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: rgba(255,255,255,0.7); }';
        html += '.light-mode .variant-title { color: rgba(0,0,0,0.6); }';
        html += '.network-variant { display: flex; justify-content: space-between; padding: 4px 8px; background: rgba(255,255,255,0.05); margin-bottom: 5px; border-radius: 4px; }';
        html += '.light-mode .network-variant { background: rgba(0,0,0,0.03); }';
        html += '.variant-channel { font-size: 12px; }';
        html += '.variant-signal { font-size: 12px; font-family: monospace; }';
        html += '.network-variant-bssid { font-size: 10px; font-family: monospace; color: rgba(255,255,255,0.5); padding-left: 8px; margin-top: -3px; margin-bottom: 5px; }';
        html += '.light-mode .network-variant-bssid { color: rgba(0,0,0,0.4); }';
        html += '</style>';
    }
    
    html += '</div>';
    return html;
}

/**
 * Generate HTML for signal bars
 * @param {number} signalLevel - Signal level in dBm
 * @param {string} color - Bar color
 * @returns {string} HTML for signal bars
 */
function generateSignalBars(signalLevel, color) {
    // Convert dBm to quality percentage
    // Typical range: -30 (excellent) to -90 (poor)
    const signal = parseInt(signalLevel);
    if (isNaN(signal)) {
        return '<div class="signal-bar inactive"></div>'.repeat(5);
    }
    
    let quality = 0;
    if (signal >= -50) quality = 100;
    else if (signal >= -60) quality = 80;
    else if (signal >= -70) quality = 60;
    else if (signal >= -80) quality = 40;
    else quality = 20;
    
    let bars = '';
    for (let i = 1; i <= 5; i++) {
        const barQuality = i * 20;
        const height = i * 20 + '%';
        if (quality >= barQuality) {
            bars += '<div class="signal-bar" style="height:' + height + '"></div>';
        } else {
            bars += '<div class="signal-bar inactive" style="height:' + height + '"></div>';
        }
    }
    return bars;
}

/**
 * Map a value from one range to another
 * @param {number} value - Value to map
 * @param {number} in_min - Input range minimum
 * @param {number} in_max - Input range maximum
 * @param {number} out_min - Output range minimum
 * @param {number} out_max - Output range maximum
 * @returns {number} Mapped value
 */
function mapRange(value, in_min, in_max, out_min, out_max) {
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

/**
 * Convert hex color to RGB format
 * @param {string} hex - Hex color code
 * @returns {string} RGB values as string
 */
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return r + ', ' + g + ', ' + b;
}

export { createWifiRadarVisualization }; 