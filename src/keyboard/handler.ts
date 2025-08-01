import { clipboard, Notification } from 'electron';
import { uIOhook, UiohookKey } from 'uiohook-napi';
import { translateText } from '../translation/index.ts';
import { getConfig, getPausedState } from '../config/index.ts';
import { setTrayIcon } from '../ui/tray.ts';
import { showTranslationPopup, closePopup } from '../ui/popup.ts';

let isTranslating = false;
let t = 0;
let n = 0;
let currentAbortController: AbortController | null = null;

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

      // Cancel current translation if in progress
      if (isTranslating) {
        console.log('Translation already in progress, cancelling and starting new one...');
        cancelCurrentTranslation();
        // Don't return - continue with new translation
      }

      setTimeout(() => {
        void (async (): Promise<void> => {
          // Create new AbortController for this translation
          const abortController = new AbortController();

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

            // Set current abort controller
            currentAbortController = abortController;
            const signal = abortController.signal;

            // Show popup immediately with loading state if in popup mode
            if (config.displayMode === 'popup') {
              showTranslationPopup(null, text);
            }

            const translation = await translateText(
              text,
              config.targetLanguage,
              config.secondaryLanguage,
              signal,
            );

            // Handle display mode
            if (config.displayMode === 'popup') {
              // Update popup window with translation
              showTranslationPopup(translation, text);
            } else {
              // Notification mode: copy to clipboard and show notification
              clipboard.writeText(translation);
              new Notification({
                title: 'Translation Result',
                body: translation.length > 100 ? translation.slice(0, 100) + '...' : translation,
              }).show();
            }
          } catch (error) {
            console.error('Error in translation process:', error);
            // Check if error is due to abortion
            if (error instanceof Error && error.name === 'AbortError') {
              console.log('Translation was cancelled');
              // Don't show error notification for cancelled translations
              // Also close popup if it's open
              const currentConfig = getConfig();
              if (currentConfig.displayMode === 'popup') {
                closePopup();
              }
            } else {
              new Notification({
                title: 'Translation Error',
                body: 'Failed to translate. Check console for details.',
              }).show();
            }
          } finally {
            // Translation complete - only reset state if this is still the current translation
            if (currentAbortController?.signal === abortController.signal) {
              isTranslating = false;
              setTrayIcon(false);
              currentAbortController = null;
            }
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

export function cancelCurrentTranslation(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    console.log('Translation cancelled');
    // Reset state immediately to allow new translations
    isTranslating = false;
    setTrayIcon(false);
    currentAbortController = null;
  }
}

export function isCurrentlyTranslating(): boolean {
  return isTranslating;
}
