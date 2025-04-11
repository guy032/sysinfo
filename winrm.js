const winrm = require('nodejs-winrm');
const si = require('systeminformation');
require('dotenv').config();

// Configuration
const host = process.env.WINRM_HOST || process.env.HOST;
const port = parseInt(process.env.WINRM_PORT || process.env.PORT, 10) || 5985;
const username = process.env.WINRM_USERNAME || process.env.USERNAME;
const password = process.env.WINRM_PASSWORD || process.env.PASSWORD;

(async () => {
  const result = await winrm.runPowershell('Get-CimInstance Win32_OperatingSystem | Select-Object Caption, SerialNumber, BuildNumber, ServicePackMajorVersion, ServicePackMinorVersion | fl', host, username, password, port);
  console.log(result);

  await si.battery((data) => {
    console.log(data);
  });
})();