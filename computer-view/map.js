// Helper function to create map section for GPS data
function createMapSection(title, gpsData) {
    if (!gpsData || !gpsData.latitude || !gpsData.longitude) {
        return `
            <div class="section">
                <div class="section-title">${title}</div>
                <pre>${JSON.stringify(gpsData, null, 2)}</pre>
            </div>
        `;
    }
    
    return `
        <div class="section">
            <div class="section-title">${title}</div>
            <div class="map-container">
                <div id="map"></div>
            </div>
        </div>
    `;
}

// Function to initialize the map with GPS coordinates
function initMap(latitude, longitude, accuracy) {
    try {
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.log('Leaflet not loaded yet, trying again in 500ms');
            setTimeout(() => initMap(latitude, longitude, accuracy), 500);
            return;
        }
        
        // Create the map centered at the GPS coordinates
        const map = L.map('map').setView([latitude, longitude], 15);
        
        // Add the Mapbox tiles
        L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwcmludCIsImEiOiJjbG9iZXVoODMwcWVxMmhxcGc5dTR4bjA4In0.xdln2HZyWPXWptpKh4HptQ', {
            attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            tileSize: 512,
            zoomOffset: -1,
            maxZoom: 19
        }).addTo(map);
        
        // Add a marker at the GPS coordinates
        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(`Location: ${latitude}, ${longitude}`).openPopup();
        
        // Add a circle to represent accuracy
        if (accuracy && accuracy > 0) {
            const circle = L.circle([latitude, longitude], {
                color: 'blue',
                fillColor: '#3388ff',
                fillOpacity: 0.2,
                radius: accuracy
            }).addTo(map);
        }
        
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
        
        // Add a fallback link
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <p>Could not load the interactive map.</p>
                    </div>
                `;
            }
        }
    }
}

// Function to load Leaflet script
function loadLeaflet() {
    return new Promise((resolve, reject) => {
        // Add Leaflet CSS
        document.head.insertAdjacentHTML('beforeend', `
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
        `);
        
        // Load Leaflet script separately to ensure it's properly loaded
        const leafletScript = document.createElement('script');
        leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        leafletScript.crossOrigin = "";
        leafletScript.onload = () => resolve();
        leafletScript.onerror = (e) => reject(e);
        document.head.appendChild(leafletScript);
    });
}

export { createMapSection, initMap, loadLeaflet }; 