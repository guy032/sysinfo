# Retrieve Bluetooth devices with Status 'OK' and a valid DeviceID pattern
$devices = Get-CimInstance Win32_PnPEntity -Filter 'PNPClass=''Bluetooth'' AND Status=''OK''';
$filteredDevices = $devices | Where-Object { $_.DeviceID -match 'DEV_([0-9A-F]+)' };

# Create array for results
$results = @();

# Process each device
foreach ($device in $filteredDevices) {
    # Extract MAC address from DeviceID
    ($device.DeviceID -match 'DEV_([0-9A-F]+)') | Out-Null;
    $macAddress = ($matches[1] -replace '(.{2})(?!$)', '$1:');
    
    # Encode device name properly - Use explicit UTF8 encoding for all characters
    $nameBytes = [System.Text.Encoding]::UTF8.GetBytes($device.Name);
    $hexName = '';
    foreach ($byte in $nameBytes) {
        $hexName += $byte.ToString('X2');
    }
    
    # Add the device to results with selected properties
    $results += [PSCustomObject]@{
        DeviceNameHex = $hexName;
        MacAddress = $macAddress;
    };
}

# Remove duplicates by grouping on both DeviceNameHex and MacAddress
$uniqueResults = $results | Group-Object -Property DeviceNameHex,MacAddress | ForEach-Object { $_.Group[0] };

# Output as JSON
ConvertTo-Json -InputObject $uniqueResults -Depth 10 -Compress;