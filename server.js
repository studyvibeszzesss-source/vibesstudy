const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

// Load environment variables from .env file if it exists
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// POST /ai - The Smart Bot Logic
app.post('/ai', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set in server environment.' });
    }

    // NEW: Universal System Instructions
    const systemInstructions = `
      You are 'Vibe AI,' a study assistant for students. 
      Be clear, direct, and accurate in your responses.
      - Explain concepts concisely without unnecessary elaboration
      - Use simple language but maintain academic rigor
      - Provide straightforward answers without excessive enthusiasm or emojis
      - Focus on facts and understanding, not cheerleading
      - If technical, be precise; if simplified, be accurate
    `;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const promptText = `${systemInstructions}\n\nUser asked: ${prompt}`;
    const result = await model.generateContent(promptText);
    const response = await result.response;
    const reply = response.text?.() || "I'm here to help! Could you rephrase that? ✨";

    res.json({ reply });
  } catch (err) {
    console.error('AI request error:', err);
    res.status(500).json({ error: 'AI Connection Failed', details: err.stack || String(err) });
  }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
