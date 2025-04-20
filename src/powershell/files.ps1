function Get-DirTree {
    param(
        [string] $p = 'C:\',
        [int] $d = 5,
        [int] $fileOffset = 0,
        [int] $fileLimit = 10,
        [int] $dirOffset = 0,
        [int] $dirLimit = 10,
        [bool] $includeSystemDirs = $false
    )
    
    # Override parameters with environment variables if they exist
    if ($env:P) { $p = $env:P }
    if ($env:DEPTH) { $d = [int]$env:DEPTH }
    if ($env:FILEOFFSET) { $fileOffset = [int]$env:FILEOFFSET }
    if ($env:FILELIMIT) { $fileLimit = [int]$env:FILELIMIT }
    if ($env:DIROFFSET) { $dirOffset = [int]$env:DIROFFSET }
    if ($env:DIRLIMIT) { $dirLimit = [int]$env:DIRLIMIT }
    if ($env:INCLUDESYSTEMDIRS -ne $null) { $includeSystemDirs = [System.Convert]::ToBoolean($env:INCLUDESYSTEMDIRS) }
    
    # Base case: if depth is 0 or negative, return empty array
    if ($d -le 0) { 
        return @{
            Name = Split-Path $p -Leaf;
            Path = $p;
            Type = 'Directory';
            FileCount = 0;
            SizeBytes = 0;
            TotalDirCount = 0;
            Files = @();
            Children = @();
            HasMoreFiles = $false;
            HasMoreDirs = $false;
            FileOffset = $fileOffset;
            FileLimit = $fileLimit;
            DirOffset = $dirOffset;
            DirLimit = $dirLimit;
        }
    }

    $epoch = [datetime]'1970-01-01';
    
    # System directories to exclude
    $systemDirs = @(
        'C:\Windows', 
        'C:\Program Files', 
        'C:\Program Files (x86)', 
        'C:\$Recycle.Bin', 
        'C:\$GetCurrent', 
        'C:\$WinREAgent', 
        'C:\$AV_AVG',
        'C:\System Volume Information',
        'C:\Recovery'
    );
    
    try {
        # Get files with pagination
        $allFiles = Get-ChildItem $p -File -Force -ErrorAction SilentlyContinue;
        $fileCount = $allFiles.Count;
        $files = $allFiles | Select-Object -Skip $fileOffset -First $fileLimit;
        
        # Format files
        $fileArray = @();
        foreach ($file in $files) {
            $fileArray += [PSCustomObject]@{
                Name = $file.Name;
                Length = $file.Length;
                LastAccessTime = [int64]([datetime]$file.LastAccessTime.ToUniversalTime() - $epoch).TotalMilliseconds;
                LastWriteTime = [int64]([datetime]$file.LastWriteTime.ToUniversalTime() - $epoch).TotalMilliseconds;
                CreationTime = [int64]([datetime]$file.CreationTime.ToUniversalTime() - $epoch).TotalMilliseconds;
                Type = ($file.Extension -replace '^\.','');
            };
        }
        
        # Calculate total size of listed files
        $size = if ($fileArray) { ($fileArray | Measure-Object Length -Sum).Sum; } else { 0; };
        
        # Get and process directories with pagination, filtering out system directories
        $allDirs = Get-ChildItem $p -Directory -Force -ErrorAction SilentlyContinue | Where-Object {
            $includeSystemDirs -or (
                ($_.Name -notlike '$*') -and 
                ($systemDirs -notcontains $_.FullName)
            )
        };
        
        $dirCount = $allDirs.Count;
        $directories = $allDirs | Select-Object -Skip $dirOffset -First $dirLimit;
        
        # Process child directories
        $childArray = @();
        foreach ($dir in $directories) {
            try {
                # Recursively process each child directory with reduced depth
                $child = Get-DirTree -p $dir.FullName -d ($d-1) -fileOffset 0 -fileLimit $fileLimit -dirOffset 0 -dirLimit $dirLimit -includeSystemDirs:$includeSystemDirs;
                if ($child) { 
                    $childArray += $child;
                }
            } catch {
                # Log error but continue processing other directories
                Write-Error "Error processing directory $($dir.FullName): $_"
            }
        }
        
        # Return directory information
        return @{
            Name = Split-Path $p -Leaf;
            Path = $p;
            Type = 'Directory';
            FileCount = $fileCount;
            SizeBytes = $size;
            TotalDirCount = $dirCount;
            Files = $fileArray;
            Children = $childArray;
            HasMoreFiles = $fileCount -gt ($fileOffset + $fileLimit);
            HasMoreDirs = $dirCount -gt ($dirOffset + $dirLimit);
            FileOffset = $fileOffset;
            FileLimit = $fileLimit;
            DirOffset = $dirOffset;
            DirLimit = $dirLimit;
        }
    } catch {
        # Return error information
        return @{
            Name = Split-Path $p -Leaf;
            Path = $p;
            Type = 'Directory';
            FileCount = 0;
            SizeBytes = 0;
            TotalDirCount = 0;
            Files = @();
            Children = @();
            HasMoreFiles = $false;
            HasMoreDirs = $false;
            FileOffset = $fileOffset;
            FileLimit = $fileLimit;
            DirOffset = $dirOffset;
            DirLimit = $dirLimit;
            Error = $_.Exception.Message;
        }
    }
}

# Example Usage with system directories excluded:
Get-DirTree | ConvertTo-Json -Depth 20 -Compress;
