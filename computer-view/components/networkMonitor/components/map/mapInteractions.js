/**
 * Map Interactions Module
 * Handles interactive elements for the map such as highlighting markers and flying to locations
 */

import { pendingMaps } from '../cyberNetworkMap.js';
import { getRiskLevel } from '../../utils/connectionUtils.js';

/**
 * Function to fly to a specific connection marker on the map
 * @param {string} ip - IP address to locate on map
 */
function flyToConnectionMarker(ip) {
    console.log(`Attempting to fly to IP: ${ip}`);
    
    // Check if this IP is already highlighted
    if (window.highlightedIP === ip) {
        console.log('IP already highlighted, skipping');
        return;
    }
    
    // First, remove any existing highlighted marker
    if (window.highlightedMarker) {
        window.highlightedMarker.remove();
        window.highlightedMarker = null;
    }
    
    // Remove active class from all connections in the sidebar
    document.querySelectorAll('.cn-external-domain').forEach(el => {
        el.classList.remove('cn-connection-active');
    });
    
    // Add active class to the selected connection
    const selectedConnection = document.querySelector(`.cn-external-domain[data-ip="${ip}"]`);
    if (selectedConnection) {
        selectedConnection.classList.add('cn-connection-active');
        
        // Scroll the connection into view if needed
        selectedConnection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Store the map instance in a global variable when creating it
    // so we can reference it later without searching
    let mapInstance = null;
    
    // Try different approaches to find the map instance
    // First check if we have any map instances stored in pendingMaps
    const mapIds = Array.from(pendingMaps.keys());
    for (const mapId of mapIds) {
        const mapContainer = document.getElementById(`${mapId}-map`);
        if (mapContainer && mapContainer._mapboxgl) {
            console.log(`Found map instance in container ${mapId}-map`);
            mapInstance = mapContainer._mapboxgl;
            break;
        }
    }
    
    // If we still don't have a map instance, try to find any mapbox instance
    if (!mapInstance) {
        // Find all deck-gl-map containers
        const mapContainers = document.querySelectorAll('.deck-gl-map');
        console.log(`Found ${mapContainers.length} map containers`);
        
        for (const container of mapContainers) {
            // Check for mapboxgl instance on the container or its children
            if (container._mapboxgl) {
                mapInstance = container._mapboxgl;
                console.log('Found mapboxgl instance on container');
                break;
            }
            
            // Try to get the map from mapbox's internal structure
            const mapboxCanvas = container.querySelector('.mapboxgl-canvas');
            if (mapboxCanvas) {
                const mapParent = mapboxCanvas.parentNode;
                if (mapParent && mapParent._map) {
                    mapInstance = mapParent._map;
                    console.log('Found map instance via canvas parent');
                    break;
                }
            }
            
            // Last resort - check for any mapboxgl element
            const mapboxEl = container.querySelector('.mapboxgl-map');
            if (mapboxEl && mapboxEl._map) {
                mapInstance = mapboxEl._map;
                console.log('Found map instance via mapboxgl-map element');
                break;
            }
        }
    }
    
    // If we still don't have a map instance, try window.mapInstance if it exists
    if (!mapInstance && window.mapInstance) {
        console.log('Using globally stored map instance');
        mapInstance = window.mapInstance;
    }
    
    if (!mapInstance) {
        console.error('No active map instance found - cannot fly to location');
        
        // Alternative approach - highlight the connection in the panel
        const connectionElement = document.querySelector(`[data-ip="${ip}"]`);
        if (connectionElement) {
            connectionElement.classList.add('cn-connection-highlighted');
            setTimeout(() => {
                connectionElement.classList.remove('cn-connection-highlighted');
            }, 2000);
        }
        return;
    }
    
    console.log('Map instance found, looking for target coordinates');
    
    // Find the connection data for this IP in pendingMaps
    let targetCoordinates = null;
    let dataPoint = null;
    
    // Try to find the coordinates in any of the pendingMaps
    for (const [mapId, mapData] of pendingMaps.entries()) {
        const connection = mapData.connections.find(conn => conn.peerAddress === ip);
        if (connection && connection.coordinates) {
            console.log(`Found coordinates for ${ip} in map ${mapId}: ${connection.coordinates}`);
            const coordParts = connection.coordinates.split(',').map(part => parseFloat(part.trim()));
            if (coordParts.length === 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1])) {
                targetCoordinates = [coordParts[1], coordParts[0]]; // Convert from lat,long to [long,lat]
                dataPoint = {
                    ip: ip,
                    isHighRisk: connection.isHighRisk || getRiskLevel(connection.peerPort) === 'high',
                    to: targetCoordinates
                };
                break;
            }
        }
    }
    
    if (!targetCoordinates) {
        console.error(`No coordinates found for IP: ${ip}`);
        return;
    }
    
    console.log(`Flying to coordinates: ${targetCoordinates}`);
    
    // If we found valid coordinates, fly to them
    try {
        // Fly to the coordinates with animation
        mapInstance.flyTo({
            center: targetCoordinates,
            zoom: 12, // Increased zoom level for more detail
            pitch: 45,
            bearing: Math.random() * 60 - 30, // Random bearing for interest
            duration: 1500,
            essential: true
        });
        
        // Wait for the flying animation to finish before adding the marker
        // This helps with alignment issues during zooming
        setTimeout(() => {
            // Create a pulse effect on the marker
            if (dataPoint) {
                highlightMarker(dataPoint);
            }
        }, 1600); // Slightly longer than the flyTo duration
        
        console.log('Fly animation started');
    } catch (error) {
        console.error('Error during map flyTo operation:', error);
    }
}

/**
 * Creates a pulse effect on a marker
 * @param {Object} dataPoint - The data point to highlight
 */
function highlightMarker(dataPoint) {
    // Find any existing highlight element and remove it
    const existingHighlight = document.querySelector('.marker-highlight');
    if (existingHighlight) {
        existingHighlight.remove();
    }
    
    // Get the map instance
    const mapInstance = window.mapInstance;
    if (!mapInstance) {
        console.error('Cannot highlight marker: No map instance found');
        return;
    }
    
    // Create a Mapbox marker instead of a div for better positioning
    const markerEl = document.createElement('div');
    markerEl.className = 'marker-highlight';
    
    // Create the marker with the proper coordinates
    const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'center',
        offset: [0, 0]  // Use a zero offset for better alignment
    })
    .setLngLat(dataPoint.to)
    .addTo(mapInstance);
    
    // Store the marker reference so we can remove it later
    window.highlightedMarker = marker;
    window.highlightedIP = dataPoint.ip;
    
    // Style the highlight effect
    markerEl.style.width = '30px';
    markerEl.style.height = '30px';
    markerEl.style.borderRadius = '50%';
    markerEl.style.backgroundColor = dataPoint.isHighRisk ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)';
    markerEl.style.border = dataPoint.isHighRisk ? '2px solid #ef4444' : '2px solid #10b981';
    markerEl.style.boxShadow = dataPoint.isHighRisk ? '0 0 15px #ef4444' : '0 0 15px #10b981';
    markerEl.style.position = 'absolute'; // Ensure absolute positioning
    
    // Add CSS for the pulse animation if it doesn't exist
    if (!document.querySelector('#pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.textContent = `
            .marker-highlight {
                animation: pulse 1.5s infinite;
                pointer-events: none;
                z-index: 999; /* Ensure marker is visible above other elements */
            }
            @keyframes pulse {
                0% {
                    transform: scale(0.5);
                    opacity: 1;
                }
                100% {
                    transform: scale(2);
                    opacity: 0;
                }
            }
            
            .cn-clear-marker-btn {
                position: absolute;
                bottom: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.8);
                border: 1px solid #0369a1;
                color: #0369a1;
                border-radius: 4px;
                padding: 5px 10px;
                font-size: 12px;
                cursor: pointer;
                z-index: 100;
                transition: all 0.2s ease;
                display: none;
            }
            
            .cn-clear-marker-btn:hover {
                background: #0369a1;
                color: white;
            }
            
            .cn-clear-marker-btn.active {
                display: block;
            }
            
            .cn-connection-highlighted {
                animation: highlight-pulse 1.5s ease-in-out;
                position: relative;
                z-index: 5;
            }
            
            @keyframes highlight-pulse {
                0%, 100% {
                    transform: translateY(0);
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    background: #f8fafc;
                }
                50% {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(3, 105, 161, 0.3);
                    background: #f0f9ff;
                    border-left-width: 5px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add a clear button to the map if it doesn't exist already
    addClearMarkerButton(mapInstance);
}

/**
 * Adds a button to clear the highlighted marker
 * @param {Object} mapInstance - The mapbox instance
 */
function addClearMarkerButton(mapInstance) {
    // Check if the button already exists
    let clearBtn = document.querySelector('.cn-clear-marker-btn');
    
    if (!clearBtn) {
        // Get the map container
        const mapContainer = mapInstance.getContainer();
        
        // Create the clear button
        clearBtn = document.createElement('button');
        clearBtn.className = 'cn-clear-marker-btn';
        clearBtn.textContent = 'Clear Highlight';
        clearBtn.onclick = clearHighlightedMarker;
        
        // Add the button to the map container
        mapContainer.appendChild(clearBtn);
    }
    
    // Show the button
    clearBtn.classList.add('active');
}

/**
 * Clears the highlighted marker
 */
function clearHighlightedMarker() {
    if (window.highlightedMarker) {
        window.highlightedMarker.remove();
        window.highlightedMarker = null;
        window.highlightedIP = null;
        
        // Remove active class from all connections in the sidebar
        document.querySelectorAll('.cn-external-domain').forEach(el => {
            el.classList.remove('cn-connection-active');
        });
        
        // Hide the clear button
        const clearBtn = document.querySelector('.cn-clear-marker-btn');
        if (clearBtn) {
            clearBtn.classList.remove('active');
        }
    }
}

// Make the functions available to the window object for direct script access
if (typeof window !== 'undefined') {
    window.flyToConnectionMarker = flyToConnectionMarker;
    window.highlightMarker = highlightMarker;
    window.clearHighlightedMarker = clearHighlightedMarker;
}

export { flyToConnectionMarker, highlightMarker, clearHighlightedMarker }; 