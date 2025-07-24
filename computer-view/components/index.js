// Import all components from separate files
import { createHardwareCard, createHardwareComponents } from './baseHardware.js';
import { getVendorLogo, getModelImage, getCpuImage, getGraphicsImage } from './vendors.js';
import { getMemoryImage, createMemoryCard } from './memory.js';
import { createStorageCard } from './storage.js';
import { createGraphicsControllerCard, createDisplayCard } from './graphics.js';
import { createOSCard } from './os.js';
import { createTimeCard } from './time.js';
import { createUsersCard } from './users.js';
import { createNetworkInterfacesCard, getVendorFromBSSID } from './network.js';
import { createWifiRadarVisualization } from './wifiRadar.js';
import { createNetworkConnectionsVisual } from './networkMonitor.js';
import { createUsbDevicesGrid } from './usb.js';
import { createPrintersGrid } from './printer.js';
import { createAudioDevicesGrid } from './audio.js';
import { createBluetoothDevicesGrid } from './bluetooth.js';
import { createSystemCard } from './systemcard.js';
import { createCondensedUserCard } from './condensed-user-card.js';

// Export all components as a single module
export {
    createHardwareCard,
    createHardwareComponents,
    getVendorLogo,
    getModelImage,
    getCpuImage,
    getGraphicsImage,
    getMemoryImage,
    createMemoryCard,
    createStorageCard,
    createGraphicsControllerCard,
    createDisplayCard,
    createOSCard,
    createTimeCard,
    createUsersCard,
    createNetworkInterfacesCard,
    createWifiRadarVisualization,
    createNetworkConnectionsVisual,
    createUsbDevicesGrid,
    createPrintersGrid,
    createAudioDevicesGrid,
    createBluetoothDevicesGrid,
    getVendorFromBSSID,
    createSystemCard,
    createCondensedUserCard,
}; 