# Get total handles across all processes
$allocated = (Get-Process | Measure-Object Handles -Sum).Sum;

# Get system memory information for better handle limit estimation
$systemInfo = Get-CimInstance -ClassName Win32_OperatingSystem;
$physicalMemoryMB = [math]::Round($systemInfo.TotalVisibleMemorySize / 1024);
$pageFileMB = [math]::Round($systemInfo.TotalVirtualMemorySize / 1024);

# Calculate max handles using a better formula that accounts for both RAM and virtual memory
# Windows allocates handles from kernel memory pool which can use both RAM and page file
# Each handle uses approximately 1KB of kernel memory
# Windows architecture typically limits kernel usage to about 40% of combined memory space
# Apply a formula that scales with system resources with reasonable minimums

# Base formula: (Physical RAM + Page File Size) * kernel_percent * handle_allocation_percent
$kernelPercent = 0.4;  # Percentage of memory typically available to kernel
$handleAllocationPercent = 0.5;  # Percentage of kernel memory that can be used for handles

# Calculate potential max handles
$potentialMaxHandles = [math]::Round(($physicalMemoryMB + $pageFileMB) * $kernelPercent * $handleAllocationPercent * 1000);

# Ensure a reasonable minimum based on Windows version
$minHandles = 1000000;  # Modern Windows systems can usually handle at least 1 million handles
$max = [math]::Max($potentialMaxHandles, $minHandles);

# Calculate available handles
$available = $max - $allocated;

# Add some additional context for better understanding
$usagePercent = [math]::Round(($allocated / $max) * 100, 2);

# Return results as JSON
@{
  "max" = $max;
  "allocated" = $allocated;
  "available" = $available;
  "usagePercent" = $usagePercent;
  "physicalMemoryMB" = $physicalMemoryMB;
  "pageFileMB" = $pageFileMB;
} | ConvertTo-Json -Compress 