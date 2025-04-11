const batteryModule = require('./systeminformation/lib/battery');
require('dotenv').config();

console.log('Testing battery module with WinRM...');
console.log('Using WinRM connection parameters:');
console.log(`  Host: ${process.env.WINRM_HOST || process.env.HOST}`);
console.log(`  Port: ${process.env.WINRM_PORT || process.env.PORT || 5985}`);
console.log(`  Username: ${process.env.WINRM_USERNAME || process.env.USERNAME}`);

// Test the battery module
batteryModule({
  host: process.env.WINRM_HOST || process.env.HOST,
  port: process.env.WINRM_PORT || process.env.PORT || 5985,
  username: process.env.WINRM_USERNAME || process.env.USERNAME,
  password: process.env.WINRM_PASSWORD || process.env.PASSWORD,
  platform: 'win32',
}, (data) => {
  console.log('Battery information:');
  console.log(JSON.stringify(data, null, 2));
}).catch(err => {
  console.error('Error:', err);
}); 