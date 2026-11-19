import dotenv from 'dotenv';

dotenv.config();

export const PORT = Number(process.env.PORT) || 5000;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quantiphi_ai_chat';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

if (!GEMINI_API_KEY) {
  console.warn('[Config Warning] GEMINI_API_KEY is not set. Gemini AI responses will not function until an API key is configured in the environment.');
}

export default {
  PORT,
  MONGODB_URI,
  GEMINI_API_KEY,
  GEMINI_MODEL,
  CLIENT_URL,
};
