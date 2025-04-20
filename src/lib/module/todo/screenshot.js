const util = require('../../util');

function screenshot(options = {}, callback) {
  let result = [];

  return new Promise((resolve) => {
    process.nextTick(async () => {
      try {
        const session = await util.powerShell(`query session`, options);
        console.log('session', session);

        // Parse session data
        const sessionInfo = parseSessionOutput(session);
        // console.log('Parsed sessions:', JSON.stringify(sessionInfo, null, 2));

        // Find active sessions
        const activeSessions = findActiveSessions(sessionInfo);
        console.log('Active sessions:', JSON.stringify(activeSessions, null, 2));

        const sessionId = activeSessions[0].id;
        const username = activeSessions[0].username;

        console.log('Using session ID:', sessionId);

        // todo: we should execute in the context of specific user and not console
        // Create PowerShell script (single line to avoid syntax errors)
        const psScript = `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; $s=[Windows.Forms.Screen]::AllScreens; $t=($s.Bounds.Top|Measure-Object -Minimum).Minimum; $l=($s.Bounds.Left|Measure-Object -Minimum).Minimum; $r=($s.Bounds.Right|Measure-Object -Maximum).Maximum; $b=($s.Bounds.Bottom|Measure-Object -Maximum).Maximum; $bounds=[Drawing.Rectangle]::FromLTRB($l,$t,$r,$b); $bmp=New-Object Drawing.Bitmap $bounds.Width, $bounds.Height; $g=[Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($bounds.Location,[Drawing.Point]::Empty,$bounds.Size); $ms=New-Object IO.MemoryStream; $bmp.Save($ms, [Drawing.Imaging.ImageFormat]::Png); [Convert]::ToBase64String($ms.ToArray()); $g.Dispose(); $bmp.Dispose(); $ms.Dispose()`;

        // Convert the script to Base64 to avoid command line parsing issues
        const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64');

        // Use direct PowerShell with util.powerShell if no psexec
        let screenshotCmd;

        screenshotCmd = options.usePsexec
          ? `psexec -i ${sessionId} -u ${username} powershell.exe -NoProfile -EncodedCommand ${encodedCommand}`
          : psScript;

        console.log('Using psexec:', Boolean(options.usePsexec));

        util.powerShell(screenshotCmd, options).then((stdout) => {
          // console.log('stdout', stdout);
          result = stdout; // Screenshot data is already a string, not JSON

          if (callback) {
            callback(result);
          }

          resolve(result);
        });
      } catch {
        if (callback) {
          callback(result);
        }

        resolve(result);
      }
    });
  });
}

/**
 * Take screenshot via WinRM and scheduled task using active session info
 * @param {Object} options - Options including outputPath
 * @returns {Promise<string>} - Base64 encoded screenshot
 */
function screenshotViaWinRM(options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const outputPath = '$env:TEMP\\screenshot.png';

      // Get session info first
      const sessionOutput = await util.powerShell(`query session`, options);
      const sessionInfo = parseSessionOutput(sessionOutput);
      const activeSessions = findActiveSessions(sessionInfo);

      if (!activeSessions || activeSessions.length === 0) {
        reject(new Error(`No active sessions found`));

        return;
      }

      // Use the first active session
      const activeSession = activeSessions[0];
      const sessionId = activeSession.id;
      const username = activeSession.username;

      console.log(`Found active session - ID: ${sessionId}, Username: ${username}`);

      // Create a single-line screenshot script to avoid syntax issues
      const simpleScreenshotScript =
        'Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $screenBounds = [Windows.Forms.Screen]::PrimaryScreen.Bounds; $bitmap = New-Object System.Drawing.Bitmap $screenBounds.Width, $screenBounds.Height; $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($screenBounds.Location, [System.Drawing.Point]::Empty, $screenBounds.Size); $bitmap.Save("${outputPath}", [System.Drawing.Imaging.ImageFormat]::Png); $graphics.Dispose(); $bitmap.Dispose();';

      // First, save the screenshot script to a file (using single line)
      await util.powerShell(
        `Set-Content -Path "$env:TEMP\\screenshot.ps1" -Value "${simpleScreenshotScript.replaceAll('"', '`"')}"`,
        options,
      );
      console.log('simpleScreenshotScript', simpleScreenshotScript);

      // Create the task if it doesn't exist (single line command)
      const checkTaskCmd = `if (-not (Get-ScheduledTask -TaskName 'TakeScreenshot' -ErrorAction SilentlyContinue)) { schtasks /Create /TN 'TakeScreenshot' /TR 'powershell -ExecutionPolicy Bypass -File "$env:TEMP\\screenshot.ps1"' /SC ONCE /ST 00:00 /RU "${username}" /RL HIGHEST /F }`;
      await util.powerShell(checkTaskCmd, options);
      console.log('checkTaskCmd', checkTaskCmd);

      // Run the task
      await util.powerShell(`schtasks /Run /TN "TakeScreenshot"`, options);

      // Wait for the screenshot to be taken
      await util.powerShell(`Start-Sleep -Seconds 5`, options);

      // Get the screenshot data (single line)
      const getScreenshotCmd = `if (Test-Path "${outputPath}") { $bytes = [System.IO.File]::ReadAllBytes("${outputPath}"); [Convert]::ToBase64String($bytes) } else { Write-Error "Screenshot file not found at ${outputPath}" }`;

      console.log('Getting screenshot data...');
      const result = await util.powerShell(getScreenshotCmd, options);
      console.log('Screenshot data:', result);

      if (result && result.trim().length > 0) {
        resolve(result.trim());
      } else {
        reject(new Error('Failed to get screenshot data'));
      }
    } catch (error) {
      console.error('Screenshot error:', error);
      reject(error);
    }
  });
}

exports.screenshot = screenshot;
exports.screenshotViaWinRM = screenshotViaWinRM;

/**
 * Parse the output of 'query session' command
 * @param {string} output - Raw output from query session command
 * @returns {Array} Array of session objects
 */
function parseSessionOutput(output) {
  if (!output || typeof output !== 'string') {
    return [];
  }

  // Split into lines and remove empty lines
  const lines = output.split('\n').filter((line) => line.trim());

  // Skip the header line
  if (lines.length <= 1) {
    return [];
  }

  const sessions = [];

  // Process each line (skip header)
  for (let i = 1; i < lines.length; i++) {
    // Replace multiple spaces with a single space for easier splitting
    const line = lines[i].replaceAll(/\s+/g, ' ').trim();

    // Skip empty lines
    if (!line) {
      continue;
    }

    const isActive = line.startsWith('>');
    // Remove the '>' if present
    const cleanLine = isActive ? line.slice(1).trim() : line;

    // Split by spaces
    const parts = cleanLine.split(' ');

    // Extract values - handle the variable format
    const sessionName = parts[0];

    // Find the index of the ID (a number) to determine position of username
    let idIndex = -1;

    for (let j = 1; j < parts.length; j++) {
      if (/^\d+$/.test(parts[j])) {
        idIndex = j;
        break;
      }
    }

    // Extract username based on ID position
    let username = '';

    if (idIndex > 1) {
      username = parts.slice(1, idIndex).join(' ').trim();
    }

    // Extract remaining fields
    const id = idIndex >= 0 ? Number.parseInt(parts[idIndex], 10) : -1;
    const state = idIndex >= 0 && parts.length > idIndex + 1 ? parts[idIndex + 1] : '';
    const type = idIndex >= 0 && parts.length > idIndex + 2 ? parts[idIndex + 2] : '';
    const device =
      idIndex >= 0 && parts.length > idIndex + 3 ? parts.slice(idIndex + 3).join(' ') : '';

    sessions.push({
      isCurrentSession: isActive,
      sessionName,
      username,
      id,
      state,
      type,
      device,
    });
  }

  return sessions;
}

/**
 * Find all active or connected sessions
 * @param {Array} sessions - Array of parsed session objects
 * @returns {Array} Array of active session objects, sorted by priority
 */
function findActiveSessions(sessions) {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    return [];
  }

  // Group sessions by state
  const activeSessionsByPriority = {
    active: sessions.filter((s) => s.state === 'Active'),
  };

  // Return all active sessions, then connected, then console
  return [...activeSessionsByPriority.active];
}
