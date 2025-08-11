// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 5500;

// Middleware to parse JSON bodies
app.use(express.json());
// Serve the static frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '')));


// 1. Create your API endpoint
app.post('/api/get-suggestion', async (req, res) => {
  try {
    const userPrompt = req.body.prompt;
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured.' });
    }

    // 2. Make the request to the Perplexity API
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar', // or another model you prefer
      messages: [
        { role: 'user', content: userPrompt }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // 3. Send the AI's response back to your frontend
    const suggestion = response.data.choices[0].message.content;
    res.json({ suggestion: suggestion });

  } catch (error) {
    console.error('Error calling Perplexity API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to get suggestion from AI.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});