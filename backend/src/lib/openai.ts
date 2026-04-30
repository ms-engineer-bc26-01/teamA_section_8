import OpenAI from 'openai';

export const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
export const MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS) || 800;
export const TEMPERATURE = Number(process.env.OPENAI_TEMPERATURE) || 0.7;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,
  maxRetries: 2,
});

export default openai;
