#!/usr/bin/env node

/**
 * Test Embedding Generation
 * Run: node scripts/test-embedding.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testEmbedding() {
  console.log('\n========================================');
  console.log('  MegaRAG - Embedding Test');
  console.log('========================================\n');

  // Check environment variables
  const googleAiKey = process.env.GOOGLE_AI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  console.log('Environment Variables:');
  console.log('  GOOGLE_AI_API_KEY:', googleAiKey ? `${googleAiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('  GEMINI_API_KEY:', geminiKey ? `${geminiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('');

  // The embeddings.ts file uses GOOGLE_AI_API_KEY
  const apiKey = googleAiKey;

  if (!apiKey) {
    console.error('ERROR: GOOGLE_AI_API_KEY is not set!');
    console.log('\nThe embedding code uses GOOGLE_AI_API_KEY, not GEMINI_API_KEY.');
    console.log('Please ensure GOOGLE_AI_API_KEY is set in your .env.local file.');
    process.exit(1);
  }

  console.log('Testing embedding generation...\n');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const testText = 'This is a test sentence for embedding generation.';
    console.log('Test text:', testText);
    console.log('');

    const result = await model.embedContent(testText);
    const embedding = result.embedding.values;

    console.log('Result:');
    console.log('  Embedding dimension:', embedding.length);
    console.log('  First 5 values:', embedding.slice(0, 5));
    console.log('  Expected dimension: 768');
    console.log('');

    if (embedding.length === 768) {
      console.log('SUCCESS: Embedding generated correctly!');
    } else {
      console.log('WARNING: Unexpected embedding dimension');
    }

  } catch (error) {
    console.error('ERROR generating embedding:', error.message);
    console.log('');
    console.log('Possible causes:');
    console.log('  1. Invalid API key');
    console.log('  2. API key does not have access to text-embedding-004 model');
    console.log('  3. Network/firewall issues');
    console.log('  4. Rate limit exceeded');
    process.exit(1);
  }
}

testEmbedding();
