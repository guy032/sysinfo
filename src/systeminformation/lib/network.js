'use strict';
// @ts-check
// ==================================================================================
// network.js
// ----------------------------------------------------------------------------------
// Description:   System Information - library
//                for Node.js
// Copyright:     (c) 2014 - 2025
// Author:        Sebastian Hildebrandt
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 9. Network
// ----------------------------------------------------------------------------------

const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const fs = require('fs');
const util = require('./util');

let _platform = process.platform;
let _linux, _darwin, _windows, _freebsd, _openbsd, _netbsd, _sunos;

function setPlatform(platform) {
  _platform = platform || process.platform;
  _linux = (_platform === 'linux' || _platform === 'android');
  _darwin = (_platform === 'darwin');
  _windows = (_platform === 'win32');
  _freebsd = (_platform === 'freebsd');
  _openbsd = (_platform === 'openbsd');
  _netbsd = (_platform === 'netbsd');
  _sunos = (_platform === 'sunos');
}

setPlatform(_platform);

let _network = {};
let _default_iface = '';
let _ifaces = {};
let _dhcpNics = [];
let _networkInterfaces = [];
let _mac = {};
let pathToIp;

async function getDefaultNetworkInterface(options = {}) {
  if (options.platform) setPlatform(options.platform);

  let ifacename = '';
  let ifacenameFirst = '';
  try {
    // let ifaces = os.networkInterfaces();
    let ifaces = [];
    let scopeid = 9999;

    // fallback - "first" external interface (sorted by scopeid)
    for (let dev in ifaces) {
      if ({}.hasOwnProperty.call(ifaces, dev)) {
        ifaces[dev].forEach(function (details) {
          if (details && details.internal === false) {
            ifacenameFirst = ifacenameFirst || dev; // fallback if no scopeid
            if (details.scopeid && details.scopeid < scopeid) {
              ifacename = dev;
              scopeid = details.scopeid;
            }
          }
        });
      }
    }
    ifacename = ifacename || ifacenameFirst || '';

    if (_windows) {
      // https://www.inetdaemon.com/tutorials/internet/ip/routing/default_route.shtml
      let defaultIp = '';
      const cmd = 'netstat -r';
      const result = await util.powerShell(cmd, options);
      const lines = result.toString().split('\r\n');
      lines.forEach(line => {
        line = line.replace(/\s+/g, ' ').trim();
        if (line.indexOf('0.0.0.0 0.0.0.0') > -1 && !(/[a-zA-Z]/.test(line))) {
          const parts = line.split(' ');
          if (parts.length >= 5) {
            defaultIp = parts[parts.length - 2];
          }
        }
      });
      if (defaultIp) {
        for (let dev in ifaces) {
          if ({}.hasOwnProperty.call(ifaces, dev)) {
            ifaces[dev].forEach(function (details) {
              if (details && details.address && details.address === defaultIp) {
                ifacename = dev;
              }
            });
          }
        }
      }
    }
    if (_linux) {
      let cmd = 'ip route 2> /dev/null | grep default';
      let result = execSync(cmd, util.execOptsLinux);
      let parts = result.toString().split('\n')[0].split(/\s+/);
      if (parts[0] === 'none' && parts[5]) {
        ifacename = parts[5];
      } else if (parts[4]) {
        ifacename = parts[4];
      }

      if (ifacename.indexOf(':') > -1) {
        ifacename = ifacename.split(':')[1].trim();
      }
    }
    if (_darwin || _freebsd || _openbsd || _netbsd || _sunos) {
      let cmd = '';
      if (_linux) { cmd = 'ip route 2> /dev/null | grep default | awk \'{print $5}\''; }
      if (_darwin) { cmd = 'route -n get default 2>/dev/null | grep interface: | awk \'{print $2}\''; }
      if (_freebsd || _openbsd || _netbsd || _sunos) { cmd = 'route get 0.0.0.0 | grep interface:'; }
      let result = execSync(cmd);
      ifacename = result.toString().split('\n')[0];
      if (ifacename.indexOf(':') > -1) {
        ifacename = ifacename.split(':')[1].trim();
      }
    }
  } catch (e) {
    util.noop();
  }
  if (ifacename) { _default_iface = ifacename; }
  return _default_iface;
}

exports.getDefaultNetworkInterface = getDefaultNetworkInterface;

function getMacAddresses() {
  let iface = '';
  let mac = '';
  let result = {};
  if (_linux || _freebsd || _openbsd || _netbsd) {
    if (typeof pathToIp === 'undefined') {
      try {
        const lines = execSync('which ip', util.execOptsLinux).toString().split('\n');
        if (lines.length && lines[0].indexOf(':') === -1 && lines[0].indexOf('/') === 0) {
          pathToIp = lines[0];
        } else {
          pathToIp = '';
        }
      } catch (e) {
        pathToIp = '';
      }
    }
    try {
      const cmd = 'export LC_ALL=C; ' + ((pathToIp) ? pathToIp + ' link show up' : '/sbin/ifconfig') + '; unset LC_ALL';
      let res = execSync(cmd, util.execOptsLinux);
      const lines = res.toString().split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] && lines[i][0] !== ' ') {
          if (pathToIp) {
            let nextline = lines[i + 1].trim().split(' ');
            if (nextline[0] === 'link/ether') {
              iface = lines[i].split(' ')[1];
              iface = iface.slice(0, iface.length - 1);
              mac = nextline[1];
            }
          } else {
            iface = lines[i].split(' ')[0];
            mac = lines[i].split('HWaddr ')[1];
          }

          if (iface && mac) {
            result[iface] = mac.trim();
            iface = '';
            mac = '';
          }
        }
      }
    } catch (e) {
      util.noop();
    }
  }
  if (_darwin) {
    try {
      const cmd = '/sbin/ifconfig';
      let res = execSync(cmd);
      const lines = res.toString().split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] && lines[i][0] !== '\t' && lines[i].indexOf(':') > 0) {
          iface = lines[i].split(':')[0];
        } else if (lines[i].indexOf('\tether ') === 0) {
          mac = lines[i].split('\tether ')[1];
          if (iface && mac) {
            result[iface] = mac.trim();
            iface = '';
            mac = '';
          }
        }
      }
    } catch (e) {
      util.noop();
    }
  }
  return result;
}

function networkInterfaceDefault(options = {}, callback) {
  if (options.platform) setPlatform(options.platform);

  return new Promise(async (resolve) => {
    process.nextTick(async () => {
      if (options.winrm && _windows) {
        try {
          const defaultCmd = 'Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Select-Object -First 1 | Select-Object InterfaceAlias | Format-List';
          util.powerShell(defaultCmd, options).then((stdout) => {
            let result = '';
            const lines = stdout.toString().split(/\r?\n/).filter(line => line.trim());
            
            for (const line of lines) {
              const parts = line.split(':');
              if (parts.length >= 2 && parts[0].trim() === 'InterfaceAlias') {
                result = parts[1].trim();
                break;
              }
            }
            
            if (callback) { callback(result); }
            resolve(result);
          }).catch(err => {
            console.error('Error getting default network interface over WinRM:', err);
            if (callback) { callback(''); }
            resolve('');
          });
        } catch (e) {
          console.error('Error in networkInterfaceDefault:', e);
          if (callback) { callback(''); }
          resolve('');
        }
      } else {
        let result = await getDefaultNetworkInterface(options);
        if (callback) { callback(result); }
        resolve(result);
      }
    });
  });
}

exports.networkInterfaceDefault = networkInterfaceDefault;

// --------------------------
// NET - interfaces

function parseLinesWindowsNics(sections, nconfigsections) {
  let nics = [];
  for (let i in sections) {
    try {
      if ({}.hasOwnProperty.call(sections, i)) {

        if (sections[i].trim() !== '') {

          let lines = sections[i].trim().split('\r\n');
          let linesNicConfig = null;
          try {
            linesNicConfig = nconfigsections && nconfigsections[i] ? nconfigsections[i].trim().split('\r\n') : [];
          } catch (e) {
            util.noop();
          }
          let netEnabled = util.getValue(lines, 'NetEnabled', ':');
          let adapterType = util.getValue(lines, 'AdapterTypeID', ':') === '9' ? 'wireless' : 'wired';
          let ifacename = util.getValue(lines, 'Name', ':').replace(/\]/g, ')').replace(/\[/g, '(');
          let iface = util.getValue(lines, 'NetConnectionID', ':').replace(/\]/g, ')').replace(/\[/g, '(');
          if (ifacename.toLowerCase().indexOf('wi-fi') >= 0 || ifacename.toLowerCase().indexOf('wireless') >= 0) {
            adapterType = 'wireless';
          }
          if (netEnabled !== '') {
            const speed = parseInt(util.getValue(lines, 'speed', ':').trim(), 10) / 1000000;
            nics.push({
              mac: util.getValue(lines, 'MACAddress', ':').toLowerCase(),
              dhcp: util.getValue(linesNicConfig, 'dhcpEnabled', ':').toLowerCase() === 'true',
              name: ifacename,
              iface,
              netEnabled: netEnabled === 'TRUE',
              speed: isNaN(speed) ? null : speed,
              operstate: util.getValue(lines, 'NetConnectionStatus', ':') === '2' ? 'up' : 'down',
              type: adapterType
            });
          }
        }
      }
    } catch (e) {
      util.noop();
    }
  }
  return nics;
}

function getWindowsNics(options = {}) {
  if (options.platform) setPlatform(options.platform);

  return new Promise((resolve) => {
    process.nextTick(() => {
      let cmd = 'Get-CimInstance Win32_NetworkAdapter | fl *' + '; echo \'#-#-#-#\';';
      cmd += 'Get-CimInstance Win32_NetworkAdapterConfiguration | fl DHCPEnabled' + '';
      try {
        util.powerShell(cmd, options).then((data) => {
          data = data.split('#-#-#-#');
          const nsections = (data[0] || '').split(/\n\s*\n/);
          const nconfigsections = (data[1] || '').split(/\n\s*\n/);
          resolve(parseLinesWindowsNics(nsections, nconfigsections));
        });
      } catch (e) {
        resolve([]);
      }
    });
  });
}

async function getWindowsDNSsuffixes(options = {}) {
  if (options.platform) setPlatform(options.platform);
  let iface = {};

  let dnsSuffixes = {
    primaryDNS: '',
    exitCode: 0,
    ifaces: [],
  };

  try {
    const ipconfig = await util.powerShell('ipconfig /all', options);
    const ipconfigArray = ipconfig.split('\r\n\r\n');

    ipconfigArray.forEach((element, index) => {

      if (index == 1) {
        const longPrimaryDNS = element.split('\r\n').filter((element) => {
          return element.toUpperCase().includes('DNS');
        });
        const primaryDNS = longPrimaryDNS[0].substring(longPrimaryDNS[0].lastIndexOf(':') + 1);
        dnsSuffixes.primaryDNS = primaryDNS.trim();
        if (!dnsSuffixes.primaryDNS) { dnsSuffixes.primaryDNS = 'Not defined'; }
      }
      if (index > 1) {
        if (index % 2 == 0) {
          const name = element.substring(element.lastIndexOf(' ') + 1).replace(':', '');
          iface.name = name;
        } else {
          const connectionSpecificDNS = element.split('\r\n').filter((element) => {
            return element.toUpperCase().includes('DNS');
          });
          const dnsSuffix = connectionSpecificDNS[0].substring(connectionSpecificDNS[0].lastIndexOf(':') + 1);
          iface.dnsSuffix = dnsSuffix.trim();
          dnsSuffixes.ifaces.push(iface);
          iface = {};
        }
      }
    });

    return dnsSuffixes;
  } catch (error) {
    return {
      primaryDNS: '',
      exitCode: 0,
      ifaces: [],
    };
  }
}

function getWindowsIfaceDNSsuffix(ifaces, ifacename) {
  let dnsSuffix = '';
  // Adding (.) to ensure ifacename compatibility when duplicated iface-names
  const interfaceName = ifacename + '.';
  try {
    const connectionDnsSuffix = ifaces.filter((iface) => {
      return interfaceName.includes(iface.name + '.');
    }).map((iface) => iface.dnsSuffix);
    if (connectionDnsSuffix[0]) {
      dnsSuffix = connectionDnsSuffix[0];
    }
    if (!dnsSuffix) { dnsSuffix = ''; }
    return dnsSuffix;
  } catch (error) {
    return 'Unknown';
  }
}

async function getWindowsWiredProfilesInformation(options = {}) {
  if (options.platform) setPlatform(options.platform);
  
  try {
    const result = await util.powerShell('netsh lan show profiles', options);
    const profileList = result.split('\r\nProfile on interface');
    return profileList;
  } catch (error) {
    if (error.status === 1 && error.stdout.includes('AutoConfig')) {
      return 'Disabled';
    }
    return [];
  }
}

async function getWindowsWirelessIfaceSSID(options = {}, interfaceName) {
  if (options.platform) setPlatform(options.platform);

  try {
    const cmd = `netsh wlan show  interface name="${interfaceName}" | findstr "SSID"`;
    const result = await util.powerShell(cmd, options);
    const SSID = result.split('\r\n').shift();
    const parseSSID = SSID.split(':').pop().trim();
    return parseSSID;
  } catch (error) {
    return 'Unknown';
  }
}
function getWindowsIEEE8021x(connectionType, iface, ifaces) {
  let i8021x = {
    state: 'Unknown',
    protocol: 'Unknown',
  };

  if (ifaces === 'Disabled') {
    i8021x.state = 'Disabled';
    i8021x.protocol = 'Not defined';
    return i8021x;
  }

  if (connectionType == 'wired' && ifaces.length > 0) {
    try {
      // Get 802.1x information by interface name
      const iface8021xInfo = ifaces.find((element) => {
        return element.includes(iface + '\r\n');
      });
      const arrayIface8021xInfo = iface8021xInfo.split('\r\n');
      const state8021x = arrayIface8021xInfo.find((element) => {
        return element.includes('802.1x');
      });

      if (state8021x.includes('Disabled')) {
        i8021x.state = 'Disabled';
        i8021x.protocol = 'Not defined';
      } else if (state8021x.includes('Enabled')) {
        const protocol8021x = arrayIface8021xInfo.find((element) => {
          return element.includes('EAP');
        });
        i8021x.protocol = protocol8021x.split(':').pop();
        i8021x.state = 'Enabled';
      }
    } catch (error) {
      return i8021x;
    }
  } else if (connectionType == 'wireless') {

    let i8021xState = '';
    let i8021xProtocol = '';



    try {
      const SSID = getWindowsWirelessIfaceSSID(iface);
      if (SSID !== 'Unknown') {

        let ifaceSanitized = '';
        const s = util.isPrototypePolluted() ? '---' : util.sanitizeShellString(SSID);
        const l = util.mathMin(s.length, 32);

        for (let i = 0; i <= l; i++) {
          if (s[i] !== undefined) {
            ifaceSanitized = ifaceSanitized + s[i];
          }
        }
        i8021xState = execSync(`netsh wlan show profiles "${ifaceSanitized}" | findstr "802.1X"`, util.execOptsWin);
        i8021xProtocol = execSync(`netsh wlan show profiles "${ifaceSanitized}" | findstr "EAP"`, util.execOptsWin);
      }

      if (i8021xState.includes(':') && i8021xProtocol.includes(':')) {
        i8021x.state = i8021xState.split(':').pop();
        i8021x.protocol = i8021xProtocol.split(':').pop();
      }
    } catch (error) {
      if (error.status === 1 && error.stdout.includes('AutoConfig')) {
        i8021x.state = 'Disabled';
        i8021x.protocol = 'Not defined';
      }
      return i8021x;
    }
  }

  return i8021x;
}

function splitSectionsNics(lines) {
  const result = [];
  let section = [];
  lines.forEach(function (line) {
    if (!line.startsWith('\t') && !line.startsWith(' ')) {
      if (section.length) {
        result.push(section);
        section = [];
      }
    }
    section.push(line);
  });
  if (section.length) {
    result.push(section);
  }
  return result;
}

function parseLinesDarwinNics(sections) {
  let nics = [];
  sections.forEach(section => {
    let nic = {
      iface: '',
      mtu: null,
      mac: '',
      ip6: '',
      ip4: '',
      speed: null,
      type: '',
      operstate: '',
      duplex: '',
      internal: false
    };
    const first = section[0];
    nic.iface = first.split(':')[0].trim();
    let parts = first.split('> mtu');
    nic.mtu = parts.length > 1 ? parseInt(parts[1], 10) : null;
    if (isNaN(nic.mtu)) {
      nic.mtu = null;
    }
    nic.internal = parts[0].toLowerCase().indexOf('loopback') > -1;
    section.forEach(line => {
      if (line.trim().startsWith('ether ')) {
        nic.mac = line.split('ether ')[1].toLowerCase().trim();
      }
      if (line.trim().startsWith('inet6 ') && !nic.ip6) {
        nic.ip6 = line.split('inet6 ')[1].toLowerCase().split('%')[0].split(' ')[0];
      }
      if (line.trim().startsWith('inet ') && !nic.ip4) {
        nic.ip4 = line.split('inet ')[1].toLowerCase().split(' ')[0];
      }
    });
    let speed = util.getValue(section, 'link rate');
    nic.speed = speed ? parseFloat(speed) : null;
    if (nic.speed === null) {
      speed = util.getValue(section, 'uplink rate');
      nic.speed = speed ? parseFloat(speed) : null;
      if (nic.speed !== null && speed.toLowerCase().indexOf('gbps') >= 0) {
        nic.speed = nic.speed * 1000;
      }
    } else {
      if (speed.toLowerCase().indexOf('gbps') >= 0) {
        nic.speed = nic.speed * 1000;
      }
    }
    nic.type = util.getValue(section, 'type').toLowerCase().indexOf('wi-fi') > -1 ? 'wireless' : 'wired';
    const operstate = util.getValue(section, 'status').toLowerCase();
    nic.operstate = (operstate === 'active' ? 'up' : (operstate === 'inactive' ? 'down' : 'unknown'));
    nic.duplex = util.getValue(section, 'media').toLowerCase().indexOf('half-duplex') > -1 ? 'half' : 'full';
    if (nic.ip6 || nic.ip4 || nic.mac) {
      nics.push(nic);
    }
  });
  return nics;
}

function getDarwinNics() {
  const cmd = '/sbin/ifconfig -v';
  try {
    const lines = execSync(cmd, { maxBuffer: 1024 * 20000 }).toString().split('\n');
    const nsections = splitSectionsNics(lines);
    return (parseLinesDarwinNics(nsections));
  } catch (e) {
    return [];
  }
}

function getLinuxIfaceConnectionName(interfaceName) {
  const cmd = `nmcli device status 2>/dev/null | grep ${interfaceName}`;

  try {
    const result = execSync(cmd, util.execOptsLinux).toString();
    const resultFormat = result.replace(/\s+/g, ' ').trim();
    const connectionNameLines = resultFormat.split(' ').slice(3);
    const connectionName = connectionNameLines.join(' ');
    return connectionName != '--' ? connectionName : '';
  } catch (e) {
    return '';
  }
}

function checkLinuxDCHPInterfaces(file) {
  let result = [];
  try {
    let cmd = `cat ${file} 2> /dev/null | grep 'iface\\|source'`;
    const lines = execSync(cmd, util.execOptsLinux).toString().split('\n');

    lines.forEach(line => {
      const parts = line.replace(/\s+/g, ' ').trim().split(' ');
      if (parts.length >= 4) {
        if (line.toLowerCase().indexOf(' inet ') >= 0 && line.toLowerCase().indexOf('dhcp') >= 0) {
          result.push(parts[1]);
        }
      }
      if (line.toLowerCase().includes('source')) {
        let file = line.split(' ')[1];
        result = result.concat(checkLinuxDCHPInterfaces(file));
      }
    });
  } catch (e) {
    util.noop();
  }
  return result;
}

function getLinuxDHCPNics() {
  // alternate methods getting interfaces using DHCP
  let cmd = 'ip a 2> /dev/null';
  let result = [];
  try {
    const lines = execSync(cmd, util.execOptsLinux).toString().split('\n');
    const nsections = splitSectionsNics(lines);
    result = (parseLinuxDHCPNics(nsections));
  } catch (e) {
    util.noop();
  }
  try {
    result = checkLinuxDCHPInterfaces('/etc/network/interfaces');
  } catch (e) {
    util.noop();
  }
  return result;
}

function parseLinuxDHCPNics(sections) {
  const result = [];
  if (sections && sections.length) {
    sections.forEach(lines => {
      if (lines && lines.length) {
        const parts = lines[0].split(':');
        if (parts.length > 2) {
          for (let line of lines) {
            if (line.indexOf(' inet ') >= 0 && line.indexOf(' dynamic ') >= 0) {
              const parts2 = line.split(' ');
              const nic = parts2[parts2.length - 1].trim();
              result.push(nic);
              break;
            }
          }
        }
      }
    });
  }
  return result;
}

function getLinuxIfaceDHCPstatus(iface, connectionName, DHCPNics) {
  let result = false;
  if (connectionName) {
    const cmd = `nmcli connection show "${connectionName}" 2>/dev/null | grep ipv4.method;`;
    try {
      const lines = execSync(cmd, util.execOptsLinux).toString();
      const resultFormat = lines.replace(/\s+/g, ' ').trim();

      let dhcStatus = resultFormat.split(' ').slice(1).toString();
      switch (dhcStatus) {
        case 'auto':
          result = true;
          break;

        default:
          result = false;
          break;
      }
      return result;
    } catch (e) {
      return (DHCPNics.indexOf(iface) >= 0);
    }
  } else {
    return (DHCPNics.indexOf(iface) >= 0);
  }
}

function getDarwinIfaceDHCPstatus(iface) {
  let result = false;
  const cmd = `ipconfig getpacket "${iface}" 2>/dev/null | grep lease_time;`;
  try {
    const lines = execSync(cmd).toString().split('\n');
    if (lines.length && lines[0].startsWith('lease_time')) {
      result = true;
    }
  } catch (e) {
    util.noop();
  }
  return result;
}

function getLinuxIfaceDNSsuffix(connectionName) {
  if (connectionName) {
    const cmd = `nmcli connection show "${connectionName}" 2>/dev/null | grep ipv4.dns-search;`;
    try {
      const result = execSync(cmd, util.execOptsLinux).toString();
      const resultFormat = result.replace(/\s+/g, ' ').trim();
      const dnsSuffix = resultFormat.split(' ').slice(1).toString();
      return dnsSuffix == '--' ? 'Not defined' : dnsSuffix;
    } catch (e) {
      return 'Unknown';
    }
  } else {
    return 'Unknown';
  }
}

function getLinuxIfaceIEEE8021xAuth(connectionName) {
  if (connectionName) {
    const cmd = `nmcli connection show "${connectionName}" 2>/dev/null | grep 802-1x.eap;`;
    try {
      const result = execSync(cmd, util.execOptsLinux).toString();
      const resultFormat = result.replace(/\s+/g, ' ').trim();
      const authenticationProtocol = resultFormat.split(' ').slice(1).toString();


      return authenticationProtocol == '--' ? '' : authenticationProtocol;
    } catch (e) {
      return 'Not defined';
    }
  } else {
    return 'Not defined';
  }
}

function getLinuxIfaceIEEE8021xState(authenticationProtocol) {
  if (authenticationProtocol) {
    if (authenticationProtocol == 'Not defined') {
      return 'Disabled';
    }
    return 'Enabled';
  } else {
    return 'Unknown';
  }
}

function testVirtualNic(iface, ifaceName, mac) {
  const virtualMacs = ['00:00:00:00:00:00', '00:03:FF', '00:05:69', '00:0C:29', '00:0F:4B', '00:13:07', '00:13:BE', '00:15:5d', '00:16:3E', '00:1C:42', '00:21:F6', '00:24:0B', '00:50:56', '00:A0:B1', '00:E0:C8', '08:00:27', '0A:00:27', '18:92:2C', '16:DF:49', '3C:F3:92', '54:52:00', 'FC:15:97'];
  if (mac) {
    return virtualMacs.filter(item => { return mac.toUpperCase().toUpperCase().startsWith(item.substring(0, mac.length)); }).length > 0 ||
      iface.toLowerCase().indexOf(' virtual ') > -1 ||
      ifaceName.toLowerCase().indexOf(' virtual ') > -1 ||
      iface.toLowerCase().indexOf('vethernet ') > -1 ||
      ifaceName.toLowerCase().indexOf('vethernet ') > -1 ||
      iface.toLowerCase().startsWith('veth') ||
      ifaceName.toLowerCase().startsWith('veth') ||
      iface.toLowerCase().startsWith('vboxnet') ||
      ifaceName.toLowerCase().startsWith('vboxnet');
  } else { return false; }
}

function networkInterfaces(options = {}, callback, rescan, defaultString) {
  if (options.platform) setPlatform(options.platform);

  if (typeof callback === 'string') {
    defaultString = callback;
    rescan = true;
    callback = null;
  }

  if (typeof callback === 'boolean') {
    rescan = callback;
    callback = null;
    defaultString = '';
  }
  if (typeof rescan === 'undefined') {
    rescan = true;
  }
  defaultString = defaultString || '';
  defaultString = '' + defaultString;

  return new Promise(async (resolve) => {
    process.nextTick(async () => {

      let ifaces = [];
      
      if (options.winrm && _windows) {
        try {
          // Get network interfaces and their properties
          const interfacesCmd = 'Get-NetAdapter | Select-Object -Property Name, InterfaceDescription, Status, MacAddress, LinkSpeed | Format-List';
          const ipAddressCmd = 'Get-NetIPAddress | Select-Object InterfaceAlias, IPAddress, PrefixLength | Format-List';
          
          const [interfacesResult, ipAddressResult] = await Promise.all([
            util.powerShell(interfacesCmd, options),
            util.powerShell(ipAddressCmd, options)
          ]);
          
          // Parse interfaces information
          const interfaces = [];
          const interfaceSections = interfacesResult.toString().split(/\r?\n\s*\r?\n/).filter(section => section.trim());
          
          interfaceSections.forEach(section => {
            const lines = section.split(/\r?\n/).filter(line => line.trim());
            let interfaceInfo = {};
            
            lines.forEach(line => {
              const parts = line.split(':');
              if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join(':').trim();
                
                if (key === 'Name') interfaceInfo.iface = value;
                if (key === 'InterfaceDescription') interfaceInfo.ifaceName = value;
                if (key === 'Status') interfaceInfo.operstate = value.toLowerCase() === 'up' ? 'up' : 'down';
                if (key === 'MacAddress') interfaceInfo.mac = value.toLowerCase();
                if (key === 'LinkSpeed') {
                  const speedMatch = value.match(/(\d+)/);
                  interfaceInfo.speed = speedMatch ? parseInt(speedMatch[1], 10) : 0;
                }
              }
            });
            
            if (interfaceInfo.iface) {
              interfaceInfo.internal = interfaceInfo.iface.toLowerCase().includes('loopback');
              interfaceInfo.virtual = interfaceInfo.iface.toLowerCase().includes('virtual');
              interfaceInfo.type = interfaceInfo.iface.toLowerCase().includes('wi-fi') ||
                                interfaceInfo.ifaceName.toLowerCase().includes('wireless') ? 'wireless' : 'wired';
              interfaceInfo.ip4 = '';
              interfaceInfo.ip4subnet = '';
              interfaceInfo.ip6 = '';
              interfaceInfo.ip6subnet = '';
              interfaceInfo.dhcp = true;
              interfaceInfo.dnsSuffix = '';
              interfaces.push(interfaceInfo);
            }
          });

          ifaces = interfaces;
          
          // Parse IP address information
          const ipSections = ipAddressResult.toString().split(/\r?\n\s*\r?\n/).filter(section => section.trim());
          
          ipSections.forEach(section => {
            const lines = section.split(/\r?\n/).filter(line => line.trim());
            let ipInfo = {
              alias: '',
              address: '',
              prefixLength: ''
            };
            
            lines.forEach(line => {
              const parts = line.split(':');
              if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join(':').trim();
                
                if (key === 'InterfaceAlias') ipInfo.alias = value;
                if (key === 'IPAddress') ipInfo.address = value;
                if (key === 'PrefixLength') ipInfo.prefixLength = value;
              }
            });
            
            if (ipInfo.alias && ipInfo.address) {
              // Find the corresponding interface and add IP info
              const matchingInterface = interfaces.find(iface => iface.iface === ipInfo.alias);
              if (matchingInterface) {
                if (ipInfo.address.includes(':')) {
                  matchingInterface.ip6 = ipInfo.address;
                  matchingInterface.ip6subnet = ipInfo.prefixLength;
                } else {
                  matchingInterface.ip4 = ipInfo.address;
                  matchingInterface.ip4subnet = ipInfo.prefixLength;
                }
              }
            }
          });
          
          // Get default interface
          let defaultInterface = '';
          try {
            const defaultCmd = 'Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Select-Object -First 1 | Select-Object InterfaceAlias | Format-List';
            const defaultResult = await util.powerShell(defaultCmd, options);
            const defaultLines = defaultResult.toString().split(/\r?\n/).filter(line => line.trim());
            
            for (const line of defaultLines) {
              const parts = line.split(':');
              if (parts.length >= 2 && parts[0].trim() === 'InterfaceAlias') {
                defaultInterface = parts[1].trim();
                break;
              }
            }
          } catch (e) {
            // If default interface detection fails, leave as empty string
          }
          
          // Mark default interface
          interfaces.forEach(iface => {
            iface.default = (iface.iface === defaultInterface);
          });
          
          let result = interfaces;
          _networkInterfaces = result;
          
          if (defaultString.toLowerCase().indexOf('default') >= 0) {
            result = result.filter(item => item.default);
            if (result.length > 0) {
              result = result[0];
            } else {
              result = [];
            }
          }
          
          if (callback) { callback(result); }
          resolve(result);
        } catch (error) {
          console.error('Error getting network interfaces over WinRM:', error);
          // Fall back to regular method
          // let ifaces = os.networkInterfaces();
        }
      }/*  else {
        let ifaces = os.networkInterfaces();
        // ... existing code ...
      } */
    });
  });
}

exports.networkInterfaces = networkInterfaces;

// --------------------------
// NET - Speed

function calcNetworkSpeed(iface, rx_bytes, tx_bytes, operstate, rx_dropped, rx_errors, tx_dropped, tx_errors) {
  let result = {
    iface,
    operstate,
    rx_bytes,
    rx_dropped,
    rx_errors,
    tx_bytes,
    tx_dropped,
    tx_errors,
    rx_sec: null,
    tx_sec: null,
    ms: 0
  };

  if (_network[iface] && _network[iface].ms) {
    result.ms = Date.now() - _network[iface].ms;
    result.rx_sec = (rx_bytes - _network[iface].rx_bytes) >= 0 ? (rx_bytes - _network[iface].rx_bytes) / (result.ms / 1000) : 0;
    result.tx_sec = (tx_bytes - _network[iface].tx_bytes) >= 0 ? (tx_bytes - _network[iface].tx_bytes) / (result.ms / 1000) : 0;
    _network[iface].rx_bytes = rx_bytes;
    _network[iface].tx_bytes = tx_bytes;
    _network[iface].rx_sec = result.rx_sec;
    _network[iface].tx_sec = result.tx_sec;
    _network[iface].ms = Date.now();
    _network[iface].last_ms = result.ms;
    _network[iface].operstate = operstate;
  } else {
    if (!_network[iface]) { _network[iface] = {}; }
    _network[iface].rx_bytes = rx_bytes;
    _network[iface].tx_bytes = tx_bytes;
    _network[iface].rx_sec = null;
    _network[iface].tx_sec = null;
    _network[iface].ms = Date.now();
    _network[iface].last_ms = 0;
    _network[iface].operstate = operstate;
  }
  return result;
}

function networkStats(options = {}, ifaces, callback) {
  if (options.platform) setPlatform(options.platform);

  let ifacesArray = [];

  return new Promise(async (resolve) => {
    process.nextTick(async () => {

      // fallback - if only callback is given
      if (util.isFunction(ifaces) && !callback) {
        callback = ifaces;
        ifacesArray = [await getDefaultNetworkInterface(options)];
      } else {
        if (typeof ifaces !== 'string' && ifaces !== undefined) {
          if (callback) { callback([]); }
          return resolve([]);
        }
        ifaces = ifaces || await getDefaultNetworkInterface(options);

        try {
          ifaces.__proto__.toLowerCase = util.stringToLower;
          ifaces.__proto__.replace = util.stringReplace;
          ifaces.__proto__.toString = util.stringToString;
          ifaces.__proto__.substr = util.stringSubstr;
          ifaces.__proto__.substring = util.stringSubstring;
          ifaces.__proto__.trim = util.stringTrim;
          ifaces.__proto__.startsWith = util.stringStartWith;
        } catch (e) {
          Object.setPrototypeOf(ifaces, util.stringObj);
        }

        ifaces = ifaces.trim().toLowerCase().replace(/,+/g, '|');
        ifacesArray = ifaces.split('|');
      }

      const result = [];

      const workload = [];
      if (ifacesArray.length && ifacesArray[0].trim() === '*') {
        ifacesArray = [];
        networkInterfaces(options, false).then(allIFaces => {
          for (let iface of allIFaces) {
            ifacesArray.push(iface.iface);
          }
          networkStats(options, ifacesArray.join(',')).then(result => {
            if (callback) { callback(result); }
            resolve(result);
          });
        });
      } else {
        for (let iface of ifacesArray) {
          workload.push(networkStatsSingle(options, iface.trim()));
        }
        if (workload.length) {
          Promise.all(
            workload
          ).then((data) => {
            if (callback) { callback(data); }
            resolve(data);
          });
        } else {
          if (callback) { callback(result); }
          resolve(result);
        }
      }
    });
  });
}

function networkStatsSingle(options = {}, iface) {
  if (options.platform) setPlatform(options.platform);

  function parseLinesWindowsPerfData(sections) {
    let perfData = [];
    for (let i in sections) {
      if ({}.hasOwnProperty.call(sections, i)) {
        if (sections[i].trim() !== '') {
          let lines = sections[i].trim().split('\r\n');
          perfData.push({
            name: util.getValue(lines, 'Name', ':').replace(/[()[\] ]+/g, '').replace(/#|\//g, '_').toLowerCase(),
            rx_bytes: parseInt(util.getValue(lines, 'BytesReceivedPersec', ':'), 10),
            rx_errors: parseInt(util.getValue(lines, 'PacketsReceivedErrors', ':'), 10),
            rx_dropped: parseInt(util.getValue(lines, 'PacketsReceivedDiscarded', ':'), 10),
            tx_bytes: parseInt(util.getValue(lines, 'BytesSentPersec', ':'), 10),
            tx_errors: parseInt(util.getValue(lines, 'PacketsOutboundErrors', ':'), 10),
            tx_dropped: parseInt(util.getValue(lines, 'PacketsOutboundDiscarded', ':'), 10)
          });
        }
      }
    }
    return perfData;
  }

  return new Promise((resolve) => {
    process.nextTick(() => {
      let ifaceSanitized = '';
      const s = util.isPrototypePolluted() ? '---' : util.sanitizeShellString(iface);
      const l = util.mathMin(s.length, 2000);
      for (let i = 0; i <= l; i++) {
        if (s[i] !== undefined) {
          ifaceSanitized = ifaceSanitized + s[i];
        }
      }

      let result = {
        iface: ifaceSanitized,
        operstate: 'unknown',
        rx_bytes: 0,
        rx_dropped: 0,
        rx_errors: 0,
        tx_bytes: 0,
        tx_dropped: 0,
        tx_errors: 0,
        rx_sec: null,
        tx_sec: null,
        ms: 0
      };

      let operstate = 'unknown';
      let rx_bytes = 0;
      let tx_bytes = 0;
      let rx_dropped = 0;
      let rx_errors = 0;
      let tx_dropped = 0;
      let tx_errors = 0;

      let cmd, lines, stats;
      if (!_network[ifaceSanitized] || (_network[ifaceSanitized] && !_network[ifaceSanitized].ms) || (_network[ifaceSanitized] && _network[ifaceSanitized].ms && Date.now() - _network[ifaceSanitized].ms >= 500)) {
        if (_linux) {
          if (fs.existsSync('/sys/class/net/' + ifaceSanitized)) {
            cmd =
              'cat /sys/class/net/' + ifaceSanitized + '/operstate; ' +
              'cat /sys/class/net/' + ifaceSanitized + '/statistics/rx_bytes; ' +
              'cat /sys/class/net/' + ifaceSanitized + '/statistics/tx_bytes; ' +
              'cat /sys/class/net/' + ifaceSanitized + '/statistics/rx_dropped; ' +
              'cat /sys/class/net/' + ifaceSanitized + '/statistics/rx_errors; ' +
              'cat /sys/class/net/' + ifaceSanitized + '/statistics/tx_dropped; ' +
              'cat /sys/class/net/' + ifaceSanitized + '/statistics/tx_errors; ';
            exec(cmd, function (error, stdout) {
              if (!error) {
                lines = stdout.toString().split('\n');
                operstate = lines[0].trim();
                rx_bytes = parseInt(lines[1], 10);
                tx_bytes = parseInt(lines[2], 10);
                rx_dropped = parseInt(lines[3], 10);
                rx_errors = parseInt(lines[4], 10);
                tx_dropped = parseInt(lines[5], 10);
                tx_errors = parseInt(lines[6], 10);

                result = calcNetworkSpeed(ifaceSanitized, rx_bytes, tx_bytes, operstate, rx_dropped, rx_errors, tx_dropped, tx_errors);

              }
              resolve(result);
            });
          } else {
            resolve(result);
          }
        }
        if (_freebsd || _openbsd || _netbsd) {
          cmd = 'netstat -ibndI ' + ifaceSanitized;   // lgtm [js/shell-command-constructed-from-input]
          exec(cmd, function (error, stdout) {
            if (!error) {
              lines = stdout.toString().split('\n');
              for (let i = 1; i < lines.length; i++) {
                const line = lines[i].replace(/ +/g, ' ').split(' ');
                if (line && line[0] && line[7] && line[10]) {
                  rx_bytes = rx_bytes + parseInt(line[7]);
                  if (line[6].trim() !== '-') { rx_dropped = rx_dropped + parseInt(line[6]); }
                  if (line[5].trim() !== '-') { rx_errors = rx_errors + parseInt(line[5]); }
                  tx_bytes = tx_bytes + parseInt(line[10]);
                  if (line[12].trim() !== '-') { tx_dropped = tx_dropped + parseInt(line[12]); }
                  if (line[9].trim() !== '-') { tx_errors = tx_errors + parseInt(line[9]); }
                  operstate = 'up';
                }
              }
              result = calcNetworkSpeed(ifaceSanitized, rx_bytes, tx_bytes, operstate, rx_dropped, rx_errors, tx_dropped, tx_errors);
            }
            resolve(result);
          });
        }
        if (_darwin) {
          cmd = 'ifconfig ' + ifaceSanitized + ' | grep "status"';    // lgtm [js/shell-command-constructed-from-input]
          exec(cmd, function (error, stdout) {
            result.operstate = (stdout.toString().split(':')[1] || '').trim();
            result.operstate = (result.operstate || '').toLowerCase();
            result.operstate = (result.operstate === 'active' ? 'up' : (result.operstate === 'inactive' ? 'down' : 'unknown'));
            cmd = 'netstat -bdI ' + ifaceSanitized;   // lgtm [js/shell-command-constructed-from-input]
            exec(cmd, function (error, stdout) {
              if (!error) {
                lines = stdout.toString().split('\n');
                // if there is less than 2 lines, no information for this interface was found
                if (lines.length > 1 && lines[1].trim() !== '') {
                  // skip header line
                  // use the second line because it is tied to the NIC instead of the ipv4 or ipv6 address
                  stats = lines[1].replace(/ +/g, ' ').split(' ');
                  const offset = stats.length > 11 ? 1 : 0;
                  rx_bytes = parseInt(stats[offset + 5]);
                  rx_dropped = parseInt(stats[offset + 10]);
                  rx_errors = parseInt(stats[offset + 4]);
                  tx_bytes = parseInt(stats[offset + 8]);
                  tx_dropped = parseInt(stats[offset + 10]);
                  tx_errors = parseInt(stats[offset + 7]);
                  result = calcNetworkSpeed(ifaceSanitized, rx_bytes, tx_bytes, result.operstate, rx_dropped, rx_errors, tx_dropped, tx_errors);
                }
              }
              resolve(result);
            });
          });
        }
        if (_windows) {
          if (options.winrm) {
            // Using WinRM to get performance data
            const perfDataCmd = 'Get-CimInstance Win32_PerfRawData_Tcpip_NetworkInterface | select Name,BytesReceivedPersec,PacketsReceivedErrors,PacketsReceivedDiscarded,BytesSentPersec,PacketsOutboundErrors,PacketsOutboundDiscarded | Format-List';
            
            util.powerShell(perfDataCmd, options).then(async (stdout) => {
              // Remove debug log
              let perfData = [];
              if (stdout) {
                const psections = stdout.toString().split(/\n\s*\n/);
                perfData = parseLinesWindowsPerfData(psections);
              }
              
              // Get network interfaces
              try {
                const interfaces = await networkInterfaces(options);
                
                // Get bytes sent, received from perfData by name
                rx_bytes = 0;
                tx_bytes = 0;
                let ifaceName = ifaceSanitized;
                let matchFound = false;
                
                // First, try to find a direct interface match
                if (ifaceSanitized !== '*') {
                  interfaces.forEach(det => {
                    if (det.iface.toLowerCase() === ifaceSanitized.toLowerCase() ||
                        det.mac.toLowerCase() === ifaceSanitized.toLowerCase() ||
                        det.ip4.toLowerCase() === ifaceSanitized.toLowerCase() ||
                        det.ip6.toLowerCase() === ifaceSanitized.toLowerCase()) {
                      ifaceName = det.iface;
                      
                      // Now find the corresponding performance data
                      perfData.forEach(detail => {
                        const detailName = det.ifaceName.replace(/[()[\] ]+/g, '').replace(/#|\//g, '_').toLowerCase();
                        const perfDataName = detail.name.toLowerCase();
                        
                        if (detailName.includes(perfDataName) || perfDataName.includes(detailName)) {
                          rx_bytes = detail.rx_bytes;
                          rx_dropped = detail.rx_dropped;
                          rx_errors = detail.rx_errors;
                          tx_bytes = detail.tx_bytes;
                          tx_dropped = detail.tx_dropped;
                          tx_errors = detail.tx_errors;
                          operstate = det.operstate;
                          matchFound = true;
                        }
                      });
                    }
                  });
                }
                
                // If no direct match found, try a more flexible match
                if (!matchFound) {
                  // If no specific interface was requested or no match found, use the first active interface
                  if (ifaceSanitized === '*' || interfaces.length > 0) {
                    for (const det of interfaces) {
                      if (det.operstate === 'up') {
                        ifaceName = det.iface;
                        
                        // Find matching performance data
                        for (const detail of perfData) {
                          // Try to extract key parts of the interface names for comparison
                          const interfaceHint = det.ifaceName.toLowerCase();
                          const perfDataHint = detail.name.toLowerCase();
                          
                          // Check for partial name matches 
                          if (interfaceHint.includes(perfDataHint) || 
                              perfDataHint.includes(interfaceHint) ||
                              // Common adapter names often include these terms
                              (interfaceHint.includes('ethernet') && perfDataHint.includes('ethernet')) ||
                              (interfaceHint.includes('wireless') && perfDataHint.includes('wireless')) ||
                              (interfaceHint.includes('wi-fi') && perfDataHint.includes('wi-fi')) ||
                              (interfaceHint.includes('wifi') && perfDataHint.includes('wifi'))) {
                            
                            rx_bytes = detail.rx_bytes;
                            rx_dropped = detail.rx_dropped;
                            rx_errors = detail.rx_errors;
                            tx_bytes = detail.tx_bytes;
                            tx_dropped = detail.tx_dropped;
                            tx_errors = detail.tx_errors;
                            operstate = det.operstate;
                            matchFound = true;
                            break;
                          }
                        }
                        if (matchFound) break;
                      }
                    }
                  }
                }
                
                if (rx_bytes && tx_bytes) {
                  result = calcNetworkSpeed(ifaceName, parseInt(rx_bytes), parseInt(tx_bytes), operstate, rx_dropped, rx_errors, tx_dropped, tx_errors);
                }
                resolve(result);
              } catch (error) {
                console.error('Error getting network stats over WinRM:', error);
                resolve(result);
              }
            }).catch(error => {
              console.error('Error getting network performance data over WinRM:', error);
              resolve(result);
            });
          } else {
            // Original Windows code path without WinRM
            let perfData = [];
            let ifaceName = ifaceSanitized;

            // Performance Data
            util.powerShell('Get-CimInstance Win32_PerfRawData_Tcpip_NetworkInterface | select Name,BytesReceivedPersec,PacketsReceivedErrors,PacketsReceivedDiscarded,BytesSentPersec,PacketsOutboundErrors,PacketsOutboundDiscarded | fl', options).then((stdout, error) => {
              if (!error) {
                const psections = stdout.toString().split(/\n\s*\n/);
                perfData = parseLinesWindowsPerfData(psections);
              }

              // Network Interfaces
              networkInterfaces(false).then(interfaces => {
                // get bytes sent, received from perfData by name
                rx_bytes = 0;
                tx_bytes = 0;
                perfData.forEach(detail => {
                  interfaces.forEach(det => {
                    if ((det.iface.toLowerCase() === ifaceSanitized.toLowerCase() ||
                      det.mac.toLowerCase() === ifaceSanitized.toLowerCase() ||
                      det.ip4.toLowerCase() === ifaceSanitized.toLowerCase() ||
                      det.ip6.toLowerCase() === ifaceSanitized.toLowerCase() ||
                      det.ifaceName.replace(/[()[\] ]+/g, '').replace(/#|\//g, '_').toLowerCase() === ifaceSanitized.replace(/[()[\] ]+/g, '').replace('#', '_').toLowerCase()) &&
                      (det.ifaceName.replace(/[()[\] ]+/g, '').replace(/#|\//g, '_').toLowerCase() === detail.name)) {
                      ifaceName = det.iface;
                      rx_bytes = detail.rx_bytes;
                      rx_dropped = detail.rx_dropped;
                      rx_errors = detail.rx_errors;
                      tx_bytes = detail.tx_bytes;
                      tx_dropped = detail.tx_dropped;
                      tx_errors = detail.tx_errors;
                      operstate = det.operstate;
                    }
                  });
                });
                if (rx_bytes && tx_bytes) {
                  result = calcNetworkSpeed(ifaceName, parseInt(rx_bytes), parseInt(tx_bytes), operstate, rx_dropped, rx_errors, tx_dropped, tx_errors);
                }
                resolve(result);
              });
            });
          }
        }
      } else {
        result.rx_bytes = _network[ifaceSanitized].rx_bytes;
        result.tx_bytes = _network[ifaceSanitized].tx_bytes;
        result.rx_sec = _network[ifaceSanitized].rx_sec;
        result.tx_sec = _network[ifaceSanitized].tx_sec;
        result.ms = _network[ifaceSanitized].last_ms;
        result.operstate = _network[ifaceSanitized].operstate;
        resolve(result);
      }
    });
  });
}

exports.networkStats = networkStats;

// --------------------------
// NET - connections (sockets)

function getProcessName(processes, pid) {
  let cmd = '';
  processes.forEach(line => {
    const parts = line.split(' ');
    const id = parseInt(parts[0], 10) || -1;
    if (id === pid) {
      parts.shift();
      cmd = parts.join(' ').split(':')[0];
    }
  });
  cmd = cmd.split(' -')[0];
  cmd = cmd.split(' /')[0];
  return cmd;
  // const cmdParts = cmd.split('/');
  // return cmdParts[cmdParts.length - 1];
}

function networkConnections(options = {},callback) {
  if (options.platform) setPlatform(options.platform);

  return new Promise((resolve) => {
    process.nextTick(() => {
      let result = [];
      if (_linux || _freebsd || _openbsd || _netbsd) {
        let cmd = 'export LC_ALL=C; netstat -tunap | grep "ESTABLISHED\\|SYN_SENT\\|SYN_RECV\\|FIN_WAIT1\\|FIN_WAIT2\\|TIME_WAIT\\|CLOSE\\|CLOSE_WAIT\\|LAST_ACK\\|LISTEN\\|CLOSING\\|UNKNOWN"; unset LC_ALL';
        if (_freebsd || _openbsd || _netbsd) { cmd = 'export LC_ALL=C; netstat -na | grep "ESTABLISHED\\|SYN_SENT\\|SYN_RECV\\|FIN_WAIT1\\|FIN_WAIT2\\|TIME_WAIT\\|CLOSE\\|CLOSE_WAIT\\|LAST_ACK\\|LISTEN\\|CLOSING\\|UNKNOWN"; unset LC_ALL'; }
        exec(cmd, { maxBuffer: 1024 * 20000 }, function (error, stdout) {
          let lines = stdout.toString().split('\n');
          if (!error && (lines.length > 1 || lines[0] != '')) {
            lines.forEach(function (line) {
              line = line.replace(/ +/g, ' ').split(' ');
              if (line.length >= 7) {
                let localip = line[3];
                let localport = '';
                let localaddress = line[3].split(':');
                if (localaddress.length > 1) {
                  localport = localaddress[localaddress.length - 1];
                  localaddress.pop();
                  localip = localaddress.join(':');
                }
                let peerip = line[4];
                let peerport = '';
                let peeraddress = line[4].split(':');
                if (peeraddress.length > 1) {
                  peerport = peeraddress[peeraddress.length - 1];
                  peeraddress.pop();
                  peerip = peeraddress.join(':');
                }
                let connstate = line[5];
                let proc = line[6].split('/');

                if (connstate) {
                  result.push({
                    protocol: line[0],
                    localAddress: localip,
                    localPort: localport,
                    peerAddress: peerip,
                    peerPort: peerport,
                    state: connstate,
                    pid: proc[0] && proc[0] !== '-' ? parseInt(proc[0], 10) : null,
                    process: proc[1] ? proc[1].split(' ')[0].split(':')[0] : ''
                  });
                }
              }
            });
            if (callback) {
              callback(result);
            }
            resolve(result);
          } else {
            cmd = 'ss -tunap | grep "ESTAB\\|SYN-SENT\\|SYN-RECV\\|FIN-WAIT1\\|FIN-WAIT2\\|TIME-WAIT\\|CLOSE\\|CLOSE-WAIT\\|LAST-ACK\\|LISTEN\\|CLOSING"';
            exec(cmd, { maxBuffer: 1024 * 20000 }, function (error, stdout) {

              if (!error) {
                let lines = stdout.toString().split('\n');
                lines.forEach(function (line) {
                  line = line.replace(/ +/g, ' ').split(' ');
                  if (line.length >= 6) {
                    let localip = line[4];
                    let localport = '';
                    let localaddress = line[4].split(':');
                    if (localaddress.length > 1) {
                      localport = localaddress[localaddress.length - 1];
                      localaddress.pop();
                      localip = localaddress.join(':');
                    }
                    let peerip = line[5];
                    let peerport = '';
                    let peeraddress = line[5].split(':');
                    if (peeraddress.length > 1) {
                      peerport = peeraddress[peeraddress.length - 1];
                      peeraddress.pop();
                      peerip = peeraddress.join(':');
                    }
                    let connstate = line[1];
                    if (connstate === 'ESTAB') { connstate = 'ESTABLISHED'; }
                    if (connstate === 'TIME-WAIT') { connstate = 'TIME_WAIT'; }
                    let pid = null;
                    let process = '';
                    if (line.length >= 7 && line[6].indexOf('users:') > -1) {
                      let proc = line[6].replace('users:(("', '').replace(/"/g, '').split(',');
                      if (proc.length > 2) {
                        process = proc[0].split(' ')[0].split(':')[0];
                        pid = parseInt(proc[1], 10);
                      }
                    }
                    if (connstate) {
                      result.push({
                        protocol: line[0],
                        localAddress: localip,
                        localPort: localport,
                        peerAddress: peerip,
                        peerPort: peerport,
                        state: connstate,
                        pid,
                        process
                      });
                    }
                  }
                });
              }
              if (callback) {
                callback(result);
              }
              resolve(result);
            });
          }
        });
      }
      if (_darwin) {
        let cmd = 'netstat -natvln | head -n2; netstat -natvln | grep "tcp4\\|tcp6\\|udp4\\|udp6"';
        const states = 'ESTABLISHED|SYN_SENT|SYN_RECV|FIN_WAIT1|FIN_WAIT_1|FIN_WAIT2|FIN_WAIT_2|TIME_WAIT|CLOSE|CLOSE_WAIT|LAST_ACK|LISTEN|CLOSING|UNKNOWN'.split('|');
        exec(cmd, { maxBuffer: 1024 * 20000 }, function (error, stdout) {
          if (!error) {
            exec('ps -axo pid,command', { maxBuffer: 1024 * 20000 }, function (err2, stdout2) {
              let processes = stdout2.toString().split('\n');
              processes = processes.map((line => { return line.trim().replace(/ +/g, ' '); }));
              let lines = stdout.toString().split('\n');
              lines.shift();
              let pidPos = 8;
              if (lines.length > 1 && lines[0].indexOf('pid') > 0) {
                const header = (lines.shift() || '').replace(/ Address/g, '_Address').replace(/ +/g, ' ').split(' ');
                pidPos = header.indexOf('pid');
              }
              lines.forEach(function (line) {
                line = line.replace(/ +/g, ' ').split(' ');
                if (line.length >= 8) {
                  let localip = line[3];
                  let localport = '';
                  let localaddress = line[3].split('.');
                  if (localaddress.length > 1) {
                    localport = localaddress[localaddress.length - 1];
                    localaddress.pop();
                    localip = localaddress.join('.');
                  }
                  let peerip = line[4];
                  let peerport = '';
                  let peeraddress = line[4].split('.');
                  if (peeraddress.length > 1) {
                    peerport = peeraddress[peeraddress.length - 1];
                    peeraddress.pop();
                    peerip = peeraddress.join('.');
                  }
                  const hasState = states.indexOf(line[5]) >= 0;
                  let connstate = hasState ? line[5] : 'UNKNOWN';
                  let pid = parseInt(line[pidPos + (hasState ? 0 : -1)], 10);
                  if (connstate) {
                    result.push({
                      protocol: line[0],
                      localAddress: localip,
                      localPort: localport,
                      peerAddress: peerip,
                      peerPort: peerport,
                      state: connstate,
                      pid: pid,
                      process: getProcessName(processes, pid)
                    });
                  }
                }
              });
              if (callback) {
                callback(result);
              }
              resolve(result);
            });

          }
        });
      }
      if (_windows) {
        let cmd = 'netstat -nao';
        try {
          util.powerShell(cmd, options).then((stdout, error) => {
            if (!error) {

              let lines = stdout.toString().split('\r\n');

              lines.forEach(function (line) {
                line = line.trim().replace(/ +/g, ' ').split(' ');
                if (line.length >= 4) {
                  let localip = line[1];
                  let localport = '';
                  let localaddress = line[1].split(':');
                  if (localaddress.length > 1) {
                    localport = localaddress[localaddress.length - 1];
                    localaddress.pop();
                    localip = localaddress.join(':');
                  }
                  localip = localip.replace(/\[/g, '').replace(/\]/g, '');
                  let peerip = line[2];
                  let peerport = '';
                  let peeraddress = line[2].split(':');
                  if (peeraddress.length > 1) {
                    peerport = peeraddress[peeraddress.length - 1];
                    peeraddress.pop();
                    peerip = peeraddress.join(':');
                  }
                  peerip = peerip.replace(/\[/g, '').replace(/\]/g, '');
                  let pid = util.toInt(line[4]);
                  let connstate = line[3];
                  if (connstate === 'HERGESTELLT') { connstate = 'ESTABLISHED'; }
                  if (connstate.startsWith('ABH')) { connstate = 'LISTEN'; }
                  if (connstate === 'SCHLIESSEN_WARTEN') { connstate = 'CLOSE_WAIT'; }
                  if (connstate === 'WARTEND') { connstate = 'TIME_WAIT'; }
                  if (connstate === 'SYN_GESENDET') { connstate = 'SYN_SENT'; }

                  if (connstate === 'LISTENING') { connstate = 'LISTEN'; }
                  if (connstate === 'SYN_RECEIVED') { connstate = 'SYN_RECV'; }
                  if (connstate === 'FIN_WAIT_1') { connstate = 'FIN_WAIT1'; }
                  if (connstate === 'FIN_WAIT_2') { connstate = 'FIN_WAIT2'; }
                  if (line[0].toLowerCase() !== 'udp' && connstate) {
                    result.push({
                      protocol: line[0].toLowerCase(),
                      localAddress: localip,
                      localPort: localport,
                      peerAddress: peerip,
                      peerPort: peerport,
                      state: connstate,
                      pid,
                    });
                  } else if (line[0].toLowerCase() === 'udp') {
                    result.push({
                      protocol: line[0].toLowerCase(),
                      localAddress: localip,
                      localPort: localport,
                      peerAddress: peerip,
                      peerPort: peerport,
                      state: null,
                      pid: parseInt(line[3], 10),
                    });
                  }
                }
              });
              if (callback) {
                callback(result);
              }
              resolve(result);
            }
          });
        } catch (e) {
          if (callback) { callback(result); }
          resolve(result);
        }
      }
    });
  });
}

exports.networkConnections = networkConnections;

function networkGatewayDefault(options = {}, callback) {
  if (options.platform) setPlatform(options.platform);

  return new Promise(async (resolve) => {
    process.nextTick(async () => {
      let result = '';
      if (_linux || _freebsd || _openbsd || _netbsd) {
        let cmd = 'ip route get 1';
        try {
          exec(cmd, { maxBuffer: 1024 * 20000 }, function (error, stdout) {
            if (!error) {
              let lines = stdout.toString().split('\n');
              const line = lines && lines[0] ? lines[0] : '';
              let parts = line.split(' via ');
              if (parts && parts[1]) {
                parts = parts[1].split(' ');
                result = parts[0];
              }
              if (callback) {
                callback(result);
              }
              resolve(result);
            } else {
              if (callback) {
                callback(result);
              }
              resolve(result);
            }
          });
        } catch (e) {
          if (callback) { callback(result); }
          resolve(result);
        }
      }
      if (_darwin) {
        let cmd = 'route -n get default';
        try {
          exec(cmd, { maxBuffer: 1024 * 20000 }, function (error, stdout) {
            if (!error) {
              const lines = stdout.toString().split('\n').map(line => line.trim());
              result = util.getValue(lines, 'gateway');
            }
            if (!result) {
              cmd = 'netstat -rn | awk \'/default/ {print $2}\'';
              exec(cmd, { maxBuffer: 1024 * 20000 }, function (error, stdout) {
                const lines = stdout.toString().split('\n').map(line => line.trim());
                result = lines.find(line => (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(line)));
                if (callback) {
                  callback(result);
                }
                resolve(result);
              });
            } else {
              if (callback) {
                callback(result);
              }
              resolve(result);
            }
          });
        } catch (e) {
          if (callback) { callback(result); }
          resolve(result);
        }
      }
      if (_windows) {
        try {
          util.powerShell('netstat -r', options).then((data) => {
            const lines = data.toString().split('\r\n');
            lines.forEach(line => {
              line = line.replace(/\s+/g, ' ').trim();
              if (line.indexOf('0.0.0.0 0.0.0.0') > -1 && !(/[a-zA-Z]/.test(line))) {
                const parts = line.split(' ');
                if (parts.length >= 5 && (parts[parts.length - 3]).indexOf('.') > -1) {
                  result = parts[parts.length - 3];
                }
              }
            });
            if (!result) {
              util.powerShell('Get-CimInstance -ClassName Win32_IP4RouteTable | Where-Object { $_.Destination -eq \'0.0.0.0\' -and $_.Mask -eq \'0.0.0.0\' }', options)
                .then((data) => {
                  let lines = data.toString().split('\r\n');
                  if (lines.length > 1 && !result) {
                    result = util.getValue(lines, 'NextHop');
                    if (callback) {
                      callback(result);
                    }
                    resolve(result);
                  }
                });
            } else {
              if (callback) {
                callback(result);
              }
              resolve(result);
            }
          });
        } catch (e) {
          if (callback) { callback(result); }
          resolve(result);
        }
      }
    });
  });
}

exports.networkGatewayDefault = networkGatewayDefault;
