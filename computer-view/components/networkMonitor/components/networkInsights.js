/**
 * Network Insights Component
 * Provides visualizations and insights about network connections
 */

import { getRiskLevel } from '../utils/connectionUtils.js';
import { isPrivateIP } from '../utils/ipUtils.js';

/**
 * Creates a visualization of processes with the most connections
 * @param {Array} pidEntries - Array of [pid, stats] entries
 * @returns {string} HTML string for the process graph
 */
function createProcessConnectionGraph(pidEntries) {
    if (pidEntries.length === 0) return '<div class="empty-state">No process data available</div>';
    
    // Sort by process name (if available) rather than just connection count
    pidEntries.sort((a, b) => {
        const nameA = a[1].name || '';
        const nameB = b[1].name || '';
        
        // If process names are the same or not available, fallback to connection count (descending)
        if (nameA === nameB) {
            return b[1].count - a[1].count;
        }
        
        return nameA.localeCompare(nameB);
    });
    
    // Find max count for scaling
    const maxCount = Math.max(...pidEntries.map(entry => entry[1].count));
    
    let html = '';
    
    pidEntries.forEach(entry => {
        const pid = entry[0];
        const stats = entry[1];
        const listenWidth = (stats.listen / maxCount) * 100;
        const establishedWidth = (stats.established / maxCount) * 100;
        const udpWidth = (stats.udp / maxCount) * 100;
        const otherWidth = (stats.other / maxCount) * 100;
        
        html += `
            <div class="process-bar">
                <div class="process-pid">${pid}${stats.name ? `<div class="process-name">${stats.name}</div>` : ''}</div>
                <div class="bar-container">
                    <div class="bar-segment bar-listen" style="width: ${listenWidth}%"></div>
                    <div class="bar-segment bar-established" style="left: ${listenWidth}%; width: ${establishedWidth}%"></div>
                    <div class="bar-segment bar-udp" style="left: ${listenWidth + establishedWidth}%; width: ${udpWidth}%"></div>
                    <div class="bar-segment bar-other" style="left: ${listenWidth + establishedWidth + udpWidth}%; width: ${otherWidth}%"></div>
                </div>
                <div class="connection-count">${stats.count}</div>
            </div>
        `;
    });
    
    return html;
}

/**
 * Creates information about external connections
 * @param {Array} connections - Array of established connections
 * @returns {string} HTML string for external connections info
 */
function createExternalConnectionsInfo(connections) {
    if (connections.length === 0) return '<div class="empty-state">No external connections found</div>';
    
    // Group connections by domain/IP
    const domains = new Map();
    
    connections.forEach(conn => {
        // Skip local connections
        if (isPrivateIP(conn.peerAddress)) {
            return;
        }
        
        if (!domains.has(conn.peerAddress)) {
            domains.set(conn.peerAddress, {
                count: 0,
                ports: new Set(),
                risk: getRiskLevel(conn.peerPort)
            });
        }
        
        const domain = domains.get(conn.peerAddress);
        domain.count++;
        domain.ports.add(conn.peerPort);
        
        // Update risk level if this connection has higher risk
        const connRisk = getRiskLevel(conn.peerPort);
        if (connRisk === 'high') {
            domain.risk = 'high';
        } else if (connRisk === 'medium' && domain.risk !== 'high') {
            domain.risk = 'medium';
        }
    });
    
    // Convert to array and sort by count
    const sortedDomains = Array.from(domains.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 8); // Limit to 8 domains
    
    let html = '';
    
    sortedDomains.forEach(([address, info]) => {
        html += `
            <div class="external-domain">
                <div class="domain-name">
                    <span class="risk-indicator risk-${info.risk}"></span>
                    ${address}
                </div>
                <div class="domain-info">
                    <span>${info.count} connection${info.count !== 1 ? 's' : ''}</span>
                    <span>${Array.from(info.ports).join(', ')}</span>
                </div>
            </div>
        `;
    });
    
    return html;
}

export {
    createProcessConnectionGraph,
    createExternalConnectionsInfo
}; 