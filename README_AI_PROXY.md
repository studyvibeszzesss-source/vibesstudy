# Vibe AI Proxy (local)

This lightweight proxy allows the Vibe web frontend to call Gemini 1.5 Flash AI from the browser without exposing your API key in client-side code and to avoid some CORS issues.

Quick start

1. Install dependencies:

```powershell
cd "c:\Users\Aditi\Desktop\Vibe and study\Vibe"
npm install
```

2. Set your Gemini API key (PowerShell):

```powershell
$env:GEMINI_API_KEY = "your_google_gemini_api_key"
```

3. Start the proxy:

```powershell
npm start
# or
node server.js
```

By default the proxy listens on `http://localhost:3000/` and accepts POST `http://localhost:3000/ai` with JSON body `{ prompt: '...'} `.

Frontend configuration

Open Chat → AI Provider Settings in the app and add a provider with:
- Name: `Local Proxy`
- Endpoint URL: `http://localhost:3000/ai`
- API Key: leave empty

Supported providers

- Gemini 1.5 Flash: set `GEMINI_API_KEY` in the environment. The proxy calls Google's Gemini 1.5 Flash model.

Examples (PowerShell)

```powershell
# Gemini
$env:GEMINI_API_KEY = "AIzaSy..."
```

Notes

- CORS & security: The local proxy keeps API keys off the client and avoids many CORS issues. Do not commit API keys.
- For production, use a secure server to manage keys and restrict access.

# Perplexity (if you have an API key)
$env:PERPLEXITY_API_KEY = "pplx-..."
```

Notes

- CORS & security: The local proxy keeps API keys off the client and avoids many CORS issues. Do not commit API keys.
- Provider formats differ: the proxy attempts to parse common response fields, but you may need to adapt `server.js` if your provider returns a different JSON schema.
- For production, use a secure server to manage keys and restrict access.

Usage endpoint (for mobile helper apps)

The proxy also exposes a simple usage endpoint to accept app-usage reports from a native helper app (for example an Android service that reads UsageStatsManager and forwards usage periodically).

- POST `/usage` with JSON `{ deviceId?: string, usage: [{ package: string, label?: string, ms: number }], date?: 'YYYY-MM-DD' }`.
- GET `/usage?date=YYYY-MM-DD` returns `{ date, data }` where `data` contains device-keyed usage arrays.

Example POST (PowerShell):

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:3000/usage -Body (ConvertTo-Json @{ deviceId='phone1'; date = (Get-Date -Format yyyy-MM-dd); usage = @(@{ package='com.instagram.android'; label='Instagram'; ms = 3600000 } ) }) -ContentType 'application/json'
```

The `wellbeing` front-end attempts to fetch `/usage` for today's date and will display per-app usage and trigger alerts when thresholds (30min, 1hr, ...) are crossed. If you want the web app to reflect real phone usage, run a small native helper on the phone that reads usage and posts to this proxy.
