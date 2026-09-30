# 🌾 চাষী বন্ধু (Chashi Bondhu): AI-Powered Crop Disease Identifier

> **Modern, AI-powered agricultural disease identification and expert agronomy advice for farmers in Bangladesh.**

A responsive, farmer-first web application that uses Google's latest **Gemini 3.8 Flash** model to diagnose crop diseases directly from photos and provide treatment recommendations with Google Search-grounded interactive guidance in Bengali and English.

---

## ✨ Features & Upgrades

- 🔍 **Gemini 3.8 Flash Diagnosis** — State-of-the-art multimodal vision analysis detecting crop diseases, healthy plants, and non-crop images with high accuracy.
- 📸 **Direct Mobile Camera Support** — Farmers can capture pictures straight from their smartphone camera in the field (`capture="environment"`).
- ⚡ **Client-Side Image Optimization** — Automatically resizes and compresses high-resolution photos on canvas before uploading, reducing payload size by up to ~95% for rapid uploads on 3G/4G networks.
- 💬 **Streaming Real-Time Chat** — Real-time token streaming with live Google Search grounding for fungicides, approved chemicals, dosages, and local purchase sources in Bangladesh.
- 🔊 **Dual Audio Playback** — Natural speech playback powered by `gemini-3.8-flash-lite-tts` with automatic fallback to browser Web Speech API for guaranteed offline/quota reliability.
- 🛡️ **Vercel Serverless Architecture** — API endpoints (`/api/analyze`, `/api/chat`, `/api/speech`) keep your `GEMINI_API_KEY` 100% secure on the server, never leaking keys into the browser bundle.
- 🌐 **Bilingual (বাংলা & English)** — Full localized interface and pathology terminology with English equivalents in parentheses (e.g. `ম্যানকোজেব (Mancozeb)`).

---

## 🚀 Deployment to Vercel

Deploying to [Vercel](https://vercel.com/) takes less than 2 minutes:

### 1. Push your repository to GitHub
```bash
git add .
git commit -m "Upgrade to Gemini 3.8 Flash and Vercel serverless architecture"
git push origin main
```

### 2. Import into Vercel
1. Go to [vercel.com](https://vercel.com/) and click **Add New Project**.
2. Select your `Chashi-Bondhu` repository.
3. In **Environment Variables**, add:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your Google AI Studio API key ([Get one free here](https://aistudio.google.com/apikey))
4. Click **Deploy**.

Vercel will automatically build the React app and deploy the Serverless Functions in `/api/`.

---

## 💻 Local Development

**Prerequisites:** Node.js (v18 or higher)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Add your Gemini API key:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser. Local API calls are seamlessly served through Vite dev middleware.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📁 Architecture & Project Structure

```
├── api/
│   ├── analyze.ts               # Vercel function: Gemini 3.8 Flash disease identification
│   ├── chat.ts                  # Vercel function: Streaming chat with Google Search grounding
│   ├── speech.ts                # Vercel function: Gemini 3.8 Flash-Lite TTS audio synthesis
│   └── config.ts                # Status check for server API key configuration
├── components/
│   ├── ImageUploader.tsx        # Camera capture, drag-and-drop, and compression stats
│   ├── ResultDisplay.tsx        # Structured diagnosis, control measures, audio playback
│   ├── ChatInterface.tsx        # Real-time streaming chat with citations
│   ├── Spinner.tsx              # Loading indicator
│   └── ApiKeyInstructions.tsx   # Setup guide for Vercel environment variables
├── services/
│   └── geminiService.ts         # Frontend API integration & fallbacks
├── utils/
│   └── imageOptimizer.ts        # Client-side HTML Canvas image compression
├── App.tsx                      # Main application workflow & state management
├── translations.ts              # Full Bengali and English UI copy
├── vercel.json                  # Vercel deployment routes and serverless configuration
├── vite.config.ts               # Vite build configuration & local dev API middleware
└── index.html                   # Clean, standards-compliant HTML template
```

---

## 🔧 Tech Stack

- **AI Models**: Google Gemini 3.8 Flash, Gemini 3.8 Flash-Lite TTS, Google Search Grounding
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **Backend / Hosting**: Vercel Serverless Functions (`@google/genai` Node.js SDK)
- **Audio Fallback**: Web Speech API (`SpeechSynthesis`)

---

## ⚠️ Disclaimer

This tool is intended to assist farmers with decision support. It should not be considered a substitute for professional agricultural extension officers. Always verify chemical rates and safety measures with authorized local agricultural experts before field application.

---

**Made with ❤️ for Bangladesh Farmers**
