const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/cai-webhook', async (req, res) => {
  try {
    const userMessage = req.body.nlp?.source || "Hello";
    console.log("Received message:", userMessage);

   const modelName = 'gemini-2.5-flash';
const geminiUrl =
  `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

const response = await axios.post(
  geminiUrl,
  { contents: [{ parts: [{ text: userMessage }] }] },
  {
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY
    }
  }
);


    const botReply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No Gemini answer received.";

    res.json({ replies: [{ type: 'text', content: botReply }] });
  } catch (err) {
    console.error("FATAL ERROR RAW:", err);
    console.error("FATAL ERROR DATA:", err.response?.data || err.message);
    res.status(200).json({
      replies: [
        { type: 'text', content: "I encountered an error connecting to the AI service." }
      ]
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook listening on ${PORT}`));
