import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { getGeminiResponse } from '../gemini.js';
import { v4 as uuidv4 } from 'uuid';

// Initialize environment variables for local dev (Vercel has them auto-injected)
dotenv.config();

// Initialize Groq client
let groq;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

const GEMINI_KEY = process.env.GEMINI_KEY;

// Logging helpers
const log = (id, ...args) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${id}]`, ...args);
};

const errorLog = (id, ...args) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${id}] ERROR:`, ...args);
};

// Timeout helper
const withTimeout = (promise, ms) => {
  const timeout = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeout]);
};

export default async function handler(req, res) {
  // CORS handling for Vercel (if needed, but usually handled by Next/Vite proxy locally provided, Vercel same origin)
  // But to be safe for local server usage which imports this:
  // We won't handle CORS here, we assume the caller/platform handles it or same-origin.
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = uuidv4();
  const { message } = req.body;
  const REQUEST_TIMEOUT_MS = 25000; // 25s to be safe within Vercel limites (Hobby 10s is tight, hopefully it's fast)

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    errorLog(requestId, 'Invalid message received');
    return res.status(400).json({ 
      error: 'Message is required and must be a non-empty string',
      requestId
    });
  }

  log(requestId, `Processing message: ${message.substring(0, 50)}...`);

  const sendResponse = (content, provider) => {
    log(requestId, `Sending response from ${provider}`);
    return res.status(200).json({ 
      response: content,
      provider,
      requestId,
      timestamp: new Date().toISOString()
    });
  };

  // Try Groq
  if (groq) {
    try {
      log(requestId, 'Trying Groq API');
      const response = await withTimeout(
        groq.chat.completions.create({
          messages: [
            { role: "system", content: "You are a helpful and versatile AI assistant. You answer all questions to the best of your ability. Be concise and friendly." },
            { role: "user", content: message }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 1.1,
          max_tokens: 700,
          presence_penalty: 0,
          frequency_penalty: 0.3
        }),
        REQUEST_TIMEOUT_MS
      );
      
      if (response?.choices?.[0]?.message?.content) {
        return sendResponse(response.choices[0].message.content, 'groq');
      }
    } catch (e) {
      errorLog(requestId, `Groq failed: ${e.message}`);
      // Fall through to Gemini
    }
  }

  // Try Gemini
  if (GEMINI_KEY) {
    try {
      log(requestId, 'Trying Gemini API');
      const response = await withTimeout(
        getGeminiResponse(message, GEMINI_KEY),
        REQUEST_TIMEOUT_MS
      );
      return sendResponse(response, 'gemini');
    } catch (e) {
      errorLog(requestId, `Gemini failed: ${e.message}`);
    }
  }

  // Failure
  errorLog(requestId, 'No AI providers available');
  return res.status(503).json({
    error: 'I am currently unable to answer. Please try again later.',
    requestId
  });
}
