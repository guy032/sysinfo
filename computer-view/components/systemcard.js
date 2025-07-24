/**
 * Creates a standardized system card component that matches the hardware card design
 * @param {string} title - The title of the system card
 * @param {string} content - The HTML content to display inside the card
 * @param {string} imageUrl - URL for card image (optional)
 * @param {string} logoUrl - URL for vendor logo (optional)
 * @param {string} accentColor - Accent color for the card (optional)
 * @returns {string} HTML string for the system card
 */
function createSystemCard(title, content, imageUrl = null, logoUrl = null, accentColor = null) {
    // Set default accent color if not provided
    let secondaryColor, bgGradient;
    
    if (!accentColor) {
        // Create a unique accent color based on title
        switch(title) {
            case 'OS Information': 
                accentColor = '#0078D4'; 
                secondaryColor = '#0063a9';
                bgGradient = 'linear-gradient(135deg, #f5f7fa, #e8edf2)';
                break;
            case 'GPS Information': 
                accentColor = '#2ecc71'; 
                secondaryColor = '#27ae60';
                bgGradient = 'linear-gradient(135deg, #f5faf7, #e8f2ec)';
                break;
            case 'Time Information': 
                accentColor = '#9b59b6'; 
                secondaryColor = '#8e44ad';
                bgGradient = 'linear-gradient(135deg, #f9f5fa, #efe8f2)';
                break;
            case 'Users': 
                accentColor = '#e67e22'; 
                secondaryColor = '#d35400';
                bgGradient = 'linear-gradient(135deg, #fdf9f5, #fcf4e7)';
                break;
            default: 
                accentColor = '#1abc9c';
                secondaryColor = '#16a085';
                bgGradient = 'linear-gradient(135deg, #f5fafa, #e8f2f2)';
        }
    } else {
        // If accent color is provided but not the others
        secondaryColor = accentColor;
        bgGradient = 'linear-gradient(135deg, #f5f7fa, #e8edf2)';
    }

    // Handle image content if provided
    let imageContent = '';
    if (imageUrl) {
        imageContent = `
            <div style="
                width: 60px;
                height: 60px;
                margin-right: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                overflow: hidden;
            ">
                <img src="${imageUrl}" alt="${title}" 
                     style="max-width: 85%; max-height: 85%; object-fit: contain;" 
                     onerror="this.src='https://via.placeholder.com/60?text=${encodeURIComponent(title)}'" />
            </div>
        `;
    }

    return `
        <div style="
            background: white;
            color: #333;
            border-radius: 10px;
            box-shadow: 0 3px 15px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1);
            overflow: hidden;
            margin-bottom: 10px;
            height: 100%;
            display: flex;
            flex-direction: column;
            border: 1px solid #f0f0f0;
            transition: all 0.2s ease;
        " onmouseover="this.style.boxShadow='0 5px 20px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)'"
           onmouseout="this.style.boxShadow='0 3px 15px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)'; this.style.transform='translateY(0)'">
            <div style="
                background: ${bgGradient};
                padding: 12px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid ${accentColor};
            ">
                <h3 style="
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: ${accentColor};
                    letter-spacing: 0.3px;
                ">${title}</h3>
                
                ${logoUrl ? `
                    <img src="${logoUrl}" alt="Logo" style="
                        height: 20px;
                        width: auto;
                        max-width: 50px;
                        object-fit: contain;
                    " />
                ` : ''}
            </div>
            
            <div style="padding: 12px 15px; flex: 1; display: flex; flex-direction: column;">
                ${content}
            </div>
        </div>
    `;
}

export { createSystemCard }; 