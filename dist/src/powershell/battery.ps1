# This script produces three separate outputs for the battery data, designed capacity, and full charge capacity

# Get battery data and output as a single JSON object

# Get battery data
$batteryData = Get-CimInstance Win32_Battery;
$batteryInfo = @{
    "BatteryStatus" = $batteryData.BatteryStatus;
    "DesignVoltage" = $batteryData.DesignVoltage;
    "EstimatedChargeRemaining" = $batteryData.EstimatedChargeRemaining;
    "DeviceID" = $batteryData.DeviceID;
};

# Get designed capacity
$ErrorActionPreference = 'SilentlyContinue';
$designedCapacity = $null;
try {
    $batteryStaticData = Get-WmiObject -Class BatteryStaticData -Namespace ROOT\WMI;
    if ($batteryStaticData) {
        $designedCapacity = $batteryStaticData.DesignedCapacity;
        # Also add to battery data
        $batteryInfo.DesignCapacity = $designedCapacity;
    }
} catch {
    # Silently continue
}

# Get full charged capacity
$fullChargedCapacity = $null;
try {
    $batteryFullCharged = Get-CimInstance -Class BatteryFullChargedCapacity -Namespace ROOT\WMI;
    if ($batteryFullCharged) {
        $fullChargedCapacity = $batteryFullCharged.FullChargedCapacity;
    }
} catch {
    # Silently continue
}

# Create result object
$result = @{
    "BatteryData" = $batteryInfo;
    "DesignedCapacity" = $designedCapacity;
    "FullChargedCapacity" = $fullChargedCapacity;
};

# Output as JSON
ConvertTo-Json -InputObject $result;