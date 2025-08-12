require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// The serverless function will handle requests to /api/*.
// The Express app needs to match the full path.
app.post('/api/get-suggestion', async (req, res) => {
  try {
    const userPrompt = req.body.prompt;
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      // This log is safe and helpful.
      console.error('API key not configured.');
      return res.status(500).json({ error: 'API key not configured on the server.' });
    }

    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [
        { role: 'user', content: userPrompt }
      ],
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const suggestion = response.data.choices[0].message.content;
    res.json({ suggestion: suggestion });

  } catch (error) {
    // Using a very simple catch block to avoid any syntax errors.
    console.error('Error calling Perplexity API:', error.message);
    res.status(500).json({ error: 'Failed to get suggestion from AI.' });
  }
});

// This line is essential for Vercel to run the Express app
// as a serverless function.
module.exports = app;
