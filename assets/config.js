// Configuration for deployed API base URL.
// When deploying, set this to your server (no trailing slash).
// Example: window.API_BASE = 'https://your-app.onrender.com';
// Default is empty string, which uses the built-in proxy path.
// NOTE: Do NOT put your Gemini API key in this file or in browser JS.
// The key must stay on the server-side only.

// For local development, if no API_BASE is set and we're on localhost or file://, use the local server.
// Otherwise, let the app default to the Netlify function proxy path.
if (!window.API_BASE && (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname)) {
    window.API_BASE = 'http://localhost:3000';
}
