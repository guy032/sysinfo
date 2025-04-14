# Get params from environment if available
$skip = if ($env:SKIP) { [int]$env:SKIP } else { 0 };
$batchSize = if ($env:BATCHSIZE) { [int]$env:BATCHSIZE } else { 100 };
$processFilter = if ($env:PROCESSFILTER) { $env:PROCESSFILTER.ToLower() -split '\|' } else { $null };

# Load persistent CPU data if available
$cpuDataFile = Join-Path $env:TEMP "SystemInformation_CPUData.json";
$previousCPUData = @{
    all = 0;
    all_utime = 0;
    all_stime = 0;
    list = @{};
    ms = 0;
};

try {
    if (Test-Path $cpuDataFile) {
        $previousCPUDataContent = Get-Content $cpuDataFile -Raw;
        $previousCPUData = ConvertFrom-Json $previousCPUDataContent -AsHashtable;
    }
} catch {
    # Continue with default values if file can't be read
}

try {
    # Get all processes with both CIM and Get-Process for more data
    $allCimProcesses = Get-CimInstance Win32_Process | 
                    Select-Object ProcessId, ParentProcessId, Caption, CommandLine, ExecutablePath, 
                                  UserModeTime, KernelModeTime, WorkingSetSize, PageFileUsage, 
                                  Priority, ExecutionState, CreationDate;
    
    # Get responding state from Get-Process as a separate step
    $allNativeProcesses = @{};
    Get-Process | ForEach-Object {
        $procId = $_.Id;
        $responding = $_.Responding;
        $status = if ($responding) { 'running' } else { 'not responding' };
        $allNativeProcesses[$procId] = @{
            Responding = $responding;
            Status = $status;
        };
    };
    
    # Extract CPU time totals for percentage calculation
    $allCpuTime = 0;
    $allUserTime = 0;
    $allKernelTime = 0;
    
    $allCimProcesses | ForEach-Object {
        $allUserTime += $_.UserModeTime;
        $allKernelTime += $_.KernelModeTime;
    };
    $allCpuTime = $allUserTime + $allKernelTime;
    
    # Create process stats
    $procStats = @{};
    $groupedProcesses = @{};
    
    # First pass - group processes by name and calculate raw stats
    $allCimProcesses | ForEach-Object {
        $processId = $_.ProcessId;
        $parentId = $_.ParentProcessId;
        $name = $_.Caption;
        $simpleName = if ($name -match '/') { $name.Substring(0, $name.IndexOf('/')) } else { $name };
        $userTime = $_.UserModeTime;
        $kernelTime = $_.KernelModeTime;
        $memUsage = if ($_.WorkingSetSize -gt 0) { [math]::Round($_.WorkingSetSize / 1MB, 2) } else { 0 };
        
        # Store process stats for CPU calculation
        $procStats[$processId] = @{
            name = $name;
            simpleName = $simpleName;
            parentId = $parentId;
            userTime = $userTime;
            kernelTime = $kernelTime;
            totalTime = $userTime + $kernelTime;
            memUsage = $memUsage;
            memVsz = $_.PageFileUsage;
            memRss = [math]::Floor($_.WorkingSetSize / 1KB);
        };
        
        # Group by simple name
        if (-not $groupedProcesses.ContainsKey($simpleName.ToLower())) {
            $groupedProcesses[$simpleName.ToLower()] = @{
                name = $simpleName;
                pids = @();
                cpu = 0;
                mem = 0;
            };
        }
        
        $groupedProcesses[$simpleName.ToLower()].pids += $processId;
        $groupedProcesses[$simpleName.ToLower()].mem += $memUsage;
    };
    
    # Calculate CPU usage percentages
    $cpuPerProcess = @{};
    $procStats.Keys | ForEach-Object {
        $processId = $_;
        $proc = $procStats[$processId];
        $cpu = 0;
        $cpuu = 0;
        $cpus = 0;
        
        # Calculate CPU usage if we have previous data
        if ($previousCPUData.all -gt 0 -and $previousCPUData.list.ContainsKey("$processId")) {
            $prevProc = $previousCPUData.list["$processId"];
            $timeDiff = $allCpuTime - $previousCPUData.all;
            
            if ($timeDiff -gt 0) {
                $userDiff = $proc.userTime - $prevProc.utime;
                $kernelDiff = $proc.kernelTime - $prevProc.stime;
                $cpuu = ($userDiff / $timeDiff) * 100;
                $cpus = ($kernelDiff / $timeDiff) * 100;
                $cpu = $cpuu + $cpus;
            }
        } else {
            # First run, use current values
            $cpuu = ($proc.userTime / [math]::Max($allCpuTime, 1)) * 100;
            $cpus = ($proc.kernelTime / [math]::Max($allCpuTime, 1)) * 100;
            $cpu = $cpuu + $cpus;
        }
        
        $cpuPerProcess[$processId] = @{
            cpu = [math]::Round($cpu, 2);
            cpuu = [math]::Round($cpuu, 2);
            cpus = [math]::Round($cpus, 2);
        };
        
        # Add to the process group total
        $groupName = $proc.simpleName.ToLower();
        if ($groupedProcesses.ContainsKey($groupName)) {
            $groupedProcesses[$groupName].cpu += [math]::Round($cpu, 2);
        }
    };
    
    # Store current CPU data for next run
    $currentCPUData = @{
        all = $allCpuTime;
        all_utime = $allUserTime;
        all_stime = $allKernelTime;
        list = @{};
        ms = [long](Get-Date).ToFileTime();
    };
    
    # Store process data for next run
    $procStats.Keys | ForEach-Object {
        $processId = $_;
        $proc = $procStats[$processId];
        $currentCPUData.list["$processId"] = @{
            utime = $proc.userTime;
            stime = $proc.kernelTime;
        };
    };
    
    # Save CPU data
    try {
        $currentCPUDataJson = ConvertTo-Json $currentCPUData -Depth 4 -Compress;
        Set-Content -Path $cpuDataFile -Value $currentCPUDataJson;
    } catch {
        # Continue if can't save the file
    }
    
    # Apply process filtering if specified
    $filteredGroups = @();
    if ($processFilter) {
        # Filter by process name
        foreach ($pattern in $processFilter) {
            $wildcard = "*" + $pattern + "*";
            $filtered = $groupedProcesses.Keys | Where-Object { $_ -like $wildcard } | ForEach-Object { $groupedProcesses[$_] };
            $filteredGroups += $filtered;
        }
        
        # Add missing process names
        foreach ($pattern in $processFilter) {
            $wildcard = "*" + $pattern + "*";
            $found = $false;
            foreach ($group in $filteredGroups) {
                if ($group.name -like $wildcard) {
                    $found = $true;
                    break;
                }
            }
            
            if (-not $found) {
                $filteredGroups += @{
                    name = $pattern;
                    pids = @();
                    cpu = 0;
                    mem = 0;
                };
            }
        }
    } else {
        # Use all processes
        $filteredGroups = $groupedProcesses.Values;
    }
    
    # Create final result items
    # Apply pagination if requested
    $totalCount = $filteredGroups.Count;
    $paginatedGroups = $filteredGroups | Select-Object -Skip $skip -First $batchSize;
    
    $items = $paginatedGroups | ForEach-Object {
        $group = $_;
        $mainPid = if ($group.pids.Count -gt 0) { $group.pids[0] } else { $null };
        
        # Create final item
        $item = [PSCustomObject]@{
            proc = $group.name;
            pid = $mainPid;
            pids = $group.pids;
            cpu = [math]::Round($group.cpu, 2);
            mem = [math]::Round($group.mem, 2);
            processes = @();
        };
        
        # Add individual processes if we have them
        foreach ($procId in $group.pids) {
            # Get process details
            $proc = $procStats[$procId];
            $cpu = $cpuPerProcess[$procId];
            
            # Determine state
            $state = 'unknown';
            if ($allNativeProcesses.ContainsKey($procId)) {
                if ($allNativeProcesses[$procId].Responding -eq $false) {
                    $state = 'blocked';
                } else {
                    $state = 'running';
                }
            }
            
            # Add process detail
            $process = [PSCustomObject]@{
                pid = $procId;
                parentPid = $proc.parentId;
                name = $proc.name;
                cpu = $cpu.cpu;
                cpuu = $cpu.cpuu;
                cpus = $cpu.cpus;
                mem = $proc.memUsage;
                priority = $null;
                memVsz = $proc.memVsz;
                memRss = $proc.memRss;
                state = $state;
            };
            
            $item.processes += $process;
        }
        
        return $item;
    };
    
    # Create result object with metadata
    $result = [PSCustomObject]@{
        Items = $items;
        TotalCount = $totalCount;
        Skip = $skip;
        BatchSize = $batchSize;
    };
    
    # Output as JSON
    ConvertTo-Json -InputObject $result -Depth 5 -Compress;
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