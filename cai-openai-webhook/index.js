const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/cai-webhook', async (req, res) => {
  try {
    const userMessage = req.body.nlp && req.body.nlp.source ? req.body.nlp.source : "Hello";
    console.log("Received message:", userMessage);

    // FIX 1: Use the specific pinned version 'gemini-1.5-flash-001' 
    // instead of the alias 'gemini-1.5-flash'.
    const modelName = 'gemini-1.5-flash-001'; 
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    let botReply = "";

    try {
        const response = await axios.post(
            geminiUrl,
            { contents: [{ parts: [{ text: userMessage }] }] },
            { headers: { 'Content-Type': 'application/json' } }
        );
        botReply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (apiError) {
        // Fallback: If 1.5 Flash fails, try the older stable model (gemini-1.0-pro)
        console.warn(`Primary model ${modelName} failed. Trying fallback model...`);
        console.error("Primary Error:", apiError.response ? apiError.response.data : apiError.message);

        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const fallbackResponse = await axios.post(
            fallbackUrl,
            { contents: [{ parts: [{ text: userMessage }] }] },
            { headers: { 'Content-Type': 'application/json' } }
        );
        botReply = fallbackResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    if (!botReply) botReply = "No Gemini answer received.";

    res.json({ 
        replies: [{ type: 'text', content: botReply }] 
    });

  } catch (err) {
    console.error("FATAL ERROR:", err.response ? err.response.data : err.message);
    res.status(200).json({ 
        replies: [{ type: 'text', content: "I encountered an error connecting to the AI service." }] 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook listening on ${PORT}`));