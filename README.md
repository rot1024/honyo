<div align="center">
  <img src="assets/icon.svg" width="128" height="128" alt="Honyo Icon">

  # Honyo - AI-Powered Translation Tool

  A desktop application that provides instant AI-powered translation with a simple double Ctrl/Cmd+C shortcut, similar to DeepL.

  ![Honyo screenshot](assets/screenshot.png)
</div>


## Features

- ⚡ **Instant Translation** - Double Ctrl+C to translate any selected text
- 🌍 **Multi-Language** - 15+ built-in languages plus custom language support
- 🤖 **AI Models** - Latest models from Claude, GPT-4, Gemini, or use your own
- 🔄 **Smart Detection** - Auto-detects language and switches translation direction
- 💻 **Lightweight** - Lives in your system tray with minimal resource usage
- 🎯 **Customizable** - Add your own translation rules, languages, and models

## Installation

### macOS

1. Download the appropriate version for your Mac:
   - **Apple Silicon (M1/M2/M3)**: Download `Honyo-*-arm64.dmg` or `Honyo-*-arm64-mac.zip`
   - **Intel Mac**: Download `Honyo-*.dmg` or `Honyo-*-mac.zip`

2. **For DMG files**:
   - Open the DMG file
   - Drag Honyo.app to your Applications folder
   - **First launch**: Right-click (or Control-click) on Honyo.app and select "Open"
   - Click "Open" in the security dialog

3. **For ZIP files**:
   - Extract the zip file
   - Move `Honyo.app` to your Applications folder
   - Remove the quarantine attribute:
     ```bash
     xattr -cr /Applications/Honyo.app
     ```

4. Grant accessibility permissions:
   - Open System Preferences > Security & Privacy > Privacy > Accessibility
   - Add and enable Honyo.app

### Windows

Download and run `Honyo-*.exe`

### Linux

Download and run `Honyo-*.AppImage`

## Configuration

### API Keys

To use the translation features, you need to configure API keys for your preferred AI provider:

1. Click on the system tray icon
2. Select "Settings..."
3. In the "API Keys" tab, enter your API keys for the providers you want to use:
   - **Anthropic**: Get your key from [console.anthropic.com](https://console.anthropic.com/)
   - **OpenAI**: Get your key from [platform.openai.com](https://platform.openai.com/api-keys)
   - **Google AI**: Get your key from [makersuite.google.com](https://makersuite.google.com/app/apikey)
4. Click "Save"

### Language Settings

The app automatically detects your system language and sets appropriate defaults:
- If your system is in English: Primary → English, Secondary → Japanese
- If your system is in Japanese: Primary → Japanese, Secondary → English
- Other languages: Primary → System language, Secondary → English

You can change these settings from the system tray menu:
1. Click on "Primary: [Language]" to select your primary translation target
2. Click on "Secondary: [Language]" to select your fallback language

### Custom Instructions

You can add custom instructions that will be included in all translations:

1. Click on the system tray icon
2. Select "Settings..."
3. Go to the "Custom Prompt" tab
4. Enter your custom instructions (e.g., terminology guidelines, tone preferences, specific translation rules)
5. Click "Save"

Examples of custom instructions:
- Use formal language
- Keep product names in English
- Maintain consistent terminology
- Follow specific industry standards

### Custom AI Models

Use any AI model not included in the default list:

1. Open Settings → "Custom Model" tab
2. Enter the model name (e.g., `gpt-4-1106-preview`, `claude-3-opus-20240229`)
3. Select the provider (Anthropic, OpenAI, or Google AI)
4. Click "Save"
5. Select "Custom Model" from the AI Model menu

### Custom Languages

Add languages not included in the default list:

1. Open Settings → "Custom Languages" tab
2. Enter language names, one per line (e.g., Esperanto, Sanskrit, Klingon)
3. Click "Save"
4. Your custom languages will appear in the Primary/Secondary language menus

## Usage

1. Select any text in any application
2. Press Ctrl+C (Windows/Linux) or Cmd+C (macOS) twice quickly
3. The translation will appear as a notification and be copied to your clipboard
4. Paste (Ctrl/Cmd+V) wherever you need the translated text

### Smart Translation

The app intelligently determines the translation direction:
- If the source text matches your primary language → translates to secondary language
- If the source text is any other language → translates to primary language

### Menu Options

Access these options by clicking the system tray icon:
- **Primary/Secondary Language**: Set your translation language preferences (including custom languages)
- **Display Mode**: Choose between notification and popup window
- **AI Model**: Choose which AI model to use for translations (including custom models)
- **Settings**: Configure API keys, custom instructions, models, and languages
- **Pause Translation**: Temporarily disable the translation feature
- **Check for Updates**: Check for new versions of the app
- **Quit**: Exit the application

### Environment Variables

You can also set API keys via environment variables:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`

Create a `.env` file in the project root:
```env
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
