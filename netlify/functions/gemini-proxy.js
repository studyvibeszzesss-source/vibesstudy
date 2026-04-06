const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body is required.' }),
    };
  }

  const { prompt } = JSON.parse(event.body || '{}');
  if (!prompt) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Prompt is required.' }),
    };
  }

  // Your Gemini API key must be stored in a server environment variable.
  // On Netlify, add GEMINI_API_KEY in Site settings > Build & deploy > Environment.
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text?.() ?? String(response);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.toString() }),
    };
  }
};
