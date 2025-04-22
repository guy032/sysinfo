$result = @{ controllers = @(); displays = @(); };

try {
    # --- Controllers (your original code) ---
    $controllers = Get-WmiObject Win32_VideoController;
    foreach ($controller in $controllers) {
        $deviceId = $null;
        $memorySize = $null;
        $vendorId = $null;
        $subDeviceIdValue = $null;
        if ($controller.PNPDeviceID) {
            if ($controller.PNPDeviceID -match 'pci\\(ven_[\da-f]{4})&(dev_[\da-f]{4})(?:&(subsys_[\da-f]{8}))?(?:&(rev_[\da-f]{2}))?') {
                $vendorId = [string]$matches[1];
                $deviceId = [string]$matches[2];
                $subDeviceId = $matches[3];
                if ($subDeviceId) {
                    $subDeviceIdValue = [string]$subDeviceId.Split('_')[1];
                    $registryPath = 'HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}';
                    $regEntries = Get-ChildItem $registryPath -ErrorAction SilentlyContinue;
                    foreach ($entry in $regEntries) {
                        $matchingId = Get-ItemProperty $entry.PSPath -Name 'MatchingDeviceId' -ErrorAction SilentlyContinue;
                        $matchPattern = '$vendorId&$deviceId';
                        if ($matchingId -and ($matchingId.MatchingDeviceId -match [regex]::Escape($matchPattern))) {
                            $memData = Get-ItemProperty $entry.PSPath -Name 'HardwareInformation.qwMemorySize' -ErrorAction SilentlyContinue;
                            if ($memData) {
                                $memorySize = $memData.'HardwareInformation.qwMemorySize';
                            };
                        };
                    };
                };
            };
        };
        $controllerObj = @{
            vendor = $controller.AdapterCompatibility;
            model = $controller.Name;
            bus = if ($controller.PNPDeviceID -match '^PCI') { 'PCI' } else { '' };
            vram = if ($memorySize) { [math]::Round($memorySize / 1MB) } elseif ($controller.AdapterRAM) { [math]::Round($controller.AdapterRAM / 1MB) } else { 0 };
            vramDynamic = $controller.VideoMemoryType -eq 2;
            vendorId = $vendorId;
            deviceId = $deviceId;
            subDeviceId = $subDeviceIdValue;
            driverVersion = $controller.DriverVersion;
            name = $controller.Name;
            deviceName = $controller.Caption;
            currentHorizontalResolution = $controller.CurrentHorizontalResolution;
            currentVerticalResolution = $controller.CurrentVerticalResolution;
            currentRefreshRate = $controller.CurrentRefreshRate;
            currentBitsPerPixel = $controller.CurrentBitsPerPixel;
        };
        $result.controllers += $controllerObj;
    };

    # --- Displays (your improved version) ---
    $monitors = @();
    $monitorIDs = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction SilentlyContinue;
    $connectionParams = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorConnectionParams -ErrorAction SilentlyContinue;
    $displayParams = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorBasicDisplayParams -ErrorAction SilentlyContinue;

    foreach ($monitor in $monitorIDs) {
        $instanceName = $monitor.InstanceName;

        $monitorObj = @{
            instanceName = $instanceName;
            vendor = (-join ($monitor.ManufacturerName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ })).Trim();
            model = (-join ($monitor.UserFriendlyName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ })).Trim();
            serial = (-join ($monitor.SerialNumberID | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ })).Trim();
            productCode = (-join ($monitor.ProductCodeID | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ })).Trim();
            connection = $null;
            sizeXcm = $null;
            sizeYcm = $null;
        };

        $connection = $connectionParams | Where-Object { $_.InstanceName -eq $instanceName };
        if ($connection) {
            switch ($connection.VideoOutputTechnology) {
                5 { $monitorObj.connection = 'HDMI'; break; };
                10 { $monitorObj.connection = 'DisplayPort'; break; };
                2147483648 { $monitorObj.connection = 'Internal'; break; };
                2 { $monitorObj.connection = 'DVI'; break; };
                4 { $monitorObj.connection = 'VGA'; break; };
                default { $monitorObj.connection = 'Other'; break; };
            };
        };

        $display = $displayParams | Where-Object { $_.InstanceName -eq $instanceName };
        if ($display) {
            $monitorObj.sizeXcm = $display.MaxHorizontalImageSize;
            $monitorObj.sizeYcm = $display.MaxVerticalImageSize;
        };

        $result.displays += $monitorObj;
    };

    # --- Special fallback: if no displays were found ---
    if ($result.displays.Count -eq 0 -and $result.controllers.Count -gt 0) {
        $ctrl = $result.controllers[0];
        $result.displays += @{
            vendor = $ctrl.vendor;
            model = '';
            instanceName = '';
            connection = $null;
            sizeXcm = $null;
            sizeYcm = $null;
        };
    };

    # --- Final output ---
    $result | ConvertTo-Json -Depth 3 -Compress;
}
catch {
    @{ error = $true; message = $_.Exception.Message; controllers = @(); displays = @(); } | ConvertTo-Json -Compress;
};

if ($Error.Count -gt 0) {
    $Error[0] | Out-String | Write-Debug;
};
