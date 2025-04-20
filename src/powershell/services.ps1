# Get params from environment if available
$skip = if ($env:SKIP) { [int]$env:SKIP } else { 0 };
$batchSize = if ($env:BATCHSIZE) { [int]$env:BATCHSIZE } else { 100 };
$serviceNames = if ($env:SERVICENAMES) { $env:SERVICENAMES.Split(',') } else { @('*') };

try {
    $allServices = @();
    
    # If we have specific services, use them, otherwise get all
    if ($serviceNames -and $serviceNames[0] -ne '*') {
        foreach ($serviceName in $serviceNames) {
            $serviceInfo = Get-CimInstance Win32_Service -Filter "Name='$serviceName'" -ErrorAction SilentlyContinue | 
                          Select-Object Name, DisplayName, State, StartMode, ProcessId, PathName;
            if ($serviceInfo) {
                $allServices += $serviceInfo;
            } else {
                # Try with caption/display name
                $serviceInfo = Get-CimInstance Win32_Service -Filter "Caption='$serviceName'" -ErrorAction SilentlyContinue | 
                              Select-Object Name, DisplayName, State, StartMode, ProcessId, PathName;
                if ($serviceInfo) {
                    $allServices += $serviceInfo;
                }
            }
        }
    } else {
        # Get all services
        $allServices = Get-CimInstance Win32_Service | 
                     Select-Object Name, DisplayName, State, StartMode, ProcessId, PathName;
    }
    
    # Calculate total count
    $totalCount = $allServices.Count;
    
    # Apply pagination
    $items = $allServices | 
             Select-Object -Skip $skip -First $batchSize | 
             ForEach-Object { 
                [PSCustomObject]@{ 
                   name = $_.Name;
                   displayName = $_.DisplayName;
                   running = ($_.State -eq 'Running');
                   startmode = $_.StartMode;
                   pids = @(if ($_.ProcessId -gt 0) { $_.ProcessId } else { });
                   path = $_.PathName;
                } 
             };
    
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