# Get params from environment if available
$skip = if ($env:SKIP) { [int]$env:SKIP } else { 0 }
$batchSize = if ($env:BATCHSIZE) { [int]$env:BATCHSIZE } else { 100 }

# Retrieve all PNP devices
$devices = Get-CimInstance Win32_PNPEntity | Where-Object { $_.PNPClass -eq 'Bluetooth' };

# Create array for results
$allResults = @();

# Process each device
foreach ($device in $devices) {
  # Add the device to results with all properties
  $allResults += [PSCustomObject]@{
    Caption = $device.Caption;
    Description = $device.Description;
    InstallDate = $device.InstallDate;
    Name = $device.Name;
    Status = $device.Status;
    Availability = $device.Availability;
    ConfigManagerErrorCode = $device.ConfigManagerErrorCode;
    ConfigManagerUserConfig = $device.ConfigManagerUserConfig;
    CreationClassName = $device.CreationClassName;
    DeviceID = $device.DeviceID;
    ErrorCleared = $device.ErrorCleared;
    ErrorDescription = $device.ErrorDescription;
    LastErrorCode = $device.LastErrorCode;
    PNPDeviceID = $device.PNPDeviceID;
    PowerManagementCapabilities = $device.PowerManagementCapabilities;
    PowerManagementSupported = $device.PowerManagementSupported;
    StatusInfo = $device.StatusInfo;
    SystemCreationClassName = $device.SystemCreationClassName;
    SystemName = $device.SystemName;
    ClassGuid = $device.ClassGuid;
    CompatibleID = $device.CompatibleID;
    HardwareID = $device.HardwareID;
    Manufacturer = $device.Manufacturer;
    PNPClass = $device.PNPClass;
    Present = $device.Present;
    Service = $device.Service;
    PSComputerName = $device.PSComputerName;
  };
}

# Apply batching to results
$batchedResults = $allResults | Select-Object -Skip $skip -First $batchSize;

# Add metadata about the batch
$response = @{
  Items = $batchedResults;
  TotalCount = $allResults.Count;
  Skip = $skip;
  BatchSize = $batchSize;
};

# Output as JSON
ConvertTo-Json -InputObject $response -Depth 10 -Compress;