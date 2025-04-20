# Get params from environment if available
$skip = if ($env:SKIP) { [int]$env:SKIP } else { 0 };
$batchSize = if ($env:BATCHSIZE) { [int]$env:BATCHSIZE } else { 100 };

try {
    # Get all available applications - using multiple calls to avoid comma issues
    $apps1 = Get-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*" -ErrorAction SilentlyContinue;
    $apps2 = Get-ItemProperty -Path "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*" -ErrorAction SilentlyContinue;
    $apps3 = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*" -ErrorAction SilentlyContinue;
    
    # Combine all apps and filter out ones without DisplayName
    $allApps = @();
    $allApps += $apps1 | Where-Object { $_.DisplayName } | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallSource, UninstallString, InstallLocation, EstimatedSize;
    $allApps += $apps2 | Where-Object { $_.DisplayName } | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallSource, UninstallString, InstallLocation, EstimatedSize;
    $allApps += $apps3 | Where-Object { $_.DisplayName } | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallSource, UninstallString, InstallLocation, EstimatedSize;
    
    # Calculate total count
    $totalCount = $allApps.Count;
    
    # Apply pagination
    $items = $allApps | 
             ForEach-Object { 
                [PSCustomObject]@{ 
                   Name = $_.DisplayName;
                   Version = $_.DisplayVersion;
                   Publisher = $_.Publisher;
                   InstallDate = $_.InstallDate;
                   InstallSource = $_.InstallSource;
                   UninstallString = $_.UninstallString;
                   InstallLocation = $_.InstallLocation;
                   EstimatedSizeMB = if ($_.EstimatedSize) { [math]::Round($_.EstimatedSize / 1024, 2); } else { $null; }
                } 
             } | 
             Sort-Object Name | 
             Select-Object -Skip $skip -First $batchSize;
    
    # Create result object with metadata
    $result = [PSCustomObject]@{
        Items = $items;
        TotalCount = $totalCount;
        Skip = $skip;
        BatchSize = $batchSize;
    };
    
    # Output as JSON
    ConvertTo-Json -InputObject $result -Depth 3 -Compress;
}
catch {
    # Return error information
    $errorResult = [PSCustomObject]@{
        Items = @();
        TotalCount = 0;
        Error = $_.Exception.Message;
    };
    
    ConvertTo-Json -InputObject $errorResult -Compress;
} 