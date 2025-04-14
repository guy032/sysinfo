[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
$ErrorActionPreference = 'Stop';
$devices = @();
try {
    $soundDevices = Get-CimInstance Win32_SoundDevice;
    foreach ($device in $soundDevices) {
        $isInput = $false;
        $isOutput = $false;
        $deviceName = if ($device.Name) { $device.Name.ToLower() } else { '' };
        if ($deviceName -match 'mic|input') { $isInput = $true };
        if ($deviceName -match 'speak|output|phone') { $isOutput = $true };
        
        $connType = 'Unknown';
        if ($device.PNPDeviceID -match 'USB') { $connType = 'USB' }
        elseif ($device.PNPDeviceID -match 'HDAUDIO') { $connType = 'HD Audio' }
        elseif ($device.PNPDeviceID -match 'BTH') { $connType = 'Bluetooth' }
        elseif ($device.PNPDeviceID -match 'PCI') { $connType = 'PCI/PCIe' };
        
        $deviceInfo = @{
            DeviceID = $device.DeviceID;
            Name = $device.Name;
            Manufacturer = $device.Manufacturer;
            Status = $device.Status;
            StatusInfo = $device.StatusInfo;
            ConnectionType = $connType;
            IsInput = $isInput;
            IsOutput = $isOutput
        };
        $devices += $deviceInfo;
    }
} catch {
    Write-Output "ERROR: $_";
}
ConvertTo-Json -InputObject @{Devices=$devices} -Compress; 