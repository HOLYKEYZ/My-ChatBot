import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { getGeminiResponse } from './gemini.js';
import { v4 as uuidv4 } from 'uuid';

// Initialize environment variables
dotenv.config();

// Configure logging
const log = (...args) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
};

const error = (...args) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR:`, ...args);
};

const app = express();
const PORT = process.env.PORT || 3001;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds timeout

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms [${req.id}]`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Initialize Groq client if API key is available
let groq;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  log('Groq client initialized');
} else {
  log('Groq API key not found, Groq client not initialized');
}

const GEMINI_KEY = process.env.GEMINI_KEY;
if (GEMINI_KEY) {
  log('Gemini API key found, Gemini fallback is available');
} else {
  log('Gemini API key not found, Gemini fallback is disabled');
}

// Helper function to handle timeouts
const withTimeout = (promise, ms, requestId) => {
  const timeout = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeout]);
};

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const requestId = req.id;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    error(`[${requestId}] Invalid message received`);
    return res.status(400).json({ 
      error: 'Message is required and must be a non-empty string',
      requestId
    });
  }

  // Log the incoming request
  log(`[${requestId}] Processing message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);

  // Function to handle the response
  const sendResponse = (content, provider = 'unknown') => {
    log(`[${requestId}] Sending response from ${provider}`);
    return res.json({ 
      response: content,
      provider,
      requestId,
      timestamp: new Date().toISOString()
    });  
  };

  // Function to handle errors
  const handleError = (error, provider, isFinal = false) => {
    const errorId = `err_${Date.now()}`;
    const errorMessage = `[${requestId}] ${provider} error (${errorId}):`;
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      error(`${errorMessage} ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      error(`${errorMessage} No response received - ${error.message}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      error(`${errorMessage} ${error.message}`);
    }

    if (isFinal || !GEMINI_KEY) {
      return res.status(500).json({
        error: `Error processing your request (${errorId})`,
        requestId,
        provider,
        timestamp: new Date().toISOString()
      });
    }
    
    return null; // Indicate that we should try the fallback
  };

  // Try Groq first if available
  if (groq) {
    try {
      log(`[${requestId}] Trying Groq API`);
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
        REQUEST_TIMEOUT_MS - 2000,
        requestId
      );
      
      if (response?.choices?.[0]?.message?.content) {
        return sendResponse(response.choices[0].message.content, 'groq');
      }
      
      throw new Error('Invalid response format from Groq');
      
    } catch (groqError) {
      const shouldTryFallback = handleError(groqError, 'groq');
      if (shouldTryFallback === null && GEMINI_KEY) {
        log(`[${requestId}] Falling back to Gemini`);
      } else {
        return shouldTryFallback;
      }
    }
  }

  // Try Gemini if available
  if (GEMINI_KEY) {
    try {
      log(`[${requestId}] Trying Gemini API`);
      const response = await withTimeout(
        getGeminiResponse(message, GEMINI_KEY),
        REQUEST_TIMEOUT_MS - 2000,
        requestId
      );
      return sendResponse(response, 'gemini');
    } catch (geminiError) {
      return handleError(geminiError, 'gemini', true);
    }
  }

  // If we get here, no providers were available
  error(`[${requestId}] No AI providers available`);
  return res.status(503).json({
    error: 'No AI service is currently available',
    requestId,
    timestamp: new Date().toISOString()
  });
});

// Export app for Vercel
export default app;

// Start the server only if not running on Vercel
// Or if explicitly run via node
const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
  app.listen(PORT, () => {
    log(`Server running on http://localhost:${PORT}`);
    log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`Groq: ${groq ? 'Enabled' : 'Disabled'}`);
    log(`Gemini: ${GEMINI_KEY ? 'Enabled' : 'Disabled'}`);
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  error('Uncaught Exception:', err);
  // Don't crash the process in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  error('Unhandled Rejection at:', promise, 'reason:', reason);
});
