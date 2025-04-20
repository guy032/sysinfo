# Initialize variables
$readSamples = @();
$writeSamples = @();
$sampleCount = 10; # Number of samples to take
$sampleInterval = 1; # Seconds between samples

# Take multiple samples
for ($i=0; $i -lt $sampleCount; $i++) {
  $readSample = 0;
  $writeSample = 0;
  
  # Try to get read bytes
  try {
    $counter = Get-Counter '\PhysicalDisk(_Total)\Disk Read Bytes/sec' -ErrorAction SilentlyContinue;
    if ($counter -and $counter.CounterSamples) {
      $readSample = $counter.CounterSamples[0].CookedValue;
    }
  } catch {
    try {
      $counter = Get-Counter '\LogicalDisk(_Total)\Disk Read Bytes/sec' -ErrorAction SilentlyContinue;
      if ($counter -and $counter.CounterSamples) {
        $readSample = $counter.CounterSamples[0].CookedValue;
      }
    } catch { }
  }
  
  # Try to get write bytes
  try {
    $counter = Get-Counter '\PhysicalDisk(_Total)\Disk Write Bytes/sec' -ErrorAction SilentlyContinue;
    if ($counter -and $counter.CounterSamples) {
      $writeSample = $counter.CounterSamples[0].CookedValue;
    }
  } catch {
    try {
      $counter = Get-Counter '\LogicalDisk(_Total)\Disk Write Bytes/sec' -ErrorAction SilentlyContinue;
      if ($counter -and $counter.CounterSamples) {
        $writeSample = $counter.CounterSamples[0].CookedValue;
      }
    } catch { }
  }
  
  # Ensure values are valid numbers
  if ([Double]::IsNaN($readSample)) { $readSample = 0; }
  if ([Double]::IsNaN($writeSample)) { $writeSample = 0; }
  
  # Add to samples array
  $readSamples += $readSample;
  $writeSamples += $writeSample;
  
  # Wait before next sample (except for last iteration)
  if ($i -lt $sampleCount - 1) {
    Start-Sleep -Seconds $sampleInterval;
  }
}

# Calculate averages
$readAvg = ($readSamples | Measure-Object -Average).Average;
$writeAvg = ($writeSamples | Measure-Object -Average).Average;

# Handle NaN results
if ([Double]::IsNaN($readAvg)) { $readAvg = 0; }
if ([Double]::IsNaN($writeAvg)) { $writeAvg = 0; }

# Output as JSON with more detailed stats
@{
  'ReadBytesPerSec' = $readAvg;
  'WriteBytesPerSec' = $writeAvg; 
  'ReadSamples' = $readSamples;
  'WriteSamples' = $writeSamples;
} | ConvertTo-Json -Compress 