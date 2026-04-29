import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY が設定されていません');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,
  maxRetries: 2,
});

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
export const OPENAI_MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS ?? '800', 10) || 800;
export const OPENAI_TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE ?? '0.7') || 0.7;
