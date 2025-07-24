/**
 * Renders a modern, futuristic file explorer tree from visitor files data
 * @param {Object} filesData - The visitor files data object
 * @returns {string} HTML for the file explorer
 */
export function renderVisitorFilesTree(filesData) {
    if (!filesData || !filesData.Children) {
        return '<div class="no-data">No file system data available</div>';
    }

    // Function to calculate file sizes in human-readable format
    const formatFileSize = (bytes) => {
        if (bytes === 0 || bytes === null || bytes === undefined) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Function to format date in a readable format
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    // Function to get appropriate icon for file type
    const getFileIcon = (name, type) => {
        const ext = name.split('.').pop().toLowerCase();
        
        // Check if it's a directory
        if (type === 'Directory') {
            return '<i class="material-icons" style="color: #4285F4;">folder</i>';
        }
        
        // Icon mapping for common file types
        const iconMap = {
            'pdf': '<i class="material-icons" style="color: #DB4437;">picture_as_pdf</i>',
            'doc': '<i class="material-icons" style="color: #4285F4;">description</i>',
            'docx': '<i class="material-icons" style="color: #4285F4;">description</i>',
            'xls': '<i class="material-icons" style="color: #0F9D58;">table_chart</i>',
            'xlsx': '<i class="material-icons" style="color: #0F9D58;">table_chart</i>',
            'txt': '<i class="material-icons" style="color: #757575;">text_snippet</i>',
            'jpg': '<i class="material-icons" style="color: #F4B400;">image</i>',
            'jpeg': '<i class="material-icons" style="color: #F4B400;">image</i>',
            'png': '<i class="material-icons" style="color: #F4B400;">image</i>',
            'gif': '<i class="material-icons" style="color: #F4B400;">gif</i>',
            'mp3': '<i class="material-icons" style="color: #9C27B0;">audiotrack</i>',
            'mp4': '<i class="material-icons" style="color: #FF5722;">movie</i>',
            'exe': '<i class="material-icons" style="color: #673AB7;">terminal</i>',
            'zip': '<i class="material-icons" style="color: #795548;">archive</i>',
            'rar': '<i class="material-icons" style="color: #795548;">archive</i>',
            'ini': '<i class="material-icons" style="color: #607D8B;">settings</i>',
            'lnk': '<i class="material-icons" style="color: #03A9F4;">link</i>',
            'dat': '<i class="material-icons" style="color: #9E9E9E;">data_object</i>',
            'log': '<i class="material-icons" style="color: #9C27B0;">receipt</i>',
            'url': '<i class="material-icons" style="color: #00BCD4;">link</i>',
            'blf': '<i class="material-icons" style="color: #FF5722;">code</i>',
            'igpi': '<i class="material-icons" style="color: #3F51B5;">memory</i>',
            'regtrans-ms': '<i class="material-icons" style="color: #FF9800;">settings_applications</i>',
            'search-ms': '<i class="material-icons" style="color: #CDDC39;">search</i>',
            'searchconnector-ms': '<i class="material-icons" style="color: #8BC34A;">search</i>'
        };
        
        return iconMap[ext] || '<i class="material-icons" style="color: #757575;">insert_drive_file</i>';
    };

    // Generate a unique ID for use in tree items
    const generateUniqueId = () => {
        return 'tree-item-' + Math.random().toString(36).substr(2, 9);
    };

    // Recursive function to calculate directory size
    const calculateDirectorySize = (node) => {
        if (!node) return 0;
        let size = 0;
        
        // Add sizes of files in this directory
        if (node.Files) {
            const filesArray = Array.isArray(node.Files) ? node.Files : node.Files.Name ? [node.Files] : [];
            filesArray.forEach(file => {
                size += file.Length || file.SizeBytes || 0;
            });
        }
        
        // Add sizes of child directories
        if (node.Children) {
            const childrenArray = Array.isArray(node.Children) 
                ? node.Children 
                : Object.keys(node.Children).length > 0 
                    ? [node.Children] 
                    : [];
            
            childrenArray.forEach(child => {
                if (Array.isArray(child)) {
                    child.forEach(subChild => {
                        size += calculateDirectorySize(subChild);
                    });
                } else {
                    size += calculateDirectorySize(child);
                }
            });
        }
        
        return size;
    };

    // Recursive function to generate file tree HTML
    const generateTreeHTML = (node, level = 0, path = '') => {
        if (!node) return '';
        
        let html = '';
        const currentPath = path ? `${path}/${node.Name}` : node.Name;
        
        // Create folder/file entry
        if (level > 0) { // Skip root node display
            const isDirectory = node.Type === 'Directory';
            const hasChildren = isDirectory && (node.Children && Object.keys(node.Children).length > 0 || Array.isArray(node.Children) && node.Children.length > 0);
            const itemId = generateUniqueId();
            
            // Calculate directory size if it's a directory
            const dirSize = isDirectory ? calculateDirectorySize(node) : 0;
            
            // Create button structure for better interaction
            html += `
                <div class="tree-item" data-level="${level}" data-path="${currentPath}" data-is-dir="${isDirectory}" id="${itemId}">
                    <button class="tree-item-button ${hasChildren ? 'has-children' : ''}" 
                            style="padding-left: ${level * 20}px; width: 100%; text-align: left; background: none; border: none; cursor: pointer; display: flex; align-items: center;">
                        <div class="tree-item-icon">${getFileIcon(node.Name, node.Type)}</div>
                        <div class="tree-item-name">${node.Name}</div>
                        ${isDirectory ? 
                            `<div class="tree-item-meta">
                                <span class="item-size">${formatFileSize(dirSize)}</span>
                                <span class="item-count">${node.FileCount !== null ? `${node.FileCount} files` : ''} 
                                ${node.TotalDirCount ? `${node.TotalDirCount} folders` : ''}</span>
                             </div>` : 
                            `<div class="tree-item-meta">
                                <span class="item-size">${formatFileSize(node.Length || node.SizeBytes)}</span>
                                <span class="item-date" title="Last modified: ${formatDate(node.LastWriteTime)}">
                                    ${formatDate(node.LastWriteTime).split(' ')[0]}
                                </span>
                             </div>`
                        }
                        ${hasChildren ? `<div class="expand-icon" data-state="collapsed"><i class="material-icons">expand_more</i></div>` : ''}
                    </button>
                </div>
            `;
            
            // If this is a directory with children, add HTML attributes for JS to target
            if (hasChildren) {
                html = html.replace('<div class="tree-item"', `<div class="tree-item" data-children-id="${itemId}-children" data-files-id="${itemId}-files"`);
            }
        }
        
        // Process Children object or array
        if (node.Children) {
            const childrenArray = Array.isArray(node.Children) 
                ? node.Children 
                : Object.keys(node.Children).length > 0 
                    ? [node.Children] 
                    : [];
            
            if (childrenArray.length > 0) {
                const parentId = level > 0 ? generateUniqueId() : '';
                html += `<div class="tree-children" id="${parentId}-children" ${level > 0 ? 'style="display:none"' : ''}>`;
                
                childrenArray.forEach(child => {
                    if (Array.isArray(child)) {
                        child.forEach(subChild => {
                            html += generateTreeHTML(subChild, level + 1, currentPath);
                        });
                    } else {
                        html += generateTreeHTML(child, level + 1, currentPath);
                    }
                });
                
                html += '</div>';
            }
        }
        
        // Process Files array or object
        if (node.Files) {
            const filesArray = Array.isArray(node.Files) ? node.Files : node.Files.Name ? [node.Files] : [];
            
            if (filesArray.length > 0) {
                const parentId = level > 0 ? generateUniqueId() : '';
                html += `<div class="tree-files" id="${parentId}-files" ${level > 0 ? 'style="display:none"' : ''}>`;
                
                filesArray.forEach(file => {
                    const fileNode = { 
                        Name: file.Name || node.Files.Name, 
                        Type: 'File',
                        Length: file.Length || node.Files.Length,
                        SizeBytes: file.SizeBytes || node.Files.SizeBytes,
                        LastWriteTime: file.LastWriteTime || node.Files.LastWriteTime,
                        CreationTime: file.CreationTime || node.Files.CreationTime
                    };
                    html += generateTreeHTML(fileNode, level + 1, currentPath);
                });
                
                html += '</div>';
            }
        }
        
        return html;
    };

    // Add styles for the file tree - changed to light theme
    const treeStyles = `
        <style>
            .file-system-tree {
                font-family: 'Roboto', sans-serif;
                background: #ffffff;
                color: #333333;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                margin: 20px 0;
                border: 1px solid #e0e0e0;
            }
            
            .tree-header {
                background: linear-gradient(135deg, #f5f9ff, #e8f4fd);
                padding: 20px;
                border-bottom: 1px solid #e6e6e6;
            }
            
            .tree-title {
                font-size: 1.4em;
                font-weight: 500;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 10px;
                color: #333;
            }
            
            .tree-search {
                margin-top: 15px;
                position: relative;
            }
            
            .tree-search input {
                width: 100%;
                padding: 10px 15px 10px 40px;
                border-radius: 30px;
                border: 1px solid #e0e0e0;
                background: #ffffff;
                color: #333;
                font-size: 14px;
                transition: all 0.3s;
            }
            
            .tree-search input:focus {
                background: #ffffff;
                outline: none;
                box-shadow: 0 0 0 2px rgba(66,133,244,0.3);
                border-color: #4285F4;
            }
            
            .tree-search i {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: #4285F4;
            }
            
            .tree-body {
                padding: 0;
                max-height: 600px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: #c1d1e0 #ffffff;
            }
            
            .tree-body::-webkit-scrollbar {
                width: 8px;
            }
            
            .tree-body::-webkit-scrollbar-track {
                background: #ffffff;
            }
            
            .tree-body::-webkit-scrollbar-thumb {
                background-color: #c1d1e0;
                border-radius: 6px;
                border: 2px solid #ffffff;
            }
            
            .tree-item {
                border-bottom: 1px solid #f0f0f0;
                transition: all 0.2s;
            }
            
            .tree-item-button {
                width: 100%;
                padding: 12px 15px;
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: all 0.2s;
                background: none;
                border: none;
                text-align: left;
                outline: none;
            }
            
            .tree-item-button:hover {
                background: #f5f9ff;
            }
            
            .tree-item-button:focus {
                background: rgba(66,133,244,0.1);
                outline: none;
            }
            
            .tree-item-button.expanded {
                background: rgba(66,133,244,0.1);
            }
            
            .tree-item-icon {
                margin-right: 10px;
                display: flex;
                align-items: center;
            }
            
            .tree-item-name {
                flex-grow: 1;
                font-weight: 400;
                color: #333;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 50%;
            }
            
            .tree-item-meta {
                margin-left: 15px;
                display: flex;
                color: #757575;
                font-size: 12px;
                gap: 15px;
            }
            
            .expand-icon {
                margin-left: 10px;
                transition: transform 0.2s;
                color: #4285F4;
            }
            
            .expand-icon[data-state="expanded"] {
                transform: rotate(180deg);
            }
            
            .tree-stats {
                background: linear-gradient(135deg, #f5f9ff, #e8f4fd);
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                font-size: 13px;
                color: #555;
                border-top: 1px solid #e6e6e6;
            }
            
            @media (max-width: 768px) {
                .tree-item-meta {
                    display: none;
                }
                
                .tree-item-name {
                    max-width: 70%;
                }
            }
        </style>
    `;

    // Calculate total size of all files
    const totalSize = calculateDirectorySize(filesData);

    // Generate the tree container
    const treeHTML = `
        ${treeStyles}
        <div class="file-system-tree" id="file-system-tree">
            <div class="tree-header">
                <h3 class="tree-title">
                    <i class="material-icons">account_circle</i>
                    Files
                </h3>
                <div class="tree-search">
                    <i class="material-icons">search</i>
                    <input type="text" placeholder="Search files..." id="file-tree-search">
                </div>
            </div>
            <div class="tree-body">
                ${generateTreeHTML(filesData)}
            </div>
            <div class="tree-stats">
                <div>Total Directories: ${countDirectories(filesData)}</div>
                <div>Total Files: ${countFiles(filesData)}</div>
                <div>Total Size: ${formatFileSize(totalSize)}</div>
            </div>
        </div>
        
        <script>
            // Completely redesigned event handling to ensure better directory interaction
            (function() {
                // This function will be called both on initial load and through a MutationObserver
                function initTreeInteractions() {
                    console.log('Initializing file tree interactions');
                    
                    // Get all folder buttons by class
                    const treeButtons = document.querySelectorAll('.tree-item-button');
                    console.log('Found tree buttons:', treeButtons.length);
                    
                    // Attach click handlers to ALL items (folder or file)
                    treeButtons.forEach(button => {
                        // Remove any existing event handlers to prevent duplicates
                        button.removeEventListener('click', handleTreeItemClick);
                        button.addEventListener('click', handleTreeItemClick);
                    });
                    
                    // Search functionality
                    const searchInput = document.getElementById('file-tree-search');
                    if (searchInput) {
                        searchInput.removeEventListener('input', handleSearchInput);
                        searchInput.addEventListener('input', handleSearchInput);
                    }
                    
                    console.log('File tree interactions initialized');
                }
                
                // Handle tree item clicks
                function handleTreeItemClick(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    console.log('Tree item clicked');
                    
                    // Get the parent tree item
                    const treeItem = this.closest('.tree-item');
                    if (!treeItem) {
                        console.log('Parent tree item not found');
                        return;
                    }
                    
                    // Check if this is a directory with children
                    const isDirectory = treeItem.getAttribute('data-is-dir') === 'true';
                    if (!isDirectory) {
                        console.log('This is a file, not a directory');
                        return;
                    }
                    
                    // Get children container and files container
                    const childrenContainerId = treeItem.getAttribute('data-children-id');
                    const filesContainerId = treeItem.getAttribute('data-files-id');
                    
                    const childrenContainer = childrenContainerId ? document.getElementById(childrenContainerId) : null;
                    const filesContainer = filesContainerId ? document.getElementById(filesContainerId) : null;
                    
                    console.log('Children container:', childrenContainerId);
                    console.log('Files container:', filesContainerId);
                    
                    // Toggle expanded state for button
                    this.classList.toggle('expanded');
                    
                    // Toggle expand icon
                    const expandIcon = this.querySelector('.expand-icon');
                    if (expandIcon) {
                        const currentState = expandIcon.getAttribute('data-state');
                        const newState = currentState === 'collapsed' ? 'expanded' : 'collapsed';
                        expandIcon.setAttribute('data-state', newState);
                    }
                    
                    // Toggle display of children and files
                    if (childrenContainer) {
                        childrenContainer.style.display = childrenContainer.style.display === 'none' ? 'block' : 'none';
                        console.log('Toggled children container to:', childrenContainer.style.display);
                    }
                    
                    if (filesContainer) {
                        filesContainer.style.display = filesContainer.style.display === 'none' ? 'block' : 'none';
                        console.log('Toggled files container to:', filesContainer.style.display);
                    }
                }
                
                // Handle search input
                function handleSearchInput() {
                    const searchTerm = this.value.toLowerCase();
                    
                    // Find all tree items
                    const treeItems = document.querySelectorAll('.tree-item');
                    
                    treeItems.forEach(item => {
                        const itemNameElem = item.querySelector('.tree-item-name');
                        if (!itemNameElem) return;
                        
                        const itemName = itemNameElem.textContent.toLowerCase();
                        const match = itemName.includes(searchTerm);
                        
                        item.style.display = match || searchTerm === '' ? 'block' : 'none';
                        
                        // If searching, expand all parent folders to show matches
                        if (match && searchTerm !== '') {
                            let parent = item.parentElement;
                            while (parent && !parent.classList.contains('tree-body')) {
                                if (parent.classList.contains('tree-children') || parent.classList.contains('tree-files')) {
                                    parent.style.display = 'block';
                                    
                                    // Find the associated tree item
                                    const parentTreeItem = document.querySelector('.tree-item[data-children-id="' + parent.id + '"]');
                                    if (parentTreeItem) {
                                        const button = parentTreeItem.querySelector('.tree-item-button');
                                        if (button) button.classList.add('expanded');
                                        
                                        const expandIcon = parentTreeItem.querySelector('.expand-icon');
                                        if (expandIcon) expandIcon.setAttribute('data-state', 'expanded');
                                    }
                                }
                                parent = parent.parentElement;
                            }
                        }
                    });
                }
                
                // Set up a MutationObserver to detect when the tree is added to the DOM
                const observer = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            // Check if our tree is in the added nodes
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeType === 1 && (
                                    node.id === 'file-system-tree' || 
                                    node.querySelector && node.querySelector('#file-system-tree')
                                )) {
                                    console.log('Tree added to DOM, initializing interactions');
                                    setTimeout(initTreeInteractions, 100);
                                }
                            });
                        }
                    });
                });
                
                // Start observing the document body for changes
                observer.observe(document.body, { childList: true, subtree: true });
                
                // Try to initialize on load
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    setTimeout(initTreeInteractions, 100);
                } else {
                    document.addEventListener('DOMContentLoaded', () => setTimeout(initTreeInteractions, 100));
                }
                
                // Additional initialization attempts with delays
                [500, 1000, 2000].forEach(delay => {
                    setTimeout(initTreeInteractions, delay);
                });
                
                // Add a global function to manually initialize (for troubleshooting)
                window.initFileExplorer = initTreeInteractions;
            })();
        </script>
    `;

    // Helper function to count directories
    function countDirectories(node) {
        if (!node) return 0;
        let count = node.Type === 'Directory' ? 1 : 0;
        
        if (node.Children) {
            const childrenArray = Array.isArray(node.Children) 
                ? node.Children 
                : Object.keys(node.Children).length > 0 
                    ? [node.Children] 
                    : [];
            
            childrenArray.forEach(child => {
                if (Array.isArray(child)) {
                    child.forEach(subChild => {
                        count += countDirectories(subChild);
                    });
                } else {
                    count += countDirectories(child);
                }
            });
        }
        
        return count;
    }

    // Helper function to count files
    function countFiles(node) {
        if (!node) return 0;
        let count = 0;
        
        if (node.Files) {
            const filesArray = Array.isArray(node.Files) ? node.Files : node.Files.Name ? 1 : 0;
            count += Array.isArray(filesArray) ? filesArray.length : filesArray;
        }
        
        if (node.Children) {
            const childrenArray = Array.isArray(node.Children) 
                ? node.Children 
                : Object.keys(node.Children).length > 0 
                    ? [node.Children] 
                    : [];
            
            childrenArray.forEach(child => {
                if (Array.isArray(child)) {
                    child.forEach(subChild => {
                        count += countFiles(subChild);
                    });
                } else {
                    count += countFiles(child);
                }
            });
        }
        
        return count;
    }

    return treeHTML;
} 