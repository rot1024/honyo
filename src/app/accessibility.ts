import { app, dialog, shell, systemPreferences } from 'electron';

export async function checkAccessibilityPermission(): Promise<boolean> {
  // Only check on macOS
  if (process.platform !== 'darwin') {
    return true;
  }

  console.log('Checking accessibility permissions...');
  console.log('App path:', app.getPath('exe'));
  console.log('App name:', app.getName());
  const isTrusted = systemPreferences.isTrustedAccessibilityClient(false);
  console.log('Is trusted:', isTrusted);

  if (!isTrusted) {
    console.log('Showing accessibility dialog...');

    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'Accessibility Permission Required',
      message: 'Honyo needs accessibility permission to detect keyboard shortcuts.',
      detail:
        'Please grant accessibility permission in System Preferences > Security & Privacy > Privacy > Accessibility.\n\nThe app will now open System Preferences and quit. Please restart Honyo after granting permission.',
      buttons: ['Open System Preferences', 'Quit'],
      defaultId: 0,
      cancelId: 1,
    });

    console.log('Dialog result:', result);

    if (result.response === 0) {
      console.log('Opening System Preferences...');
      // Open System Preferences to the Privacy > Accessibility pane

      const opened = await shell.openExternal(
        'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
      );
      console.log('System Preferences opened:', opened);
      // Wait a bit for System Preferences to open
      console.log('Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Wait complete');
    }

    // Quit the app
    console.log('Quitting app...');
    app.quit();
    return false;
  }

  return true;
}
