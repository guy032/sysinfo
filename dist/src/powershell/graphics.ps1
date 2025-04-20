# Collect all graphics information in a single PowerShell script
# Output structured JSON for easy parsing in the TypeScript code

# Create result object structure
$result = @{
    controllers = @();
    displays = @();
};

try {
    # 1. Get graphics controller information
    $controllers = Get-WmiObject Win32_VideoController;

    foreach ($controller in $controllers) {
        # Get registry information about memory
        $deviceId = $null;
        $memorySize = $null;
        $vendorId = $null;
        $subDeviceIdValue = $null;
        
        if ($controller.PNPDeviceID) {
            $pnpMatch = $controller.PNPDeviceID -match 'pci\\(ven_[\da-f]{4})&(dev_[\da-f]{4})(?:&(subsys_[\da-f]{8}))?(?:&(rev_[\da-f]{2}))?';
            if ($pnpMatch) {
                $vendorId = [string]$matches[1];
                $deviceId = [string]$matches[2];
                $subDeviceId = $matches[3];
                
                # Try to get memory size from registry
                if ($subDeviceId) {
                    $subDeviceIdValue = [string]$subDeviceId.Split('_')[1];
                    
                    # Look up in registry
                    $registryPath = 'HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}';
                    $regEntries = Get-ChildItem $registryPath -ErrorAction SilentlyContinue;
                    
                    foreach ($entry in $regEntries) {
                        $matchingId = Get-ItemProperty $entry.PSPath -Name 'MatchingDeviceId' -ErrorAction SilentlyContinue;
                        $matchPattern = '$vendorId&$deviceId';
                        if ($matchingId -and ($matchingId.MatchingDeviceId -match [regex]::Escape($matchPattern))) {
                            $memData = Get-ItemProperty $entry.PSPath -Name 'HardwareInformation.qwMemorySize' -ErrorAction SilentlyContinue;
                            if ($memData) {
                                $memorySize = $memData.'HardwareInformation.qwMemorySize';
                            }
                        }
                    }
                }
            }
        }

        # Add controller to result
        $controllerObj = @{
            vendor = $controller.AdapterCompatibility;
            model = $controller.Name;
            bus = if ($controller.PNPDeviceID -match '^PCI') { 'PCI' } else { '' };
            vram = if ($memorySize) { [math]::Round($memorySize / 1024 / 1024) } elseif ($controller.AdapterRAM) { [math]::Round($controller.AdapterRAM / 1024 / 1024) } else { 0 };
            vramDynamic = $controller.VideoMemoryType -eq 2;
            vendorId = if ($vendorId) { $vendorId } else { $null };
            deviceId = if ($deviceId) { $deviceId } else { $null };
            subDeviceId = $subDeviceIdValue;
            driverVersion = $controller.DriverVersion;
            name = $controller.Name;
            deviceName = $controller.Caption;
            currentHorizontalResolution = $controller.CurrentHorizontalResolution;
            currentVerticalResolution = $controller.CurrentVerticalResolution;
            currentRefreshRate = $controller.CurrentRefreshRate;
            currentBitsPerPixel = $controller.CurrentBitsPerPixel;
        };
        
        # Add to controllers array
        $result.controllers += $controllerObj;
    }
    
    # 2. Get monitor information
    $desktopMonitors = Get-CimInstance Win32_DesktopMonitor;
    $displayParams = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorBasicDisplayParams -ErrorAction SilentlyContinue;
    $connectionParams = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorConnectionParams -ErrorAction SilentlyContinue;
    
    # Get screen information
    Add-Type -AssemblyName System.Windows.Forms;
    $screens = [System.Windows.Forms.Screen]::AllScreens;
    
    # Get monitor IDs with vendor/model information
    $monitorIds = @();
    $rawMonitorIds = Get-WmiObject -Namespace root\wmi -Class WmiMonitorID -ErrorAction SilentlyContinue;
    
    foreach ($mid in $rawMonitorIds) {
        $monitorId = @{
            instanceId = $mid.InstanceName;
            vendor = -join ($mid.ManufacturerName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ });
            model = -join ($mid.UserFriendlyName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ });
            serial = -join ($mid.SerialNumberID | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ });
            productCode = -join ($mid.ProductCodeID | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ });
        };
        
        $monitorIds += $monitorId;
    }
    
    # Process display information
    foreach ($screen in $screens) {
        $displayObj = @{
            vendor = '';
            model = '';
            deviceName = $screen.DeviceName;
            main = $screen.Primary;
            builtin = $false;
            connection = $null;
            sizeX = $null;
            sizeY = $null;
            pixelDepth = $screen.BitsPerPixel;
            resolutionX = $screen.Bounds.Width;
            resolutionY = $screen.Bounds.Height;
            currentResX = $screen.Bounds.Width;
            currentResY = $screen.Bounds.Height;
            positionX = $screen.Bounds.X;
            positionY = $screen.Bounds.Y;
            currentRefreshRate = $null;
        };
        
        # Find matching display parameters
        $displayName = if ($screen.DeviceName.Contains('\')) { 
            $screen.DeviceName.Substring($screen.DeviceName.LastIndexOf('\') + 1) 
        } else { 
            $screen.DeviceName 
        };
        
        # Match with desktop monitor info
        foreach ($monitor in $desktopMonitors) {
            if ($monitor.PNPDeviceID -match $displayName) {
                $displayObj.vendor = $monitor.MonitorManufacturer;
                $displayObj.model = $monitor.MonitorType;
            }
        }
        
        # Check display params for physical size
        foreach ($param in $displayParams) {
            if ($param -and $param.InstanceName) {
                $instanceName = [string]$param.InstanceName.ToLower();
                $displayNameLower = [string]$displayName.ToLower();
                
                if ($instanceName -match $displayNameLower) {
                    $displayObj.sizeX = $param.MaxHorizontalImageSize;
                    $displayObj.sizeY = $param.MaxVerticalImageSize;
                    
                    # Try to find refresh rate
                    if ($result.controllers.Count -gt 0) {
                        $displayObj.currentRefreshRate = $result.controllers[0].currentRefreshRate;
                    }
                }
            }
        }
        
        # Determine connection type with safety checks
        foreach ($conn in $connectionParams) {
            if ($conn -and $conn.InstanceName) {
                $instanceName = [string]$conn.InstanceName.ToLower();
                $displayNameLower = [string]$displayName.ToLower();
                
                if ($instanceName -match $displayNameLower) {
                    # Check if built-in
                    if ($conn.VideoOutputTechnology -eq 2147483648) {
                        $displayObj.builtin = $true;
                        $displayObj.connection = 'Internal';
                    } elseif ($conn.VideoOutputTechnology -eq 5) {
                        $displayObj.connection = 'HDMI';
                    } elseif ($conn.VideoOutputTechnology -eq 10) {
                        $displayObj.connection = 'Display Port';
                    } else {
                        # Map other connection types if needed
                    }
                }
            }
        }
        
        # Try to get vendor/model from monitor IDs with safety checks
        foreach ($monId in $monitorIds) {
            if ($monId -and $monId.instanceId) {
                $instanceName = [string]$monId.instanceId.ToLower();
                $displayNameLower = [string]$displayName.ToLower();
                
                if ($instanceName -match $displayNameLower) {
                    if (-not [string]::IsNullOrEmpty($monId.vendor)) {
                        $displayObj.vendor = $monId.vendor;
                    }
                    
                    if (-not [string]::IsNullOrEmpty($monId.model)) {
                        $displayObj.model = $monId.model;
                    }
                }
            }
        }
        
        # Add to displays array
        $result.displays += $displayObj;
    }
    
    # If no screens found but we have a controller, create a default display
    if ($result.displays.Count -eq 0 -and $result.controllers.Count -gt 0) {
        $ctrl = $result.controllers[0];
        
        $result.displays += @{
            vendor = $ctrl.vendor;
            model = '';
            deviceName = '';
            main = $true;
            builtin = $false;
            connection = $null;
            sizeX = $null;
            sizeY = $null;
            pixelDepth = $ctrl.currentBitsPerPixel;
            resolutionX = $ctrl.currentHorizontalResolution;
            resolutionY = $ctrl.currentVerticalResolution;
            currentResX = $ctrl.currentHorizontalResolution;
            currentResY = $ctrl.currentVerticalResolution;
            positionX = 0;
            positionY = 0;
            currentRefreshRate = $ctrl.currentRefreshRate;
        };
    }
    
    # Output the result as JSON
    $result | ConvertTo-Json -Depth 3 -Compress;
} catch {
    # Return error information as JSON
    @{
        error = $true;
        message = $_.Exception.Message;
        controllers = @();
        displays = @();
    } | ConvertTo-Json -Compress;
}

# Ensure proper termination
if ($Error.Count -gt 0) {
    # Log error if needed
    $Error[0] | Out-String | Write-Debug
} 