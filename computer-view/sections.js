import { formatColumnName, formatCellValue } from './utils.js';

/**
 * Creates a regular section for non-array data
 * @param {string} title - The title of the section
 * @param {Object} data - The data to display
 * @returns {string} HTML string for the section
 */
function createSection(title, data) {
    if (Array.isArray(data)) {
        return createTableSection(title, data);
    } else {
        return `
            <div class="section">
                <div class="section-title">${title}</div>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
    }
}

/**
 * Creates a table section for arrays of data
 * @param {string} title - The title of the section
 * @param {Array} data - The array of data to display
 * @returns {string} HTML string for the table section
 */
function createTableSection(title, data) {
    if (!Array.isArray(data) || data.length === 0) {
        return createSection(title, data);
    }
    
    const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Extract column headers from the first item
    const firstItem = data[0];
    const columns = Object.keys(firstItem);
    
    return `
        <div class="section" id="${sectionId}">
            <div class="section-title">${title} (${data.length} items)</div>
            <div class="scrollable-section">
                <table>
                    <thead>
                        <tr>
                            ${columns.map(col => `<th>${formatColumnName(col)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                ${columns.map(col => `
                                    <td>${formatCellValue(item[col])}</td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Special formatter for applications table
 * @param {string} title - The title of the section
 * @param {Array} applications - Array of application data
 * @returns {string} HTML string for the applications table
 */
function createApplicationsTable(title, applications) {
    const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;
    
    return `
        <div class="section" id="${sectionId}">
            <div class="section-title">${title} (${applications.length} items)</div>
            <div class="scrollable-section">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Version</th>
                            <th>Publisher</th>
                            <th>Install Date</th>
                            <th>Install Location</th>
                            <th>Size (MB)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${applications.map(app => `
                            <tr>
                                <td>${app.Name || 'Unknown'}</td>
                                <td>${app.Version || '-'}</td>
                                <td>${app.Publisher || '-'}</td>
                                <td>${app.InstallDate || '-'}</td>
                                <td>${app.InstallLocation || '-'}</td>
                                <td>${app.EstimatedSizeMB || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

export { createSection, createTableSection, createApplicationsTable }; 