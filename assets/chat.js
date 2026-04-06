// ==========================
// VIBE AI ASSISTANCE - Study Companion
// Sends prompts to a server-side AI proxy and displays Gemini responses
// ==========================
const API_ENDPOINT = (window.API_BASE ? `${window.API_BASE}/ai` : '/.netlify/functions/gemini-proxy');
console.log('Chat API endpoint:', API_ENDPOINT, 'Location:', window.location.href);
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');

// Load saved chat history
let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

function renderSavedHistory() {
    if (!chatContainer) return;
    chatHistory.forEach(msg => displayMessage(msg.text, msg.sender));
}
renderSavedHistory();

function displayMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-message');
    msgDiv.classList.add(sender);
    msgDiv.textContent = text;
    msgDiv.style.opacity = 0;
    chatContainer.appendChild(msgDiv);
    setTimeout(() => {
        msgDiv.style.opacity = 1;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
}

function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// SMARTBOT: Answers using AI (Gemini), or provides a link if no direct answer
async function generateBotReply(userText) {
    const text = (userText || '').toLowerCase().trim();

    // Math quick answers
    const mathPattern = /^[0-9+\-*/().\s]+$/;
    if (mathPattern.test(text)) {
        try {
            const result = Function('"use strict"; return (' + text + ')')();
            return `The answer is ${result}.`;
        } catch (e) {
            return "I couldn't solve that one, try again?";
        }
    }

    // Server-side AI: call our Netlify Gemini proxy
    try {
        const resp = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userText })
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data && (data.reply || data.text)) {
                return data.reply || data.text;
            }
        }
    } catch (e) { /* ignore */ }

    // Fallback: provide direct Google search link
    return { type: 'link', url: `https://www.google.com/search?q=${encodeURIComponent(userText)}`, message: `I couldn't find a direct answer, but you can check this Google search.` };
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const container = document.getElementById('chat-container');
    const message = input.value.trim();

    if (!message) return;

    // 1. Show user message
    container.innerHTML += `<div class="chat-message user">${message}</div>`;
    input.value = '';

    // 2. Call the Netlify function proxy
    try {
        console.log('Sending chat request to', API_ENDPOINT);
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: message })
        });
        const data = await response.json();
        const botText = data.text || data.reply || data.error || 'Sorry, I did not receive a response.';

        if (!response.ok) {
            console.error('Gemini proxy error', response.status, data);
            const details = data.details ? ` Details: ${data.details}` : '';
            container.innerHTML += `<div class="chat-message bot">Error contacting ${API_ENDPOINT}: ${data.error || response.statusText || 'request failed.'}${details}</div>`;
        } else {
            container.innerHTML += `<div class="chat-message bot">${botText}</div>`;
        }
        container.scrollTop = container.scrollHeight; // Auto-scroll
    } catch (err) {
        console.error('Chat failed', err);
        container.innerHTML += `<div class="chat-message bot">Unable to send your message to ${API_ENDPOINT}. Start the local server or deploy the backend.</div>`;
    }
}

// Toggle function for the drawer
function toggleChat() {
    document.querySelector('.chat-drawer').classList.toggle('open');
}

// allow Enter to send
userInput && userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// If the DOM wasn't ready when this script ran, try again once DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    renderSavedHistory();
    // Attach fail-safe click handler to Send button
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
});
