/**
 * UDP Connections Table Component
 * Displays a table of UDP network connections
 */

import { findProcessNameByPid, getPortClass } from '../utils/connectionUtils.js';
import { isPrivateIP } from '../utils/ipUtils.js';

/**
 * Creates a table for UDP connections
 * @param {Array} connections - Array of UDP connections
 * @param {Array} [processesList] - Optional array of process objects for name lookup
 * @returns {string} HTML string for the table
 */
function createUdpConnectionsTable(connections, processesList = []) {
    // Filter out passive bindings without specific destinations
    const activeConnections = connections.filter(conn => 
        (conn.peerAddress && conn.peerAddress !== '0.0.0.0' && conn.peerAddress !== '*') && 
        (conn.peerPort && conn.peerPort !== '*')
    );
    
    if (activeConnections.length === 0) return '<div class="empty-state">No active UDP connections found</div>';
    
    // Consolidate connections by process name
    const processMaps = new Map();
    
    activeConnections.forEach(conn => {
        const processName = findProcessNameByPid(processesList, conn.pid) || `PID ${conn.pid}`;
        
        if (!processMaps.has(processName)) {
            processMaps.set(processName, {
                processName: processName,
                pids: new Set([conn.pid]),
                connections: [],
                localPorts: new Map() // Group first by local port
            });
        }
        
        const processInfo = processMaps.get(processName);
        processInfo.pids.add(conn.pid);
        
        // Group first by local port
        const localPortKey = conn.localPort.toString();
        if (!processInfo.localPorts.has(localPortKey)) {
            processInfo.localPorts.set(localPortKey, {
                remoteHosts: new Map(),
                portClass: getPortClass(conn.localPort)
            });
        }
        
        const localPortInfo = processInfo.localPorts.get(localPortKey);
        
        // Then by remote host
        if (!localPortInfo.remoteHosts.has(conn.peerAddress)) {
            localPortInfo.remoteHosts.set(conn.peerAddress, new Set());
        }
        
        // Add remote port
        localPortInfo.remoteHosts.get(conn.peerAddress).add(conn.peerPort);
        
        // Keep original connection for reference
        processInfo.connections.push(conn);
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
        
        // Format by local ports
        const connectionsHtml = Array.from(process.localPorts.entries()).map(([localPort, info]) => {
            const remoteHostsHtml = Array.from(info.remoteHosts.entries()).map(([host, ports]) => {
                // Sort ports numerically
                const sortedPorts = Array.from(ports).sort((a, b) => a - b);
                
                // Format ports 
                const portsStr = sortedPorts.length <= 5 
                    ? sortedPorts.join(', ')
                    : `${sortedPorts.slice(0, 3).join(', ')}... +${sortedPorts.length - 3} more`;
                
                // Determine if the IP is private/local
                const isLocal = isPrivateIP(host);
                const ipTypeTag = isLocal 
                    ? '<span class="ip-tag local-ip" title="Local/Private Network">LAN</span>'
                    : '<span class="ip-tag public-ip" title="Public Internet">WAN</span>';
                
                return `<div class="remote-endpoint">
                    ${ipTypeTag}
                    <span class="remote-host-name">${host}</span>: 
                    <span class="remote-port-list">${portsStr}</span>
                </div>`;
            }).join('');
            
            return `
                <div class="local-port-group">
                    <div class="local-port-tag ${info.portClass}">${localPort}</div>
                    <div class="arrow-icon">→</div>
                    <div class="remote-hosts-container">${remoteHostsHtml}</div>
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
            .local-port-group {
                display: flex;
                align-items: flex-start;
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 1px dashed #e2e8f0;
            }
            .local-port-group:last-child {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }
            .local-port-tag {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                color: white;
                min-width: 50px;
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
            .arrow-icon {
                margin: 0 10px;
                color: #64748b;
                font-weight: 600;
                font-size: 14px;
            }
            .remote-hosts-container {
                display: flex;
                flex-direction: column;
                gap: 4px;
                flex: 1;
            }
            .remote-endpoint {
                font-size: 12px;
                color: #334155;
            }
            .remote-host-name {
                font-weight: 500;
            }
            .remote-port-list {
                color: #64748b;
                font-family: monospace;
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
        </style>
    `;
    
    return html;
}

export default createUdpConnectionsTable; 