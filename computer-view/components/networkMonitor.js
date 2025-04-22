/**
 * Network Monitor Main Module
 * This is the main entry point for the Network Monitor component
 */

import { createNetworkConnectionsVisual, createCyberNetworkMap } from './networkMonitor/index.js';
import { enhanceConnectionsIPData } from './networkMonitor/components/map/mapVisualizer.js';
import { IPInfoManager } from './networkMonitor/utils/ipUtils.js';

// Export all necessary functions for external use
export { createNetworkConnectionsVisual, createCyberNetworkMap, enhanceConnectionsIPData };

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