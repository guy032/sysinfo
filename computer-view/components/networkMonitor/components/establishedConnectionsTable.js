/**
 * Established Connections Table Component
 * Displays a table of established network connections
 */

import { findProcessNameByPid, getPortClass } from '../utils/connectionUtils.js';
import { isPrivateIP } from '../utils/ipUtils.js';
import { createSecurityBadge, generateSecurityDetailsHTML } from '../utils/securityUtils.js';

/**
 * Creates a table for established connections
 * @param {Array} connections - Array of ESTABLISHED state connections
 * @param {Array} [processesList] - Optional array of process objects for name lookup
 * @returns {string} HTML string for the table
 */
function createEstablishedConnectionsTable(connections, processesList = []) {
    if (connections.length === 0) return '<div class="empty-state">No established connections found</div>';
    
    // Consolidate connections by process name
    const processMaps = new Map();
    
    // Determine if we're showing WAN or LAN connections
    const isShowingWAN = !connections.some(conn => isPrivateIP(conn.peerAddress));
    
    connections.forEach(conn => {
        const processName = findProcessNameByPid(processesList, conn.pid) || `PID ${conn.pid}`;
        
        if (!processMaps.has(processName)) {
            processMaps.set(processName, {
                processName: processName,
                pids: new Set([conn.pid]),
                connections: [],
                remoteIPs: new Map() // Group first by remote IP
            });
        }
        
        const processInfo = processMaps.get(processName);
        processInfo.pids.add(conn.pid);
        
        // Group first by remote IP
        const remoteIP = conn.peerAddress;
        if (!processInfo.remoteIPs.has(remoteIP)) {
            processInfo.remoteIPs.set(remoteIP, {
                localPorts: new Map(),
                remotePorts: new Set(),
                isLocal: isPrivateIP(remoteIP),
                securityInfo: conn.securityInfo || null,
                riskLevel: conn.riskLevel || 'UNKNOWN',
                asOwner: conn.asOwner || null,
                threatDetections: conn.threatDetections || null
            });
        }
        
        const remoteIPInfo = processInfo.remoteIPs.get(remoteIP);
        
        // Then by local port
        const localPortKey = conn.localPort.toString();
        if (!remoteIPInfo.localPorts.has(localPortKey)) {
            remoteIPInfo.localPorts.set(localPortKey, {
                portClass: getPortClass(conn.localPort),
                remotePorts: new Set()
            });
        }
        
        // Add remote port to both collections
        remoteIPInfo.remotePorts.add(conn.peerPort);
        remoteIPInfo.localPorts.get(localPortKey).remotePorts.add(conn.peerPort);
        
        // Keep original connection for reference
        processInfo.connections.push(conn);
        
        // Update security info if this connection has more details
        if (conn.securityInfo && (!remoteIPInfo.securityInfo || 
            (remoteIPInfo.securityInfo.riskScore < conn.securityInfo.riskScore))) {
            remoteIPInfo.securityInfo = conn.securityInfo;
            remoteIPInfo.riskLevel = conn.riskLevel;
            remoteIPInfo.asOwner = conn.asOwner;
            remoteIPInfo.threatDetections = conn.threatDetections;
        }
    });
    
    // Convert to array and sort by process name
    const consolidatedProcesses = Array.from(processMaps.values());
    consolidatedProcesses.sort((a, b) => a.processName.localeCompare(b.processName));
    
    let html = `
        <table class="data-grid">
            <thead>
                <tr>
                    <th>Process</th>
                    <th>PIDs</th>
                    <th>Connections (Local Port → Remote Endpoints)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    consolidatedProcesses.forEach(process => {
        // Convert PIDs set to a formatted string
        const pidsDisplay = Array.from(process.pids).map(pid => 
            `<span class="pid-tag">${pid}</span>`
        ).join(' ');
        
        // Format by remote IPs
        const connectionsHtml = Array.from(process.remoteIPs.entries()).map(([remoteIP, info]) => {
            // Sort local ports numerically
            const sortedLocalPorts = Array.from(info.localPorts.keys()).sort((a, b) => parseInt(a) - parseInt(b));
            
            // Create a string of local ports with their classes
            const localPortsHtml = sortedLocalPorts.map(portKey => {
                const portInfo = info.localPorts.get(portKey);
                return `<span class="local-port-tag ${portInfo.portClass}">${portKey}</span>`;
            }).join(' ');
            
            // Format remote ports
            const remotePorts = Array.from(info.remotePorts).sort((a, b) => a - b);
            const remotePortsStr = remotePorts.length === 1 
                ? remotePorts[0]
                : `${remotePorts.join(', ')}`;
            
            // Create a unique ID for this host - only needed for WAN connections
            const hostIdAttr = isShowingWAN && !info.isLocal
                ? `id="ip-${remoteIP.replace(/\./g, '-')}" data-ip="${remoteIP}"`
                : '';
            
            // Generate security badge if available
            const securityBadge = info.riskLevel 
                ? createSecurityBadge(info.riskLevel)
                : '';
            
            // Show ASN/owner if available
            const asOwnerInfo = info.asOwner
                ? `<span class="as-owner-tag">${info.asOwner}</span>`
                : '';
            
            // Show threat detection counts if available
            const threatInfo = info.threatDetections && info.threatDetections.total > 0
                ? `<span class="threat-detection-tag">${info.threatDetections.total} detection${info.threatDetections.total > 1 ? 's' : ''}</span>`
                : '';
            
            // Generate security details HTML
            const securityDetailsHTML = info.securityInfo
                ? generateSecurityDetailsHTML(info.securityInfo)
                : '<div class="security-info-missing">No security information available</div>';
            
            // Only add IP details container for WAN connections
            const detailsContainer = isShowingWAN && !info.isLocal
                ? `
                <div class="ip-details-container" style="display:block;">
                    <div class="ip-metadata">
                        ${securityBadge}
                        ${asOwnerInfo}
                        ${threatInfo}
                    </div>
                    <div class="security-details-wrapper">
                        ${securityDetailsHTML}
                    </div>
                </div>
                `
                : '';
            
            return `
                <div class="remote-endpoint-group">
                    <div class="remote-endpoint" ${hostIdAttr}>
                        <div class="remote-host-info">
                            <span class="remote-host-name">${remoteIP}</span>
                            <span class="remote-port-list">: ${remotePortsStr}</span>
                        </div>
                        <div class="local-ports-container">
                            <span class="from-ports-label">From ports:</span> ${localPortsHtml}
                        </div>
                        ${detailsContainer}
                    </div>
                </div>
            `;
        }).join('');
        
        html += `
            <tr>
                <td class="process-name-cell">${process.processName}</td>
                <td class="pids-cell">${pidsDisplay}</td>
                <td class="connections-cell">${connectionsHtml}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <style>
            .data-grid {
                width: 100%;
                border-collapse: collapse;
            }
            .data-grid tbody {
                display: block;
                overflow-y: auto;
                max-height: 50vh;
            }
            .data-grid thead {
                display: table;
                width: 100%;
                table-layout: fixed;
            }
            .data-grid thead tr, .data-grid tbody tr {
                display: table;
                width: 100%;
                table-layout: fixed;
            }
            .data-grid th {
                text-align: left;
                padding: 12px 15px;
                background: #f1f5f9;
                color: #334155;
                font-weight: 600;
                position: sticky;
                top: 0;
                z-index: 1;
                border-bottom: 1px solid #e2e8f0;
            }
            .data-grid td {
                padding: 10px 15px;
                border-bottom: 1px solid #e2e8f0;
                color: #1e293b;
            }
            .data-grid td:first-child {
                max-width: 250px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .data-grid td:first-child:hover {
                white-space: normal;
                word-break: break-all;
            }
            .data-grid tbody tr {
                transition: background 0.2s;
            }
            .data-grid tbody tr:hover {
                background: #f8fafc;
            }
            .remote-endpoint-group {
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 1px dashed #e2e8f0;
            }
            .remote-endpoint-group:last-child {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }
            .remote-endpoint {
                font-size: 12px;
                color: #334155;
                position: relative;
            }
            .remote-host-info {
                margin-bottom: 4px;
            }
            .remote-host-name {
                font-weight: 500;
            }
            .remote-port-list {
                color: #64748b;
                font-family: monospace;
            }
            .local-ports-container {
                margin-top: 4px;
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 5px;
            }
            .from-ports-label {
                color: #64748b;
                font-size: 11px;
                margin-right: 5px;
            }
            .local-port-tag {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                color: white;
                min-width: 40px;
                text-align: center;
                font-family: monospace;
            }
            .port-well-known {
                background: #3b82f6;
                color: white;
            }
            .port-registered {
                background: #0891b2;
                color: white;
            }
            .port-dynamic {
                background: #64748b;
                color: white;
            }
            .port-danger {
                background: #ef4444;
                color: white;
            }
            .ip-tag {
                display: inline-block;
                padding: 1px 4px;
                border-radius: 3px;
                font-size: 9px;
                font-weight: 600;
                margin-right: 4px;
                vertical-align: middle;
            }
            .local-ip {
                background: #3b82f6;
                color: white;
            }
            .public-ip {
                background: #ef4444;
                color: white;
            }
            .ip-details-container {
                margin-top: 8px;
                font-size: 12px;
                color: #334155;
                background: #f8fafc;
                padding: 8px 10px;
                border-radius: 6px;
                border-left: 3px solid #3b82f6;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                animation: fadeIn 0.3s ease-in-out;
            }
            .ip-metadata {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 8px;
            }
            .as-owner-tag {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                background: #e2e8f0;
                color: #334155;
            }
            .threat-detection-tag {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                background: #fee2e2;
                color: #b91c1c;
                font-weight: 600;
            }
            .security-details-wrapper {
                margin-top: 10px;
            }
            .security-info-missing {
                color: #64748b;
                font-style: italic;
                padding: 8px;
                background: #f1f5f9;
                border-radius: 4px;
            }
            .pid-tag {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                background: #f1f5f9;
                color: #334155;
                margin-right: 4px;
            }
        </style>
    `;
    
    return html;
}

export default createEstablishedConnectionsTable; 