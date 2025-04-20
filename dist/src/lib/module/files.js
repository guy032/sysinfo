"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.files = files;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const util = tslib_1.__importStar(require("../util"));
const platform_1 = require("../util/platform");
/**
 * Default batch settings
 */
const DEFAULT_BATCH_SETTINGS = {
    fileOffset: 0,
    fileLimit: 1,
    dirOffset: 0,
    dirLimit: 1,
    maxDepth: 1,
    includeSystemDirs: false,
};
/**
 * Get the path to the PowerShell script
 * @returns The absolute path to the Files PowerShell script
 */
function getFilesScriptPath() {
    // Calculate the path to the PowerShell script relative to this file
    return path_1.default.resolve(__dirname, '../../powershell/files.ps1');
}
/**
 * Helper function to fetch directory data in batches and build a complete tree
 * @param options Options for the file retrieval
 * @param dirPath Path to start directory traversal
 * @returns Promise resolving to complete directory tree
 */
async function fetchDirectoryData(options = {}, dirPath = 'C:\\', currentDepth = 0) {
    try {
        // Get batch settings from options or use defaults
        const batchSettings = options.batch || DEFAULT_BATCH_SETTINGS;
        const maxDepth = batchSettings.maxDepth || DEFAULT_BATCH_SETTINGS.maxDepth;
        // If we've reached max depth, return early
        if (currentDepth > maxDepth) {
            return {
                Name: path_1.default.basename(dirPath),
                Path: dirPath,
                Type: 'Directory',
                FileCount: 0,
                SizeBytes: 0,
                Files: [],
                Children: [],
            };
        }
        // Create PowerShell script options for this directory
        const scriptOptions = {
            ...options,
            p: dirPath,
            d: maxDepth - currentDepth,
            fileOffset: batchSettings.fileOffset || DEFAULT_BATCH_SETTINGS.fileOffset,
            fileLimit: batchSettings.fileLimit || DEFAULT_BATCH_SETTINGS.fileLimit,
            dirOffset: batchSettings.dirOffset || DEFAULT_BATCH_SETTINGS.dirOffset,
            dirLimit: batchSettings.dirLimit || DEFAULT_BATCH_SETTINGS.dirLimit,
            includeSystemDirs: batchSettings.includeSystemDirs || DEFAULT_BATCH_SETTINGS.includeSystemDirs,
        };
        // Get the script path
        const scriptPath = getFilesScriptPath();
        // Execute the script to get the first batch of data
        const result = await util.executeScript(scriptPath, scriptOptions);
        const output = Array.isArray(result) ? result.join('\n') : result;
        if (!output || !output.trim()) {
            throw new Error('No data returned from script');
        }
        // Parse the results
        const dirData = JSON.parse(output);
        // Process all children if they have more directories and we haven't reached max depth
        if (dirData.Children &&
            Array.isArray(dirData.Children) &&
            dirData.Children.length > 0 &&
            currentDepth < maxDepth) {
            // Process children sequentially to avoid overwhelming the system
            const completedChildren = [];
            // Process each child with a timeout (limit to max 30 seconds per child)
            for (const child of dirData.Children) {
                try {
                    // Start a timer for this child processing
                    const startTime = Date.now();
                    const maxTime = 30_000; // 30 seconds max per child
                    // If this child has more directories, fetch them in additional batches
                    const processedChild = { ...child };
                    // Set up a processed flag so we know if we've successfully recursed
                    let processed = false;
                    // Recursively fetch subdirectory data if we haven't reached time limit
                    if (currentDepth < maxDepth && Date.now() - startTime < maxTime) {
                        try {
                            // Recursively process each child directory
                            const fullChildData = await fetchDirectoryData(options, child.Path, currentDepth + 1);
                            // Check if we're still within time limit
                            if (Date.now() - startTime < maxTime) {
                                // Merge any existing files/metadata with the full child data
                                processedChild.Children = fullChildData.Children || [];
                                processedChild.FileCount = fullChildData.FileCount || child.FileCount || 0;
                                processedChild.SizeBytes = fullChildData.SizeBytes || child.SizeBytes || 0;
                                // If we already have files from the batch, keep those
                                processedChild.Files =
                                    child.Files && child.Files.length > 0 ? child.Files : fullChildData.Files || [];
                                processed = true;
                            }
                        }
                        catch (error) {
                            console.error(`Error processing child ${child.Path}:`, error);
                            // Continue with the original child data
                        }
                    }
                    // If we didn't process successfully (timeout or error), use original data
                    if (!processed) {
                        console.warn(`Using original data for ${child.Path} due to processing constraints`);
                    }
                    completedChildren.push(processedChild);
                }
                catch (error) {
                    console.error(`Error processing child in parent ${dirPath}:`, error);
                    // Add the original child to maintain structure
                    completedChildren.push(child);
                }
            }
            // Replace the children in the directory data
            dirData.Children = completedChildren;
        }
        // If this directory has more children (paged), fetch additional batches
        // Only fetch more if we haven't reached the depth limit
        if (dirData.HasMoreDirs && currentDepth < maxDepth) {
            try {
                let hasMoreChildren = true;
                let dirOffset = batchSettings.dirLimit || DEFAULT_BATCH_SETTINGS.dirLimit;
                // Limit the number of additional batches to avoid overwhelming the system
                const maxBatches = 5; // Reduced from 10 to 5 for safety
                let batchCount = 0;
                // Continue fetching more children until we have them all or reach limits
                while (hasMoreChildren &&
                    dirOffset < (dirData.TotalDirCount || 0) &&
                    batchCount < maxBatches) {
                    try {
                        // Get the next batch of children
                        const nextBatchOptions = {
                            ...options,
                            p: dirPath,
                            d: maxDepth - currentDepth,
                            fileOffset: batchSettings.fileOffset || DEFAULT_BATCH_SETTINGS.fileOffset,
                            fileLimit: batchSettings.fileLimit || DEFAULT_BATCH_SETTINGS.fileLimit,
                            dirOffset,
                            dirLimit: batchSettings.dirLimit || DEFAULT_BATCH_SETTINGS.dirLimit,
                            includeSystemDirs: batchSettings.includeSystemDirs || DEFAULT_BATCH_SETTINGS.includeSystemDirs,
                        };
                        // Execute the script directly to get the next batch
                        const scriptPath = getFilesScriptPath();
                        const batchResult = await util.executeScript(scriptPath, nextBatchOptions);
                        const batchOutput = Array.isArray(batchResult) ? batchResult.join('\n') : batchResult;
                        if (batchOutput && batchOutput.trim()) {
                            // Parse the batch results
                            const nextBatchData = JSON.parse(batchOutput);
                            // Add the children from the next batch to our collection
                            if (nextBatchData.Children && nextBatchData.Children.length > 0) {
                                // Process children in the next batch the same way we did for the first batch
                                const processedChildren = [];
                                for (const child of nextBatchData.Children) {
                                    try {
                                        // If this child has more directories, fetch them recursively
                                        const processedChild = { ...child };
                                        if (currentDepth < maxDepth - 1) {
                                            try {
                                                // Recursively process each child directory
                                                const fullChildData = await fetchDirectoryData(options, child.Path, currentDepth + 1);
                                                // Merge any existing files/metadata with the full child data
                                                processedChild.Children = fullChildData.Children || [];
                                                processedChild.FileCount = fullChildData.FileCount || child.FileCount || 0;
                                                processedChild.SizeBytes = fullChildData.SizeBytes || child.SizeBytes || 0;
                                                // If we already have files from the batch, keep those
                                                processedChild.Files =
                                                    child.Files && child.Files.length > 0
                                                        ? child.Files
                                                        : fullChildData.Files || [];
                                            }
                                            catch (error) {
                                                console.error(`Error processing child ${child.Path}:`, error);
                                                // Continue with the original child data
                                            }
                                        }
                                        processedChildren.push(processedChild);
                                    }
                                    catch (error) {
                                        console.error(`Error processing child in batch ${dirOffset}:`, error);
                                        // Add the original child to maintain structure
                                        processedChildren.push(child);
                                    }
                                }
                                // Add the processed children to our main collection
                                dirData.Children = dirData.Children.concat(processedChildren);
                            }
                            // Update hasMoreChildren flag
                            hasMoreChildren = nextBatchData.HasMoreDirs || false;
                        }
                        else {
                            hasMoreChildren = false;
                        }
                        // Update offset for next batch
                        dirOffset += batchSettings.dirLimit || DEFAULT_BATCH_SETTINGS.dirLimit;
                        batchCount++;
                    }
                    catch (error) {
                        console.error(`Error fetching directory batch for ${dirPath} at offset ${dirOffset}:`, error);
                        hasMoreChildren = false;
                    }
                }
            }
            catch (error) {
                console.error(`Error fetching additional directory batches for ${dirPath}:`, error);
                // Continue with what we have so far
            }
        }
        // If this directory has more files (paged), fetch additional file batches
        if (dirData.HasMoreFiles) {
            try {
                let hasMoreFiles = true;
                let fileOffset = batchSettings.fileLimit || DEFAULT_BATCH_SETTINGS.fileLimit;
                // Define the array with explicit type to avoid type errors
                const allFiles = [...(dirData.Files || [])];
                // Limit the number of file batches
                const maxFileBatches = 1; // Reduced from 20 to 10 for safety
                let fileBatchCount = 0;
                // Continue fetching more files until we have them all or reach limits
                while (hasMoreFiles &&
                    fileOffset < (dirData.FileCount || 0) &&
                    fileBatchCount < maxFileBatches) {
                    try {
                        // Get the next batch of files
                        const fileOptions = {
                            ...options,
                            p: dirPath,
                            d: maxDepth - currentDepth,
                            fileOffset,
                            fileLimit: batchSettings.fileLimit || DEFAULT_BATCH_SETTINGS.fileLimit,
                            dirOffset: 0, // We don't need directories in subsequent file batches
                            dirLimit: 0, // Skip directories to save time
                            includeSystemDirs: batchSettings.includeSystemDirs || DEFAULT_BATCH_SETTINGS.includeSystemDirs,
                        };
                        // Execute the script for files only
                        const scriptPath = getFilesScriptPath();
                        const fileResult = await util.executeScript(scriptPath, fileOptions);
                        const fileOutput = Array.isArray(fileResult) ? fileResult.join('\n') : fileResult;
                        if (fileOutput && fileOutput.trim()) {
                            try {
                                const fileData = JSON.parse(fileOutput);
                                // Add files from this batch
                                if (fileData.Files && Array.isArray(fileData.Files) && fileData.Files.length > 0) {
                                    allFiles.push(...fileData.Files);
                                }
                                // Update offset for next batch
                                fileOffset += batchSettings.fileLimit || DEFAULT_BATCH_SETTINGS.fileLimit;
                                fileBatchCount++;
                                // Check if we need more batches
                                hasMoreFiles = fileData.HasMoreFiles || false;
                            }
                            catch (parseError) {
                                console.error(`Error parsing file batch JSON for ${dirPath}:`, parseError);
                                hasMoreFiles = false;
                            }
                        }
                        else {
                            hasMoreFiles = false;
                        }
                    }
                    catch (error) {
                        console.error(`Error fetching file batch for ${dirPath} at offset ${fileOffset}:`, error);
                        hasMoreFiles = false;
                    }
                }
                // Update files in the directory data
                dirData.Files = allFiles;
            }
            catch (error) {
                console.error(`Error fetching additional file batches for ${dirPath}:`, error);
                // Continue with the files we have so far
            }
        }
        // Return the fully populated directory data
        return dirData;
    }
    catch (error) {
        console.error(`Error fetching directory data for ${dirPath}:`, error);
        // Return a minimal structure in case of error
        return {
            Name: path_1.default.basename(dirPath),
            Path: dirPath,
            Type: 'Directory',
            FileCount: 0,
            SizeBytes: 0,
            Files: [],
            Children: [],
            error: true,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Get directory and file information from the system
 *
 * @param {IFileOptions} options - options for WinRM if used remotely and path/depth settings
 * @param {IFilesCallback} callback - callback function
 * @returns {Promise<IFileData>} - File/directory tree data
 */
function files(options = {}, callback) {
    // Get platform flags from options
    const platform = (0, platform_1.getPlatformFlagsFromOptions)(options);
    // Set default batch settings if not provided
    if (!options.batch) {
        options.batch = { ...DEFAULT_BATCH_SETTINGS };
    }
    // Get the start path from options or use default
    const startPath = options.path || 'C:\\';
    // Log what we're going to do
    console.log(`Starting directory scan on ${startPath} with batch settings:`, JSON.stringify({
        fileLimit: options.batch.fileLimit || DEFAULT_BATCH_SETTINGS.fileLimit,
        dirLimit: options.batch.dirLimit || DEFAULT_BATCH_SETTINGS.dirLimit,
        maxDepth: options.batch.maxDepth || DEFAULT_BATCH_SETTINGS.maxDepth,
    }));
    let result = {};
    return new Promise((resolve) => {
        process.nextTick(async () => {
            try {
                // Only proceed with Windows platforms
                if (!platform._windows) {
                    result = {
                        error: true,
                        message: 'File tree data only available on Windows platforms',
                        Name: '',
                        Path: '',
                        Type: '',
                        FileCount: 0,
                        SizeBytes: 0,
                        Files: [],
                        Children: [],
                    };
                    if (callback) {
                        callback(result);
                    }
                    resolve(result);
                    return;
                }
                try {
                    // Fetch the complete directory tree using our recursive batching function
                    result = await fetchDirectoryData(options, startPath);
                    console.log(`Completed directory scan. Found ${result.TotalDirCount} directories and ${result.FileCount} files at the root level.`);
                    // Clean up pagination metadata that isn't needed in the final result
                    delete result.HasMoreFiles;
                    delete result.HasMoreDirs;
                    delete result.FileOffset;
                    delete result.FileLimit;
                    delete result.DirOffset;
                    delete result.DirLimit;
                    // Also clean up pagination metadata from all children recursively
                    const cleanChildren = (children) => {
                        for (const child of children) {
                            delete child.HasMoreFiles;
                            delete child.HasMoreDirs;
                            delete child.FileOffset;
                            delete child.FileLimit;
                            delete child.DirOffset;
                            delete child.DirLimit;
                            if (child.Children && child.Children.length > 0) {
                                cleanChildren(child.Children);
                            }
                        }
                    };
                    if (result.Children && result.Children.length > 0) {
                        cleanChildren(result.Children);
                    }
                }
                catch (error) {
                    console.error('Error processing directory data:', error);
                    result = {
                        error: true,
                        message: 'Failed to process directory data',
                        errorDetails: error instanceof Error ? error.message : String(error),
                        Name: '',
                        Path: '',
                        Type: '',
                        FileCount: 0,
                        SizeBytes: 0,
                        Files: [],
                        Children: [],
                    };
                }
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
            catch (error) {
                console.error('Files error:', error);
                result = {
                    error: true,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    Name: '',
                    Path: '',
                    Type: '',
                    FileCount: 0,
                    SizeBytes: 0,
                    Files: [],
                    Children: [],
                };
                if (callback) {
                    callback(result);
                }
                resolve(result);
            }
        });
    });
}
