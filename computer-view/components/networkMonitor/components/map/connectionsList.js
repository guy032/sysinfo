/**
 * Connections List Module
 * Handles generating the connections list for the sidebar
 */

import { isPrivateIP } from '../../utils/ipUtils.js';
import { getRiskLevel } from '../../utils/connectionUtils.js';

/**
 * Group connections by IP address
 * @param {Array} connections - Array of network connections
 * @returns {Object} Object with IP addresses as keys and connection details as values
 */
function groupConnectionsByIp(connections) {
    const ipMap = new Map();
    
    connections.forEach(conn => {
        // Skip local connections
        if (isPrivateIP(conn.peerAddress)) {
            return;
        }
        
        if (!ipMap.has(conn.peerAddress)) {
            ipMap.set(conn.peerAddress, {
                count: 0,
                ports: new Set(),
                risk: getRiskLevel(conn.peerPort),
                pids: new Set(),
                processes: new Map()
            });
        }
        
        const ipInfo = ipMap.get(conn.peerAddress);
        ipInfo.count++;
        ipInfo.ports.add(conn.peerPort);
        
        // Track PIDs and process names
        if (conn.pid) {
            ipInfo.pids.add(conn.pid);
            if (conn.processName && !ipInfo.processes.has(conn.pid)) {
                ipInfo.processes.set(conn.pid, conn.processName);
            }
        }
        
        // Update risk level if this connection has higher risk
        const connRisk = getRiskLevel(conn.peerPort);
        if (connRisk === 'high') {
            ipInfo.risk = 'high';
        } else if (connRisk === 'medium' && ipInfo.risk !== 'high') {
            ipInfo.risk = 'medium';
        }
    });
    
    return Object.fromEntries(ipMap);
}

/**
 * Gets risk label based on risk level
 * @param {string} risk - Risk level (low, medium, high, clean)
 * @returns {string} Risk label for display
 */
function getRiskLabel(risk) {
    switch (risk) {
        case 'high': return 'HIGH';
        case 'medium': return 'MEDIUM';
        case 'low': return 'LOW';
        case 'clean': return 'CLEAN';
        default: return 'UNKNOWN';
    }
}

/**
 * Generates HTML for external connections info display
 * @param {Object} connectionsByIp - Connections grouped by IP
 * @returns {string} HTML for external connections
 */
function generateExternalConnectionsInfo(connectionsByIp) {
    if (Object.keys(connectionsByIp).length === 0) {
        return '<div class="cn-empty-state">No external connections found</div>';
    }
    
    // Sort IPs by connection count
    const sortedIps = Object.entries(connectionsByIp)
        .sort((a, b) => b[1].count - a[1].count);
    
    let html = '';
    
    sortedIps.forEach(([ip, info]) => {
        const ports = Array.from(info.ports).sort((a, b) => a - b).join(', ');
        
        // Get process names if available
        const processNames = info.processes ? 
            Array.from(info.processes.values()).filter(Boolean) : [];
        
        const hostname = info.hostname ? info.hostname : '';
        const location = info.location ? info.location : 'Unknown Location';
        const asn = info.asn ? info.asn : '';
        
        // Determine risk level - prefer security risk level from VirusTotal if available
        let riskLevel = info.risk; // Default from port-based determination
        let riskBadge = '';
        let securityDetails = '';
        
        // Get risk level and badge from security info if available
        if (info.securityInfo) {
            riskLevel = info.securityInfo.riskLevel.toLowerCase();
            
            // Create security risk badge
            riskBadge = `<span class="cn-risk-badge ${riskLevel}-risk">${info.securityInfo.riskLevel}</span>`;
            
            // Add security details if we have malicious/suspicious detections
            if (info.securityInfo.maliciousCount > 0 || info.securityInfo.suspiciousCount > 0) {
                securityDetails = `
                    <div class="cn-security-details">
                        ${info.securityInfo.maliciousCount > 0 ? 
                            `<span class="cn-detection malicious">⚠️ ${info.securityInfo.maliciousCount} Malicious</span>` : ''}
                        ${info.securityInfo.suspiciousCount > 0 ? 
                            `<span class="cn-detection suspicious">⚠️ ${info.securityInfo.suspiciousCount} Suspicious</span>` : ''}
                    </div>
                `;
            }
        }
        
        // Use asOwner from VirusTotal if available
        const ownerInfo = info.asOwner || asn;
        
        html += `
            <div class="cn-external-domain risk-${riskLevel}" data-ip="${ip}" onclick="flyToConnectionMarker('${ip}')">
                <div class="cn-domain-header">
                    <span class="cn-domain-name">${ip}</span>
                    <div class="cn-domain-badges">
                        <span class="cn-connection-count">${info.count}</span>
                        ${riskBadge}
                    </div>
                </div>
                ${securityDetails}
                <div class="cn-domain-info">
                    ${location ? `<div class="cn-location"><i class="cn-icon">📍</i> ${location}</div>` : ''}
                    ${hostname ? `<div class="cn-hostname"><i class="cn-icon">🌐</i> ${hostname}</div>` : ''}
                    ${processNames.length > 0 ? 
                        `<div class="cn-processes"><i class="cn-icon">⚙️</i> ${processNames.join(', ')}</div>` : ''}
                    ${ownerInfo ? `<div class="cn-asn"><i class="cn-icon">🔌</i> ${ownerInfo}</div>` : ''}
                    <div class="cn-ports"><i class="cn-icon">🚪</i> Ports: ${ports}</div>
                    <div class="cn-risk-level"><i class="cn-icon">⚠️</i> Risk: ${getRiskLabel(riskLevel)}</div>
                </div>
            </div>
        `;
    });
    
    return html + `
        <style>
            .cn-domain-badges {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .cn-risk-badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                color: white;
            }
            
            .cn-risk-badge.high-risk {
                background-color: #ef4444;
            }
            
            .cn-risk-badge.medium-risk {
                background-color: #f59e0b;
            }
            
            .cn-risk-badge.low-risk {
                background-color: #10b981;
            }
            
            .cn-risk-badge.clean-risk {
                background-color: #22c55e;
            }
            
            .cn-security-details {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin: 5px 0 8px 0;
                padding: 5px;
                background: rgba(0, 0, 0, 0.03);
                border-radius: 4px;
            }
            
            .cn-detection {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
            }
            
            .cn-detection.malicious {
                background: rgba(239, 68, 68, 0.15);
                color: #b91c1c;
            }
            
            .cn-detection.suspicious {
                background: rgba(249, 115, 22, 0.15);
                color: #c2410c;
            }
            
            .cn-threat-high {
                color: #ef4444 !important;
                font-weight: bold !important;
            }
            
            .cn-threat-medium {
                color: #f59e0b !important;
                font-weight: bold !important;
            }
            
            .cn-threat-low {
                color: #10b981 !important;
                font-weight: bold !important;
            }
        </style>
    `;
}

/**
 * Generates table rows for the fallback view
 * @param {Object} connectionsByIp - Connections grouped by IP address
 * @returns {string} HTML for table rows
 */
function generateFallbackTableRows(connectionsByIp) {
    if (Object.keys(connectionsByIp).length === 0) {
        return '<tr><td colspan="5" style="text-align: center;">No connections found</td></tr>';
    }
    
    // Sort IPs by connection count
    const sortedIps = Object.entries(connectionsByIp)
        .sort((a, b) => b[1].count - a[1].count);
    
    return sortedIps.map(([ip, info]) => {
        const ports = Array.from(info.ports).sort((a, b) => a - b);
        const portsHtml = ports.map(port => 
            `<span class="fallback-port ${getRiskLevel(port) === 'high' ? 'high-risk' : 
              (getRiskLevel(port) === 'medium' ? 'medium-risk' : '')}">${port}</span>`
        ).join('');
        
        return `
            <tr>
                <td>${ip}</td>
                <td>${info.location || 'Unknown'}</td>
                <td><div class="fallback-ports">${portsHtml}</div></td>
                <td>${info.count}</td>
                <td class="risk-${info.risk}">${getRiskLabel(info.risk)}</td>
            </tr>
        `;
    }).join('');
}

export { groupConnectionsByIp, generateExternalConnectionsInfo, generateFallbackTableRows, getRiskLabel }; 