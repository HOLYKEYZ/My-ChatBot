import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "llama-3.3-70b-versatile",
      temperature: 1.1,
      max_tokens: 700,
      presence_penalty: 0,
      frequency_penalty: 0.3
    });

    res.json({ response: response.choices[0]?.message?.content });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch response from Groq' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
