/**
 * Scatter Layer Module
 * Creates scatter plot layers for connection endpoints on the map
 */

import { getRiskLevel } from '../../../utils/connectionUtils.js';

/**
 * Creates a ScatterplotLayer for the endpoint markers
 * @param {Array} arcData - Data for the arcs
 * @returns {Object} ScatterplotLayer instance
 */
function createScatterplotLayer(arcData) {
    const {ScatterplotLayer} = deck;
    
    return new ScatterplotLayer({
        id: 'connection-points',
        data: arcData,
        pickable: true,
        opacity: 0.8,
        stroked: false,
        filled: true,
        radiusScale: 12,
        radiusMinPixels: 6,
        radiusMaxPixels: 15,
        lineWidthMinPixels: 1,
        getPosition: d => d.to,
        getRadius: d => {
            // Adjust radius based on security risk level
            if (d.securityRiskLevel === 'HIGH') return 10;
            if (d.securityRiskLevel === 'MEDIUM') return 8;
            if (d.securityRiskLevel === 'LOW') return 7;
            // Use traditional risk level as fallback
            if (d.riskLevel === 'high') return 8;
            if (d.riskLevel === 'medium') return 7;
            return 6;
        },
        getFillColor: d => {
            // Color markers based on security risk level first if available
            if (d.securityRiskLevel) {
                if (d.securityRiskLevel === 'HIGH') return [220, 38, 38, 255]; // More intense red
                if (d.securityRiskLevel === 'MEDIUM') return [249, 115, 22, 255]; // Orange
                if (d.securityRiskLevel === 'LOW') return [16, 185, 129, 255]; // Green
                if (d.securityRiskLevel === 'CLEAN') return [34, 197, 94, 255]; // Bright green
            }
            
            // Fallback to traditional risk levels if no security info
            if (d.riskLevel === 'high') return [239, 68, 68, 255];  // Red
            if (d.riskLevel === 'medium') return [249, 115, 22, 255]; // Orange
            return [16, 185, 129, 255]; // Green
        },
        // Update hover handler to show enhanced information
        onHover: ({object, x, y}) => {
            if (object) {
                const el = document.getElementById('tooltip');
                if (!el) return;
                
                // Create a more detailed tooltip with all available information
                let content = `
                    <div class="tooltip-content">
                        <div class="tooltip-header">
                            ${object.securityRiskLevel ? 
                                `<span class="tooltip-badge ${object.securityRiskLevel.toLowerCase()}-risk">${object.securityRiskLevel} RISK</span>` :
                                (object.riskLevel === 'high' ? 
                                    '<span class="tooltip-badge high-risk">HIGH RISK</span>' : 
                                    (object.riskLevel === 'medium' ?
                                    '<span class="tooltip-badge medium-risk">MEDIUM RISK</span>' :
                                    '<span class="tooltip-badge low-risk">LOW RISK</span>')
                                )
                            }
                            <h3>${object.location || 'Unknown Location'}</h3>
                        </div>
                        <div class="tooltip-body">`;
                
                // Add security details if available from VirusTotal
                if (object.securityInfo) {
                    const securityInfo = object.securityInfo;
                    
                    // Show malicious and suspicious counts
                    if (securityInfo.maliciousCount || securityInfo.suspiciousCount) {
                        content += `
                            <div class="tooltip-row highlight-row security-highlight">
                                ${securityInfo.maliciousCount > 0 ? 
                                    `<span class="security-alert malicious">⚠️ ${securityInfo.maliciousCount} Malicious</span>` : ''}
                                ${securityInfo.suspiciousCount > 0 ? 
                                    `<span class="security-alert suspicious">⚠️ ${securityInfo.suspiciousCount} Suspicious</span>` : ''}
                            </div>`;
                    }
                    
                    // Add security notes if available
                    if (securityInfo.securityNotes && securityInfo.securityNotes.length > 0) {
                        content += `<div class="tooltip-row security-notes">`;
                        securityInfo.securityNotes.forEach(note => {
                            content += `<div class="security-note">• ${note}</div>`;
                        });
                        content += `</div>`;
                    }
                }
                
                // Add connection count information
                content += `
                    <div class="tooltip-row highlight-row">
                        <span class="tooltip-icon">🔢</span>
                        <span class="connection-count">${object.connectionCount} Connection${object.connectionCount !== 1 ? 's' : ''}</span>
                    </div>`;
                
                // Add process information if available (make this appear first)
                if (object.process) {
                    content += `
                        <div class="tooltip-row">
                            <span class="tooltip-icon">⚙️</span>
                            <span class="process-name">${object.process}</span>
                            ${object.pid ? `<span class="pid-tag">PID: ${object.pid}</span>` : ''}
                        </div>`;
                }
                
                // Add ASN/Owner information if available from VirusTotal
                if (object.asOwner) {
                    content += `
                        <div class="tooltip-row">
                            <span class="tooltip-icon">🏢</span>
                            <span class="as-owner">${object.asOwner}</span>
                        </div>`;
                }
                
                // Add coordinates if available
                if (object.coordinates) {
                    content += `
                        <div class="tooltip-row">
                            <span class="tooltip-icon">📍</span>
                            <span>Coordinates: ${object.coordinates[1]}, ${object.coordinates[0]}</span>
                        </div>`;
                }
                
                // Add ASN information if available
                if (object.asn) {
                    content += `
                        <div class="tooltip-row">
                            <span class="tooltip-icon">🌐</span>
                            <span>${object.asn}</span>
                        </div>`;
                }
                
                // Add hostname/DNS if available
                if (object.hostname) {
                    content += `
                        <div class="tooltip-row">
                            <span class="tooltip-icon">🔗</span>
                            <span>${object.hostname}</span>
                        </div>`;
                }
                
                // Add IP information
                content += `
                    <div class="tooltip-row">
                        <span class="tooltip-icon">🔌</span>
                        <span class="ip-address">${object.ip}</span>
                    </div>`;
                
                // Show all ports, not just the current one
                content += `
                    <div class="tooltip-row">
                        <span class="tooltip-icon">🚪</span>
                        <span class="ports-list">
                            <span>Ports: </span>
                            ${object.allPorts.map(port => 
                                `<span class="port-tag ${getRiskLevel(port) === 'high' ? 'high-risk' : 
                                  (getRiskLevel(port) === 'medium' ? 'medium-risk' : 'low-risk')}">${port}</span>`
                            ).join(' ')}
                        </span>
                    </div>`;
                
                // Add local port information
                content += `
                    <div class="tooltip-row">
                        <span class="tooltip-icon">⬆️</span>
                        <span>From local port: <span class="local-port">${object.localPort}</span></span>
                    </div>`;
                
                // Add protocol information if available
                if (object.protocol) {
                    content += `
                        <div class="tooltip-row">
                            <span class="tooltip-icon">📡</span>
                            <span>Protocol: ${object.protocol.toUpperCase()}</span>
                        </div>`;
                }
                
                // Add connection state if available
                if (object.state) {
                    content += `
                        <div class="tooltip-row">
                            <span class="tooltip-icon">🔄</span>
                            <span>State: ${object.state}</span>
                        </div>`;
                }
                
                // Close the divs
                content += `
                        </div>
                    </div>
                `;
                
                el.innerHTML = content;
                el.style.display = 'block';
                
                // Position the tooltip with boundary detection and adjustment
                // First set it to the cursor position to calculate dimensions
                el.style.left = (x + 10) + 'px';
                el.style.top = (y + 10) + 'px';
                
                // Make sure tooltip is displayed so we can get its dimensions
                el.style.visibility = 'hidden';
                el.style.display = 'block';
                
                // Get viewport dimensions
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Now get the dimensions of the tooltip and the container
                const tooltipRect = el.getBoundingClientRect();
                const mapContainer = el.closest('.deck-gl-map') || el.closest('.cn-map-area');
                const containerRect = mapContainer ? mapContainer.getBoundingClientRect() : document.body.getBoundingClientRect();
                
                // Calculate available space in different directions
                const spaceRight = containerRect.right - x;
                const spaceLeft = x - containerRect.left;
                const spaceBelow = containerRect.bottom - y;
                const spaceAbove = y - containerRect.top;
                
                // Determine best position (prefer right side if there's room)
                let left, top;
                
                // Horizontal positioning
                if (spaceRight >= tooltipRect.width + 20) {
                    // Position to the right of cursor if there's room
                    left = x + 10;
                } else if (spaceLeft >= tooltipRect.width + 20) {
                    // Position to the left of cursor if there's room
                    left = x - tooltipRect.width - 10;
                } else {
                    // Center the tooltip if neither side has enough room
                    left = containerRect.left + (containerRect.width - tooltipRect.width) / 2;
                }
                
                // Vertical positioning
                if (spaceBelow >= tooltipRect.height + 20) {
                    // Position below cursor if there's room
                    top = y + 10;
                } else if (spaceAbove >= tooltipRect.height + 20) {
                    // Position above cursor if there's room
                    top = y - tooltipRect.height - 10;
                } else {
                    // If tooltip is too tall for either above or below, cap the height
                    const maxHeight = Math.max(spaceBelow, spaceAbove) - 20;
                    el.style.maxHeight = maxHeight + 'px';
                    
                    // Position at the top if showing below cursor or at the bottom if showing above
                    if (spaceBelow >= spaceAbove) {
                        top = y + 10;
                    } else {
                        top = y - Math.min(tooltipRect.height, maxHeight) - 10;
                    }
                }
                
                // Final adjustments to ensure the tooltip is within both viewport and container
                left = Math.max(10, Math.min(left, viewportWidth - tooltipRect.width - 10));
                top = Math.max(10, Math.min(top, viewportHeight - tooltipRect.height - 10));
                
                // Apply the calculated position
                el.style.left = left + 'px';
                el.style.top = top + 'px';
                el.style.visibility = 'visible';
            } else {
                const el = document.getElementById('tooltip');
                if (el) el.style.display = 'none';
            }
        },
        onClick: ({object, x, y}) => {
            if (object) {
                // Make the tooltip interactive and locked when clicked
                const el = document.getElementById('tooltip');
                if (el) {
                    // Make the tooltip interactive
                    el.style.pointerEvents = 'auto';
                    el.classList.add('tooltip-locked');
                    
                    // Add a close button when locked
                    const closeBtn = document.createElement('div');
                    closeBtn.className = 'tooltip-close';
                    closeBtn.textContent = '×';
                    closeBtn.onclick = (e) => {
                        e.stopPropagation();
                        el.classList.remove('tooltip-locked');
                        el.style.pointerEvents = 'none';
                        el.style.display = 'none';
                        // Remove close button
                        const existingBtn = el.querySelector('.tooltip-close');
                        if (existingBtn) existingBtn.remove();
                    };
                    
                    // Add close button if it doesn't exist
                    if (!el.querySelector('.tooltip-close')) {
                        el.querySelector('.tooltip-header').appendChild(closeBtn);
                    }
                    
                    // Check if content overflows and add a scroll indicator if needed
                    setTimeout(() => {
                        if (el.scrollHeight > el.clientHeight) {
                            // Add scroll indicator if it doesn't exist
                            if (!el.querySelector('.tooltip-scroll-indicator')) {
                                const scrollIndicator = document.createElement('div');
                                scrollIndicator.className = 'tooltip-scroll-indicator';
                                scrollIndicator.innerHTML = '↓';
                                scrollIndicator.title = 'Scroll for more information';
                                el.appendChild(scrollIndicator);
                                
                                // Hide the indicator when scrolled to the bottom
                                el.addEventListener('scroll', () => {
                                    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
                                        scrollIndicator.style.opacity = '0';
                                    } else {
                                        scrollIndicator.style.opacity = '0.7';
                                    }
                                });
                            }
                        }
                    }, 100);
                }
            }
        }
    });
}

export { createScatterplotLayer }; 