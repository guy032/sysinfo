/**
 * Reagraph Network View Component
 * Displays a visual graph of network connections using Reagraph
 */

import { isPrivateIP } from '../utils/ipUtils.js';
import { findProcessNameByPid, getPortClass } from '../utils/connectionUtils.js';

// Store reference to window for global object access
const globalScope = typeof window !== 'undefined' ? window : {};

// Maximum number of retries to avoid infinite loops
const MAX_RETRIES = 10;

/**
 * Initializes the reagraph network visualization
 * @param {string} containerId - ID of the container element
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @param {number} retryCount - Current retry count
 */
function initializeGraphNetwork(containerId, nodes, edges, retryCount = 0) {
    try {
        // Get the container element
        var container = document.getElementById(containerId);
        if (!container) {
            console.error('Container element not found:', containerId);
            return;
        }
        
        // Check if force-graph is available as a fallback
        if (typeof window.ForceGraph === 'function') {
            console.log('Using force-graph as fallback visualization');
            createSimpleNetworkGraph(container, nodes, edges);
            return;
        }
        
        // Check if we've exceeded the maximum retry count
        if (retryCount >= MAX_RETRIES) {
            console.error(`Max retry attempts (${MAX_RETRIES}) reached. ReGraph library could not be loaded.`);
            
            // Display error message in the container
            const errorContainer = document.getElementById(containerId + '-container');
            if (errorContainer) {
                errorContainer.innerHTML = 
                    '<div class="error-message">' +
                    '<strong>Error:</strong> Failed to load ReGraph library after multiple attempts. ' +
                    'Please check your network connection and reload the page.' +
                    '</div>';
            }
            return;
        }
        
        // Check if ReGraph is available
        if (typeof window.ReGraph === 'undefined' || typeof window.ReGraph.ForceGraph !== 'function') {
            console.warn('ReGraph library not found, retrying... (attempt ' + (retryCount + 1) + '/' + MAX_RETRIES + ')');
            setTimeout(function() {
                initializeGraphNetwork(containerId, nodes, edges, retryCount + 1);
            }, 300);
            return;
        }
        
        // Map data to ReGraph format
        var graphNodes = nodes.map(function(node) {
            return {
                id: node.id,
                label: node.label,
                type: node.type,
                fill: getNodeColor(node.type, node.isLocal),
                size: node.size || 15,
                icon: node.icon,
                imageUrl: node.imageUrl
            };
        });
        
        var graphEdges = edges.map(function(edge) {
            return {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label,
                color: getEdgeColor(edge.type),
                thickness: getEdgeThickness(edge.type)
            };
        });
        
        // Create graph component
        var ForceGraph = window.ReGraph.ForceGraph;
        
        console.log('Graph nodes with icons:', graphNodes.filter(node => node.icon));
        
        // Log gateway node specifically if it exists
        var gatewayNode = graphNodes.find(node => node.type === 'gateway');
        if (gatewayNode) {
            console.log('Gateway node details:', gatewayNode);
        }
        
        // Set fixed positions for key nodes
        const computerNode = graphNodes.find(node => node.id === 'local-computer');
        if (computerNode) {
            computerNode.fx = 0;  // Fix X position
            computerNode.fy = 0;  // Fix Y position
            computerNode.pinned = true;
        }

        if (gatewayNode) {
            gatewayNode.fx = -200;  // Fix X position to the left
            gatewayNode.fy = 0;    // Same Y as computer
            gatewayNode.pinned = true;
        }

        // Group nodes by type for better organization
        const processNodes = graphNodes.filter(node => node.type === 'process');
        const listenPortNodes = graphNodes.filter(node => node.type === 'listen-port');
        const externalNodes = graphNodes.filter(node => node.type === 'external');
        const localDeviceNodes = graphNodes.filter(node => node.type === 'local-device');

        // Apply initial positions to node groups
        processNodes.forEach((node, i) => {
            // Position processes in a semicircle above the computer
            const angle = (Math.PI * 0.8) * (i / processNodes.length) + (Math.PI * 0.6);
            const radius = 150;
            node.x = radius * Math.cos(angle);
            node.y = radius * Math.sin(angle);
        });

        listenPortNodes.forEach((node, i) => {
            // Position listen ports to the right of their parent process
            const parentProcess = processNodes.find(pNode => pNode.id === node.parentProcess);
            if (parentProcess) {
                const angle = Math.PI * 0.5 * Math.random() - Math.PI * 0.25; // slight random variance
                node.x = (parentProcess.x || 0) + 80 * Math.cos(angle);
                node.y = (parentProcess.y || 0) + 80 * Math.sin(angle);
            }
        });

        externalNodes.forEach((node, i) => {
            // Position external nodes to the bottom right
            const angle = (Math.PI * 0.5) * (i / externalNodes.length) + (Math.PI * 1.75);
            const radius = 250;
            node.x = radius * Math.cos(angle);
            node.y = radius * Math.sin(angle);
        });

        localDeviceNodes.forEach((node, i) => {
            // Position local devices to the right
            const angle = (Math.PI * 0.5) * (i / localDeviceNodes.length) + (Math.PI * 0.25);
            const radius = 200;
            node.x = radius * Math.cos(angle);
            node.y = radius * Math.sin(angle);
        });

        // Render with React
        window.ReactDOM.render(
            window.React.createElement(ForceGraph, {
                nodes: graphNodes,
                edges: graphEdges,
                layoutType: 'forceDirected',
                edgeArrowPosition: 'end',
                nodeHighlightBehavior: true,
                zoomToFit: true,
                showLabels: true,
                height: 650,
                width: '100%',
                backgroundColor: '#f8fafc',
                enableZoomPanControls: true,
                draggable: true,
                showNodeIcons: true,   // Use correct property name for icons if available
                iconScale: 1.5,        // Scale icons slightly larger
                // Add custom physics settings for better organization
                d3Force: {
                    charge: {
                        strength: -200,
                        distanceMax: 300
                    },
                    link: {
                        distance: 120
                    },
                    center: {
                        x: 0,
                        y: 0,
                        strength: 0.05
                    },
                    // Add a clustering force to help organization
                    cluster: {
                        strength: 0.3
                    }
                },
                // Add custom configuration for fixed nodes and clustering
                config: {
                    nodePositioning: 'fixed',
                    stabilization: {
                        iterations: 200
                    }
                },
                onNodeHover: function(node) {
                    container.style.cursor = node ? 'pointer' : 'default';
                },
                onNodeClick: function(node) {
                    highlightConnections(node, graphNodes, graphEdges);
                    
                    // Pin node on click for better control
                    if (node) {
                        node.fx = node.x;
                        node.fy = node.y;
                        node.pinned = true;
                    }
                    
                    // Log clicked node for debugging
                    console.log('Clicked node details:', node);
                },
                // Improved node rendering function with better icons
                nodeCanvasObject: function(node, ctx, globalScale) {
                    if (!node) return null;
                    
                    // Get node coordinates and size
                    const x = node.x || 0;
                    const y = node.y || 0;
                    const size = node.size || 15;
                    
                    // Draw circle for the node
                    ctx.beginPath();
                    ctx.arc(x, y, size / globalScale, 0, 2 * Math.PI);
                    ctx.fillStyle = node.fill || getNodeColor(node.type, node.isLocal);
                    ctx.fill();
                    
                    // Draw border for listen port nodes
                    if (node.type === 'listen-port') {
                        ctx.lineWidth = (node.borderWidth || 2) / globalScale;
                        ctx.strokeStyle = node.borderColor || '#64748b';
                        ctx.stroke();
                        
                        // Draw port number label in the center
                        if (node.port) {
                            ctx.font = `${12 / globalScale}px Arial`;
                            ctx.fillStyle = '#FFFFFF';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            
                            // For larger port numbers, make font smaller
                            if (node.port >= 10000) {
                                ctx.font = `${10 / globalScale}px Arial`;
                            }
                            
                            ctx.fillText(node.port.toString(), x, y);
                        }
                    }
                    
                    // Draw custom icon for gateway
                    if (node.type === 'gateway') {
                        // Draw a router icon
                        const iconSize = size * 0.8 / globalScale;
                        
                        // Draw diamond shape
                        ctx.beginPath();
                        ctx.moveTo(x, y - iconSize/2);  // Top
                        ctx.lineTo(x + iconSize/2, y);  // Right
                        ctx.lineTo(x, y + iconSize/2);  // Bottom
                        ctx.lineTo(x - iconSize/2, y);  // Left
                        ctx.closePath();
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fill();
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.stroke();
                        
                        // Draw center circle
                        ctx.beginPath();
                        ctx.arc(x, y, iconSize/3, 0, 2 * Math.PI);
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fill();
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.stroke();
                    }
                    
                    // Add other icons for different node types as needed
                    if (node.type === 'computer') {
                        // Draw computer icon
                        const iconSize = size * 0.6 / globalScale;
                        ctx.fillStyle = '#FFFFFF';
                        
                        // Monitor
                        ctx.fillRect(x - iconSize/2, y - iconSize/2, iconSize, iconSize*0.7);
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.strokeRect(x - iconSize/2, y - iconSize/2, iconSize, iconSize*0.7);
                        
                        // Stand
                        ctx.fillRect(x - iconSize/4, y + iconSize*0.2, iconSize/2, iconSize*0.1);
                        
                        // Base
                        ctx.fillRect(x - iconSize/3, y + iconSize*0.3, iconSize*2/3, iconSize*0.1);
                    }
                    
                    // Draw process icon (simplified)
                    if (node.type === 'process') {
                        // Draw a gear icon (simplified)
                        const iconSize = size * 0.5 / globalScale;
                        ctx.fillStyle = '#FFFFFF';
                        ctx.beginPath();
                        ctx.arc(x, y, iconSize, 0, 2 * Math.PI);
                        ctx.fill();
                        
                        // Draw a simplified gear
                        const innerRadius = iconSize * 0.6;
                        const outerRadius = iconSize * 1.2;
                        const numTeeth = 8;
                        
                        ctx.beginPath();
                        for (let i = 0; i < numTeeth; i++) {
                            const angle = (i / numTeeth) * 2 * Math.PI;
                            const nextAngle = ((i + 0.5) / numTeeth) * 2 * Math.PI;
                            const afterAngle = ((i + 1) / numTeeth) * 2 * Math.PI;
                            
                            ctx.lineTo(x + innerRadius * Math.cos(angle), y + innerRadius * Math.sin(angle));
                            ctx.lineTo(x + outerRadius * Math.cos(nextAngle), y + outerRadius * Math.sin(nextAngle));
                            ctx.lineTo(x + innerRadius * Math.cos(afterAngle), y + innerRadius * Math.sin(afterAngle));
                        }
                        ctx.closePath();
                        ctx.lineWidth = 1.5 / globalScale;
                        ctx.strokeStyle = '#10b981';
                        ctx.stroke();
                        
                        // Draw center circle
                        ctx.beginPath();
                        ctx.arc(x, y, innerRadius * 0.5, 0, 2 * Math.PI);
                        ctx.fillStyle = '#10b981';
                        ctx.fill();
                    }
                    
                    // Only show the label for process nodes, computer node, gateway, and listen ports
                    const shouldShowLabel = true; // Show labels for all nodes
                    
                    // Draw node label for better visibility - ALWAYS show labels
                    if (node.label) { // Remove scale condition to ensure labels always show
                        const fontSize = Math.max(16 / globalScale, 12); // Ensure minimum size
                        ctx.font = `bold ${fontSize}px Arial`;
                        ctx.fillStyle = '#334155';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        
                        // Position label below node with proper spacing
                        const baseY = y + (size / globalScale) + 5;
                        
                        // Create more detailed labels based on node type
                        let displayLabel = node.label;
                        let additionalInfo = '';
                        
                        // Add port information if available
                        if (node.port) {
                            additionalInfo = `Port: ${node.port}`;
                        }
                        
                        // Add interface info if available
                        if (node.isAllInterfaces) {
                            additionalInfo += additionalInfo ? ' | All Interfaces' : 'All Interfaces';
                        } else if (node.ip) {
                            additionalInfo += additionalInfo ? ` | ${node.ip}` : `${node.ip}`;
                        }
                        
                        // Draw main label with very obvious background
                        const textWidth = ctx.measureText(displayLabel).width;
                        const padding = 6; // Larger padding
                        
                        // Draw background - more opaque
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                        ctx.fillRect(
                            x - textWidth/2 - padding, 
                            baseY - fontSize - padding + 4,
                            textWidth + padding*2,
                            fontSize + padding*2
                        );
                        
                        // Add border to label background
                        ctx.strokeStyle = '#64748b';
                        ctx.lineWidth = 1 / globalScale;
                        ctx.strokeRect(
                            x - textWidth/2 - padding, 
                            baseY - fontSize - padding + 4,
                            textWidth + padding*2,
                            fontSize + padding*2
                        );
                        
                        // Draw the main text
                        ctx.fillStyle = '#1e293b'; // Darker text for better contrast
                        ctx.fillText(displayLabel, x, baseY + padding);
                        
                        // Draw additional info if available
                        if (additionalInfo) {
                            const infoFontSize = Math.max(14 / globalScale, 10); // Ensure minimum size
                            ctx.font = `${infoFontSize}px Arial`;
                            const infoY = baseY + padding + infoFontSize + 6; // More spacing
                            const infoWidth = ctx.measureText(additionalInfo).width;
                            
                            // Draw info background - more opaque
                            ctx.fillStyle = 'rgba(224, 242, 254, 0.95)'; // Light blue background
                            ctx.fillRect(
                                x - infoWidth/2 - padding, 
                                infoY - infoFontSize - padding + 4,
                                infoWidth + padding*2,
                                infoFontSize + padding*2
                            );
                            
                            // Add border to info background
                            ctx.strokeStyle = '#93c5fd';
                            ctx.lineWidth = 1 / globalScale;
                            ctx.strokeRect(
                                x - infoWidth/2 - padding, 
                                infoY - infoFontSize - padding + 4,
                                infoWidth + padding*2,
                                infoFontSize + padding*2
                            );
                            
                            ctx.fillStyle = '#1e40af'; // Darker blue for info text
                            ctx.fillText(additionalInfo, x, infoY);
                        }
                    }
                }
            }),
            container
        );
        
        // Function to get visible nodes and create groups to help with visual clustering
        function getNodeGroups(nodes) {
            const groups = {};
            
            nodes.forEach(node => {
                if (!groups[node.type]) {
                    groups[node.type] = [];
                }
                groups[node.type].push(node.id);
            });
            
            return Object.values(groups);
        }
        
        // Add zoom controls functionality
        setupZoomControls(containerId);
        
        console.log('ReGraph network visualization rendered successfully');
    } catch (error) {
        console.error('Error rendering network graph:', error);
        var errorContainer = document.getElementById(containerId + '-container');
        if (errorContainer) {
            errorContainer.innerHTML = 
                '<div class="error-message">' +
                '<strong>Error:</strong> Failed to render network graph. ' + error.message +
                '</div>';
            
            // Try fallback if available
            if (typeof window.ForceGraph === 'function') {
                const graphCanvas = document.getElementById(containerId);
                if (graphCanvas) {
                    console.log('Attempting to use fallback graph after error');
                    try {
                        createSimpleNetworkGraph(graphCanvas, nodes, edges);
                    } catch (fallbackError) {
                        console.error('Fallback graph also failed:', fallbackError);
                    }
                }
            }
        }
    }
}

/**
 * Setup zoom control buttons functionality
 * @param {string} containerId - ID of the container element
 */
function setupZoomControls(containerId) {
    var zoomInBtn = document.getElementById(containerId + '-zoom-in');
    var zoomOutBtn = document.getElementById(containerId + '-zoom-out');
    var resetBtn = document.getElementById(containerId + '-reset');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', function() {
            // Zoom in functionality would go here
            console.log('Zoom in clicked');
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', function() {
            // Zoom out functionality would go here
            console.log('Zoom out clicked');
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            // Reset view functionality would go here
            console.log('Reset view clicked');
        });
    }
}

/**
 * Highlight node connections when clicked
 * @param {Object} node - The clicked node
 * @param {Array} nodes - All nodes in the graph
 * @param {Array} edges - All edges in the graph
 */
function highlightConnections(node, nodes, edges) {
    console.log('Node clicked:', node);
    // This would highlight connections in a full implementation
}

/**
 * Get node color based on type
 * @param {string} type - Node type
 * @param {boolean} isLocal - Whether the node is on local network
 * @returns {string} - Color hex code
 */
function getNodeColor(type, isLocal) {
    switch (type) {
        case 'computer':
            return '#3b82f6'; // blue
        case 'process':
            return '#10b981'; // green
        case 'internal-device':
            return '#8b5cf6'; // purple for internal (localhost)
        case 'local-device':
            return '#6366f1'; // indigo for local network
        case 'remote-endpoint':
            // For backward compatibility
            return isLocal ? '#6366f1' : '#ef4444'; // indigo for local, red for external
        case 'gateway':
            return '#ff7700'; // orange for gateway (changed from amber to match legend)
        case 'external':
            return '#ef4444'; // red for external
        case 'listen-port':
            return '#3b82f6'; // blue (default, will be customized)
        default:
            return '#64748b'; // slate
    }
}

/**
 * Get edge color based on type
 * @param {string} type - Edge type
 * @returns {string} - Color hex code
 */
function getEdgeColor(type) {
    switch (type) {
        case 'port-well-known':
            return '#3b82f6'; // blue
        case 'port-registered':
            return '#0891b2'; // cyan
        case 'port-dynamic':
            return '#64748b'; // slate
        case 'port-danger':
            return '#ef4444'; // red
        case 'process-connection':
            return '#10b981'; // green
        case 'localhost-connection':
            return '#8b5cf6'; // purple for localhost connections
        case 'gateway-connection':
            return '#f59e0b'; // amber for gateway connections
        case 'self-connection':
            return '#8b5cf6'; // purple
        default:
            return '#94a3b8'; // slate-300
    }
}

/**
 * Get edge thickness based on type
 * @param {string} type - Edge type
 * @returns {number} - Thickness value
 */
function getEdgeThickness(type) {
    switch (type) {
        case 'port-danger':
            return 3;
        case 'port-well-known':
            return 2;
        case 'process-connection':
            return 2;
        default:
            return 1;
    }
}

/**
 * Initializes a specific network graph instance
 * @param {string} graphId - Unique ID for this graph instance
 */
function setupNetworkGraph(graphId) {
    // Set a timeout to hide the loading message after 5 seconds regardless
    setTimeout(function() {
        var loadingElement = document.getElementById(`${graphId}-loading`);
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }, 5000);
    
    function initGraph() {
        var container = document.getElementById(`${graphId}-container`);
        if (!container) {
            setTimeout(initGraph, 100);
            return;
        }
        
        // Remove loading message
        var loadingElem = document.getElementById(`${graphId}-loading`);
        if (loadingElem) loadingElem.style.display = 'none';
        
        try {
            // Decode the JSON data from attributes
            var nodesData = JSON.parse(decodeURIComponent(container.getAttribute('data-nodes-encoded')));
            var edgesData = JSON.parse(decodeURIComponent(container.getAttribute('data-edges-encoded')));
            
            // Try to initialize the graph with ReGraph, fallback to simple graph if needed
            initializeGraphNetwork(graphId, nodesData, edgesData);
            
            // Ensure loading is hidden after initialization
            setTimeout(function() {
                var loadingElement = document.getElementById(`${graphId}-loading`);
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
            }, 500);
        } catch (error) {
            console.error('Error parsing graph data:', error);
            container.innerHTML = '<div class="error-message">Failed to parse graph data</div>';
            
            // Try direct fallback if data is available
            if (typeof window.ForceGraph === 'function') {
                try {
                    const graphCanvas = document.getElementById(graphId);
                    if (graphCanvas && nodesData && edgesData) {
                        createSimpleNetworkGraph(graphCanvas, nodesData, edgesData);
                    }
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                }
            }
        }
        
        // Fix any duplicate legends
        ensureSingleLegend();
    }
    
    // Set up a MutationObserver to detect when the LAN tab becomes visible
    var lanTab = document.getElementById(`${graphId}-container`).closest('.subtab-pane');
    if (lanTab) {
        // Initialize when this tab becomes visible
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (lanTab.style.display !== 'none') {
                        initGraph();
                        observer.disconnect(); // Only need to initialize once
                    }
                }
            });
        });
        
        observer.observe(lanTab, { attributes: true });
        
        // Also check if it's already visible
        if (lanTab.style.display !== 'none') {
            initGraph();
        }
    } else {
        // If we can't find the tab container, just initialize anyway
        initGraph();
    }
    
    // Function to make sure only one legend is visible
    function ensureSingleLegend() {
        var allLegends = document.querySelectorAll('.network-legend');
        if (allLegends.length <= 1) return; // No duplicates
        
        // Find our legend with the marker class
        var ourLegend = document.querySelector('.one-true-legend');
        if (!ourLegend) return;
        
        // First make our legend visible
        ourLegend.style.display = 'block';
        
        // Remove all other legends
        allLegends.forEach(function(legend) {
            if (legend !== ourLegend && legend.parentNode) {
                console.log('Removing duplicate legend');
                legend.parentNode.removeChild(legend);
            }
        });
        
        // Add event listener to close button
        var closeBtn = document.getElementById(`${graphId}-legend-close`);
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                ourLegend.style.display = 'none';
            });
        }
    }
    
    // Run legend cleanup both immediately and after a delay
    setTimeout(ensureSingleLegend, 500);
    setTimeout(ensureSingleLegend, 1500);
}

// Expose function to global scope
globalScope.NetworkGraphUtils = {
    initializeGraphNetwork: initializeGraphNetwork,
    setupNetworkGraph: setupNetworkGraph,
    createSimpleNetworkGraph: createSimpleNetworkGraph
};

// Helper function to get subnet from IP (first 3 octets)
function getSubnet(ip) {
    if (!ip || typeof ip !== 'string') return '';
    const parts = ip.split('.');
    if (parts.length < 3) return ip; // Not a valid IPv4
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

/**
 * Creates a visual graph representation of local network connections
 * @param {Array} connections - Array of network connections
 * @param {Array} processesList - Array of process objects for name lookup
 * @param {Object} gatewayInfo - Gateway information (optional)
 * @param {Array} listenConnections - Array of listening connections (optional)
 * @returns {string} HTML string for the reagraph visualization
 */
function createReagraphNetworkView(connections, processesList = [], gatewayInfo = null, listenConnections = []) {
    if (connections.length === 0 && listenConnections.length === 0) return '<div class="empty-state">No network connections found</div>';
    
    // Create a unique ID for this graph instance
    const graphId = `network-graph-${Date.now()}`;
    
    // Prepare nodes and edges data for reagraph
    const nodes = [];
    const edges = [];
    
    // Track which external connections have been routed through the gateway
    const routedConnections = new Set();
    
    // Track gateways by subnet
    const gatewaysBySubnet = new Map();
    
    // Map to track process nodes by PID (single source of truth)
    const processNodeMap = new Map();
    
    // Add the local computer as the central node (make it blue and larger)
    nodes.push({
        id: 'local-computer',
        label: 'This Computer',
        type: 'computer',
        size: 40,  // Make it larger than other nodes
        // Add SVG data for laptop icon
        icon: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
            <rect x="4" y="5" width="16" height="10" fill="#FFFFFF" stroke="#000000" stroke-width="0.5"/>
            <rect x="6" y="17" width="12" height="1" fill="#FFFFFF" stroke="#000000" stroke-width="0.5"/>
            <rect x="9" y="18" width="6" height="1" fill="#000000"/>
        </svg>
        `
    });
    
    // First step: create all process nodes to avoid duplicates
    const allProcessPids = new Set();
    
    // Collect all unique PIDs from connections and listen connections
    connections.forEach(conn => {
        if (conn.pid) allProcessPids.add(conn.pid);
    });
    
    if (listenConnections && listenConnections.length > 0) {
        listenConnections.forEach(conn => {
            // if (conn.pid) allProcessPids.add(conn.pid);
        });
    }
    
    // Create a single node for each unique process
    allProcessPids.forEach(pid => {
        const processId = `process-${pid}`;
        const processName = findProcessNameByPid(processesList, pid) || `PID ${pid}`;
        
        const processNode = {
            id: processId,
            label: processName,
            type: 'process',
            size: 20,
            pid: pid
        };
        
        nodes.push(processNode);
        processNodeMap.set(processId, processNode);
        
        // Connect process to local computer
        edges.push({
            id: `comp-to-${processId}`,
            source: 'local-computer',
            target: processId,
            label: '',
            type: 'process-connection'
        });
    });

    // Add gateway node(s)
    if (gatewayInfo && gatewayInfo.gateway && gatewayInfo.gateway !== '-') {
        const gatewayIp = gatewayInfo.gateway;
        const gatewaySubnet = getSubnet(gatewayIp);
        const gatewayId = `gateway-${gatewayIp.replace(/\./g, '-')}`;
        
        nodes.push({
            id: gatewayId,
            label: `Gateway: ${gatewayIp}`,
            type: 'gateway',
            size: 35,  // Larger for better visibility
            subnet: gatewaySubnet,
            ip: gatewayIp,
            // Use base64 SVG for better compatibility
            imageUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNmZjc3MDAiIHJ4PSI0IiByeT0iNCIvPjxwYXRoIGQ9Ik0xMiwxMiBtLTgsLTggbDE2LDE2IE0xMiwxMiBtLTgsOCBsMTYsLTE2IE0xMiwxMCBhMiwyLDAsMCwxLDAsMCw0IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjQiIGZpbGw9IiNGRkZGRkYiLz48L3N2Zz4="
        });
        
        // Add edge between computer and gateway
        edges.push({
            id: `comp-to-gateway-${gatewayIp.replace(/\./g, '-')}`,
            source: 'local-computer',
            target: gatewayId,
            label: 'Default Gateway',
            type: 'gateway-connection',
            thickness: 3  // Make the gateway connection thicker for better visibility
        });
        
        // Store gateway by subnet
        gatewaysBySubnet.set(gatewaySubnet, {
            id: gatewayId,
            ip: gatewayIp
        });
        
        console.log(`Added gateway for subnet ${gatewaySubnet}: ${gatewayIp}`);
    }
    
    // First pass: collect all nodes from active connections
    // We no longer create process nodes here, just external nodes
    const externalNodes = new Map();
    
    connections.forEach((conn) => {
        const processId = `process-${conn.pid}`;
        
        // Determine if this is a localhost/internal connection
        const isLocalhost = conn.peerAddress === '127.0.0.1' || 
                           conn.peerAddress === 'localhost' || 
                           conn.peerAddress === '::1';
        
        // Get subnet for the connection's peer address
        const peerSubnet = getSubnet(conn.peerAddress);
        
        // Determine node type based on IP address
        let nodeType = 'external';  // Default to external (red) for non-local connections
        const isPrivate = isPrivateIP(conn.peerAddress);
        if (isLocalhost) {
            nodeType = 'internal-device';
        } else if (isPrivate) {
            nodeType = 'local-device';
        }
        
        // Check if the remote address is a gateway
        const isGateway = Array.from(gatewaysBySubnet.values()).some(gw => gw.ip === conn.peerAddress);
        if (isGateway) {
            nodeType = 'gateway';
        }
        
        // Use process ID for both source and target if it's localhost
        const remoteNodeId = isLocalhost ? 'local-computer' : 
                            isGateway ? `gateway-${conn.peerAddress.replace(/\./g, '-')}` :
                            `${nodeType}-${conn.peerAddress.replace(/\./g, '-')}`;
        
        // For non-localhost connections, add remote endpoint node if it doesn't exist yet
        // And not already added as a gateway
        if (!isLocalhost && nodeType !== 'gateway') {
            if (!externalNodes.has(remoteNodeId)) {
                // Include port in the remote endpoint label for better visibility
                const portDisplay = conn.peerPort ? `:${conn.peerPort}` : '';
                nodes.push({
                    id: remoteNodeId,
                    label: `${conn.peerAddress}${portDisplay}`,
                    type: nodeType,
                    size: 15,
                    port: conn.peerPort, // Store port for tooltips
                    isExternal: !isPrivate,
                    subnet: peerSubnet, // Store subnet for routing
                    ip: conn.peerAddress
                });
                externalNodes.set(remoteNodeId, {
                    address: conn.peerAddress,
                    type: nodeType,
                    isExternal: !isPrivate,
                    subnet: peerSubnet
                });
            }
        }
    });
    
    // Process listening connections - don't create process nodes, just port nodes
    if (listenConnections && listenConnections.length > 0) {
        // Group listening connections by process for better organization
        const listenByProcess = new Map();
        
        // listenConnections.forEach(conn => {
        //     const processId = `process-${conn.pid}`;
        //     if (!listenByProcess.has(processId)) {
        //         listenByProcess.set(processId, []);
        //     }
        //     listenByProcess.get(processId).push(conn);
        // });
        
        // For each process with listening connections
        listenByProcess.forEach((processListenConns, processId) => {
            // Process node already exists, no need to create it again
            
            // Group by interface type
            const portsByInterface = new Map();
            
            processListenConns.forEach(conn => {
                const interfaceType = getInterfaceType(conn.localAddress);
                if (!portsByInterface.has(interfaceType)) {
                    portsByInterface.set(interfaceType, new Set());
                }
                portsByInterface.get(interfaceType).add(conn.localPort);
            });
            
            // Handle localhost-only ports together (single edge back to computer)
            // if (portsByInterface.has('local')) {
            //     const localPorts = Array.from(portsByInterface.get('local')).sort((a, b) => a - b);
            //     if (localPorts.length > 0) {
            //         // Create a single edge for all localhost ports
            //         const portLabel = localPorts.length <= 3 ? 
            //             localPorts.join(', ') : 
            //             `${localPorts.slice(0, 3).join(', ')}... +${localPorts.length - 3} more`;
                    
            //         edges.push({
            //             id: `localhost-ports-${processId}`,
            //             source: processId,
            //             target: 'local-computer',
            //             label: `Listening on localhost: ${portLabel}`,
            //             type: 'localhost-connection',
            //             tooltip: `Localhost-only ports: ${localPorts.join(', ')}`,
            //             isListening: true
            //         });
            //     }
                
            //     // Remove localhost from interface groups since we've handled it separately
            //     portsByInterface.delete('local');
            // }
            
            // Create nodes for network-exposed ports
            // portsByInterface.forEach((ports, interfaceType) => {
            //     ports.forEach(port => {
            //         const portClass = getPortClass(port);
            //         const isAllInterfaces = interfaceType === 'all';
                    
            //         // Create node ID based on process, port and interface
            //         const listenNodeId = `listen-${processId}-${port}-${interfaceType}`;
            //         const nodeLabel = isAllInterfaces ? 
            //             `Port ${port} (All Interfaces)` : 
            //             `Port ${port} (Network)`;
                    
            //         // Add listen port node
            //         nodes.push({
            //             id: listenNodeId,
            //             label: nodeLabel,
            //             type: 'listen-port',
            //             portClass: portClass,
            //             size: 15,
            //             port: port,
            //             isAllInterfaces: isAllInterfaces,
            //             parentProcess: processId
            //         });
                    
            //         // Connect process to listen port
            //         edges.push({
            //             id: `process-to-listen-${processId}-${port}-${interfaceType}`,
            //             source: processId,
            //             target: listenNodeId,
            //             label: `Listening on ${port}`,
            //             type: 'listen-connection',
            //             portClass: portClass
            //         });
                    
            //         // For ports exposed to network, create edge from gateway to this port
            //         if (gatewaysBySubnet.size > 0) {
            //             const defaultGateway = Array.from(gatewaysBySubnet.values())[0];
                        
            //             // Connect from gateway to show network exposure
            //             edges.push({
            //                 id: `gateway-to-listen-${port}-${interfaceType}`,
            //                 source: defaultGateway.id,
            //                 target: listenNodeId,
            //                 label: `Exposed: Port ${port}`,
            //                 type: 'exposed-port',
            //                 portClass: portClass,
            //                 dashed: true
            //             });
            //         }
            //     });
            // });
        });
    }
    
    // Second pass: create connection edges with correct routing
    // Group connections by process, endpoint and interface
    const groupedConnections = new Map();
    
    connections.forEach((conn) => {
        const processId = `process-${conn.pid}`;
        const isLocalhost = conn.peerAddress === '127.0.0.1' || 
                           conn.peerAddress === 'localhost' || 
                           conn.peerAddress === '::1';
        const isPrivate = isPrivateIP(conn.peerAddress);
        const isGateway = Array.from(gatewaysBySubnet.values()).some(gw => gw.ip === conn.peerAddress);
        const nodeType = isLocalhost ? 'internal-device' : 
                        isGateway ? 'gateway' : 
                        isPrivate ? 'local-device' : 'external';
        
        const peerSubnet = getSubnet(conn.peerAddress);
        const remoteNodeId = isLocalhost ? 'local-computer' : 
                            isGateway ? `gateway-${conn.peerAddress.replace(/\./g, '-')}` :
                            `${nodeType}-${conn.peerAddress.replace(/\./g, '-')}`;
        
        // Create a unique key for this process-endpoint-interface combination
        const groupKey = `${processId}|${remoteNodeId}|${conn.localAddress || 'default'}`;
        
        if (!groupedConnections.has(groupKey)) {
            groupedConnections.set(groupKey, {
                processId,
                remoteNodeId,
                isLocalhost,
                isGateway,
                isPrivate,
                peerSubnet,
                isExternal: !isLocalhost && !isPrivate && !isGateway,
                nodeType,
                connections: []
            });
        }
        
        // Add this connection to the group
        groupedConnections.get(groupKey).connections.push(conn);
    });
    
    // Create edges for each grouped connection
    let edgeIndex = 0;
    groupedConnections.forEach((group, groupKey) => {
        const { processId, remoteNodeId, isLocalhost, isGateway, peerSubnet, nodeType, isExternal, connections } = group;
        const edgeId = `edge-${edgeIndex++}`;
        
        // Sort connections by port
        connections.sort((a, b) => a.localPort - b.localPort);
        
        // Create a label showing all ports in this group
        let portLabel;
        if (connections.length <= 3) {
            // Show all ports if 3 or fewer
            portLabel = connections.map(conn => `${conn.localPort} → ${conn.peerPort}`).join(', ');
        } else {
            // Otherwise show the first 3 and indicate there are more
            portLabel = connections.slice(0, 3).map(conn => `${conn.localPort} → ${conn.peerPort}`).join(', ') + 
                       ` +${connections.length - 3} more`;
        }
        
        // Store detailed port information for tooltips
        const portDetails = connections.map(conn => `${conn.localPort} → ${conn.peerPort}`).join('\n');
        
        // Find matching gateway for this subnet
        const matchingGateway = gatewaysBySubnet.get(peerSubnet);
        
        // Use default gateway if no matching subnet gateway found
        const defaultGateway = gatewaysBySubnet.size > 0 ? 
                            Array.from(gatewaysBySubnet.values())[0] : null;
        
        const gatewayToUse = matchingGateway || defaultGateway;
        
        // Create connection edge based on node type
        if (isLocalhost) {
            // For localhost, connect process to computer directly
            edges.push({
                id: edgeId,
                source: processId,
                target: 'local-computer',
                label: portLabel,
                type: 'localhost-connection',
                tooltip: portDetails,
                connectionCount: connections.length
            });
        } else if (isGateway) {
            // Direct connection to gateway
            edges.push({
                id: edgeId,
                source: processId,
                target: remoteNodeId,
                label: portLabel,
                type: 'gateway-connection',
                tooltip: portDetails,
                connectionCount: connections.length
            });
        } else if ((nodeType === 'external' || nodeType === 'local-device') && gatewayToUse) {
            // Route through appropriate gateway based on subnet matching
            console.log(`Routing ${nodeType} through gateway for ${connections.length} connections via ${gatewayToUse.ip}`);
            
            // 1. Process to gateway connection
            edges.push({
                id: `${edgeId}-to-gateway`,
                source: processId,
                target: gatewayToUse.id,
                label: portLabel,
                type: 'gateway-connection',
                tooltip: portDetails,
                connectionCount: connections.length
            });
            
            // 2. Gateway to external/local-device connection (only add once per endpoint)
            const gatewayToExternalId = `gateway-${gatewayToUse.ip.replace(/\./g, '-')}-to-${remoteNodeId}`;
            if (!routedConnections.has(gatewayToExternalId)) {
                // Use the last port in connections as an example for the label
                const lastConn = connections[connections.length - 1];
                edges.push({
                    id: gatewayToExternalId,
                    source: gatewayToUse.id,
                    target: remoteNodeId,
                    label: `Gateway → ${connections.length} port${connections.length > 1 ? 's' : ''}`,
                    type: 'gateway-connection',
                    tooltip: portDetails,
                    connectionCount: connections.length
                });
                routedConnections.add(gatewayToExternalId);
            }
        } else {
            // Default case - should not normally occur with proper routing
            console.warn(`Direct connection (no gateway): ${processId} → ${remoteNodeId} (${connections.length} ports)`);
            edges.push({
                id: edgeId,
                source: processId,
                target: remoteNodeId,
                label: portLabel,
                type: 'port-well-known', // Default type
                tooltip: portDetails,
                connectionCount: connections.length
            });
        }
    });

    // Ensure all nodes are properly colored
    nodes.forEach(node => {
        if (node.type === 'external') {
            node.fill = '#ef4444'; // Red for external
        } else if (node.type === 'local-device') {
            node.fill = '#6366f1'; // Indigo for local network
        } else if (node.type === 'listen-port') {
            // Color listen ports based on port class
            if (node.portClass === 'port-danger') {
                node.fill = '#f43f5e'; // Bright red for dangerous ports
            } else if (node.portClass === 'port-well-known') {
                node.fill = '#3b82f6'; // Blue for well-known ports
            } else if (node.portClass === 'port-registered') {
                node.fill = '#0891b2'; // Cyan for registered ports
            } else {
                node.fill = '#9ca3af'; // Gray for dynamic ports
            }
            
            // Add border style based on exposure
            if (node.isAllInterfaces) {
                node.borderColor = '#f59e0b'; // Orange border for all interfaces (highest exposure)
                node.borderWidth = 3;
            } else {
                node.borderColor = '#84cc16'; // Green border for network interfaces
                node.borderWidth = 2;
            }
        }
    });
    
    // Store data in data attributes as JSON strings, but safely encode to avoid 
    // potential HTML attribute issues
    const nodesJson = encodeURIComponent(JSON.stringify(nodes));
    const edgesJson = encodeURIComponent(JSON.stringify(edges));
    
    // Create HTML with the container for reagraph
    const containerHTML = `
        <div class="reagraph-container" id="${graphId}-container" 
             data-nodes-encoded="${nodesJson}" data-edges-encoded="${edgesJson}">
            <div class="graph-controls">
                <button class="graph-control-btn" id="${graphId}-zoom-in">+</button>
                <button class="graph-control-btn" id="${graphId}-zoom-out">-</button>
                <button class="graph-control-btn" id="${graphId}-reset">Reset</button>
            </div>
            <div id="${graphId}" class="reagraph-canvas"></div>
            <div class="graph-loading" id="${graphId}-loading">Initializing network visualization...</div>
            
            <!-- Network legend with unique identifier -->
            <div class="network-legend one-true-legend" id="${graphId}-legend">
                <div class="legend-header">
                    <div class="legend-title">Network Elements</div>
                    <div class="legend-close" id="${graphId}-legend-close" title="Close Legend">×</div>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #3b82f6;"></span>
                    <span class="legend-label">This Computer</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #10b981;"></span>
                    <span class="legend-label">Process</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #6366f1;"></span>
                    <span class="legend-label">Local Network Device</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #ef4444;"></span>
                    <span class="legend-label">External Endpoint</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #8b5cf6;"></span>
                    <span class="legend-label">Localhost Connection</span>
                </div>
                
                ${gatewayInfo && gatewayInfo.gateway ? `
                <div class="legend-item gateway-legend-item">
                    <span class="legend-color" style="background-color: #ff7700;"></span>
                    <span class="legend-label">Network Gateway</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <style>
            .reagraph-container {
                height: 650px;
                width: 100%;
                position: relative;
                border-radius: 8px;
                overflow: hidden;
                background: #f8fafc;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .reagraph-canvas {
                width: 100%;
                height: 100%;
            }
            
            .graph-controls {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 100;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .graph-control-btn {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: white;
                border: 1px solid #e2e8f0;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                transition: all 0.2s;
            }
            
            .graph-control-btn:hover {
                background: #f1f5f9;
                transform: scale(1.05);
            }
            
            .error-message {
                padding: 20px;
                background: #fee2e2;
                color: #b91c1c;
                border-radius: 6px;
                margin: 20px;
                font-size: 14px;
            }
            
            .graph-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.8);
                padding: 10px 20px;
                border-radius: 4px;
                font-size: 14px;
                color: #334155;
            }
            
            .network-legend {
                position: absolute;
                bottom: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.95);
                padding: 10px 15px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                z-index: 100;
                font-size: 12px;
                min-width: 200px;
                border: 1px solid #ddd;
                max-height: 80%;
                overflow-y: auto;
            }
            
            .legend-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            
            .legend-close {
                cursor: pointer;
                font-size: 18px;
                width: 20px;
                height: 20px;
                line-height: 20px;
                text-align: center;
                border-radius: 50%;
            }
            
            .legend-close:hover {
                background: #f0f0f0;
            }
            
            .legend-title {
                font-weight: bold;
                font-size: 14px;
                color: #000;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                margin: 8px 0;
            }
            
            .legend-color {
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                margin-right: 10px;
                border: 1px solid rgba(0,0,0,0.1);
            }
            
            .legend-port {
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: 4px;
                margin-right: 10px;
            }
            
            .legend-label {
                color: #334155;
            }
            
            .legend-section-title {
                font-weight: 600;
                margin: 12px 0 6px 0;
                color: #334155;
                border-top: 1px dashed #e2e8f0;
                padding-top: 10px;
                width: 100%;
            }
            
            .port-legend-group {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .mini-caption {
                font-size: 10px;
                color: #64748b;
                font-style: italic;
                margin-top: 4px;
                margin-left: 26px;
            }
            
            .gateway-legend-item {
                border-top: 1px dashed #ddd;
                padding-top: 8px;
                margin-top: 8px;
                font-weight: bold;
            }
            
            .gateway-legend-item .legend-color {
                width: 20px;
                height: 20px;
                border: 2px solid white;
                box-shadow: 0 0 0 1px #000;
            }
        </style>
    `;
    
    return containerHTML;
}

/**
 * Get the interface type from the address
 * @param {string} address - IP address
 * @returns {string} Interface type: 'all', 'local', or 'network'
 */
function getInterfaceType(address) {
    if (address === '0.0.0.0' || address === '::') {
        return 'all'; // All interfaces (0.0.0.0)
    } else if (address === '127.0.0.1' || address === 'localhost' || address === '::1') {
        return 'local'; // Localhost only
    } else {
        return 'network'; // Specific network interface
    }
}

/**
 * Create a simple network visualization using force-graph as fallback
 * @param {HTMLElement} container - Container element
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 */
function createSimpleNetworkGraph(container, nodes, edges) {
    if (!window.ForceGraph) {
        console.error('ForceGraph library not available');
        return;
    }
    
    // Try to hide any loading messages in parent containers
    const parentContainer = container.parentElement;
    if (parentContainer) {
        const loadingElements = parentContainer.querySelectorAll('.graph-loading');
        loadingElements.forEach(function(el) {
            el.style.display = 'none';
        });
    }
    
    const computerNode = nodes.find(n => n.id === 'local-computer');
    if (computerNode) {
        computerNode.val = 40; // Make it bigger
        computerNode.color = '#3b82f6'; // Ensure it's blue
    }
    
    // Create node data objects with port information if available
    const data = {
        nodes: nodes.map(n => ({ 
            id: n.id,
            name: n.label,
            color: n.fill || getNodeColor(n.type, n.isLocal),
            val: n.size || 15,
            type: n.type,
            isLocal: n.isLocal,
            port: n.port,
            pid: n.pid
        })),
        links: edges.map(e => ({
            source: e.source,
            target: e.target,
            color: getEdgeColor(e.type),
            label: e.label || '',
            localPort: e.localPort,
            remotePort: e.remotePort
        }))
    };
    
    // Find gateway node
    const gatewayNode = data.nodes.find(n => n.type === 'gateway');
    if (gatewayNode) {
        gatewayNode.color = '#ff7700'; // Ensure it's orange
    }
    
    // Make sure external nodes are red
    data.nodes.forEach(node => {
        if (node.type === 'external') {
            node.color = '#ef4444'; // red
        }
    });
    
    // Configure ForceGraph with hover tooltip to show port information
    const graph = ForceGraph()
        .graphData(data)
        .nodeLabel(node => {
            if (node.type === 'remote-endpoint' && node.port) {
                return node.name + ' (Port: ' + node.port + ')';
            }
            return node.name;
        })
        .nodeColor('color')
        .nodeVal('val')
        .linkColor('color')
        .linkLabel(link => {
            // Show tooltip for localhost connections with multiple ports
            if (link.tooltip) {
                return link.tooltip;
            }
            if (link.localPort && link.remotePort) {
                return `${link.localPort} → ${link.remotePort}`;
            }
            return link.label || '';
        })
        .linkDirectionalArrowLength(3)
        .linkDirectionalArrowRelPos(1)
        .linkCurvature(0.25)
        .backgroundColor('#f8fafc')
        .width(container.clientWidth)
        .height(650)
        // Improved node render function for all node types
        .nodeCanvasObject((node, ctx, globalScale) => {
            const size = Math.sqrt(node.val) * 2 / globalScale;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Add laptop icon for the computer node
            if (node.type === 'computer') {
                // Draw a simple laptop icon
                const iconSize = size * 0.7;
                
                // Base of laptop (keyboard area)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(
                    node.x - iconSize/2,
                    node.y - iconSize/6,
                    iconSize,
                    iconSize/3
                );
                
                // Screen area
                ctx.fillRect(
                    node.x - iconSize/2,
                    node.y - iconSize/2,
                    iconSize,
                    iconSize/3
                );
                
                // Screen border
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5 / globalScale;
                ctx.strokeRect(
                    node.x - iconSize/2,
                    node.y - iconSize/2,
                    iconSize,
                    iconSize/3
                );
            }
            
            // Add process icon (simplified)
            if (node.type === 'process') {
                // Draw a gear icon (simplified)
                const iconSize = size * 0.5 / globalScale;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(node.x, node.y, iconSize, 0, 2 * Math.PI);
                ctx.fill();
                
                // Draw a simplified gear
                const innerRadius = iconSize * 0.6;
                const outerRadius = iconSize * 1.2;
                const numTeeth = 8;
                
                    ctx.beginPath();
                for (let i = 0; i < numTeeth; i++) {
                    const angle = (i / numTeeth) * 2 * Math.PI;
                    const nextAngle = ((i + 0.5) / numTeeth) * 2 * Math.PI;
                    const afterAngle = ((i + 1) / numTeeth) * 2 * Math.PI;
                    
                    ctx.lineTo(node.x + innerRadius * Math.cos(angle), node.y + innerRadius * Math.sin(angle));
                    ctx.lineTo(node.x + outerRadius * Math.cos(nextAngle), node.y + outerRadius * Math.sin(nextAngle));
                    ctx.lineTo(node.x + innerRadius * Math.cos(afterAngle), node.y + innerRadius * Math.sin(afterAngle));
                }
                ctx.closePath();
                ctx.lineWidth = 1.5 / globalScale;
                ctx.strokeStyle = '#10b981';
                    ctx.stroke();
                
                // Draw center circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, innerRadius * 0.5, 0, 2 * Math.PI);
                ctx.fillStyle = '#10b981';
                ctx.fill();
            }
            
            // Add gateway icon for gateway nodes
            if (node.type === 'gateway') {
                const iconSize = size * 0.8;
                
                // Draw a router icon as a diamond with a circle in the middle
                ctx.fillStyle = '#ffffff';
                
                // Draw diamond shape
                ctx.beginPath();
                ctx.moveTo(node.x, node.y - iconSize/2);  // Top
                ctx.lineTo(node.x + iconSize/2, node.y);  // Right
                ctx.lineTo(node.x, node.y + iconSize/2);  // Bottom
                ctx.lineTo(node.x - iconSize/2, node.y);  // Left
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5 / globalScale;
                ctx.stroke();
                
                // Draw center circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, iconSize/3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            }
        });
        
    graph(container);
    
    // After rendering, make sure any loading message is hidden
    setTimeout(function() {
        if (parentContainer) {
            const loadingElements = parentContainer.querySelectorAll('.graph-loading');
            loadingElements.forEach(function(el) {
                el.style.display = 'none';
            });
            
            // Also try by ID pattern
            const loadingId = container.id + '-loading';
            const specificLoader = document.getElementById(loadingId);
            if (specificLoader) {
                specificLoader.style.display = 'none';
            }
        }
    }, 100);
}

// Expose the function to the global scope for backward compatibility
globalScope.createSimpleNetworkGraph = createSimpleNetworkGraph;

export default createReagraphNetworkView; 