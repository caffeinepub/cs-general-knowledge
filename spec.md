# CS General Knowledge

## Current State
- App has 20 languages in LANGUAGES array but only 5 have full UI translations (English, Hindi, Spanish, French, Arabic)
- No voice input or output support
- Chat UI with text input, send button, sidebar categories

## Requested Changes (Diff)

### Add
- Voice input: microphone button next to text input using Web Speech API (SpeechRecognition)
- Voice output: speaker/read-aloud button on AI messages using SpeechSynthesis API
- Expand LANGUAGES list to cover many more world languages (50+)
- Add UI translations for more commonly used languages (Chinese, German, Portuguese, Russian, Japanese, Korean, Bengali, Urdu, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi)
- Voice mode indicator (recording state animation)

### Modify
- Input bar: add mic button that starts/stops voice recognition, fills input with transcript
- AI message bubbles: add small speaker icon to read the response aloud in selected language
- LANGUAGES array: expand to 50+ languages
- getTranslations: add translations for more languages

### Remove
- Nothing removed

## Implementation Plan
1. Expand LANGUAGES array in translations.ts to 50+ languages with proper language codes for SpeechSynthesis
2. Add UITranslations for all major languages
3. In App.tsx: add useVoiceInput hook logic (SpeechRecognition API) - mic button in input bar
4. Add TTS: each AI message gets a speak button that calls speechSynthesis.speak()
5. Map language codes to BCP-47 lang codes for SpeechRecognition and SpeechSynthesis
6. Show recording state with pulsing red mic icon
