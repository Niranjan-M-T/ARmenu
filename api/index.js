require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// In-memory cache
const suggestionCache = new Map();

app.post('/api/get-suggestion', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  // Check cache first
  if (suggestionCache.has(prompt)) {
    console.log('Returning cached suggestion.');
    return res.json({ suggestion: suggestionCache.get(prompt), fromCache: true });
  }

  console.log('Requesting new suggestion from AI.');
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured on the server.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const suggestion = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!suggestion) {
      console.error('Unexpected response structure from Gemini API:', response.data);
      return res.status(500).json({ error: 'Failed to parse suggestion from AI response.' });
    }

    // Store in cache
    suggestionCache.set(prompt, suggestion);

    res.json({ suggestion, fromCache: false });

  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to get suggestion from AI.' });
  }
});

module.exports = app;
