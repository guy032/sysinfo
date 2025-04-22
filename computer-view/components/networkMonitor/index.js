/**
 * Network Monitor Module
 * Provides an advanced visualization for network connections with security insights
 */

import { consolidateConnections, countUniqueProcesses } from './utils/connectionUtils.js';
import { getWANConnections, getLANConnections } from './utils/ipUtils.js';
import createListenConnectionsTable from './components/listenConnectionsTable.js';
import createEstablishedConnectionsTable from './components/establishedConnectionsTable.js';
import createUdpConnectionsTable from './components/udpConnectionsTable.js';
import { createProcessConnectionGraph, createExternalConnectionsInfo } from './components/networkInsights.js';
import createCyberNetworkMap from './components/cyberNetworkMap.js';
import { enhanceConnectionsIPData } from './components/map/mapVisualizer.js';
import createSecurityDashboard from './components/securityDashboard.js';
import NetworkMonitorUI from './ui/networkMonitorUI.js';
import getNetworkMonitorStyles from './styles.js';
import createReagraphNetworkView from './components/graphNetworkView.js';

/**
 * Creates an advanced visualization for network connections
 * @param {Array} connections - Array of network connection objects
 * @param {Array} [processesList] - Optional array of process objects for name lookup
 * @param {Object} [gpsCoordinates] - Optional GPS coordinates for the origin point of connections
 * @param {Object} [gatewayInfo] - Optional gateway information for network visualization
 * @returns {string} HTML string with the visualization
 */
function createNetworkConnectionsVisual(connections, processesList = [], gpsCoordinates = null, gatewayInfo = null) {
    // Group connections by type
    const listenConnections = connections.filter(conn => conn.protocol === 'tcp' && conn.state === 'LISTEN');
    const establishedConnections = connections.filter(conn => conn.protocol === 'tcp' && conn.state === 'ESTABLISHED');
    const udpConnections = connections.filter(conn => conn.protocol === 'udp');
    const otherConnections = connections.filter(conn => 
        !(conn.protocol === 'tcp' && (conn.state === 'LISTEN' || conn.state === 'ESTABLISHED')) && 
        conn.protocol !== 'udp'
    );
    
    // Filter active UDP connections (with specific destinations)
    const activeUdpConnections = udpConnections.filter(conn => 
        (conn.peerAddress && conn.peerAddress !== '0.0.0.0' && conn.peerPort && conn.peerPort !== '*')
    );
    
    // Count unique processes for each connection type
    const processCount = {
        listen: countUniqueProcesses(listenConnections, processesList),
        established: countUniqueProcesses(establishedConnections, processesList),
        udp: countUniqueProcesses(activeUdpConnections, processesList),
        other: countUniqueProcesses(otherConnections, processesList)
    };
    
    // Get unique PIDs with connection counts for potential security insights
    const pidMap = new Map();
    connections.forEach(conn => {
        if (conn.pid) {
            if (!pidMap.has(conn.pid)) {
                pidMap.set(conn.pid, { 
                    count: 0, 
                    listen: 0, 
                    established: 0, 
                    udp: 0, 
                    other: 0,
                    name: null
                });
                
                // Find process name
                const process = processesList.find(p => p.pid === conn.pid);
                if (process) {
                    pidMap.get(conn.pid).name = process.name || process.proc;
                }
            }
            const pidInfo = pidMap.get(conn.pid);
            pidInfo.count++;
            
            if (conn.protocol === 'tcp' && conn.state === 'LISTEN') {
                pidInfo.listen++;
            } else if (conn.protocol === 'tcp' && conn.state === 'ESTABLISHED') {
                pidInfo.established++;
            } else if (conn.protocol === 'udp') {
                // Only count active UDP connections for visualization
                if (conn.peerAddress && conn.peerAddress !== '0.0.0.0' && conn.peerPort && conn.peerPort !== '*') {
                    pidInfo.udp++;
                }
            } else {
                pidInfo.other++;
            }
        }
    });
    
    // Sort PIDs by connection count (potentially suspicious processes with many connections)
    const sortedPids = Array.from(pidMap.entries()).sort((a, b) => b[1].count - a[1].count);
    
    // Generate unique ID for this instance
    const instanceId = 'network-monitor-' + Math.random().toString(36).substring(2, 9);
    
    // Get WAN and LAN connections
    const wanConnections = getWANConnections(establishedConnections);
    const lanConnections = getLANConnections(establishedConnections);
    
    // Build the HTML for the network monitor
    return `
        <div class="network-connections-section">
            <div class="section-title">Network Activity Monitor</div>
            
            <div class="network-dashboard">
                <div class="dashboard-header">
                    <div class="connection-stats">
                        <div class="stat-card" data-tab="established" title="Active connections to remote endpoints" onclick="NetworkMonitor.switchTab('${instanceId}', 'established')">
                            <div class="stat-icon established-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M16.59,7.58L10,14.17L7.41,11.59L6,13L10,17L18,9L16.59,7.58Z">
                                    </path>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${processCount.established}</div>
                                <div class="stat-label">Connected</div>
                            </div>
                        </div>
                        <div class="stat-card" data-tab="listen" title="Services listening for incoming connections" onclick="NetworkMonitor.switchTab('${instanceId}', 'listen')">
                            <div class="stat-icon listen-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7,13H17V11H7">
                                    </path>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${processCount.listen}</div>
                                <div class="stat-label">Listening</div>
                            </div>
                        </div>
                        <div class="stat-card" data-tab="udp" title="Active UDP connections" onclick="NetworkMonitor.switchTab('${instanceId}', 'udp')">
                            <div class="stat-icon udp-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M16,4L9,8.04V15.96L16,20L23,15.96V8.04M16,6.8L19.86,9L16,11.2L12.14,9M10.9,9.54L14.2,11.4V15.1L11,13.3M21.1,9.54V13.3L17.9,15.1V11.4">
                                    </path>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${processCount.udp}</div>
                                <div class="stat-label">Active UDP</div>
                            </div>
                        </div>
                        <div class="stat-card" data-tab="insights" title="Connections in other states" onclick="NetworkMonitor.switchTab('${instanceId}', 'insights')">
                            <div class="stat-icon other-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,10.5A1.5,1.5 0 0,0 10.5,12A1.5,1.5 0 0,0 12,13.5A1.5,1.5 0 0,0 13.5,12A1.5,1.5 0 0,0 12,10.5M7.5,10.5A1.5,1.5 0 0,0 6,12A1.5,1.5 0 0,0 7.5,13.5A1.5,1.5 0 0,0 9,12A1.5,1.5 0 0,0 7.5,10.5M16.5,10.5A1.5,1.5 0 0,0 15,12A1.5,1.5 0 0,0 16.5,13.5A1.5,1.5 0 0,0 18,12A1.5,1.5 0 0,0 16.5,10.5Z">
                                    </path>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${processCount.other}</div>
                                <div class="stat-label">Other</div>
                            </div>
                        </div>
                        <div class="stat-card" data-tab="security" title="Security Dashboard" onclick="NetworkMonitor.switchTab('${instanceId}', 'security')">
                            <div class="stat-icon security-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M17.13,17C15.92,18.85 14.11,20.24 12,20.92C9.89,20.24 8.08,18.85 6.87,17C6.53,16.5 6.24,16 6,15.47C6,13.82 8.71,12.47 12,12.47C15.29,12.47 18,13.79 18,15.47C17.76,16 17.47,16.5 17.13,17Z">
                                    </path>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">SOC</div>
                                <div class="stat-label">Security</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="network-tabs" id="${instanceId}">
                    <div class="tab-content">
                        <div id="${instanceId}-content-established" class="tab-pane">
                            <div class="pane-header">
                                <h3>Active Connections (${processCount.established})</h3>
                                <div class="pane-description">
                                    Established connections to external endpoints - potential data exfiltration
                                </div>
                            </div>
                            
                            <div class="connection-subtabs">
                                <div class="subtab active" data-subtab="wan" onclick="NetworkMonitor.switchSubTab('${instanceId}', 'wan')">
                                    <div class="subtab-label">
                                        <span class="ip-tag public-ip">WAN</span>
                                        Internet (${wanConnections.length})
                                    </div>
                                </div>
                                <div class="subtab" data-subtab="lan" onclick="NetworkMonitor.switchSubTab('${instanceId}', 'lan')">
                                    <div class="subtab-label">
                                        <span class="ip-tag local-ip">LAN</span>
                                        Local Network (${lanConnections.length})
                                    </div>
                                </div>
                            </div>
                            
                            <div class="subtab-content">
                                <div id="${instanceId}-subcontent-wan" class="subtab-pane">
                                    <div class="cyber-network-map-container">
                                        ${createCyberNetworkMap(wanConnections, processesList, gpsCoordinates, gatewayInfo)}
                                    </div>
                                </div>
                                
                                <div id="${instanceId}-subcontent-lan" class="subtab-pane" style="display:none">
                                    <div class="network-container">
                                        <!-- Graph-based network visualization -->
                                        ${createReagraphNetworkView(lanConnections, processesList, gatewayInfo, listenConnections)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="${instanceId}-content-listen" class="tab-pane" style="display:none">
                            <div class="pane-header">
                                <h3>Listening Services (${processCount.listen})</h3>
                                <div class="pane-description">Services accepting incoming connections - potential attack surface</div>
                            </div>
                            <div class="data-grid grid-listen">
                                ${createListenConnectionsTable(listenConnections, processesList)}
                            </div>
                        </div>
                        
                        <div id="${instanceId}-content-udp" class="tab-pane" style="display:none">
                            <div class="pane-header">
                                <h3>Active UDP Connections (${processCount.udp})</h3>
                                <div class="pane-description">Active UDP traffic with specific destinations</div>
                            </div>
                            <div class="data-grid grid-udp">
                                ${createUdpConnectionsTable(udpConnections, processesList)}
                            </div>
                        </div>
                        
                        <div id="${instanceId}-content-insights" class="tab-pane" style="display:none">
                            <div class="pane-header">
                                <h3>Security Insights</h3>
                                <div class="pane-description">Analysis of network activity patterns</div>
                            </div>
                            <div class="insights-container">
                                <div class="insight-section">
                                    <h4>Processes with Most Connections</h4>
                                    <div class="process-graph">
                                        ${createProcessConnectionGraph(sortedPids.slice(0, 5))}
                                    </div>
                                </div>
                                <div class="insight-section">
                                    <h4>External Communication</h4>
                                    <div class="external-connections">
                                        ${createExternalConnectionsInfo(establishedConnections)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="${instanceId}-content-security" class="tab-pane" style="display:none">
                            <div class="pane-header">
                                <h3>Security Operations Dashboard</h3>
                                <div class="pane-description">
                                    Comprehensive security view of network connections for SOC/CISO analysis
                                </div>
                            </div>
                            <div class="security-dashboard-container">
                                ${createSecurityDashboard(wanConnections)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="network-styles">
                <style>
                    ${getNetworkMonitorStyles()}
                    
                    /* Additional styles for cyber network map integration */
                    .cyber-network-map-container {
                        height: 100%;
                        min-height: 650px;
                        width: 100%;
                        border-radius: 8px;
                        overflow: hidden;
                        margin-bottom: 20px;
                    }
                    
                    .subtab-pane .cyber-network-map-container {
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    }
                    
                    .subtab-pane .cn-grid-container {
                        height: 700px;
                    }
                    
                    /* Ensure map container is visible */
                    #${instanceId}-subcontent-wan {
                        height: auto;
                        min-height: 750px;
                    }
                    
                    /* Security dashboard styles */
                    .security-dashboard-container {
                        padding: 20px;
                        background: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    }
                    
                    .security-icon {
                        color: #ef4444;
                    }
                    
                    /* Risk level legend styles */
                    .risk-level-legend {
                        position: absolute;
                        bottom: 20px;
                        left: 20px;
                        background: rgba(255, 255, 255, 0.9);
                        padding: 10px;
                        border-radius: 6px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        z-index: 100;
                        font-size: 12px;
                        min-width: 120px;
                    }
                    
                    .legend-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                        text-align: center;
                    }
                    
                    .legend-item {
                        display: flex;
                        align-items: center;
                        margin: 4px 0;
                    }
                    
                    .legend-color {
                        display: inline-block;
                        width: 14px;
                        height: 14px;
                        border-radius: 50%;
                        margin-right: 8px;
                    }
                    
                    .legend-color.high-risk {
                        background-color: rgb(239, 68, 68);
                    }
                    
                    .legend-color.medium-risk {
                        background-color: rgb(249, 115, 22);
                    }
                    
                    .legend-color.low-risk {
                        background-color: rgb(16, 185, 129);
                    }
                    
                    /* Override styles to match the original look */
                    .cn-data-panel {
                        background: #f8fafc;
                    }
                    
                    .cn-external-domain {
                        background: #ffffff;
                        border-radius: 6px;
                        border-left-width: 3px;
                    }
                    
                    .cn-domain-name {
                        color: #334155;
                    }
                    
                    .cn-domain-info {
                        color: #64748b;
                    }
                    
                    .cn-location {
                        color: #0369a1;
                    }
                    
                    .cn-ports {
                        color: #64748b;
                    }
                    
                    .cn-hostname {
                        color: #4b5563;
                    }
                    
                    .cn-processes {
                        color: #4b5563;
                    }
                </style>
            </div>
        </div>
    `;
}

// Initialize the NetworkMonitor object for UI interactions
if (typeof window !== 'undefined') {
    window.NetworkMonitor = NetworkMonitorUI;
    
    // Initialize tabs when the DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Find all network monitors and initialize them
        document.querySelectorAll('.network-tabs').forEach(tabContainer => {
            const instanceId = tabContainer.id;
            if (instanceId) {
                NetworkMonitorUI.initTabs(instanceId);
            }
        });
        
        // Directly trigger IP enhancement after a longer delay to ensure map is loaded
        setTimeout(() => {
            console.log('Initial IP enhancement after page load');
            if (NetworkMonitorUI.enhanceIPDetails) {
                NetworkMonitorUI.enhanceIPDetails();
            }
        }, 2500); // Increased delay from 1000ms to 2500ms
    });
    
    // Debug function - can be called from the console to test the IP info API
    window.testIPInfo = async function(ip = '8.8.8.8') {
        console.log(`Testing IP info API with IP: ${ip}`);
        try {
            const result = await IPInfoManager.getIPInfo(ip);
            console.log('IP info result:', result);
            return result;
        } catch (error) {
            console.error('Error testing IP info:', error);
            return null;
        }
    }; 
}

// Export the network visualization functions for external use
export { createNetworkConnectionsVisual, createCyberNetworkMap, enhanceConnectionsIPData }; 