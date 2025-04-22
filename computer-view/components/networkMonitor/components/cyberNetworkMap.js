/**
 * Cyber Network Map Component (Entry Point)
 * Creates a futuristic network visualization for active connections using deck.gl and Mapbox
 */

// Import map components
import { initDeckGLCyberMap, enhanceConnectionsIPData } from '../components/map/mapVisualizer.js';
import { generateExternalConnectionsInfo, groupConnectionsByIp } from './map/connectionsList.js';
import { getCyberNetworkMapStyles } from '../styles/mapStyles.js';
import { flyToConnectionMarker, highlightMarker, clearHighlightedMarker } from './map/mapInteractions.js';

// Import utility functions
import { IPInfoManager, isPrivateIP } from '../utils/ipUtils.js';
import { getRiskLevel, findProcessNameByPid, isHighRiskPort } from '../utils/connectionUtils.js';

// Set up a MutationObserver to watch for new map elements
let mapObserver;
const pendingMaps = new Map();

/**
 * Initialize the observer that will watch for map elements being added to the DOM
 */
function initMapObserver() {
    if (mapObserver) return;
    
    mapObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check for new map containers
                        const mapContainers = node.querySelectorAll ? 
                            node.querySelectorAll('[data-cyber-map-id]') : [];
                        
                        // Also check if the node itself is a map container
                        if (node.hasAttribute && node.hasAttribute('data-cyber-map-id')) {
                            mapContainers = [node];
                        }
                        
                        // Initialize maps
                        mapContainers.forEach(container => {
                            const mapId = container.getAttribute('data-cyber-map-id');
                            if (pendingMaps.has(mapId)) {
                                const mapData = pendingMaps.get(mapId);
                                initDeckGLCyberMap(mapId, mapData.coordinates, mapData.connections, mapData.processesList, mapData.connectionsByIp);
                            }
                        });
                    }
                });
            }
        });
    });
    
    // Start observing
    mapObserver.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
    
    // Initialize any maps that might already be in the DOM
    document.querySelectorAll('[data-cyber-map-id]').forEach(container => {
        const mapId = container.getAttribute('data-cyber-map-id');
        if (pendingMaps.has(mapId)) {
            const mapData = pendingMaps.get(mapId);
            initDeckGLCyberMap(mapId, mapData.coordinates, mapData.connections, mapData.processesList, mapData.connectionsByIp);
        }
    });
}

// Initialize observer when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMapObserver);
    } else {
        initMapObserver();
    }
}

/**
 * Creates a cyberpunk-style global network visualization
 * @param {Array} connections - Array of network connections
 * @param {Array} processesList - List of processes for reference
 * @param {Object} [gpsCoordinates] - Optional GPS coordinates for the origin point
 * @returns {string} HTML for the visualization
 */
function createCyberNetworkMap(connections, processesList = [], gpsCoordinates = null) {
    console.log(`Creating cyber network map with ${connections.length} connections and ${processesList.length} processes`);
    console.log(connections);
    
    // Generate unique ID for this map instance
    const mapId = 'cyber-network-map-' + Math.random().toString(36).substr(2, 9);
    
    // Get WAN connections (Internet)
    const wanConnections = connections.filter(conn => 
        !isPrivateIP(conn.peerAddress) && 
        conn.state === 'ESTABLISHED'
    );
    
    console.log(`Found ${wanConnections.length} WAN connections`);
    
    // Enhance connections with process info first
    const processEnhancedConnections = wanConnections.map(conn => {
        let enhancedConnection = { ...conn };
        
        // Add process name if not present but PID exists
        if (!enhancedConnection.processName && enhancedConnection.pid) {
            enhancedConnection.processName = findProcessNameByPid(processesList, enhancedConnection.pid);
        }
        
        return enhancedConnection;
    });
    
    // Group connections by IP address to show connection counts and port info
    const connectionsByIp = groupConnectionsByIp(processEnhancedConnections);
    
    // Default coordinates (San Francisco) if GPS not available
    const defaultCoordinates = {
        latitude: 37.7749,
        longitude: -122.4194
    };
    
    const coordinates = gpsCoordinates || defaultCoordinates;
    
    // Calculate unique processes count
    const uniqueProcesses = new Set();
    processEnhancedConnections.forEach(conn => {
        if (conn.processName) uniqueProcesses.add(conn.processName);
        else if (conn.pid) uniqueProcesses.add(`PID ${conn.pid}`);
    });
    const uniqueProcessCount = uniqueProcesses.size;
    
    // Add this map to pending maps with connection count information
    pendingMaps.set(mapId, {
        coordinates,
        connections: processEnhancedConnections,
        processesList: processesList,
        connectionsByIp: connectionsByIp,
        mapReady: false,
        dataReady: false,
        initialized: false
    });
    
    // Immediately trigger enhancement of IP data but don't wait for it to return HTML
    // This will populate the coordinates asynchronously
    setTimeout(() => enhanceConnectionsIPData(mapId), 100);
    
    // Create HTML structure for the map
    return `
        <div class="cyber-network-map-container" data-cyber-map-id="${mapId}">
            <div class="cn-grid-container">
                <div class="cn-header">
                    <div class="cn-title">GLOBAL NETWORK DEFENSE GRID</div>
                    <div class="cn-stats">
                        <div class="cn-stat">
                            <span class="cn-stat-value">${processEnhancedConnections.length}</span>
                            <span class="cn-stat-label">ACTIVE CONNECTIONS</span>
                        </div>
                        <div class="cn-stat">
                            <span class="cn-stat-value" id="${mapId}-processes-count">${uniqueProcessCount}</span>
                            <span class="cn-stat-label">PROCESSES</span>
                        </div>
                        <div class="cn-stat">
                            <span class="cn-stat-value" id="${mapId}-threat-level">SCANNING</span>
                            <span class="cn-stat-label">THREAT LEVEL</span>
                        </div>
                    </div>
                </div>
                
                <div class="cn-map-area" id="${mapId}">
                    <div id="${mapId}-map" class="deck-gl-map">
                        <div class="loading-indicator">
                            <div class="loading-spinner"></div>
                            <div class="loading-text">Retrieving location data...</div>
                        </div>
                    </div>
                </div>
                
                <div class="cn-data-panel">
                    <div class="cn-external-connections">
                        ${generateExternalConnectionsInfo(connectionsByIp)}
                    </div>
                </div>
            </div>
        </div>
        <style>
            ${getCyberNetworkMapStyles()}
            .loading-indicator {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(248, 250, 252, 0.9);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10;
            }
            .loading-spinner {
                border: 4px solid rgba(0, 0, 0, 0.1);
                border-radius: 50%;
                border-top: 4px solid #0284c7;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
            }
            .loading-text {
                margin-top: 20px;
                color: #0284c7;
                font-weight: bold;
                letter-spacing: 1px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
        <script>
            // Update process count
            document.addEventListener('DOMContentLoaded', function() {
                const processesCount = document.getElementById('${mapId}-processes-count');
                if (processesCount) {
                    // Calculate unique processes from the connections
                    const uniqueProcesses = new Set();
                    const connections = ${JSON.stringify(processEnhancedConnections.map(conn => ({
                        processName: conn.processName || null,
                        pid: conn.pid || null
                    })))};
                    
                    connections.forEach(conn => {
                        if (conn.processName) uniqueProcesses.add(conn.processName);
                        else if (conn.pid) uniqueProcesses.add('PID ' + conn.pid);
                    });
                    
                    processesCount.textContent = uniqueProcesses.size;
                }
            });
        </script>
    `;
}

// Make the pendingMaps available to other modules
export { pendingMaps };

// Export default and named functions
export default createCyberNetworkMap;
export { initMapObserver }; 