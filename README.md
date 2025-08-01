# Honyo - AI-Powered Translation Tool

A desktop application that provides instant AI-powered translation with a simple double Ctrl/Cmd+C shortcut, similar to DeepL. (status: alpha)

![Honyo screenshot](honyo.png)

## Features

- **Quick Translation**: Double-tap Ctrl+C (Windows/Linux) or Cmd+C (macOS) to translate selected text
- **Multi-Language Support**: Supports 15+ languages including Japanese, English, Chinese, Korean, Spanish, French, German, and more
- **Multiple AI Models**: Choose from various AI providers:
  - Anthropic (Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku)
  - OpenAI (GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, GPT-4o, GPT-4o Mini, GPT-4, o1, o1 Mini, o1 Preview)
  - Google (Gemini 2.0 Flash Experimental, Gemini 1.5 Flash, Gemini 1.5 Pro)
- **Smart Language Detection**: Automatically detects source language and translates accordingly
- **Primary/Secondary Language System**: Set primary and secondary languages for smart translation switching
- **System Tray Integration**: Runs quietly in the background with easy access from the system tray
- **Translation Status Indicator**: Visual feedback showing when translation is in progress
- **Two Display Modes**:
  - **Notification & Copy**: Shows notification and automatically copies translation to clipboard
  - **Popup Window**: Shows translation in a draggable popup window near your cursor with manual copy option
- **Pause/Resume**: Temporarily disable translation when needed
- **Single Instance**: Prevents multiple instances from running simultaneously
- **Custom Instructions**: Add your own translation guidelines and terminology

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
- **Primary/Secondary Language**: Set your translation language preferences
- **AI Model**: Choose which AI model to use for translations
- **Settings**: Configure API keys and custom instructions
- **Pause Translation**: Temporarily disable the translation feature
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
