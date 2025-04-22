/**
 * Get the logo URL for a vendor
 * @param {string} vendor - The vendor name
 * @returns {string} URL to the vendor logo
 */
function getVendorLogo(vendor) {
    if (!vendor) return null;
    
    const normalizedVendor = vendor.toLowerCase();
    
    // Define vendor logos - expand this list as needed
    const vendorLogos = {
        'intel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Intel_logo_%282006-2020%29.svg/200px-Intel_logo_%282006-2020%29.svg.png',
        'amd': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/AMD_Logo.svg/200px-AMD_Logo.svg.png',
        'nvidia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/200px-Nvidia_logo.svg.png',
        'dell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/200px-Dell_Logo.svg.png',
        'hp': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/HP_New_Logo_2D.svg/200px-HP_New_Logo_2D.svg.png',
        'lenovo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/200px-Lenovo_logo_2015.svg.png',
        'asus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/200px-ASUS_Logo.svg.png',
        'apple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png',
        'microsoft': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/200px-Microsoft_logo_%282012%29.svg.png',
        'samsung': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png',
        'kingston': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Kingston_logo.svg/200px-Kingston_logo.svg.png',
        'crucial': 'https://logos-world.net/wp-content/uploads/2022/01/Crucial-Symbol.png',
        'corsair': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Corsair_logo.svg/200px-Corsair_logo.svg.png',
        'lg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/LG_logo_%282015%29.svg/200px-LG_logo_%282015%29.svg.png',
        'seagate': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Seagate_Technology_logo.svg/200px-Seagate_Technology_logo.svg.png',
        'western digital': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/WD_logo.svg/200px-WD_logo.svg.png',
        'sandisk': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/SanDisk_logo.svg/200px-SanDisk_logo.svg.png',
        // Battery manufacturers
        'sony': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Sony_logo.svg/200px-Sony_logo.svg.png',
        'panasonic': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Panasonic_logo_%28Blue%29.svg/200px-Panasonic_logo_%28Blue%29.svg.png',
        'lg chem': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/LG_logo_%282015%29.svg/200px-LG_logo_%282015%29.svg.png',
        'samsung sdi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png',
        'simplo': 'https://media.licdn.com/dms/image/C4D0BAQGdwELb05O3Aw/company-logo_200_200/0/1631380818902?e=2147483647&v=beta&t=gLlbwLETWfh29s0KYj0tFwmwY4Zj2IibXZkVR6ZrBEs',
        // Display manufacturer codes
        'sharp': 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Logo_of_the_Sharp_Corporation.svg',
        'shp': 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Logo_of_the_Sharp_Corporation.svg',
        'xiaomi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/2560px-Xiaomi_logo_%282021-%29.svg.png',
        'xmi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/2560px-Xiaomi_logo_%282021-%29.svg.png',
        'sk hynix': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/SK_Hynix.svg/1200px-SK_Hynix.svg.png'
    };
    
    // First check for exact match
    if (vendorLogos[normalizedVendor]) {
        return vendorLogos[normalizedVendor];
    }
    
    // Then check for partial matches
    for (const [key, value] of Object.entries(vendorLogos)) {
        if (normalizedVendor.includes(key)) {
            return value;
        }
    }
    
    return null;
}

/**
 * Returns a URL for a model image based on the model name
 * @param {string} modelName - The name of the model
 * @returns {string} URL for the model image
 */
function getModelImage(modelName) {
    if (!modelName) return 'https://via.placeholder.com/150?text=System';
    
    const model = modelName.toLowerCase();
    
    // Dell XPS models
    if (model.includes('xps 13')) {
        return 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-13-9300/global-spi/ng/silver/notebook-xps-13-9300-silver-campaign-hero-504x350-ng.psd?fmt=jpg';
    } else if (model.includes('xps 15')) {
        return 'https://i.dell.com/is/image/DellContent/content/dam/ss2/products/laptops-and-2-in-1s/xps/15-9520/media-gallery/black/laptop-xps-15-9520-pdp-gallery-504x350.jpg';
    } else if (model.includes('xps')) {
        return 'https://i.dell.com/is/image/DellContent/content/dam/images/products/laptops-and-2-in-1s/xps/xps-13-9315/blue/asset-card-xps-13-9315-blue-800x550.jpg?fmt=png-alpha&wid=800&hei=550';
    }
    
    // Dell Inspiron models
    if (model.includes('inspiron')) {
        return 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/inspiron-notebooks/15-3520/media-gallery/notebook-inspiron-15-3520-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&wid=4000&hei=2800';
    }
    
    // Dell Latitude models
    if (model.includes('latitude')) {
        return 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-3420/media-gallery/peripherals_laptop_latitude_3420_gallery_1.psd?fmt=png-alpha&pscan=auto&scl=1&wid=4000&hei=2800&qlt=100,1&resMode=sharp2&size=4000,2800';
    }
    
    // Default Dell computer image
    if (model.includes('dell')) {
        return 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/14-9440/media-gallery/notebook-latitude-9440-2in1-gallery-1.psd?fmt=pjpg&pscan=auto&scl=1&wid=4000&hei=2800&qlt=100,0&resMode=sharp2&size=4000,2800';
    }
    
    // Fallback to a generic computer image
    return 'https://via.placeholder.com/150?text=Computer';
}

/**
 * Returns a URL for a CPU image based on the CPU information
 * @param {Object} cpu - The CPU information object
 * @returns {string|null} URL for the CPU image or null if not found
 */
function getCpuImage(cpu) {
    if (!cpu || !cpu.manufacturer) return null;
    
    const manufacturer = cpu.manufacturer.toLowerCase();
    const brand = cpu.brand ? cpu.brand.toLowerCase() : '';
    
    if (manufacturer.includes('intel')) {
        if (brand.includes('i7')) {
            return 'https://www.notebookcheck.net/fileadmin/Notebooks/News/_nc3/download37.png';
        } else if (brand.includes('i5')) {
            return 'https://www.notebookcheck.net/fileadmin/Notebooks/Intel/core_i5_logo.png';
        } else if (brand.includes('i9')) {
            return 'https://www.notebookcheck.net/fileadmin/Notebooks/Intel/core_i9_logo.png';
        } else {
            return 'https://www.notebookcheck.net/fileadmin/Notebooks/Intel/Intel_Core_logo_3.jpg';
        }
    } else if (manufacturer.includes('amd')) {
        if (brand.includes('ryzen')) {
            return 'https://www.amd.com/system/files/2019-06/238593-ryzen-logo-lockup-vertical-black-1260x709_0.png';
        } else {
            return 'https://www.amd.com/system/files/12807-amd-logo-black-725x306.png';
        }
    }
    
    return null;
}

/**
 * Returns a URL for a graphics controller image based on the graphics information
 * @param {Object} graphics - The graphics information object
 * @returns {string|null} URL for the graphics image or null if not found
 */
function getGraphicsImage(graphics) {
    if (!graphics || !graphics.vendor) return null;
    
    const vendor = graphics.vendor.toLowerCase();
    const model = graphics.model ? graphics.model.toLowerCase() : '';
    
    if (vendor.includes('intel')) {
        if (model.includes('iris')) {
            return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7JWjPDA-mcOzv9UGDrC51wiwbGL0ALlcJFQ&s';
        } else if (model.includes('hd')) {
            return 'https://www.notebookcheck.net/fileadmin/_processed_/9/f/csm_Intel_HD_Graphics_logo_9f3d0a6655.jpg';
        } else if (model.includes('xe')) {
            return 'https://cdn.wccftech.com/wp-content/uploads/2020/08/intel-xe-gpu-feature-1480x833.jpg';
        } else {
            return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5k4RmDQS6aHa4IiOnrgjIN-rMh0iY5fcGo9Z4cYKvDfuv0aAl1J3l_B5Sdc_TZHx0N2o&usqp=CAU';
        }
    } else if (vendor.includes('nvidia')) {
        if (model.includes('rtx')) {
            return 'https://www.notebookcheck.net/fileadmin/Notebooks/NVIDIA/rtx_3060.jpg';
        } else if (model.includes('gtx')) {
            return 'https://www.notebookcheck.net/fileadmin/Notebooks/NVIDIA/GeForce_GTX_1660_Ti_notebook.jpg';
        } else {
            return 'https://www.notebookcheck.net/fileadmin/Notebooks/NVIDIA/mx450.jpg';
        }
    } else if (vendor.includes('amd') || vendor.includes('ati')) {
        if (model.includes('radeon') && model.includes('vega')) {
            return 'https://www.notebookcheck.net/fileadmin/Notebooks/AMD/vega_mobile.jpg';
        } else if (model.includes('radeon') && model.includes('rx')) {
            return 'https://www.notebookcheck.net/fileadmin/Notebooks/AMD/5600m.jpg';
        } else {
            return 'https://www.notebookcheck.net/fileadmin/Notebooks/AMD/radeon_rx_logo.jpg';
        }
    }
    
    return null;
}

export { getVendorLogo, getModelImage, getCpuImage, getGraphicsImage }; 