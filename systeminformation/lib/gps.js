'use strict';

const util = require('./util');

function gps(options = {}, callback) {

  let result = [];
  return new Promise((resolve) => {
    process.nextTick(() => {
      try {
        util.powerShell(`Add-Type -AssemblyName System.Device; $g = New-Object System.Device.Location.GeoCoordinateWatcher; $g.Start(); while (($g.Status -ne 'Ready') -and ($g.Permission -ne 'Denied')) { Start-Sleep -Milliseconds 100 }; if ($g.Permission -eq 'Denied') { Write-Error 'Access Denied for Location Information' } else { [pscustomobject]@{ latitude = $g.Position.Location.Latitude;longitude = $g.Position.Location.Longitude } | ConvertTo-Json -Compress }`, options).then((stdout) => {
          result = JSON.parse(stdout);
          if (callback) { callback(result); }
          resolve(result);
        });
      } catch (e) {
        console.error('gps error', e);
        if (callback) { callback(result); }
        resolve(result);
      }
    });
  });
}

exports.gps = gps;
