const { app, clipboard, Notification, Menu, Tray, nativeImage, BrowserWindow, ipcMain } = require('electron');
const { uIOhook, UiohookKey } = require('uiohook-napi');
const { createAnthropic } = require('@ai-sdk/anthropic');
const { createOpenAI } = require('@ai-sdk/openai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { generateText } = require('ai');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Keep Tray instance globally
let tray = null;

// Translation in progress flag
let isTranslating = false;

// Translation paused flag
let isPaused = false;

// Hold icon instances
let normalIcon = null;
let translatingIcon = null;

// File paths for saving settings
const configPath = path.join(app.getPath('userData'), 'config.json');
const apiKeysPath = path.join(app.getPath('userData'), 'apikeys.json');

// Settings window
let settingsWindow = null;

// Load AI model definitions
const { models: AI_MODELS } = require('./models.json');
const DEFAULT_AI_MODEL = Object.keys(AI_MODELS)[0]; // First model in the list

// Store API keys
let apiKeys = {
  anthropic: process.env.ANTHROPIC_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  google: process.env.GOOGLE_API_KEY || ''
};

// Language code to name mapping
const LANGUAGES = {
  ja: 'Japanese',
  en: 'English',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  hi: 'Hindi',
  th: 'Thai',
  vi: 'Vietnamese'
};

// Array of language names (for menu display)
const languages = Object.values(LANGUAGES);

// Function to get language name from locale
function getLanguageFromLocale(locale) {
  // Try exact match
  if (LANGUAGES[locale]) {
    return LANGUAGES[locale];
  }
  
  // Try with language code only (e.g., ja-JP → ja)
  const langCode = locale.split('-')[0];
  if (LANGUAGES[langCode]) {
    return LANGUAGES[langCode];
  }
  
  // Special handling for Chinese
  if (langCode === 'zh') {
    return (locale.includes('TW') || locale.includes('HK')) 
      ? LANGUAGES['zh-TW'] 
      : LANGUAGES['zh-CN'];
  }
  
  // Default to English
  return LANGUAGES.en;
}

// Function to determine default settings
function getDefaultConfig() {
  const locale = app.getLocale();
  console.log('System locale:', locale);
  
  // Set primary language based on system language
  const primaryLang = getLanguageFromLocale(locale);
  
  // If primary is English, set secondary to Japanese
  const secondaryLang = primaryLang === LANGUAGES.en ? LANGUAGES.ja : LANGUAGES.en;
  
  return {
    targetLanguage: primaryLang,
    secondaryLanguage: secondaryLang,
    isPaused: false,
    aiModel: DEFAULT_AI_MODEL
  };
}

// Default settings
let config = getDefaultConfig();

// Load settings
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const savedConfig = JSON.parse(data);
      
      // Migrate old fallbackLanguage to secondaryLanguage
      if (savedConfig.fallbackLanguage && !savedConfig.secondaryLanguage) {
        savedConfig.secondaryLanguage = savedConfig.fallbackLanguage;
        delete savedConfig.fallbackLanguage;
      }
      
      config = { ...config, ...savedConfig };
      
      // Check settings consistency
      if (config.targetLanguage === config.secondaryLanguage) {
        // If same language, reapply default settings
        const defaultConfig = getDefaultConfig();
        config.secondaryLanguage = defaultConfig.secondaryLanguage;
      }
      
      // Validate AI model exists
      if (!AI_MODELS[config.aiModel]) {
        console.log(`Invalid AI model: ${config.aiModel}, resetting to default`);
        config.aiModel = DEFAULT_AI_MODEL;
      }
      
      // Restore isPaused state
      if (typeof savedConfig.isPaused === 'boolean') {
        isPaused = savedConfig.isPaused;
      }
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

// Save settings
function saveConfig() {
  try {
    const configToSave = {
      ...config,
      isPaused: isPaused
    };
    fs.writeFileSync(configPath, JSON.stringify(configToSave, null, 2));
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

// Load API keys
function loadApiKeys() {
  try {
    if (fs.existsSync(apiKeysPath)) {
      const data = fs.readFileSync(apiKeysPath, 'utf8');
      const savedKeys = JSON.parse(data);
      apiKeys = { ...apiKeys, ...savedKeys };
    }
  } catch (error) {
    console.error('Failed to load API keys:', error);
  }
}

// Save API keys
function saveApiKeys() {
  try {
    fs.writeFileSync(apiKeysPath, JSON.stringify(apiKeys, null, 2));
    // Set file permissions (read-only for owner)
    fs.chmodSync(apiKeysPath, 0o600);
  } catch (error) {
    console.error('Failed to save API keys:', error);
  }
}

// Open settings window
function openSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'API Key Settings'
  });

  settingsWindow.loadFile('settings.html');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// Get AI provider instance
function getAIProvider(modelId) {
  const modelInfo = AI_MODELS[modelId];
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const apiKey = apiKeys[modelInfo.provider];
  if (!apiKey) {
    throw new Error(`No API key configured for ${modelInfo.provider}`);
  }

  switch (modelInfo.provider) {
    case 'anthropic':
      return createAnthropic({ apiKey })(modelInfo.model);
    case 'openai':
      return createOpenAI({ apiKey })(modelInfo.model);
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(modelInfo.model);
    default:
      throw new Error(`Unknown provider: ${modelInfo.provider}`);
  }
}

async function detectLanguage(text) {
  try {
    const model = getAIProvider(config.aiModel);
    const { text: detectedLang } = await generateText({
      model,
      prompt: `Detect the language of this text and return ONLY the language name in English (e.g., "Japanese", "English", "Chinese", etc.). Do not include any explanation, just the language name: "${text.slice(0, 200)}"`
    });
    return detectedLang.trim();
  } catch (error) {
    console.error('Language detection error:', error);
    if (error.message.includes('No API key')) {
      new Notification({
        title: 'API Key Missing',
        body: `Please configure API key for ${AI_MODELS[config.aiModel].name}`
      }).show();
    }
    return null;
  }
}

async function translateText(text, primaryLanguage, secondaryLanguage) {
  try {
    // Pre-check API key
    const modelInfo = AI_MODELS[config.aiModel];
    if (!modelInfo) {
      throw new Error(`Unknown model: ${config.aiModel}`);
    }
    
    const apiKey = apiKeys[modelInfo.provider];
    if (!apiKey) {
      new Notification({
        title: 'API Key Missing',
        body: `Please configure API key for ${modelInfo.name}`
      }).show();
      return `API key not configured for ${modelInfo.provider}`;
    }
    
    // Detect language
    const detectedLanguage = await detectLanguage(text);
    if (!detectedLanguage) {
      return 'Could not detect language';
    }
    
    console.log(`Detected language: ${detectedLanguage}`);
    
    // Determine target language
    let targetLanguage;
    if (detectedLanguage && detectedLanguage.toLowerCase() === primaryLanguage.toLowerCase()) {
      targetLanguage = secondaryLanguage;
      console.log(`Source language matches primary (${primaryLanguage}), using secondary: ${secondaryLanguage}`);
    } else {
      targetLanguage = primaryLanguage;
      console.log(`Translating to primary language: ${primaryLanguage}`);
    }
    
    console.log(`Translating text to ${targetLanguage}:`, text.slice(0, 50) + '...');
    
    const model = getAIProvider(config.aiModel);
    const { text: translation } = await generateText({
      model,
      prompt: `You are a translator. Translate the following text to ${targetLanguage}. 
IMPORTANT: Return ONLY the translated text. Do not include any explanations, notes, or phrases like "Here is the translation" or "The translation is". Just the translated text itself.

Text to translate: ${text}`
    });
    console.log('Translation complete:', translation.slice(0, 50) + '...');
    return translation.trim();
  } catch (error) {
    console.error('Translation error:', error);
    if (error.message.includes('No API key')) {
      new Notification({
        title: 'API Key Missing',
        body: `Please configure API key for ${AI_MODELS[config.aiModel].name}`
      }).show();
      return 'API key not configured';
    }
    return 'Translation failed: ' + error.message;
  }
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Another instance is already running. Exiting...');
  app.quit();
  return;
}

// Handle second instance attempt
app.on('second-instance', (event, commandLine, workingDirectory) => {
  console.log('Another instance tried to run');
  // Focus existing instance
  if (tray) {
    new Notification({
      title: 'Honyo Translator',
      body: 'Already running in the system tray'
    }).show();
  }
});

// Hide dock icon on macOS
if (process.platform === 'darwin') {
  app.dock.hide();
}

// Function to create icons
function createIcons() {
  // Normal icon: black square
  normalIcon = nativeImage.createFromBuffer(Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x91, 0x68, 0x36, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x60, 0x60, 0x60, 0x00,
    0x00, 0x00, 0x04, 0x00, 0x01, 0x27, 0x34, 0x27, 0x0a, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]));
  
  // Translating icon: white square with border
  translatingIcon = nativeImage.createFromBuffer(Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x91, 0x68, 0x36, 0x00, 0x00, 0x00,
    0x3f, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x60, 0x60, 0x60, 0x60,
    0xf8, 0x0f, 0x00, 0x01, 0x04, 0x04, 0x04, 0x20, 0xaa, 0xaa, 0xaa, 0x02,
    0xd1, 0xd1, 0xd1, 0x00, 0x43, 0x43, 0x43, 0x10, 0x55, 0x55, 0x55, 0x01,
    0x0c, 0x0c, 0x0c, 0x40, 0x54, 0x54, 0x54, 0x04, 0xf2, 0xf3, 0xf3, 0x01,
    0x86, 0x86, 0x86, 0x20, 0x00, 0x00, 0x91, 0x2f, 0x0f, 0x8c, 0x6f, 0xa9,
    0xa7, 0xa2, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
    0x60, 0x82
  ]));
  
  // Set as template image on macOS
  if (process.platform === 'darwin') {
    normalIcon.setTemplateImage(true);
    translatingIcon.setTemplateImage(true);
  }
}

// Function to create tray icon
function createTray() {
  createIcons();
  
  tray = new Tray(normalIcon);
  
  // Debug: Show title on macOS to confirm existence
  if (process.platform === 'darwin') {
    tray.setTitle('H');
  }
  
  console.log('Tray created successfully');
  console.log('Normal icon size:', normalIcon.getSize());
  console.log('Translating icon size:', translatingIcon.getSize());
  
  // Create menu
  function updateMenu() {
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Honyo Translator', type: 'normal', enabled: false },
      { type: 'separator' },
      {
        label: `Primary: ${config.targetLanguage}`,
        submenu: languages.map(lang => ({
          label: lang,
          type: 'radio',
          checked: config.targetLanguage === lang,
          click: () => {
            if (config.secondaryLanguage === lang) {
              // Swap languages if same language selected
              config.secondaryLanguage = config.targetLanguage;
              config.targetLanguage = lang;
            } else {
              config.targetLanguage = lang;
            }
            saveConfig();
            updateMenu();
          }
        }))
      },
      {
        label: `Secondary: ${config.secondaryLanguage}`,
        submenu: languages.map(lang => ({
          label: lang,
          type: 'radio',
          checked: config.secondaryLanguage === lang,
          click: () => {
            if (config.targetLanguage === lang) {
              // Swap languages if same language selected
              const temp = config.secondaryLanguage;
              config.secondaryLanguage = config.targetLanguage;
              config.targetLanguage = temp;
            } else {
              config.secondaryLanguage = lang;
            }
            saveConfig();
            updateMenu();
          }
        }))
      },
      { type: 'separator' },
      {
        label: `AI Model: ${AI_MODELS[config.aiModel] ? AI_MODELS[config.aiModel].name : 'Unknown'}`,
        submenu: Object.entries(AI_MODELS).map(([modelId, modelInfo]) => ({
          label: modelInfo.name,
          type: 'radio',
          checked: config.aiModel === modelId,
          click: () => {
            config.aiModel = modelId;
            saveConfig();
            updateMenu();
          }
        }))
      },
      {
        label: 'API Key Settings...',
        click: () => {
          openSettingsWindow();
        }
      },
      { type: 'separator' },
      {
        label: 'Pause Translation',
        type: 'checkbox',
        checked: isPaused,
        click: () => {
          isPaused = !isPaused;
          saveConfig(); // Save settings
          updateMenu();
          
          // Update title
          if (process.platform === 'darwin') {
            tray.setTitle(isPaused ? 'P' : 'H');
          }
          
          console.log(`Translation ${isPaused ? 'paused' : 'resumed'}`);
        }
      },
      { type: 'separator' },
      { 
        label: 'Quit', 
        click: () => {
          console.log('Quit menu clicked');
          // Stop uIOhook
          try {
            uIOhook.stop();
          } catch (error) {
            console.error('Error stopping uIOhook:', error);
          }
          
          // Destroy tray icon
          if (tray) {
            tray.destroy();
          }
          
          // Force quit app
          app.exit(0);
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
  }
  
  tray.setToolTip('Honyo - Double Cmd+C to translate');
  updateMenu();
}

app.whenReady().then(() => {
  console.log('App ready, starting key listener...');
  console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);
  
  // Load settings
  loadConfig();
  loadApiKeys();
  console.log('Current target language:', config.targetLanguage);
  console.log('Translation paused:', isPaused);
  console.log('Current AI model:', config.aiModel);
  
  // Create tray icon
  createTray();
  
  // Set title based on pause state
  if (process.platform === 'darwin' && isPaused) {
    tray.setTitle('P');
  }
  
  // Setup IPC communication
  ipcMain.on('load-api-keys', (event) => {
    event.reply('api-keys-loaded', apiKeys);
  });

  ipcMain.on('save-api-keys', (event, keys) => {
    apiKeys = { ...apiKeys, ...keys };
    saveApiKeys();
    event.reply('api-keys-saved', true);
  });
  
  // Electron app shutdown handling
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      cleanupAndExit();
    }
  });
  
  // Cleanup before app quit
  app.on('before-quit', (event) => {
    console.log('App is about to quit, cleaning up...');
    try {
      uIOhook.stop();
    } catch (error) {
      console.error('Error stopping uIOhook:', error);
    }
  });
  
  // Process termination handling
  process.on('SIGINT', () => {
    console.log('Received SIGINT, cleaning up...');
    cleanupAndExit();
  });
  
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, cleaning up...');
    cleanupAndExit();
  });
  
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    cleanupAndExit();
  });
  
  // Cleanup function
  function cleanupAndExit() {
    try {
      uIOhook.stop();
    } catch (error) {
      console.error('Error stopping uIOhook:', error);
    }
    
    if (tray) {
      tray.destroy();
    }
    
    // Wait a bit then force exit
    setTimeout(() => {
      app.exit(0);
    }, 100);
  }
  
  let t = 0, n = 0;
  
  try {
    uIOhook.on('keydown', e => {
    const isC = e.keycode === UiohookKey.C;
    const meta = process.platform === 'darwin' ? e.metaKey : e.ctrlKey;
    if (!(isC && meta)) return;

    const now = Date.now();
    n = (now - t) < 800 ? n + 1 : 1;
    t = now;

    if (n === 2) {
      console.log('Double copy detected');
      
      // Ignore if paused
      if (isPaused) {
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
      
      setTimeout(async () => { // Wait for copy to complete
        try {
          const text = clipboard.readText();
          console.log('Clipboard content:', text ? text.slice(0, 50) + '...' : '(empty)');
          
          if (!text) {
            return; // Do nothing
          }
          
          // Start translation
          isTranslating = true;
          tray.setImage(translatingIcon);
          if (process.platform === 'darwin') {
            tray.setTitle('T'); // Change to 'T' while translating
          }
          
          const translation = await translateText(text, config.targetLanguage, config.secondaryLanguage);
          clipboard.writeText(translation); // Copy translation result to clipboard
          
          new Notification({ 
            title: 'Translation Result', 
            body: translation.length > 100 ? translation.slice(0, 100) + '...' : translation
          }).show();
        } catch (error) {
          console.error('Error in translation process:', error);
          new Notification({ 
            title: 'Translation Error', 
            body: 'Failed to translate. Check console for details.'
          }).show();
        } finally {
          // Translation complete
          isTranslating = false;
          tray.setImage(normalIcon);
          if (process.platform === 'darwin') {
            tray.setTitle('H'); // Return to 'H' for normal state
          }
        }
      }, 60);
      n = 0;
    }
  });
    
    uIOhook.start();
    console.log('Key listener started successfully');
  } catch (error) {
    console.error('Failed to start uIOhook:', error);
    app.quit();
  }
});