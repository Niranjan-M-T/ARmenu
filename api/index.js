require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

app.use(express.json());

app.post('/api/get-suggestion', async (req, res) => {
  console.log('Received request for AI suggestion.');
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {

      return res.status(500).json({ error: 'API key not configured on the server.' });
    }
    // --- END DEBUG LOGGING ---



    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar',
        messages: [{ role: 'user', content: req.body.prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },


    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar',
        messages: [{ role: 'user', content: req.body.prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );


    res.json({ suggestion: response.data.choices[0].message.content });

  } catch (error) {
    console.error('API Error:', error.message);

    res.status(500).json({ error: 'Failed to get suggestion from AI.' });
  }
});


module.exports = app;
