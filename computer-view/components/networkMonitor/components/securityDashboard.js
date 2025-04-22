/**
 * Security Dashboard Component
 * Provides a high-level view of network security status for CISO/SOC analysis
 */

import { generateSecuritySummary, createSecurityDashboardHTML } from '../utils/securityUtils.js';

/**
 * Creates a security dashboard with threat intelligence from VirusTotal
 * @param {Array} connections - Array of network connections
 * @returns {string} HTML string for the security dashboard
 */
function createSecurityDashboard(connections) {
    if (!connections || connections.length === 0) {
        return '<div class="empty-state">No connection data available for security analysis</div>';
    }
    
    // Generate security summary from connections
    const securitySummary = generateSecuritySummary(connections);
    
    // Create dashboard HTML
    return createSecurityDashboardHTML(securitySummary);
}

export default createSecurityDashboard; 