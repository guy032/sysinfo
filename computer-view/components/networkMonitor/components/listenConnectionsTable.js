/**
 * Listen Connections Table Component
 * Displays a table of listening network connections
 */

import { findProcessNameByPid, getPortClass } from '../utils/connectionUtils.js';

/**
 * Creates a table for listening connections
 * @param {Array} connections - Array of LISTEN state connections
 * @param {Array} [processesList] - Optional array of process objects for name lookup
 * @returns {string} HTML string for the table
 */
function createListenConnectionsTable(connections, processesList = []) {
    if (connections.length === 0) return '<div class="empty-state">No listening connections found</div>';
    
    // Consolidate connections by process name
    const processMaps = new Map();
    
    connections.forEach(conn => {
        const processName = findProcessNameByPid(processesList, conn.pid) || `PID ${conn.pid}`;
        
        if (!processMaps.has(processName)) {
            processMaps.set(processName, {
                processName: processName,
                pids: new Set([conn.pid]),
                ports: new Map(), // Map ports to their interfaces
                connections: []
            });
        }
        
        const processInfo = processMaps.get(processName);
        processInfo.pids.add(conn.pid);
        
        // Track ports and their interfaces (reverse mapping from before)
        if (!processInfo.ports.has(conn.localPort)) {
            processInfo.ports.set(conn.localPort, new Set());
        }
        processInfo.ports.get(conn.localPort).add(conn.localAddress);
        
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
                    <th>Ports (Addresses)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    consolidatedProcesses.forEach(process => {
        // Group ports by their interface sets (to find ports that share the same interfaces)
        const interfaceSets = new Map();
        
        // First, collect all unique interface combinations
        process.ports.forEach((interfaces, port) => {
            const interfaceKey = Array.from(interfaces).sort().join(',');
            if (!interfaceSets.has(interfaceKey)) {
                interfaceSets.set(interfaceKey, {
                    interfaces: Array.from(interfaces).sort(),
                    ports: []
                });
            }
            interfaceSets.get(interfaceKey).ports.push(port);
        });
        
        // Sort interface groups by the first interface in each group
        const sortedInterfaceSets = Array.from(interfaceSets.values())
            .sort((a, b) => {
                // Sort 0.0.0.0 first, then IPv4, then IPv6
                const interfaceA = a.interfaces[0];
                const interfaceB = b.interfaces[0];
                
                if (interfaceA === '0.0.0.0') return -1;
                if (interfaceB === '0.0.0.0') return 1;
                if (interfaceA.includes(':') && !interfaceB.includes(':')) return 1;
                if (!interfaceA.includes(':') && interfaceB.includes(':')) return -1;
                return interfaceA.localeCompare(interfaceB);
            });
        
        // Convert interface sets to HTML
        const interfacesDisplay = sortedInterfaceSets.map(interfaceSet => {
            // Sort ports numerically
            const sortedPorts = interfaceSet.ports.sort((a, b) => a - b);
            
            // Create port tags
            const portsHtml = sortedPorts.map(port => {
                const portClass = getPortClass(port);
                return `<span class="port-tag ${portClass}">${port}</span>`;
            }).join('');
            
            // Format interfaces list
            let interfacesLabel = interfaceSet.interfaces.join(', ');
            if (interfaceSet.interfaces.length > 3) {
                interfacesLabel = `${interfaceSet.interfaces.slice(0, 2).join(', ')} +${interfaceSet.interfaces.length - 2} more`;
            }
            
            return `
                <div class="interface-group">
                    <div class="interface-address">${interfacesLabel}</div>
                    <div class="ports-container">${portsHtml}</div>
                </div>
            `;
        }).join('');
        
        // Convert PIDs set to a formatted string
        const pidsDisplay = Array.from(process.pids).map(pid => 
            `<span class="pid-tag">${pid}</span>`
        ).join(' ');
        
        html += `
            <tr>
                <td class="process-name-cell">${process.processName}</td>
                <td class="pids-cell">${pidsDisplay}</td>
                <td class="interfaces-cell">${interfacesDisplay}</td>
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
            .pids-cell {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }
            .process-name-cell {
                font-weight: 500;
            }
            .interface-group {
                margin-bottom: 10px;
            }
            .interface-address {
                font-size: 12px;
                color: #64748b;
                margin-bottom: 4px;
            }
            .ports-container {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                max-width: 100%;
            }
            .port-tag {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                text-align: center;
                min-width: 60px;
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
        </style>
    `;
    
    return html;
}

export default createListenConnectionsTable; 