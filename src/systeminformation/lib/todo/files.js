'use strict';

const util = require('../util');

function files(options = {}, callback) {

  let result = [];
  return new Promise((resolve) => {
    process.nextTick(() => {
      try {
        // todo: we should execute in the context of specific user and not console
        util.powerShell(`function Get-DirTree($p,$d=5){if($d -le 0){return @()};$epoch=[datetime]'1970-01-01';$f=Get-ChildItem $p -File -Force -ea SilentlyContinue | ForEach-Object{[PSCustomObject]@{Name=$_.Name;Length=$_.Length;LastAccessTime=[int64]([datetime]$_.LastAccessTime.ToUniversalTime()-$epoch).TotalMilliseconds;LastWriteTime=[int64]([datetime]$_.LastWriteTime.ToUniversalTime()-$epoch).TotalMilliseconds;CreationTime=[int64]([datetime]$_.CreationTime.ToUniversalTime()-$epoch).TotalMilliseconds;Type=($_.Extension -replace '^\.','')}};$s=($f|Measure-Object Length -Sum).Sum;$c=Get-ChildItem $p -Directory -Force -ea SilentlyContinue | ForEach-Object{Get-DirTree $_.FullName ($d-1)};@{Name=Split-Path $p -Leaf;Path=$p;Type='Directory';FileCount=$f.Count;SizeBytes=$s;Files=$f;Children=$c}};Get-DirTree 'C:\' 5 | ConvertTo-Json -Depth 100 -Compress`, options).then((stdout) => {
          console.log('stdout', stdout);
          result = JSON.parse(stdout);
          if (callback) { callback(result); }
          resolve(result);
        });
      } catch (e) {
        if (callback) { callback(result); }
        resolve(result);
      }
    });
  });
}

exports.files = files;
