import { displayComputerInfo } from './display.js';
import { loadLeaflet } from './map.js';

// Load Leaflet scripts right away
loadLeaflet().catch(err => console.error('Error loading Leaflet:', err));

// Fetch the JSON data as text first
fetch('snapshot.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // Get the response as text instead of JSON
        return response.text();
    })
    .then(text => {
        try {
            // First attempt: Try to parse it directly
            // (in case the user has already fixed the JSON)
            const data = JSON.parse(text);
            displayComputerInfo(data);
        } catch (initialError) {
            console.error("Initial parsing failed, attempting to fix JSON:", initialError);
            
            try {
                // Step 1: Use a more comprehensive approach to fix JSON
                let fixedJson = text
                    // Add quotes around property keys (basic)
                    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
                    
                    // Fix trailing commas in objects
                    .replace(/,(\s*})/g, '$1')
                    
                    // Fix trailing commas in arrays
                    .replace(/,(\s*\])/g, '$1')
                    
                    // Fix missing commas between objects in arrays
                    .replace(/}(\s*){/g, '},\n$1{')
                    
                    // Replace any unescaped backslashes in strings
                    .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, function(match) {
                        return match.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
                    });
                
                // Step 2: Try to parse the fixed JSON
                try {
                    const data = JSON.parse(fixedJson);
                    console.log("Successfully fixed and parsed JSON");
                    displayComputerInfo(data);
                } catch (fixError) {
                    // Step 3: If still failing, try a more aggressive approach
                    console.error("First fix attempt failed:", fixError);
                    
                    // Try converting JavaScript object literal to JSON
                    try {
                        // Replace property names without quotes
                        fixedJson = text.replace(/(\w+):/g, '"$1":');
                        
                        // Replace single quotes with double quotes (carefully)
                        fixedJson = fixedJson.replace(/'([^']*)'/g, '"$1"');
                        
                        // Remove trailing commas
                        fixedJson = fixedJson.replace(/,\s*([\]}])/g, '$1');
                        
                        // Try parsing one more time
                        const data = JSON.parse(fixedJson);
                        console.log("Successfully fixed and parsed JSON with aggressive approach");
                        displayComputerInfo(data);
                    } catch (lastError) {
                        console.error("All parsing attempts failed:", lastError);
                        
                        // Alternative approach: Use Function constructor as a last resort
                        // WARNING: This is generally not recommended for security reasons
                        // but can work for trusted local files
                        try {
                            console.log("Attempting to evaluate as JavaScript object");
                            // Convert the JS object notation to a valid JSON string
                            const jsObjText = 'return ' + text;
                            // Use Function constructor to evaluate the text as JS
                            // This is like eval() but slightly safer
                            const evalFunc = new Function(jsObjText);
                            const data = evalFunc();
                            console.log("Successfully evaluated as JavaScript object");
                            displayComputerInfo(data);
                        } catch (evalError) {
                            // If all else fails, show error
                            console.error("All attempts failed:", evalError);
                            document.getElementById('computer-info').innerHTML = `
                                <div class="section">
                                    <div class="section-title">Error</div>
                                    <p>All attempts to parse computer information failed.</p>
                                    <p>Original error: ${initialError.message}</p>
                                    <p>After fix attempts: ${lastError.message}</p>
                                    <p>Please check the browser console for more details or manually fix the JSON file.</p>
                                </div>
                            `;
                        }
                    }
                }
            } catch (e) {
                console.error("Error during JSON fixing process:", e);
                document.getElementById('computer-info').innerHTML = `
                    <div class="section">
                        <div class="section-title">Error</div>
                        <p>Failed during JSON fixing process: ${e.message}</p>
                        <p>Please check the browser console for more details.</p>
                    </div>
                `;
            }
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        document.getElementById('computer-info').innerHTML = `
            <div class="section">
                <div class="section-title">Error</div>
                <p>Failed to load computer information: ${error.message}</p>
            </div>
        `;
    }); 