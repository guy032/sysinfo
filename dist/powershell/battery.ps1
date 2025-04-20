# Get battery data from various sources
$batteryData = Get-CimInstance Win32_Battery | Select-Object BatteryStatus, DesignCapacity, DesignVoltage, EstimatedChargeRemaining, DeviceID;

# Get additional battery information without try/catch
$designedCapacity = $null;
$fullChargedCapacity = $null;

# Try to get BatteryStaticData
$ErrorActionPreference = 'SilentlyContinue';
$batteryStaticData = Get-WmiObject -Class BatteryStaticData -Namespace ROOT/WMI;
if ($batteryStaticData) {
    $designedCapacity = $batteryStaticData.DesignedCapacity;
}

# Try to get BatteryFullChargedCapacity
$batteryFullCharged = Get-CimInstance -Class BatteryFullChargedCapacity -Namespace ROOT/WMI -ErrorAction SilentlyContinue;
if ($batteryFullCharged) {
    $fullChargedCapacity = $batteryFullCharged.FullChargedCapacity;
}

# Create result object
$result = @{ 
    BatteryData = $batteryData; 
    DesignedCapacity = $designedCapacity; 
    FullChargedCapacity = $fullChargedCapacity;
};

# Output as JSON
ConvertTo-Json -Compress -InputObject $result;
