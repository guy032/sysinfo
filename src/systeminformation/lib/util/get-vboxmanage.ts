import os from 'os';

// Define constants
const _windows = os.type() === 'Windows_NT';

/**
 * Get the VBoxManage executable path
 *
 * @returns {string} Path to VBoxManage executable
 */
export function getVboxmanage(): string {
  return _windows
    ? `"${process.env.VBOX_INSTALL_PATH || process.env.VBOX_MSI_INSTALL_PATH}\\VBoxManage.exe"`
    : 'vboxmanage';
}

export default getVboxmanage;
