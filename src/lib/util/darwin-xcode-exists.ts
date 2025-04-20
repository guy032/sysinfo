import fs from 'fs';

/**
 * Check if Xcode or Command Line Tools are installed on macOS
 *
 * @returns {boolean} True if Xcode or Command Line Tools are installed
 */
export function darwinXcodeExists(): boolean {
  const cmdLineToolsExists = fs.existsSync('/Library/Developer/CommandLineTools/usr/bin/');
  const xcodeAppExists = fs.existsSync('/Applications/Xcode.app/Contents/Developer/Tools');
  const xcodeExists = fs.existsSync('/Library/Developer/Xcode/');

  return cmdLineToolsExists || xcodeExists || xcodeAppExists;
}

export default darwinXcodeExists;
