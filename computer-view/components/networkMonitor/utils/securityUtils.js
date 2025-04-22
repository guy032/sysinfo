/**
 * Security Utilities
 * Helper functions for security-related display and assessment
 */

/**
 * Get CSS class for a risk level
 * @param {string} riskLevel - Risk level (HIGH, MEDIUM, LOW, CLEAN, UNKNOWN, INTERNAL)
 * @returns {string} CSS class name for the risk level
 */
function getRiskLevelClass(riskLevel) {
    switch (riskLevel) {
        case 'HIGH':
            return 'risk-high';
        case 'MEDIUM':
            return 'risk-medium';
        case 'LOW':
            return 'risk-low';
        case 'CLEAN':
            return 'risk-clean';
        case 'INTERNAL':
            return 'risk-internal';
        case 'UNKNOWN':
        default:
            return 'risk-unknown';
    }
}

/**
 * Get human-readable color for a risk level
 * @param {string} riskLevel - Risk level (HIGH, MEDIUM, LOW, CLEAN, UNKNOWN, INTERNAL)
 * @returns {string} Color name for the risk level
 */
function getRiskLevelColor(riskLevel) {
    switch (riskLevel) {
        case 'HIGH':
            return 'red';
        case 'MEDIUM':
            return 'orange';
        case 'LOW':
            return 'yellow';
        case 'CLEAN':
            return 'green';
        case 'INTERNAL':
            return 'blue';
        case 'UNKNOWN':
        default:
            return 'gray';
    }
}

/**
 * Create HTML security badge for risk level
 * @param {string} riskLevel - Risk level (HIGH, MEDIUM, LOW, CLEAN, UNKNOWN, INTERNAL)
 * @returns {string} HTML for security badge
 */
function createSecurityBadge(riskLevel) {
    return `<span class="security-badge ${getRiskLevelClass(riskLevel)}">${riskLevel}</span>`;
}

/**
 * Generate HTML for detailed security information
 * @param {Object} securityInfo - Security information object
 * @returns {string} HTML string with security details
 */
function generateSecurityDetailsHTML(securityInfo) {
    if (!securityInfo) {
        return '<div class="security-info-missing">No security information available</div>';
    }

    const { 
        riskLevel, 
        riskScore, 
        maliciousCount, 
        suspiciousCount, 
        harmlessCount, 
        undetectedCount,
        asOwner,
        detectionDetails,
        securityNotes
    } = securityInfo;

    // Create detection details HTML
    let detectionDetailsHTML = '';
    if (detectionDetails && detectionDetails.length > 0) {
        detectionDetailsHTML = `
            <div class="detection-details">
                <h4>Detection Details</h4>
                <ul class="detection-list">
                    ${detectionDetails.map(d => `
                        <li class="detection-item">
                            <span class="detection-engine">${d.engine}</span>: 
                            <span class="detection-category ${d.category === 'malicious' ? 'category-malicious' : 'category-suspicious'}">${d.category}</span>
                            ${d.result ? `- <span class="detection-result">${d.result}</span>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Create security notes HTML
    let securityNotesHTML = '';
    if (securityNotes && securityNotes.length > 0) {
        securityNotesHTML = `
            <div class="security-notes">
                <h4>Security Insights</h4>
                <ul class="notes-list">
                    ${securityNotes.map(note => `<li class="note-item">${note}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Create scan summary HTML
    const totalEngines = maliciousCount + suspiciousCount + harmlessCount + undetectedCount;
    const scanSummaryHTML = totalEngines > 0 ? `
        <div class="scan-summary">
            <h4>Scan Summary</h4>
            <div class="scan-stats">
                <div class="stat-item stat-malicious">
                    <span class="stat-value">${maliciousCount}</span>
                    <span class="stat-label">Malicious</span>
                </div>
                <div class="stat-item stat-suspicious">
                    <span class="stat-value">${suspiciousCount}</span>
                    <span class="stat-label">Suspicious</span>
                </div>
                <div class="stat-item stat-harmless">
                    <span class="stat-value">${harmlessCount}</span>
                    <span class="stat-label">Harmless</span>
                </div>
                <div class="stat-item stat-undetected">
                    <span class="stat-value">${undetectedCount}</span>
                    <span class="stat-label">Undetected</span>
                </div>
            </div>
        </div>
    ` : '';

    return `
        <div class="security-details">
            <div class="security-summary">
                <div class="risk-indicator">
                    <div class="risk-level ${getRiskLevelClass(riskLevel)}">
                        <span class="risk-label">Risk</span>
                        <span class="risk-value">${riskLevel}</span>
                    </div>
                    ${riskScore > 0 ? `<div class="risk-score">Score: ${riskScore}/100</div>` : ''}
                </div>
                ${asOwner ? `<div class="as-owner">Owner: <span class="owner-value">${asOwner}</span></div>` : ''}
            </div>
            
            ${scanSummaryHTML}
            ${detectionDetailsHTML}
            ${securityNotesHTML}
            
            <div class="security-footer">
                <div class="powered-by">Data powered by VirusTotal</div>
            </div>
        </div>
        <style>
            .security-details {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                padding: 10px;
                border-radius: 6px;
                background: #f8fafc;
                color: #334155;
                margin-top: 10px;
            }
            
            .security-summary {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
            }
            
            .risk-indicator {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .risk-level {
                display: flex;
                flex-direction: column;
                padding: 6px 10px;
                border-radius: 6px;
                font-weight: 600;
            }
            
            .risk-label {
                font-size: 10px;
                text-transform: uppercase;
                opacity: 0.7;
            }
            
            .risk-value {
                font-size: 16px;
            }
            
            .risk-high {
                background-color: #fee2e2;
                color: #b91c1c;
            }
            
            .risk-medium {
                background-color: #ffedd5;
                color: #c2410c;
            }
            
            .risk-low {
                background-color: #fef9c3;
                color: #854d0e;
            }
            
            .risk-clean {
                background-color: #dcfce7;
                color: #166534;
            }
            
            .risk-internal {
                background-color: #dbeafe;
                color: #1e40af;
            }
            
            .risk-unknown {
                background-color: #f3f4f6;
                color: #4b5563;
            }
            
            .risk-score {
                font-size: 14px;
                color: #64748b;
                font-weight: 500;
            }
            
            .as-owner {
                font-size: 13px;
                color: #475569;
            }
            
            .owner-value {
                font-weight: 500;
                color: #334155;
            }
            
            .scan-summary, .detection-details, .security-notes {
                margin-bottom: 15px;
                border-top: 1px solid #e2e8f0;
                padding-top: 12px;
            }
            
            .scan-summary h4, .detection-details h4, .security-notes h4 {
                font-size: 13px;
                margin: 0 0 8px 0;
                color: #334155;
                font-weight: 600;
            }
            
            .scan-stats {
                display: flex;
                gap: 10px;
            }
            
            .stat-item {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px;
                border-radius: 6px;
                background: #fff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            
            .stat-value {
                font-size: 18px;
                font-weight: 600;
            }
            
            .stat-label {
                font-size: 10px;
                text-transform: uppercase;
                color: #64748b;
            }
            
            .stat-malicious .stat-value {
                color: #dc2626;
            }
            
            .stat-suspicious .stat-value {
                color: #ea580c;
            }
            
            .stat-harmless .stat-value {
                color: #16a34a;
            }
            
            .stat-undetected .stat-value {
                color: #6b7280;
            }
            
            .detection-list, .notes-list {
                margin: 0;
                padding: 0;
                list-style: none;
                font-size: 12px;
            }
            
            .detection-item, .note-item {
                margin-bottom: 6px;
                padding-bottom: 6px;
                border-bottom: 1px dashed #e2e8f0;
            }
            
            .detection-item:last-child, .note-item:last-child {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }
            
            .detection-engine {
                font-weight: 600;
            }
            
            .category-malicious {
                color: #dc2626;
                font-weight: 500;
            }
            
            .category-suspicious {
                color: #ea580c;
                font-weight: 500;
            }
            
            .security-footer {
                margin-top: 12px;
                text-align: right;
                font-size: 10px;
                color: #94a3b8;
            }
            
            .security-badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: 600;
                color: white;
            }
        </style>
    `;
}

/**
 * Generate a security summary for CISO/SOC view
 * @param {Array} connections - Array of network connections
 * @returns {Object} Security summary statistics
 */
function generateSecuritySummary(connections) {
    // Filter to only analyze public connections
    const publicConnections = connections.filter(conn => 
        conn.securityInfo && conn.securityInfo.riskLevel !== 'INTERNAL'
    );
    
    if (publicConnections.length === 0) {
        return {
            totalPublicConnections: 0,
            riskLevels: {
                HIGH: 0,
                MEDIUM: 0,
                LOW: 0,
                CLEAN: 0,
                UNKNOWN: 0
            },
            totalMaliciousDetections: 0,
            totalSuspiciousDetections: 0,
            highRiskIPs: [],
            topDetectionEngines: {}
        };
    }
    
    // Count connections by risk level
    const riskLevels = {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
        CLEAN: 0,
        UNKNOWN: 0
    };
    
    let totalMaliciousDetections = 0;
    let totalSuspiciousDetections = 0;
    const highRiskIPs = [];
    const detectionEngines = {};
    
    // Process each connection
    publicConnections.forEach(conn => {
        const security = conn.securityInfo || {};
        
        // Count by risk level
        if (security.riskLevel) {
            riskLevels[security.riskLevel] = (riskLevels[security.riskLevel] || 0) + 1;
        }
        
        // Sum up detections
        totalMaliciousDetections += security.maliciousCount || 0;
        totalSuspiciousDetections += security.suspiciousCount || 0;
        
        // Track high risk IPs
        if (security.riskLevel === 'HIGH') {
            highRiskIPs.push({
                ip: conn.peerAddress,
                riskScore: security.riskScore,
                maliciousCount: security.maliciousCount,
                asOwner: security.asOwner
            });
        }
        
        // Track detection engines
        if (security.detectionDetails) {
            security.detectionDetails.forEach(detection => {
                if (!detectionEngines[detection.engine]) {
                    detectionEngines[detection.engine] = 0;
                }
                detectionEngines[detection.engine]++;
            });
        }
    });
    
    // Sort high risk IPs by risk score
    highRiskIPs.sort((a, b) => b.riskScore - a.riskScore);
    
    // Get top detection engines
    const topDetectionEngines = {};
    Object.entries(detectionEngines)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([engine, count]) => {
            topDetectionEngines[engine] = count;
        });
    
    return {
        totalPublicConnections: publicConnections.length,
        riskLevels,
        totalMaliciousDetections,
        totalSuspiciousDetections,
        highRiskIPs,
        topDetectionEngines
    };
}

/**
 * Create HTML for security dashboard
 * @param {Object} summary - Security summary object from generateSecuritySummary
 * @returns {string} HTML for security dashboard
 */
function createSecurityDashboardHTML(summary) {
    const {
        totalPublicConnections,
        riskLevels,
        totalMaliciousDetections,
        totalSuspiciousDetections,
        highRiskIPs,
        topDetectionEngines
    } = summary;
    
    // Create high risk IPs list
    let highRiskIPsHTML = '';
    if (highRiskIPs.length > 0) {
        highRiskIPsHTML = `
            <div class="high-risk-ips">
                <h3>High Risk IPs</h3>
                <ul class="high-risk-list">
                    ${highRiskIPs.map(ip => `
                        <li class="high-risk-item">
                            <span class="high-risk-ip">${ip.ip}</span>
                            <span class="high-risk-score">Score: ${ip.riskScore}</span>
                            <span class="high-risk-detections">Malicious: ${ip.maliciousCount}</span>
                            ${ip.asOwner ? `<span class="high-risk-owner">${ip.asOwner}</span>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    // Create top detection engines list
    let topEnginesHTML = '';
    if (Object.keys(topDetectionEngines).length > 0) {
        topEnginesHTML = `
            <div class="top-engines">
                <h3>Top Detection Engines</h3>
                <ul class="engines-list">
                    ${Object.entries(topDetectionEngines).map(([engine, count]) => `
                        <li class="engine-item">
                            <span class="engine-name">${engine}</span>
                            <span class="engine-count">${count} detections</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    return `
        <div class="security-dashboard">
            <div class="dashboard-header">
                <h2>Network Security Dashboard</h2>
                <div class="dashboard-subtitle">Analyzing ${totalPublicConnections} public connections</div>
            </div>
            
            <div class="dashboard-metrics">
                <div class="metric-card">
                    <div class="metric-title">Risk Distribution</div>
                    <div class="risk-distribution">
                        <div class="risk-bar-container">
                            <div class="risk-bar risk-high" style="width: ${Math.max(1, (riskLevels.HIGH / totalPublicConnections) * 100)}%"></div>
                            <div class="risk-bar risk-medium" style="width: ${Math.max(1, (riskLevels.MEDIUM / totalPublicConnections) * 100)}%"></div>
                            <div class="risk-bar risk-low" style="width: ${Math.max(1, (riskLevels.LOW / totalPublicConnections) * 100)}%"></div>
                            <div class="risk-bar risk-clean" style="width: ${Math.max(1, (riskLevels.CLEAN / totalPublicConnections) * 100)}%"></div>
                            <div class="risk-bar risk-unknown" style="width: ${Math.max(1, (riskLevels.UNKNOWN / totalPublicConnections) * 100)}%"></div>
                        </div>
                        <div class="risk-legend">
                            <div class="legend-item">
                                <span class="legend-color risk-high"></span>
                                <span class="legend-label">High (${riskLevels.HIGH})</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color risk-medium"></span>
                                <span class="legend-label">Medium (${riskLevels.MEDIUM})</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color risk-low"></span>
                                <span class="legend-label">Low (${riskLevels.LOW})</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color risk-clean"></span>
                                <span class="legend-label">Clean (${riskLevels.CLEAN})</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color risk-unknown"></span>
                                <span class="legend-label">Unknown (${riskLevels.UNKNOWN})</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Threat Detection Summary</div>
                    <div class="detection-summary">
                        <div class="detection-metric malicious">
                            <div class="detection-count">${totalMaliciousDetections}</div>
                            <div class="detection-label">Malicious</div>
                        </div>
                        <div class="detection-metric suspicious">
                            <div class="detection-count">${totalSuspiciousDetections}</div>
                            <div class="detection-label">Suspicious</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-details">
                ${highRiskIPsHTML}
                ${topEnginesHTML}
            </div>
            
            <div class="dashboard-footer">
                <div class="dashboard-timestamp">Last updated: ${new Date().toLocaleString()}</div>
                <div class="dashboard-powered-by">Powered by VirusTotal Intelligence</div>
            </div>
        </div>
        <style>
            .security-dashboard {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1);
                padding: 20px;
                margin: 20px 0;
                color: #1e293b;
            }
            
            .dashboard-header {
                margin-bottom: 20px;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 15px;
            }
            
            .dashboard-header h2 {
                margin: 0 0 5px 0;
                font-size: 24px;
                font-weight: 600;
                color: #1e293b;
            }
            
            .dashboard-subtitle {
                color: #64748b;
                font-size: 14px;
            }
            
            .dashboard-metrics {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .metric-card {
                flex: 1;
                background: #f8fafc;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            
            .metric-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 15px;
                color: #334155;
            }
            
            .risk-distribution {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .risk-bar-container {
                height: 20px;
                background: #f1f5f9;
                border-radius: 10px;
                overflow: hidden;
                display: flex;
            }
            
            .risk-bar {
                height: 100%;
                transition: width 0.5s ease;
            }
            
            .risk-legend {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                font-size: 12px;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .legend-color {
                width: 12px;
                height: 12px;
                border-radius: 2px;
            }
            
            .legend-label {
                color: #64748b;
            }
            
            .detection-summary {
                display: flex;
                gap: 15px;
            }
            
            .detection-metric {
                flex: 1;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
            }
            
            .detection-metric.malicious {
                background-color: #fee2e2;
                color: #b91c1c;
            }
            
            .detection-metric.suspicious {
                background-color: #ffedd5;
                color: #c2410c;
            }
            
            .detection-count {
                font-size: 36px;
                font-weight: 700;
                line-height: 1;
                margin-bottom: 5px;
            }
            
            .detection-label {
                font-size: 14px;
                font-weight: 500;
            }
            
            .dashboard-details {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .high-risk-ips, .top-engines {
                flex: 1;
                background: #f8fafc;
                border-radius: 6px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            
            .high-risk-ips h3, .top-engines h3 {
                margin: 0 0 15px 0;
                font-size: 16px;
                font-weight: 600;
                color: #334155;
            }
            
            .high-risk-list, .engines-list {
                margin: 0;
                padding: 0;
                list-style: none;
            }
            
            .high-risk-item, .engine-item {
                padding: 10px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 14px;
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .high-risk-item:last-child, .engine-item:last-child {
                border-bottom: none;
            }
            
            .high-risk-ip {
                font-weight: 600;
                color: #b91c1c;
            }
            
            .high-risk-score, .high-risk-detections {
                color: #64748b;
            }
            
            .high-risk-owner {
                font-size: 12px;
                color: #1e293b;
                background: #e2e8f0;
                padding: 2px 6px;
                border-radius: 4px;
            }
            
            .engine-name {
                font-weight: 600;
                color: #1e293b;
            }
            
            .engine-count {
                color: #64748b;
            }
            
            .dashboard-footer {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #94a3b8;
                margin-top: 20px;
                padding-top: 10px;
                border-top: 1px solid #e2e8f0;
            }
        </style>
    `;
}

export {
    getRiskLevelClass,
    getRiskLevelColor,
    createSecurityBadge,
    generateSecurityDetailsHTML,
    generateSecuritySummary,
    createSecurityDashboardHTML
}; 