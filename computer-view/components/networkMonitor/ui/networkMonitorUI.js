/**
 * Network Monitor UI Controller
 * Handles UI interactions for the network monitor component
 */

import { IPInfoManager } from '../utils/ipUtils.js';
import { enhanceConnectionsIPData } from '../components/map/mapVisualizer.js';

/**
 * Network Monitor UI controller for handling tab switching and IP enhancement
 */
const NetworkMonitorUI = {
    /**
     * Switch between main tabs
     * @param {string} instanceId - ID of the monitor instance
     * @param {string} tabId - ID of the tab to switch to
     */
    switchTab: function(instanceId, tabId) {
        // Hide all tab contents for this instance
        document.querySelectorAll(`#${instanceId} .tab-pane`).forEach(pane => {
            pane.style.display = 'none';
        });
        
        // Show selected tab content
        document.getElementById(`${instanceId}-content-${tabId}`).style.display = 'block';
        
        // Update active stat card
        document.querySelectorAll(`.stat-card`).forEach(card => {
            card.classList.remove('active');
        });
        document.querySelectorAll(`.stat-card[data-tab="${tabId}"]`).forEach(card => {
            card.classList.add('active');
        });
    },
    
    /**
     * Switch between subtabs
     * @param {string} instanceId - ID of the monitor instance
     * @param {string} subtabId - ID of the subtab to switch to
     */
    switchSubTab: function(instanceId, subtabId) {
        // Hide all subtab contents
        document.querySelectorAll(`#${instanceId} .subtab-pane`).forEach(pane => {
            pane.style.display = 'none';
        });
        
        // Show selected subtab content
        const selectedPane = document.getElementById(`${instanceId}-subcontent-${subtabId}`);
        selectedPane.style.display = 'block';
        
        // Update active subtab
        document.querySelectorAll(`#${instanceId} .subtab`).forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll(`#${instanceId} .subtab[data-subtab="${subtabId}"]`).forEach(tab => {
            tab.classList.add('active');
        });
        
        // Special handling for the WAN tab that has the cyber network map
        if (subtabId === 'wan') {
            console.log(`Switched to WAN tab, initializing cyber network map...`);
            
            // Find all cyber network map containers in the current pane
            const mapContainers = selectedPane.querySelectorAll('[data-cyber-map-id]');
            
            if (mapContainers.length > 0) {
                console.log(`Found ${mapContainers.length} cyber map containers, enhancing data...`);
                
                // Enhance connection data for each map container
                mapContainers.forEach(container => {
                    const mapId = container.getAttribute('data-cyber-map-id');
                    if (mapId) {
                        // Trigger IP data enhancement for the map
                        setTimeout(() => {
                            enhanceConnectionsIPData(mapId);
                        }, 500);
                    }
                });
            } else {
                console.log(`No cyber map containers found in the WAN tab.`);
            }
        }
        // Special handling for the LAN tab with reagraph visualization
        else if (subtabId === 'lan') {
            console.log(`Switched to LAN tab, initializing reagraph visualization...`);
            this.initializeReagraphVisualizations(selectedPane);
        }
        
        // Enhance IPs in the newly shown tab
        console.log(`Switched to subtab: ${subtabId}, enhancing IPs...`);
        setTimeout(() => this.enhanceIPDetails(), 100);
    },
    
    /**
     * Initialize the first tab as active
     * @param {string} instanceId - ID of the monitor instance
     */
    initTabs: function(instanceId) {
        this.switchTab(instanceId, 'established');
        // Also initialize the subtab if we're on the established tab
        this.switchSubTab(instanceId, 'wan');
        
        // Start IP enhancement
        setTimeout(() => this.enhanceIPDetails(), 500);
        
        // Set up observer to detect when new connections are added
        this.setupIPEnhancementObserver();
    },
    
    /**
     * Initialize reagraph visualizations in the specified container
     * @param {HTMLElement} container - The container element to search for reagraph elements
     */
    initializeReagraphVisualizations: function(container) {
        try {
            if (!container) {
                console.error('No container provided for reagraph initialization');
                return;
            }
            
            // Find all reagraph containers
            const reagraphContainers = container.querySelectorAll('.reagraph-container[data-nodes-encoded]');
            console.log(`Found ${reagraphContainers.length} reagraph containers to initialize`);
            
            if (reagraphContainers.length === 0) {
                return;
            }
            
            // Initialize each container
            reagraphContainers.forEach(graphContainer => {
                try {
                    const graphId = graphContainer.querySelector('.reagraph-canvas').id;
                    const nodesData = JSON.parse(decodeURIComponent(graphContainer.getAttribute('data-nodes-encoded')));
                    const edgesData = JSON.parse(decodeURIComponent(graphContainer.getAttribute('data-edges-encoded')));
                    
                    console.log(`Initializing reagraph visualization for: ${graphId}`);
                    
                    // Check if NetworkGraphUtils is available in the window object
                    if (typeof window.NetworkGraphUtils !== 'undefined' && 
                        typeof window.NetworkGraphUtils.initializeGraphNetwork === 'function') {
                        window.NetworkGraphUtils.initializeGraphNetwork(graphId, nodesData, edgesData);
                    } else {
                        console.error('NetworkGraphUtils not found or not properly initialized');
                        graphContainer.innerHTML = '<div class="error-message">Graph initialization failed: NetworkGraphUtils not loaded</div>';
                    }
                } catch (error) {
                    console.error('Error initializing reagraph visualization:', error);
                }
            });
        } catch (error) {
            console.error('Error in initializeReagraphVisualizations:', error);
        }
    },
    
    /**
     * Set up an observer to watch for DOM changes and enhance IPs when tabs change
     */
    setupIPEnhancementObserver: function() {
        // Create a single observer for all DOM changes that might contain IPs
        const observer = new MutationObserver((mutations) => {
            let shouldEnhance = false;
            
            for (const mutation of mutations) {
                // Check if any nodes were added
                if (mutation.addedNodes.length > 0) {
                    shouldEnhance = true;
                    break;
                }
                
                // Check for style changes (tab switching)
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    shouldEnhance = true;
                    break;
                }
            }
            
            if (shouldEnhance) {
                console.log('DOM changes detected, enhancing IPs...');
                this.enhanceIPDetails();
            }
        });
        
        // Observe the entire network connections container
        const container = document.querySelector('.network-connections-section');
        if (container) {
            observer.observe(container, { 
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            console.log('IP enhancement observer set up on network container');
        } else {
            console.log('Network container not found, observing body');
            // Fallback to observing the body if container not found
            observer.observe(document.body, { 
                childList: true,
                subtree: true, 
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    },
    
    /**
     * Enhance IP address displays with additional information
     * @param {number} retryCount - Number of retry attempts made so far
     */
    enhanceIPDetails: function(retryCount = 0) {
        console.log('Enhancing IP details...');
        
        // Stop after 5 retries
        if (retryCount >= 5) {
            console.log('Max retry attempts reached for enhancing IP details');
            return;
        }
        
        try {
            // Only look for IP elements in the WAN tab
            let ipElements = document.querySelectorAll('#network-monitor-\\w+ .subtab-pane[id$="-subcontent-wan"]:not([style*="display: none"]) .remote-endpoint[data-ip]');
            
            if (ipElements.length === 0) {
                // Try a more generic selector as fallback
                ipElements = document.querySelectorAll('.remote-endpoint[data-ip], [data-ip]');
            }
            
            if (ipElements.length === 0) {
                console.log('No IP elements found - will retry in 1 second (attempt ' + (retryCount + 1) + '/5)');
                // Pass retry count to next attempt
                setTimeout(() => this.enhanceIPDetails(retryCount + 1), 1000);
                return;
            }
            
            // Process each IP element
            Array.from(ipElements).forEach(async (element) => {
                try {
                    // Get the IP
                    const ip = element.getAttribute('data-ip');
                    if (!ip) {
                        console.log('No IP found in element:', element);
                        return;
                    }
                    
                    // Skip private IPs
                    if (IPInfoManager.isPrivateIP && IPInfoManager.isPrivateIP(ip)) {
                        console.log(`Skipping private IP: ${ip}`);
                        return;
                    }
                    
                    // Check if already enhanced
                    const detailsContainer = element.querySelector('.ip-details-container');
                    if (detailsContainer && detailsContainer.children.length > 0) {
                        console.log(`IP ${ip} already enhanced`);
                        return;
                    }
                    
                    // Create details container if it doesn't exist
                    let container = detailsContainer;
                    if (!container) {
                        container = document.createElement('div');
                        container.className = 'ip-details-container';
                        element.appendChild(container);
                    } else {
                        // Clear existing content
                        container.innerHTML = '';
                    }
                    
                    // Show loading indicator
                    container.innerHTML = '<div class="ip-details-loading">Loading info...</div>';
                    
                    // Fetch IP info
                    try {
                        const ipInfo = await IPInfoManager.getIPInfo(ip);
                        
                        // Clear loading indicator
                        container.innerHTML = '';
                        
                        if (ipInfo.error) {
                            container.innerHTML = `<div class="ip-details-error">${ipInfo.errorMessage || 'Error fetching data'}</div>`;
                            return;
                        }
                        
                        // Create detail elements
                        const details = document.createElement('div');
                        details.className = 'ip-details';
                        
                        // Add location info if available
                        if (ipInfo.city || ipInfo.region || ipInfo.country) {
                            const locationElem = document.createElement('div');
                            locationElem.className = 'ip-location';
                            
                            const locationParts = [];
                            if (ipInfo.city) locationParts.push(ipInfo.city);
                            if (ipInfo.region) locationParts.push(ipInfo.region);
                            if (ipInfo.country) locationParts.push(ipInfo.country);
                            
                            locationElem.textContent = locationParts.join(', ');
                            details.appendChild(locationElem);
                        }
                        
                        // Add coordinates if available
                        if (ipInfo.loc) {
                            const coordsElem = document.createElement('div');
                            coordsElem.className = 'ip-coordinates';
                            coordsElem.textContent = `Coordinates: ${ipInfo.loc}`;
                            details.appendChild(coordsElem);
                        }
                        
                        // Add organization info if available
                        if (ipInfo.org) {
                            const orgElem = document.createElement('div');
                            orgElem.className = 'ip-org';
                            orgElem.textContent = ipInfo.org;
                            details.appendChild(orgElem);
                        }
                        
                        // Add hostname if available
                        if (ipInfo.hostname) {
                            const hostnameElem = document.createElement('div');
                            hostnameElem.className = 'ip-hostname';
                            hostnameElem.textContent = ipInfo.hostname;
                            details.appendChild(hostnameElem);
                        }
                        
                        // Add security info if available
                        if (ipInfo.securityInfo) {
                            const securityElem = document.createElement('div');
                            securityElem.className = 'ip-security';
                            securityElem.innerHTML = `<strong>Risk Level:</strong> ${ipInfo.securityInfo.riskLevel}`;
                            details.appendChild(securityElem);
                        }
                        
                        // Add to container
                        container.appendChild(details);
                        
                        // Add flag near the IP if country information available
                        if (ipInfo.country) {
                            try {
                                const countryCode = ipInfo.country.toLowerCase();
                                const flagSpan = document.createElement('span');
                                flagSpan.className = 'country-flag';
                                flagSpan.title = ipInfo.country;
                                flagSpan.textContent = countryCode;
                                
                                const hostElement = element.querySelector('.remote-host-name');
                                if (hostElement) {
                                    hostElement.parentNode.insertBefore(flagSpan, hostElement.nextSibling);
                                }
                            } catch (flagError) {
                                console.error('Error adding country flag:', flagError);
                            }
                        }
                    } catch (apiError) {
                        console.error(`Error processing IP ${ip}:`, apiError);
                        container.innerHTML = '<div class="ip-details-error">Error fetching data</div>';
                    }
                } catch (elementError) {
                    console.error('Error processing element:', elementError);
                }
            });
            
            // Schedule another check for new elements after a delay, but only if this wasn't a retry
            if (retryCount === 0) {
                setTimeout(() => {
                    // Use a more direct selector
                    const allRemoteEndpoints = document.querySelectorAll('.remote-endpoint[data-ip]');
                    const enhancedEndpoints = document.querySelectorAll('.remote-endpoint .ip-details-container');
                    
                    if (allRemoteEndpoints.length > enhancedEndpoints.length) {
                        console.log(`Found ${allRemoteEndpoints.length - enhancedEndpoints.length} more IPs to enhance, continuing...`);
                        this.enhanceIPDetails();
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Error in enhanceIPDetails:', error);
        }
    }
};

export default NetworkMonitorUI; 