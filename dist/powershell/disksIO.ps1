# Initialize variables
Try {
  # Get physical disk objects
  $disks = Get-WmiObject -Class Win32_PerfFormattedData_PerfDisk_PhysicalDisk -ErrorAction SilentlyContinue;
  
  # Initialize results array
  $results = @();
  
  # Process each disk
  foreach ($disk in $disks) {
    # Skip _Total
    if ($disk.Name -ne '_Total') {
      # Clean up disk name for output only
      $diskName = $disk.Name.Replace(' ', '').Replace(':', '');
      
      # Create disk object with metrics - using exact property names
      $diskObj = @{
        'name' = $diskName;
        'rIO' = [int]$disk.DiskReadsPersec;
        'wIO' = [int]$disk.DiskWritesPersec;
        'tIO' = [int]$disk.DiskTransfersPersec;
        'rB' = [long]$disk.DiskReadBytesPersec;
        'wB' = [long]$disk.DiskWriteBytesPersec;
        'tB' = [long]$disk.DiskBytesPersec;
        'queue' = [float]$disk.CurrentDiskQueueLength;
        'rWait' = [float]($disk.AvgDisksecPerRead * 1000); # Note: correct property case
        'wWait' = [float]($disk.AvgDisksecPerWrite * 1000); # Note: correct property case
        'tWait' = 0;
      };
      
      # Calculate wait percentages based on total I/O
      if ($diskObj.tIO -gt 0) {
        $diskObj.tWait = ($diskObj.rWait * $diskObj.rIO + $diskObj.wWait * $diskObj.wIO) / $diskObj.tIO;
      }
      
      $results += $diskObj;
    }
  }
  
  # Convert to JSON and output
  ConvertTo-Json -InputObject $results -Compress;
} Catch {
  Write-Error $_.Exception.Message;
  ConvertTo-Json -InputObject @() -Compress;
}