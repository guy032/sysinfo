/**
 * Map Visualizer Module
 * Handles creation and initialization of the deck.gl map
 */

import { createScatterplotLayer } from './layers/scatterLayer.js';
import { pendingMaps } from '../cyberNetworkMap.js';
import { isHighRiskPort, getRiskLevel } from '../../utils/connectionUtils.js';
import { isPrivateIP } from '../../utils/ipUtils.js';
import { generateExternalConnectionsInfo } from './connectionsList.js';
import { createFallbackView } from './fallbackView.js';
import { flyToConnectionMarker, highlightMarker, clearHighlightedMarker } from './mapInteractions.js';
import { IPInfoManager } from '../../utils/ipUtils.js';

/**
 * Extracts and converts coordinates from the connection object
 * to the format expected by DeckGL/Mapbox
 * 
 * @param {Object} conn - Connection object
 * @returns {Array|null} [longitude, latitude] array or null if coordinates not found/invalid
 */
function extractCoordinatesFromConnection(conn) {
    // Check for coordinates directly in the connection object
    if (conn.coordinates) {
        // Coordinates from the IPInfo API are stored as a string in the format "latitude,longitude"
        // However, DeckGL and Mapbox expect coordinates in [longitude, latitude] format (GeoJSON convention)
        // So we need to parse the string and swap the order
        const coordParts = conn.coordinates.split(',').map(part => parseFloat(part.trim()));
        if (coordParts.length === 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1])) {
            // Convert from "latitude,longitude" (standard GPS format) to [longitude, latitude] (GeoJSON format)
            return [coordParts[1], coordParts[0]];
        }
    }
    
    return null;
}

/**
 * Function to add 3D buildings to the map
 * @param {Object} map - Mapbox map instance
 */
function add3DBuildings(map) {
    map.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6
        }
    });
}

/**
 * Function to create and configure the deck.gl map
 * @param {string} mapId - Map element ID
 * @param {Object} coordinates - GPS coordinates of origin point
 * @param {Array} connections - Array of network connections
 * @param {Array} processesList - List of processes for reference
 * @param {Object} connectionsByIp - Connections grouped by IP address
 */
function createDeckGLMap(mapId, coordinates, connections, processesList = [], connectionsByIp = {}) {
    // Check if required libraries are loaded
    if (!window.mapboxgl || !window.deck) {
        console.error('Required libraries not loaded. Using fallback view.');
        createFallbackView(mapId, connections, connectionsByIp);
        return;
    }

    try {
        console.log(`Creating map with ${connections.length} connections and ${processesList.length} processes`);
        
        // Check if map container already exists and has a map instance
        const mapContainer = document.getElementById(`${mapId}-map`);
        if (!mapContainer) {
            console.error(`Map container for ${mapId} not found`);
            return;
        }
        
        // Remove any existing map instance to prevent duplication
        if (mapContainer._map) {
            console.log(`Existing map found for ${mapId}, removing it`);
            mapContainer._map.remove();
        }
        
        const {DeckGL, ArcLayer} = deck;
        const {MapboxOverlay} = deck;
        
        // Mapbox token - replace with your own if needed
        mapboxgl.accessToken = 'pk.eyJ1IjoibWFwcmludCIsImEiOiJjbG9iZXVoODMwcWVxMmhxcGc5dTR4bjA4In0.xdln2HZyWPXWptpKh4HptQ';
        
        // Create map instance
        const map = new mapboxgl.Map({
            container: `${mapId}-map`,
            style: 'mapbox://styles/mapbox/light-v10',
            center: [coordinates.longitude, coordinates.latitude],
            zoom: 1.5,
            bearing: 0,
            pitch: 30
        });
        
        // Store map instance on container and globally
        mapContainer._mapboxgl = map;
        window.mapInstance = map;
        
        // Filter out connections without coordinates
        const validConnections = connections.filter(conn => {
            const hasCoordinates = conn.coordinates && extractCoordinatesFromConnection(conn);
            return hasCoordinates;
        });
        
        if (validConnections.length === 0) {
            console.warn("No connections with valid coordinates found. Map will be empty.");
        }
        
        // Process connection data for the ArcLayer
        const arcData = validConnections.map(conn => {
            // Find process name directly from the connection or lookup in processesList
            let processName = conn.processName;
            if (!processName && conn.pid) {
                processName = findProcessNameByPid(processesList, conn.pid);
                console.log(`Found process for ${conn.peerAddress}: ${processName || 'Unknown'} (PID ${conn.pid})`);
            }
            
            // Log connection details for debugging
            console.log(`Processing connection: {ipAddress: '${conn.peerAddress}', peerPort: '${conn.peerPort}', pid: ${conn.pid}}`);
            
            // Get coordinates from connection
            const extractedCoords = extractCoordinatesFromConnection(conn);
            if (!extractedCoords) {
                console.error(`Expected coordinates but none found for ${conn.peerAddress}`);
                return null; // This shouldn't happen due to the filter above
            }
            
            // Prepare data object for this connection
            const connectionData = {
                from: [coordinates.longitude, coordinates.latitude],
                to: extractedCoords,
                ip: conn.peerAddress,
                port: conn.peerPort,
                localPort: conn.localPort,
                isHighRisk: isHighRiskPort(conn.peerPort),
                location: conn.location || null,
                coordinates: extractedCoords,
                asn: conn.asn || null,
                hostname: conn.hostname || null,
                process: processName || `PID ${conn.pid}`,
                pid: conn.pid,
                state: conn.state,
                protocol: conn.protocol,
                connectionCount: connectionsByIp[conn.peerAddress] ? connectionsByIp[conn.peerAddress].count : 1,
                allPorts: connectionsByIp[conn.peerAddress] ? 
                    Array.from(connectionsByIp[conn.peerAddress].ports).sort((a, b) => a - b) : 
                    [conn.peerPort],
                riskLevel: connectionsByIp[conn.peerAddress] ? 
                    connectionsByIp[conn.peerAddress].risk : 
                    getRiskLevel(conn.peerPort)
            };
            
            // Add security information from VirusTotal if available
            if (conn.securityInfo) {
                connectionData.securityInfo = conn.securityInfo;
                connectionData.securityRiskLevel = conn.securityInfo.riskLevel;
                connectionData.securityRiskScore = conn.securityInfo.riskScore;
                connectionData.asOwner = conn.asOwner || null;
                connectionData.threatDetections = conn.threatDetections || null;
            }

            console.log({connectionData, conn});
            
            return connectionData;
        }).filter(Boolean); // Remove any nulls
        
        // Create the arc layer for connections
        const arcLayer = new ArcLayer({
            id: 'connections-arcs',
            data: arcData,
            pickable: true,
            getWidth: d => {
                // Adjust width based on security risk level if available
                if (d.securityRiskLevel === 'HIGH') return 3.5;
                if (d.securityRiskLevel === 'MEDIUM') return 2.5;
                
                // Fallback to traditional risk level
                if (d.riskLevel === 'high') return 3;
                if (d.riskLevel === 'medium') return 2;
                return 1.5;
            },
            getSourcePosition: d => d.from,
            getTargetPosition: d => d.to,
            getSourceColor: d => [3, 105, 161, 200], // Source color is always blue
            getTargetColor: d => {
                // Color arcs based on security risk level if available
                if (d.securityRiskLevel) {
                    if (d.securityRiskLevel === 'HIGH') return [220, 38, 38, 200]; // More intense red
                    if (d.securityRiskLevel === 'MEDIUM') return [249, 115, 22, 200]; // Orange
                    if (d.securityRiskLevel === 'LOW') return [16, 185, 129, 200]; // Green
                    if (d.securityRiskLevel === 'CLEAN') return [34, 197, 94, 200]; // Bright green
                }
                
                // Fallback to traditional risk level
                if (d.riskLevel === 'high') return [239, 68, 68, 200]; // Red for high risk
                if (d.riskLevel === 'medium') return [249, 115, 22, 200]; // Orange for medium risk
                return [16, 185, 129, 200]; // Green for low risk
            },
            getHeight: d => {
                // Adjust arc height based on risk level for better visual separation
                if (d.securityRiskLevel === 'HIGH') return 0.8;
                if (d.securityRiskLevel === 'MEDIUM') return 0.7;
                
                // Fallback to traditional risk level
                if (d.riskLevel === 'high') return 0.7;
                if (d.riskLevel === 'medium') return 0.6;
                return 0.5;
            },
            getTilt: d => 15
        });
        
        // Create a ScatterplotLayer for the endpoint markers
        const scatterLayer = createScatterplotLayer(arcData);
        
        // Add both layers to the map
        const overlay = new MapboxOverlay({
            layers: [arcLayer, scatterLayer]
        });
        
        map.addControl(overlay);
        
        // Add a tooltip element to the map container if it doesn't exist
        createTooltipElement(mapId);
        
        // Add event listeners for interactive features if needed
        map.on('load', () => {
            // Add 3D buildings
            add3DBuildings(map);
            
            // Update threat element with security information
            const threatElement = document.getElementById(`${mapId}-threat-level`);
            if (threatElement) {
                // Count high risk connections based on VirusTotal data
                const highRiskCount = arcData.filter(d => d.securityRiskLevel === 'HIGH').length;
                const mediumRiskCount = arcData.filter(d => d.securityRiskLevel === 'MEDIUM').length;
                
                // Set threat level based on counts
                if (highRiskCount > 0) {
                    threatElement.textContent = 'HIGH';
                    threatElement.className = 'cn-stat-value cn-threat-high';
                } else if (mediumRiskCount > 0) {
                    threatElement.textContent = 'MEDIUM';
                    threatElement.className = 'cn-stat-value cn-threat-medium';
                } else {
                    threatElement.textContent = 'LOW';
                    threatElement.className = 'cn-stat-value cn-threat-low';
                }
            }
            
            console.log(`Map loaded with ${arcData.length} connections`);
        });
    } catch (error) {
        console.error('Error initializing map:', error);
        createFallbackView(mapId, connections, connectionsByIp);
    }
}

/**
 * Creates tooltip element for the map
 * @param {string} mapId - Map element ID
 */
function createTooltipElement(mapId) {
    const tooltipDiv = document.createElement('div');
    tooltipDiv.id = 'tooltip';
    tooltipDiv.style.position = 'absolute';
    tooltipDiv.style.zIndex = 1000;
    tooltipDiv.style.pointerEvents = 'none'; // Initially non-interactive
    tooltipDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    tooltipDiv.style.color = '#1e293b';
    tooltipDiv.style.padding = '15px';
    tooltipDiv.style.borderRadius = '6px';
    tooltipDiv.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    tooltipDiv.style.minWidth = '250px';
    tooltipDiv.style.maxWidth = '350px';
    tooltipDiv.style.maxHeight = '60vh'; // Limit height to 60% of viewport
    tooltipDiv.style.overflowY = 'auto'; // Enable vertical scrolling
    tooltipDiv.style.fontSize = '13px';
    tooltipDiv.style.lineHeight = '1.5';
    tooltipDiv.style.display = 'none';
    tooltipDiv.style.backdropFilter = 'blur(2px)';
    tooltipDiv.style.transition = 'opacity 0.2s ease-in-out';
    tooltipDiv.style.border = '1px solid rgba(0, 0, 0, 0.05)';
    tooltipDiv.innerHTML = `
    <style>
        #tooltip.tooltip-locked {
            pointer-events: auto !important;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(2, 132, 199, 0.5);
        }
        .tooltip-content {
            font-family: Arial, sans-serif;
        }
        .tooltip-header {
            margin-bottom: 12px;
            position: relative;
            padding-right: 20px; /* Make space for close button */
        }
        .tooltip-header h3 {
            margin: 0;
            padding: 0;
            font-size: 16px;
            color: #0369a1;
            text-shadow: 0 0 10px rgba(3, 105, 161, 0.1);
        }
        .tooltip-badge {
            position: absolute;
            top: -10px;
            right: -5px;
            font-size: 10px;
            padding: 3px 6px;
            border-radius: 3px;
            color: white;
            font-weight: bold;
        }
        .high-risk {
            background-color: #ef4444;
        }
        .medium-risk {
            background-color: #f59e0b;
        }
        .low-risk {
            background-color: #10b981;
        }
        .clean-risk {
            background-color: #22c55e;
        }
        .tooltip-body {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .tooltip-row {
            display: flex;
            align-items: flex-start;
            line-height: 1.3;
        }
        .tooltip-icon {
            margin-right: 8px;
            font-size: 14px;
            min-width: 14px;
        }
        .ip-address {
            font-family: monospace;
            font-weight: bold;
            color: #0369a1;
        }
        .local-port {
            background: rgba(3, 105, 161, 0.1);
            padding: 1px 5px;
            border-radius: 3px;
            font-family: monospace;
        }
        .tooltip-close {
            position: absolute;
            top: -10px;
            right: -8px;
            background: rgba(0, 0, 0, 0.1);
            color: #1e293b;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        }
        .tooltip-close:hover {
            background: rgba(0, 0, 0, 0.2);
        }
        .highlight-row {
            background: rgba(3, 105, 161, 0.1);
            padding: 4px;
            border-radius: 4px;
            margin-bottom: 6px;
        }
        .security-highlight {
            background: rgba(239, 68, 68, 0.1);
            border-left: 3px solid #ef4444;
        }
        .connection-count {
            font-weight: 600;
            color: #0369a1;
        }
        .security-alert {
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
            margin-right: 8px;
        }
        .security-alert.malicious {
            background: rgba(239, 68, 68, 0.15);
            color: #b91c1c;
        }
        .security-alert.suspicious {
            background: rgba(249, 115, 22, 0.15);
            color: #c2410c;
        }
        .security-notes {
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 5px;
            background: rgba(3, 105, 161, 0.05);
            border-radius: 4px;
        }
        .security-note {
            font-size: 12px;
            color: #334155;
        }
        .as-owner {
            font-weight: 500;
        }
        
        /* Scrollbar styling */
        #tooltip::-webkit-scrollbar {
            width: 6px;
        }
        #tooltip::-webkit-scrollbar-track {
            background: rgba(241, 245, 249, 0.5);
        }
        #tooltip::-webkit-scrollbar-thumb {
            background-color: rgba(100, 116, 139, 0.3);
            border-radius: 6px;
        }
        #tooltip::-webkit-scrollbar-thumb:hover {
            background-color: rgba(100, 116, 139, 0.5);
        }
        
        /* Tooltip scrollable indicator */
        .tooltip-scroll-indicator {
            position: absolute;
            bottom: 5px;
            right: 5px;
            background: rgba(3, 105, 161, 0.7);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            opacity: 0.7;
        }
    </style>
    `;
    document.getElementById(`${mapId}-map`).appendChild(tooltipDiv);
}

/**
 * JavaScript to initialize and animate the cyber network map using deck.gl
 * @param {string} mapId - Map element ID
 * @param {Object} coordinates - GPS coordinates of origin point
 * @param {Array} connections - Array of network connections
 * @param {Array} processesList - List of processes for reference
 * @param {Object} connectionsByIp - Connections grouped by IP address
 */
function initDeckGLCyberMap(mapId, coordinates, connections, processesList = [], connectionsByIp = {}) {
    // Check if this map is already being initialized to prevent duplicate layers
    if (pendingMaps.has(mapId)) {
        const mapData = pendingMaps.get(mapId);
        // If this map is already initialized or in the process of being initialized, don't proceed
        if (mapData.initialized) {
            console.log(`Map ${mapId} is already initialized, skipping duplicate initialization`);
            return;
        }
        // Mark this map as being initialized
        mapData.initialized = true;
    }

    // First ensure we have coordinates for all connections
    enhanceConnectionsIPData(mapId, true).then(() => {
        // Get the updated connections after enhancement
        if (pendingMaps.has(mapId)) {
            const mapData = pendingMaps.get(mapId);
            // Now load libraries and initialize the map with enhanced connections
            loadMapLibraries().then(() => {
                createDeckGLMap(mapId, mapData.coordinates, mapData.connections, mapData.processesList, mapData.connectionsByIp);
            }).catch(error => {
                console.error('Error initializing cyber map:', error);
                createFallbackView(mapId, mapData.connections, mapData.connectionsByIp);
            });
        }
    }).catch(error => {
        console.error('Error enhancing connections data:', error);
        // Still try to initialize the map even if enhancement fails
        loadMapLibraries().then(() => {
            if (pendingMaps.has(mapId)) {
                const mapData = pendingMaps.get(mapId);
                createDeckGLMap(mapId, coordinates, connections, processesList, connectionsByIp);
            }
        }).catch(e => {
            console.error('Error initializing cyber map:', e);
            createFallbackView(mapId, connections, connectionsByIp);
        });
    });
}

/**
 * Function to load required libraries for the map
 * @returns {Promise} Promise that resolves when libraries are loaded
 */
function loadMapLibraries() {
    return new Promise((resolve, reject) => {
        // Check if libraries are already loaded
        if (window.mapboxgl && window.deck) {
            console.log('Map libraries already loaded');
            resolve();
            return;
        }
        
        console.log('Loading map libraries...');
        
        // Keep track of loaded libraries
        let mapboxLoaded = false;
        let deckLoaded = false;
        
        function checkAllLoaded() {
            if (mapboxLoaded && deckLoaded) {
                console.log('All map libraries loaded successfully');
                resolve();
            }
        }
        
        // Load Mapbox GL
        const mapboxScript = document.createElement('script');
        mapboxScript.src = 'https://api.mapbox.com/mapbox-gl-js/v2.10.0/mapbox-gl.js';
        mapboxScript.onload = () => {
            console.log('Mapbox GL loaded');
            mapboxLoaded = true;
            checkAllLoaded();
        };
        mapboxScript.onerror = (error) => {
            reject(new Error('Failed to load Mapbox GL'));
        };
        document.head.appendChild(mapboxScript);
        
        const mapboxCSS = document.createElement('link');
        mapboxCSS.rel = 'stylesheet';
        mapboxCSS.href = 'https://api.mapbox.com/mapbox-gl-js/v2.10.0/mapbox-gl.css';
        document.head.appendChild(mapboxCSS);
        
        // Load deck.gl
        const deckScript = document.createElement('script');
        deckScript.src = 'https://unpkg.com/deck.gl@8.8.0/dist.min.js';
        deckScript.onload = () => {
            console.log('deck.gl loaded');
            deckLoaded = true;
            checkAllLoaded();
        };
        deckScript.onerror = () => {
            reject(new Error('Failed to load deck.gl'));
        };
        document.head.appendChild(deckScript);
        
        // Set a timeout in case libraries fail to load
        setTimeout(() => {
            if (!mapboxLoaded || !deckLoaded) {
                reject(new Error('Timeout loading map libraries'));
            }
        }, 10000);
    });
}

/**
 * Enhances all connections with IP geolocation data
 * @param {string} mapId - The ID of the map
 * @param {boolean} [waitForCompletion=false] - Whether to wait for completion and return a promise
 * @returns {Promise|void} Promise if waitForCompletion is true, void otherwise
 */
async function enhanceConnectionsIPData(mapId, waitForCompletion = false) {
    if (!pendingMaps.has(mapId)) {
        console.log(`Map ${mapId} not found in pending maps`);
        return waitForCompletion ? Promise.resolve() : undefined;
    }

    const enhancementProcess = async () => {
        // Update the UI to show we're working on it
        const threatElement = document.getElementById(`${mapId}-threat-level`);
        if (threatElement) {
            threatElement.textContent = 'SCANNING';
            threatElement.style.color = '#f59e0b';
        }
        
        const mapData = pendingMaps.get(mapId);
        const connections = mapData.connections;
        const connectionsByIp = mapData.connectionsByIp || {};
        
        console.log(`Enhancing IP data for ${connections.length} connections in map ${mapId}`);
        
        let enhancedCount = 0;
        let coordinatesFound = 0;
        const totalConnections = connections.length;
        
        // Process each connection to fetch IP data
        for (const conn of connections) {
            try {
                // Skip if already has location and coordinates
                if (conn.location && conn.coordinates) {
                    enhancedCount++;
                    coordinatesFound++;
                    continue;
                }
                
                // Skip local/private IPs
                if (isPrivateIP(conn.peerAddress)) {
                    enhancedCount++;
                    continue;
                }
                
                // Fetch IP info - this is the key call that gets coordinates
                const ipInfo = await IPInfoManager.getIPInfo(conn.peerAddress);
                
                if (!ipInfo.error) {
                    // Update connection with location data
                    conn.location = ipInfo.city ? 
                        `${ipInfo.city}${ipInfo.region ? ', ' + ipInfo.region : ''}${ipInfo.country ? ', ' + ipInfo.country : ''}` : 
                        (ipInfo.country || null);
                    
                    // Update connection with coordinates
                    if (ipInfo.loc) {
                        // Store coordinates in their original format "latitude,longitude" from the API
                        // The extractCoordinatesFromConnection function will handle conversion when needed
                        conn.coordinates = ipInfo.loc;
                        coordinatesFound++;
                    } else {
                        console.warn(`No coordinates found for ${conn.peerAddress}`);
                    }
                    
                    // Add organization info if available
                    if (ipInfo.org) {
                        conn.asn = ipInfo.org;
                    }
                    
                    // Add hostname if available
                    if (ipInfo.hostname) {
                        conn.hostname = ipInfo.hostname;
                    }
                    
                    // Add security information from VirusTotal data
                    if (ipInfo.securityInfo) {
                        conn.securityInfo = ipInfo.securityInfo;
                        
                        // Add risk level for display
                        console.log('ipInfo.securityInfo', ipInfo.securityInfo);
                        conn.riskLevel = ipInfo.securityInfo.riskLevel;
                        
                        // Add notable security details
                        if (ipInfo.securityInfo.asOwner) {
                            conn.asOwner = ipInfo.securityInfo.asOwner;
                        }
                        
                        // Add malicious detection count if any
                        if (ipInfo.securityInfo.maliciousCount > 0 || ipInfo.securityInfo.suspiciousCount > 0) {
                            conn.threatDetections = {
                                malicious: ipInfo.securityInfo.maliciousCount,
                                suspicious: ipInfo.securityInfo.suspiciousCount,
                                total: ipInfo.securityInfo.maliciousCount + ipInfo.securityInfo.suspiciousCount
                            };
                        }
                        
                        // Store detection details if any
                        if (ipInfo.securityInfo.detectionDetails && ipInfo.securityInfo.detectionDetails.length > 0) {
                            conn.detectionDetails = ipInfo.securityInfo.detectionDetails;
                        }
                    } else {
                        // Provide default security info if not available
                        conn.securityInfo = {
                            riskLevel: 'UNKNOWN',
                            riskScore: 0,
                            securityNotes: ['No security information available']
                        };
                        conn.riskLevel = 'UNKNOWN';
                    }
                    
                    // Update connectionsByIp with this info as well
                    if (connectionsByIp[conn.peerAddress]) {
                        connectionsByIp[conn.peerAddress].location = conn.location;
                        connectionsByIp[conn.peerAddress].coordinates = conn.coordinates;
                        connectionsByIp[conn.peerAddress].asn = conn.asn;
                        connectionsByIp[conn.peerAddress].hostname = conn.hostname;
                        
                        // Also update security info
                        if (conn.securityInfo) {
                            connectionsByIp[conn.peerAddress].securityInfo = conn.securityInfo;
                            connectionsByIp[conn.peerAddress].riskLevel = conn.riskLevel;
                            connectionsByIp[conn.peerAddress].asOwner = conn.asOwner;
                            connectionsByIp[conn.peerAddress].threatDetections = conn.threatDetections;
                            connectionsByIp[conn.peerAddress].detectionDetails = conn.detectionDetails;
                        }
                    }
                    
                    enhancedCount++;
                    
                    // Update the threat level to show progress
                    if (threatElement && enhancedCount % 2 === 0) {
                        const percentage = Math.floor((enhancedCount / totalConnections) * 100);
                        threatElement.textContent = `SCANNING ${percentage}%`;
                    }
                } else {
                    console.error(`Error in IP info for ${conn.peerAddress}:`, ipInfo.error);
                    enhancedCount++;
                }
            } catch (error) {
                console.error(`Error fetching IP info for ${conn.peerAddress}:`, error);
                enhancedCount++;
            }
        }
        
        console.log(`Finished enhancing IP data for map ${mapId}: ${enhancedCount}/${totalConnections} processed, ${coordinatesFound} with coordinates`);
        
        // Mark data as ready
        mapData.dataReady = true;
        
        // If the map is already initialized, update it
        const mapContainer = document.getElementById(`${mapId}-map`);
        if (mapContainer) {
            // Update the external connections info with the new data
            const externalConnectionsElement = document.querySelector(`[data-cyber-map-id="${mapId}"] .cn-external-connections`);
            if (externalConnectionsElement) {
                externalConnectionsElement.innerHTML = generateExternalConnectionsInfo(connectionsByIp);
            }
            
            // Update the threat level
            if (threatElement) {
                const highRiskCount = Object.values(connectionsByIp).filter(info => info.risk === 'high').length;
                const riskPercentage = Math.floor((highRiskCount / Object.keys(connectionsByIp).length) * 100) || 0;
                
                if (riskPercentage > 30) {
                    threatElement.textContent = 'HIGH';
                    threatElement.style.color = '#ef4444';
                } else if (riskPercentage > 10) {
                    threatElement.textContent = 'MEDIUM';
                    threatElement.style.color = '#f59e0b';
                } else {
                    threatElement.textContent = 'LOW';
                    threatElement.style.color = '#10b981';
                }
            }
            
            // Remove loading indicator
            const loadingIndicator = mapContainer.querySelector('.loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // If map is not ready yet and we're not already initializing it, do so now
            if (!mapData.mapReady) {
                mapData.mapReady = true;
                initDeckGLCyberMap(mapId, mapData.coordinates, connections, mapData.processesList, connectionsByIp);
            }
        }
    };
    
    if (waitForCompletion) {
        return enhancementProcess();
    } else {
        enhancementProcess().catch(err => console.error('Error in enhanceConnectionsIPData:', err));
    }
}

// Export the functions
export { 
    initDeckGLCyberMap, 
    createDeckGLMap, 
    enhanceConnectionsIPData, 
    extractCoordinatesFromConnection 
}; 