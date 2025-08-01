import { clipboard, Notification } from 'electron';
import { uIOhook, UiohookKey } from 'uiohook-napi';
import { translateText } from '../translation/index.ts';
import { getConfig, getPausedState } from '../config/index.ts';
import { setTrayIcon } from '../ui/tray.ts';

let isTranslating = false;
let t = 0;
let n = 0;

export function setupKeyboardHandler(): void {
  uIOhook.on('keydown', e => {
    const isC = e.keycode === UiohookKey.C;
    const meta = process.platform === 'darwin' ? e.metaKey : e.ctrlKey;
    if (!(isC && meta)) return;

    const now = Date.now();
    n = now - t < 800 ? n + 1 : 1;
    t = now;

    if (n === 2) {
      console.log('Double copy detected');

      // Ignore if paused
      if (getPausedState()) {
        console.log('Translation is paused, ignoring...');
        n = 0;
        return;
      }

      // Ignore if translating
      if (isTranslating) {
        console.log('Translation already in progress, ignoring...');
        n = 0;
        return;
      }

      setTimeout(() => {
        void (async (): Promise<void> => {
          // Wait for copy to complete
          try {
            const text = clipboard.readText();
            console.log('Clipboard content:', text ? text.slice(0, 50) + '...' : '(empty)');

            if (!text) {
              return; // Do nothing
            }

            // Start translation
            isTranslating = true;
            setTrayIcon(true);

            const config = getConfig();
            const translation = await translateText(
              text,
              config.targetLanguage,
              config.secondaryLanguage,
            );
            clipboard.writeText(translation); // Copy translation result to clipboard

            new Notification({
              title: 'Translation Result',
              body: translation.length > 100 ? translation.slice(0, 100) + '...' : translation,
            }).show();
          } catch (error) {
            console.error('Error in translation process:', error);
            new Notification({
              title: 'Translation Error',
              body: 'Failed to translate. Check console for details.',
            }).show();
          } finally {
            // Translation complete
            isTranslating = false;
            setTrayIcon(false);
          }
        })();
      }, 60);
      n = 0;
    }
  });
}

export function startKeyboardListener(): void {
  try {
    uIOhook.start();
    console.log('Key listener started successfully');
  } catch (error) {
    console.error('Failed to start uIOhook:', error);
    throw error;
  }
}

export function stopKeyboardListener(): void {
  try {
    uIOhook.stop();
  } catch (error) {
    console.error('Error stopping uIOhook:', error);
  }
}
