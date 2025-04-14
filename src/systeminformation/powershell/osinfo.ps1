# Get OS information
$osInfo = Get-CimInstance Win32_OperatingSystem | Select-Object Caption, SerialNumber, BuildNumber, ServicePackMajorVersion, ServicePackMinorVersion;

# Get system virtualization information
$computerSystem = Get-CimInstance Win32_ComputerSystem;
$hypervisorPresent = $computerSystem.HypervisorPresent;

# Get terminal session information
Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue;
$terminalServerSession = [System.Windows.Forms.SystemInformation]::TerminalServerSession;

# Check if system is UEFI
$uefi = $false;
try {
    $bootEnvLine = Get-Content -Path "$env:windir\Panther\setupact.log" -ErrorAction SilentlyContinue | Select-String -Pattern "Detected boot environment" -SimpleMatch;
    if ($bootEnvLine -and $bootEnvLine.ToString().ToLower().Contains('efi')) {
        $uefi = $true;
    } else {
        $firmwareType = $env:firmware_type;
        if ($firmwareType -and $firmwareType.ToLower().Contains('efi')) {
            $uefi = $true;
        }
    }
} catch {
    # Ignore errors, default to BIOS if cannot determine
}

# Create result object
$result = [PSCustomObject]@{
    caption = $osInfo.Caption;
    serialNumber = $osInfo.SerialNumber;
    buildNumber = $osInfo.BuildNumber;
    servicePackMajorVersion = $osInfo.ServicePackMajorVersion;
    servicePackMinorVersion = $osInfo.ServicePackMinorVersion;
    hypervisorPresent = $hypervisorPresent;
    terminalServerSession = $terminalServerSession;
    uefi = $uefi;
};

# Convert to JSON and output (with compression)
ConvertTo-Json -InputObject $result -Compress;