'use strict';

const util = require('../../util');

function windows(options = {}, callback) {

  let result = [];
  return new Promise((resolve) => {
    process.nextTick(() => {
      try {
        // todo: we should execute in the context of specific user and not console
        util.powerShell(`Add-Type -TypeDefinition 'using System;using System.Collections.Generic;using System.Diagnostics;using System.Runtime.InteropServices;using System.Text;public class WindowX{[DllImport("user32.dll")]static extern bool IsWindowVisible(IntPtr hWnd);[DllImport("user32.dll")]static extern IntPtr GetForegroundWindow();[DllImport("user32.dll", CharSet=CharSet.Auto, SetLastError=true)]static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);[DllImport("user32.dll")]static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);[DllImport("user32.dll")]static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);[DllImport("user32.dll")]static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);[StructLayout(LayoutKind.Sequential)]public struct RECT{public int Left; public int Top; public int Right; public int Bottom;}public static List<Dictionary<string, string>> GetOpenWindows(){var windows=new List<Dictionary<string,string>>();var fg=GetForegroundWindow();EnumWindows((h,l)=>{if(IsWindowVisible(h)){var t=new StringBuilder(256);GetWindowText(h,t,256);uint pid;GetWindowThreadProcessId(h,out pid);var p=Process.GetProcessById((int)pid);RECT r; GetWindowRect(h, out r);var w=new Dictionary<string,string>{{"ProcessName",p.ProcessName},{"ProcessID",p.Id.ToString()},{"WindowsTitle",t.ToString()},{"IsFocused",(h==fg).ToString().ToLower()},{"IsVisible","true"},{"Left",r.Left.ToString()},{"Top",r.Top.ToString()},{"Width",(r.Right-r.Left).ToString()},{"Height",(r.Bottom-r.Top).ToString()}};windows.Add(w);}return true;},IntPtr.Zero);return windows;}}' | Out-Null; $w=@(); [WindowX]::GetOpenWindows() | Where-Object { $_.WindowsTitle } | ForEach-Object { $i=[pscustomobject][ordered]@{ProcessName=$_.ProcessName;ProcessID=$_.ProcessID;WindowsTitle=$_.WindowsTitle;IsFocused=$_.IsFocused;IsVisible=$_.IsVisible;Left=$_.Left;Top=$_.Top;Width=$_.Width;Height=$_.Height}; $w+=$i }; $w | ConvertTo-Json -Compress`, options).then((stdout) => {
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

exports.windows = windows;
