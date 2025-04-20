Add-Type -AssemblyName System.Device;
$g = New-Object System.Device.Location.GeoCoordinateWatcher;
$g.Start();
$timeout = 5000;
$sw = [System.Diagnostics.Stopwatch]::StartNew();

while (($g.Status -ne 'Ready') -and ($g.Permission -ne 'Denied') -and ($sw.ElapsedMilliseconds -lt $timeout)) {
  Start-Sleep -Milliseconds 100;
};

$sw.Stop();

if ($g.Permission -eq 'Denied') {
  Write-Error 'Access Denied for Location Information';
} elseif ($g.Status -ne 'Ready') {
  Write-Output '{"status": "timeout", "message": "Location services timed out"}';
} else {
  [pscustomobject]@{
    latitude = $g.Position.Location.Latitude;
    longitude = $g.Position.Location.Longitude;
    status = 'ready';
    accuracy = if ($g.Position.Location.HorizontalAccuracy -and -not [Double]::IsNaN($g.Position.Location.HorizontalAccuracy)) { $g.Position.Location.HorizontalAccuracy } else { $null };
    altitude = if ($g.Position.Location.Altitude -and -not [Double]::IsNaN($g.Position.Location.Altitude)) { $g.Position.Location.Altitude } else { $null };
    altitudeAccuracy = if ($g.Position.Location.VerticalAccuracy -and -not [Double]::IsNaN($g.Position.Location.VerticalAccuracy)) { $g.Position.Location.VerticalAccuracy } else { $null };
    timestamp = [DateTime]::Now.ToString('o');
  } | ConvertTo-Json -Compress;
} 