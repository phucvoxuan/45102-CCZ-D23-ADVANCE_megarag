import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.warn('GOOGLE_AI_API_KEY not set - embedding generation will not work');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Gemini text-embedding-004 produces 768-dimensional vectors
export const EMBEDDING_DIMENSION = 768;

// Batch size for embedding generation (to avoid rate limits)
const EMBEDDING_BATCH_SIZE = 100;

// Rate limiting: max requests per minute
const MAX_REQUESTS_PER_MINUTE = 1500; // Gemini's default limit
const REQUEST_DELAY_MS = Math.ceil(60000 / MAX_REQUESTS_PER_MINUTE);

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate embedding for a single text with retry logic
 */
export async function generateEmbedding(text: string, maxRetries = 3): Promise<number[]> {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Embedding] Attempt ${attempt}/${maxRetries} for text: "${text.substring(0, 50)}..."`);

      const result = await model.embedContent(text);

      if (result.embedding?.values) {
        console.log(`[Embedding] Success on attempt ${attempt}`);
        return result.embedding.values;
      }

      throw new Error('No embedding values returned');
    } catch (error) {
      lastError = error as Error;
      console.error(`[Embedding] Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`[Embedding] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Failed to generate embedding after retries');
}

/**
 * Generate embeddings for multiple texts in batches
 * Returns array of embeddings in the same order as input texts
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<number[][]> {
  console.log(`[Embeddings] Starting batch embedding for ${texts.length} texts`);

  if (!genAI) {
    console.error('[Embeddings] ERROR: Gemini API key not configured');
    throw new Error('Gemini API key not configured');
  }

  if (texts.length === 0) {
    console.log('[Embeddings] No texts to embed');
    return [];
  }

  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const embeddings: number[][] = [];
  let completed = 0;
  let successCount = 0;
  let failCount = 0;

  // Process in batches
  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    console.log(`[Embeddings] Processing batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}, texts ${i}-${i + batch.length - 1}`);

    // Process each text in the batch
    const batchPromises = batch.map(async (text, batchIndex) => {
      // Add small delay to avoid rate limiting
      if (batchIndex > 0) {
        await sleep(REQUEST_DELAY_MS);
      }

      try {
        const result = await model.embedContent(text);
        successCount++;
        return result.embedding.values;
      } catch (error) {
        failCount++;
        console.error(`[Embeddings] Error generating embedding for text at index ${i + batchIndex}:`, error);
        // Return null embedding on error (will be filtered later)
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);

    for (const result of batchResults) {
      if (result) {
        embeddings.push(result);
        completed++;
        onProgress?.(completed, texts.length);
      } else {
        // Push empty array for failed embeddings to maintain order
        embeddings.push([]);
        completed++;
        onProgress?.(completed, texts.length);
      }
    }

    // Add delay between batches
    if (i + EMBEDDING_BATCH_SIZE < texts.length) {
      await sleep(100); // 100ms between batches
    }
  }

  console.log(`[Embeddings] Batch complete: ${successCount} success, ${failCount} failed out of ${texts.length} total`);
  return embeddings;
}

/**
 * Convert embedding array to pgvector-compatible string format
 * Supabase/pgvector requires vectors in string format '[x,y,z,...]' for INSERT operations
 */
export function vectorToString(embedding: number[]): string {
  return '[' + embedding.join(',') + ']';
}

/**
 * Generate embeddings for chunks and update them in place
 * Returns the chunks with embeddings added
 * Note: content_vector is converted to string format for Supabase/pgvector compatibility
 */
export async function addEmbeddingsToChunks<T extends { content: string; content_vector?: number[] | string }>(
  chunks: T[],
  onProgress?: (completed: number, total: number) => void
): Promise<T[]> {
  console.log(`[Embeddings] addEmbeddingsToChunks called with ${chunks.length} chunks`);

  const texts = chunks.map(chunk => chunk.content);
  const embeddings = await generateEmbeddingsBatch(texts, onProgress);

  const result = chunks.map((chunk, index) => ({
    ...chunk,
    // Convert to string format for Supabase pgvector compatibility
    content_vector: embeddings[index].length > 0 ? vectorToString(embeddings[index]) : undefined,
  }));

  const withEmbeddings = result.filter(c => c.content_vector).length;
  console.log(`[Embeddings] addEmbeddingsToChunks complete: ${withEmbeddings}/${chunks.length} chunks have embeddings`);

  return result;
}

/**
 * Validate that an embedding has the correct dimension
 */
export function isValidEmbedding(embedding: number[] | null | undefined): boolean {
  return Array.isArray(embedding) && embedding.length === EMBEDDING_DIMENSION;
}
