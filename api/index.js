require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

app.use(express.json());

app.post('/api/get-suggestion', async (req, res) => {
  console.log('Received request for AI suggestion.');
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured on the server.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              {
                text: req.body.prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Safely access the suggestion text
    const suggestion = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!suggestion) {
      console.error('Unexpected response structure from Gemini API:', response.data);
      return res.status(500).json({ error: 'Failed to parse suggestion from AI response.' });
    }

    res.json({ suggestion });

  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to get suggestion from AI.' });
  }
});

module.exports = app;
