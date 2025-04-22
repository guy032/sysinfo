// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
    if (!bytes) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper function to format column names for better readability
function formatColumnName(name) {
    // Convert camelCase to Title Case with spaces
    return name
        // Insert a space before all uppercase letters
        .replace(/([A-Z])/g, ' $1')
        // Replace underscores with spaces
        .replace(/_/g, ' ')
        // Capitalize first letter
        .replace(/^./, str => str.toUpperCase())
        // Trim leading spaces
        .trim();
}

// Helper function to format cell values based on type
function formatCellValue(value) {
    if (value === null || value === undefined) {
        return '-';
    } else if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    } else if (Array.isArray(value)) {
        if (value.length === 0) return '-';
        return `<div class="json-value">${JSON.stringify(value, null, 2)}</div>`;
    } else if (typeof value === 'object') {
        return `<div class="json-value">${JSON.stringify(value, null, 2)}</div>`;
    } else {
        return String(value);
    }
}

export { formatBytes, formatColumnName, formatCellValue }; 