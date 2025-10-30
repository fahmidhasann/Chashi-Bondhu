<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🌾 চাষী বন্ধু (Chashi Bondhu): Crop Disease Identifier

> **Modern, AI-powered crop disease identification for Bangladesh farmers**

A beautiful, user-friendly application that uses Google's Gemini AI to identify crop diseases from images and provide treatment recommendations in Bengali and English.

## ✨ Features

- 🔍 **AI-Powered Analysis** - Identifies crop diseases from images using Gemini 2.5 Flash
- 🌐 **Bilingual Support** - Full Bengali (বাংলা) and English interface
- 💬 **Interactive Chat** - Ask follow-up questions about treatments and chemicals
- 🔊 **Text-to-Speech** - Audio playback of results in both languages
- 📱 **Responsive Design** - Works beautifully on mobile, tablet, and desktop
- 🎨 **Modern UI** - Clean, professional interface with smooth animations
- ♿ **Accessible** - Built with accessibility in mind

## 🎨 Recent Design Improvements (v2.0)

The application has been completely redesigned with a modern, professional interface:

- **Step-by-step workflow** with visual progress indicators
- **Enhanced image uploader** with drag-and-drop and real-time feedback
- **Rich result cards** with color-coded sections and gradients
- **Modern chat interface** with beautiful message bubbles
- **Smooth animations** and transitions throughout
- **Professional color scheme** with teal and green gradients
- **Improved accessibility** with better focus states and contrast

See [DESIGN_IMPROVEMENTS.md](./DESIGN_IMPROVEMENTS.md) for detailed documentation.

## 🚀 Quick Start

View your app in AI Studio: https://ai.studio/apps/drive/1m_BI0Huc1Vg6FFamI5HpaUTUJFIRaCf1

## 💻 Run Locally

**Prerequisites:** Node.js (v16 or higher)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up API key:**
   - Create a `.env.local` file in the root directory
   - Add your Gemini API key:
     ```
     API_KEY=your_gemini_api_key_here
     ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to the URL shown in the terminal (usually `http://localhost:3000`)

## 📖 How to Use

1. **Select Language** - Choose between Bengali (বাংলা) or English
2. **Upload Image** - Click to upload or drag & drop a crop image
3. **Analyze** - Click the analyze button to detect diseases
4. **Review Results** - See disease identification and treatment recommendations
5. **Ask Questions** - Use the chat to ask follow-up questions (if disease detected)

## 🔧 Tech Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **AI**: Google Gemini 2.5 Flash
- **Build Tool**: Vite
- **Text-to-Speech**: Gemini TTS API

## 📁 Project Structure

```
├── App.tsx                      # Main application component
├── index.tsx                    # Entry point
├── index.html                   # HTML template
├── index.css                    # Global styles and animations
├── components/
│   ├── ImageUploader.tsx       # Enhanced image upload component
│   ├── ResultDisplay.tsx       # Rich results presentation
│   ├── ChatInterface.tsx       # Modern chat interface
│   ├── Spinner.tsx             # Loading indicator
│   └── ApiKeyInstructions.tsx  # API key setup instructions
├── services/
│   └── geminiService.ts        # AI service integration
├── types.ts                     # TypeScript type definitions
├── translations.ts              # Bengali/English translations
└── DESIGN_IMPROVEMENTS.md       # Design documentation
```

## 🎯 Key Components

### 1. Image Uploader
- Beautiful gradient backgrounds
- Real-time upload progress
- Image preview with overlay
- Drag & drop support

### 2. Results Display
- Color-coded status indicators
- Gradient cards for measures
- Audio playback button
- Professional typography

### 3. Chat Interface
- Modern message bubbles
- Source citations with links
- Animated loading states
- Clear visual distinction between user/bot

### 4. Step Progress
- Visual workflow indicator
- Shows current step
- Guides user through process

## 🌍 Language Support

The application supports:
- **বাংলা (Bengali)** - Primary language for Bangladesh farmers
- **English** - International users and technical details

All UI elements, instructions, and AI responses are fully localized.

## ⚠️ Disclaimer

This tool is intended to assist farmers in identifying potential crop diseases. It should not be considered a substitute for professional agricultural advice. Always consult with local agricultural experts for accurate diagnosis and treatment.

## 📝 License

This project is part of Google AI Studio.

## 🙏 Acknowledgments

- Google Gemini AI for disease identification
- Tailwind CSS for beautiful styling
- The farming community of Bangladesh

---

**Made with ❤️ for Bangladesh Farmers**
