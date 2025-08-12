require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// The serverless function will handle requests to /api/*.
// The Express app needs to match the full path.
app.post('/api/get-suggestion', async (req, res) => {
  console.log('Received request for AI suggestion.');
  try {
    const userPrompt = req.body.prompt;
    const apiKey = process.env.PERPLEXITY_API_KEY;

    // --- DEBUG LOGGING ---
    console.log(`Is PERPLEXITY_API_KEY present? ${!!apiKey}`);
    if (!apiKey) {
      console.error('API key not configured.');
      return res.status(500).json({ error: 'API key not configured on the server.' });
    }
    // --- END DEBUG LOGGING ---

    console.log('Sending request to Perplexity API...');
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

    console.log('Successfully received response from Perplexity API.');
    const suggestion = response.data.choices[0].message.content;
    res.json({ suggestion: suggestion });

  } catch (error) {
    // --- DETAILED ERROR LOGGING ---
    console.error('--- ERROR CALLING PERPLEXITY API ---');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response Data:', error.response.data);
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('General Error Message:', error.message);
    }
    console.error('Error Config:', error.config);
    console.error('--- END OF ERROR DETAILS ---');
    // --- END DETAILED ERROR LOGGING ---

    res.status(500).json({ error: 'Failed to get suggestion from AI.' });
  }
});

// This line is essential for Vercel to run the Express app
// as a serverless function.
module.exports = app;
