# Local Development Setup

## Prerequisites
- Node.js (v16 or higher)
- npm

## Setup
1. Clone or download the project
2. Copy `.env.example` to `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the local server:
   ```bash
   npm start
   ```
   Server will run on http://localhost:3000

5. Open the app in your browser:
   - Main app: Open `index.html` in browser
   - Chat page: Open `pages/chat.html` in browser

## API Key Security
- Your Gemini API key is stored in `.env` (not committed to git)
- The key stays on the server-side only
- Never put API keys in browser JavaScript files

## Deployment
For production, deploy the server to a cloud provider (Render, Heroku, etc.) and set the API_BASE in `assets/config.js` to your deployed server URL.