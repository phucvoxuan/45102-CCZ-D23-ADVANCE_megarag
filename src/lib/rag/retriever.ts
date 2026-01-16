import { supabaseAdmin } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/gemini/embeddings';
import type {
  QueryMode,
  ChunkWithScore,
  EntityWithScore,
  RelationWithScore,
  RetrievalResult,
} from '@/types';

const DEFAULT_TOP_K = 10;
const DEFAULT_THRESHOLD = 0.3;

// Media-specific parameters for better video/audio retrieval
const MEDIA_TOP_K = 20;  // Retrieve more chunks for media queries
const MEDIA_THRESHOLD = 0.2;  // Lower threshold for media to capture more segments

/**
 * Detect if a query is related to video/audio content
 */
function detectMediaQuery(query: string): { isMedia: boolean; mediaType: 'video' | 'audio' | null } {
  const lowerQuery = query.toLowerCase();

  // Vietnamese keywords
  const videoKeywordsVi = ['video', 'clip', 'phim', 'hình ảnh', 'xem', 'tóm tắt video', 'nội dung video', 'trong video', 'về video'];
  const audioKeywordsVi = ['audio', 'âm thanh', 'giọng nói', 'nghe', 'podcast', 'ghi âm', 'trong audio', 'về audio'];

  // English keywords
  const videoKeywordsEn = ['video', 'clip', 'watch', 'footage', 'movie', 'scene', 'visual', 'in the video', 'about the video', 'summarize video', 'video content'];
  const audioKeywordsEn = ['audio', 'sound', 'voice', 'listen', 'podcast', 'recording', 'speech', 'in the audio', 'about the audio'];

  const allVideoKeywords = [...videoKeywordsVi, ...videoKeywordsEn];
  const allAudioKeywords = [...audioKeywordsVi, ...audioKeywordsEn];

  const isVideoQuery = allVideoKeywords.some(kw => lowerQuery.includes(kw));
  const isAudioQuery = allAudioKeywords.some(kw => lowerQuery.includes(kw));

  console.log('[RAG Search] Query media detection:', {
    query: lowerQuery.substring(0, 50),
    isVideoQuery,
    isAudioQuery,
    matchedVideoKeyword: allVideoKeywords.find(kw => lowerQuery.includes(kw)),
    matchedAudioKeyword: allAudioKeywords.find(kw => lowerQuery.includes(kw)),
  });

  if (isVideoQuery) return { isMedia: true, mediaType: 'video' };
  if (isAudioQuery) return { isMedia: true, mediaType: 'audio' };
  return { isMedia: false, mediaType: null };
}

/**
 * Search chunks using vector similarity
 * @param queryEmbedding - The embedding vector for the query
 * @param userId - REQUIRED: User ID to filter results (data isolation)
 * @param workspace - Workspace name (default: 'default')
 * @param topK - Number of results to return
 * @param threshold - Minimum similarity threshold
 */
export async function searchChunks(
  queryEmbedding: number[],
  userId: string,
  workspace: string = 'default',
  topK: number = DEFAULT_TOP_K,
  threshold: number = DEFAULT_THRESHOLD
): Promise<ChunkWithScore[]> {
  console.log('[RAG Search] ===== SEARCH START =====');
  console.log('[RAG Search] User ID:', userId);
  console.log('[RAG Search] Workspace:', workspace);
  console.log('[RAG Search] Embedding length:', queryEmbedding?.length);
  console.log('[RAG Search] TopK:', topK, 'Threshold:', threshold);

  // First, check if user has any chunks at all
  const { data: userChunks, count: userChunkCount } = await supabaseAdmin
    .from('document_chunks')
    .select('id, content, content_vector', { count: 'exact' })
    .eq('user_id', userId)
    .limit(3);

  console.log('User total chunks in DB:', userChunkCount);
  console.log('Sample chunks:', userChunks?.map(c => ({
    id: c.id,
    contentPreview: c.content?.substring(0, 50),
    hasVector: !!c.content_vector,
    vectorType: typeof c.content_vector
  })));

  // Check how many chunks have embeddings
  const { count: chunksWithVectors } = await supabaseAdmin
    .from('document_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('content_vector', 'is', null);

  console.log('User chunks WITH embeddings:', chunksWithVectors);

  // Try RPC function first
  console.log('Calling search_chunks RPC with params:', {
    query_embedding_length: queryEmbedding?.length,
    match_threshold: threshold,
    match_count: topK,
    p_user_id: userId,
  });

  const { data, error } = await supabaseAdmin.rpc('search_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
    p_user_id: userId, // CRITICAL: Filter by user for data isolation
  });

  if (error) {
    console.error('RPC search_chunks error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.log('Falling back to direct query...');

    // Fallback: Direct query without vector search (returns all user chunks)
    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
      .from('document_chunks')
      .select('*')
      .eq('user_id', userId)
      .limit(topK);

    if (fallbackError) {
      console.error('Fallback query error:', fallbackError);
      return [];
    }

    console.log('Fallback returned:', fallbackData?.length, 'chunks');
    // Add default similarity for fallback results
    return (fallbackData || []).map(chunk => ({
      ...chunk,
      similarity: 0.5, // Default score for non-vector results
    }));
  }

  console.log('[RAG Search] RPC search_chunks returned:', data?.length, 'results');
  if (data && data.length > 0) {
    // ===== DETAILED LOGGING FOR VIDEO/AUDIO CHUNKS =====
    console.log('[RAG Search] ===== RESULTS ANALYSIS =====');

    // Count chunks by type
    const chunksByType: Record<string, number> = {};
    data.forEach((chunk: ChunkWithScore) => {
      const type = chunk.chunk_type || 'unknown';
      chunksByType[type] = (chunksByType[type] || 0) + 1;
    });
    console.log('[RAG Search] Chunks by type:', chunksByType);

    // Log each result with details
    data.forEach((chunk: ChunkWithScore, index: number) => {
      console.log(`[RAG Search] Result ${index + 1}:`, {
        id: chunk.id,
        documentId: chunk.document_id,
        chunkType: chunk.chunk_type,
        similarity: chunk.similarity?.toFixed(4),
        timestampStart: chunk.timestamp_start,
        timestampEnd: chunk.timestamp_end,
        contentPreview: chunk.content?.substring(0, 150) + '...',
      });
    });

    // Special logging for video_segment chunks
    const videoChunks = data.filter((c: ChunkWithScore) => c.chunk_type === 'video_segment');
    if (videoChunks.length > 0) {
      console.log('[RAG Search] ===== VIDEO CHUNKS FOUND =====');
      console.log('[RAG Search] Video chunks count:', videoChunks.length);
      videoChunks.forEach((chunk: ChunkWithScore, i: number) => {
        console.log(`[RAG Search] Video ${i + 1}: [${chunk.timestamp_start}s - ${chunk.timestamp_end}s] similarity=${chunk.similarity?.toFixed(4)}`);
      });
    }

    // Special logging for audio chunks
    const audioChunks = data.filter((c: ChunkWithScore) => c.chunk_type === 'audio');
    if (audioChunks.length > 0) {
      console.log('[RAG Search] ===== AUDIO CHUNKS FOUND =====');
      console.log('[RAG Search] Audio chunks count:', audioChunks.length);
      audioChunks.forEach((chunk: ChunkWithScore, i: number) => {
        console.log(`[RAG Search] Audio ${i + 1}: [${chunk.timestamp_start}s - ${chunk.timestamp_end}s] similarity=${chunk.similarity?.toFixed(4)}`);
      });
    }

    console.log('[RAG Search] ===== END RESULTS =====');
  } else {
    console.log('NO RESULTS from RPC. Possible causes:');
    console.log('  1. Chunks have no embeddings (content_vector IS NULL)');
    console.log('  2. Similarity below threshold:', threshold);
    console.log('  3. RPC function not matching chunks table structure');

    // Debug: Try a lower threshold
    console.log('Trying with lower threshold (0.1)...');
    const { data: lowThresholdData, error: lowThresholdError } = await supabaseAdmin.rpc('search_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1,
      match_count: topK,
      p_user_id: userId,
    });

    if (lowThresholdError) {
      console.error('Low threshold query error:', lowThresholdError);
    } else {
      console.log('Low threshold results:', lowThresholdData?.length);
      if (lowThresholdData && lowThresholdData.length > 0) {
        console.log('Found results with lower threshold! First similarity:', lowThresholdData[0].similarity);
        return lowThresholdData;
      }
    }

    // Final fallback: return user's chunks directly if RPC finds nothing
    if (chunksWithVectors === 0) {
      console.log('No embeddings found - using fallback direct query');
      const { data: directData } = await supabaseAdmin
        .from('document_chunks')
        .select('id, document_id, content, chunk_type, chunk_order_index, metadata')
        .eq('user_id', userId)
        .limit(topK);

      if (directData && directData.length > 0) {
        console.log('Fallback direct query returned:', directData.length, 'chunks');
        return directData.map(chunk => ({
          ...chunk,
          similarity: 0.5,
          content_vector: null,
          tokens: null,
          page_idx: null,
          timestamp_start: null,
          timestamp_end: null,
          workspace: workspace,
          created_at: new Date().toISOString(),
        })) as ChunkWithScore[];
      }
    }
  }

  return data || [];
}

/**
 * Search entities using vector similarity
 * @param queryEmbedding - The embedding vector for the query
 * @param userId - REQUIRED: User ID to filter results (data isolation)
 * @param workspace - Workspace name (default: 'default')
 * @param topK - Number of results to return
 * @param threshold - Minimum similarity threshold
 */
export async function searchEntities(
  queryEmbedding: number[],
  userId: string,
  workspace: string = 'default',
  topK: number = DEFAULT_TOP_K,
  threshold: number = DEFAULT_THRESHOLD
): Promise<EntityWithScore[]> {
  const { data, error } = await supabaseAdmin.rpc('search_entities', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
    p_user_id: userId, // CRITICAL: Filter by user for data isolation
  });

  if (error) {
    console.error('Error searching entities:', error);
    return [];
  }

  return data || [];
}

/**
 * Search relations using vector similarity
 * @param queryEmbedding - The embedding vector for the query
 * @param userId - REQUIRED: User ID to filter results (data isolation)
 * @param workspace - Workspace name (default: 'default')
 * @param topK - Number of results to return
 * @param threshold - Minimum similarity threshold
 */
export async function searchRelations(
  queryEmbedding: number[],
  userId: string,
  workspace: string = 'default',
  topK: number = DEFAULT_TOP_K,
  threshold: number = DEFAULT_THRESHOLD
): Promise<RelationWithScore[]> {
  const { data, error } = await supabaseAdmin.rpc('search_relations', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
    p_user_id: userId, // CRITICAL: Filter by user for data isolation
  });

  if (error) {
    console.error('Error searching relations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get chunks by entity source chunk IDs
 * @param chunkIds - Array of chunk IDs to fetch
 * @param userId - User ID to filter results (data isolation)
 */
async function getChunksByIds(chunkIds: string[], userId: string): Promise<ChunkWithScore[]> {
  if (chunkIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from('document_chunks') // Use actual table name (not view) for direct queries
    .select('*')
    .in('id', chunkIds)
    .eq('user_id', userId); // CRITICAL: Filter by user for data isolation

  if (error) {
    console.error('Error fetching chunks by IDs:', error);
    return [];
  }

  // Add default similarity score for entity-linked chunks
  return (data || []).map(chunk => ({
    ...chunk,
    similarity: 0.8, // Default score for entity-linked chunks
  }));
}

/**
 * Get entity names by IDs
 * @param entityIds - Array of entity IDs to fetch
 * @param userId - User ID to filter results (data isolation)
 */
async function getEntityNames(entityIds: string[], userId: string): Promise<Map<string, string>> {
  if (entityIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin
    .from('entities')
    .select('id, entity_name')
    .in('id', entityIds)
    .eq('user_id', userId); // CRITICAL: Filter by user for data isolation

  if (error) {
    console.error('Error fetching entity names:', error);
    return new Map();
  }

  const nameMap = new Map<string, string>();
  for (const entity of data || []) {
    nameMap.set(entity.id, entity.entity_name);
  }
  return nameMap;
}

/**
 * Naive mode: Vector search on chunks only
 */
async function retrieveNaive(
  queryEmbedding: number[],
  userId: string,
  workspace: string,
  topK: number,
  threshold: number = DEFAULT_THRESHOLD
): Promise<RetrievalResult> {
  const chunks = await searchChunks(queryEmbedding, userId, workspace, topK, threshold);

  return {
    chunks,
    entities: [],
    relations: [],
    context: buildContext(chunks, [], []),
  };
}

/**
 * Local mode: Search entities → get related chunks
 */
async function retrieveLocal(
  queryEmbedding: number[],
  userId: string,
  workspace: string,
  topK: number
): Promise<RetrievalResult> {
  // Search for relevant entities
  const entities = await searchEntities(queryEmbedding, userId, workspace, topK);

  // Get all source chunk IDs from entities
  const chunkIds = new Set<string>();
  for (const entity of entities) {
    const sourceIds = entity.source_chunk_ids as string[];
    if (sourceIds) {
      sourceIds.forEach(id => chunkIds.add(id));
    }
  }

  // Fetch the related chunks
  const chunks = await getChunksByIds(Array.from(chunkIds), userId);

  return {
    chunks,
    entities,
    relations: [],
    context: buildContext(chunks, entities, []),
  };
}

/**
 * Global mode: Search relations → get connected entities and chunks
 */
async function retrieveGlobal(
  queryEmbedding: number[],
  userId: string,
  workspace: string,
  topK: number
): Promise<RetrievalResult> {
  // Search for relevant relations
  const relations = await searchRelations(queryEmbedding, userId, workspace, topK);

  // Get all entity IDs from relations
  const entityIds = new Set<string>();
  const chunkIds = new Set<string>();

  for (const relation of relations) {
    entityIds.add(relation.source_entity_id);
    entityIds.add(relation.target_entity_id);
    const sourceIds = relation.source_chunk_ids as string[];
    if (sourceIds) {
      sourceIds.forEach(id => chunkIds.add(id));
    }
  }

  // Get entity names for context
  const entityNames = await getEntityNames(Array.from(entityIds), userId);

  // Fetch related chunks
  const chunks = await getChunksByIds(Array.from(chunkIds), userId);

  // Create entity placeholders with names
  const entities: EntityWithScore[] = Array.from(entityIds).map(id => ({
    id,
    workspace,
    entity_name: entityNames.get(id) || 'Unknown',
    entity_type: '',
    description: null,
    content_vector: null,
    source_chunk_ids: [],
    created_at: '',
    similarity: 0.7,
  }));

  return {
    chunks,
    entities,
    relations,
    context: buildContext(chunks, entities, relations),
  };
}

/**
 * Hybrid mode: Combine local (entities) + global (relations)
 */
async function retrieveHybrid(
  queryEmbedding: number[],
  userId: string,
  workspace: string,
  topK: number
): Promise<RetrievalResult> {
  // Run local and global in parallel
  const [localResult, globalResult] = await Promise.all([
    retrieveLocal(queryEmbedding, userId, workspace, Math.ceil(topK / 2)),
    retrieveGlobal(queryEmbedding, userId, workspace, Math.ceil(topK / 2)),
  ]);

  // Merge and deduplicate chunks
  const chunkMap = new Map<string, ChunkWithScore>();
  for (const chunk of [...localResult.chunks, ...globalResult.chunks]) {
    if (!chunkMap.has(chunk.id) || chunk.similarity > chunkMap.get(chunk.id)!.similarity) {
      chunkMap.set(chunk.id, chunk);
    }
  }

  // Merge and deduplicate entities
  const entityMap = new Map<string, EntityWithScore>();
  for (const entity of [...localResult.entities, ...globalResult.entities]) {
    if (!entityMap.has(entity.id) || entity.similarity > entityMap.get(entity.id)!.similarity) {
      entityMap.set(entity.id, entity);
    }
  }

  const chunks = Array.from(chunkMap.values()).sort((a, b) => b.similarity - a.similarity);
  const entities = Array.from(entityMap.values()).sort((a, b) => b.similarity - a.similarity);
  const relations = globalResult.relations;

  return {
    chunks,
    entities,
    relations,
    context: buildContext(chunks, entities, relations),
  };
}

/**
 * Mix mode: Full hybrid - chunks + entities + relations
 */
async function retrieveMix(
  queryEmbedding: number[],
  userId: string,
  workspace: string,
  topK: number,
  threshold: number = DEFAULT_THRESHOLD
): Promise<RetrievalResult> {
  // Run all searches in parallel
  const [chunks, entities, relations] = await Promise.all([
    searchChunks(queryEmbedding, userId, workspace, topK, threshold),
    searchEntities(queryEmbedding, userId, workspace, Math.ceil(topK / 2), threshold),
    searchRelations(queryEmbedding, userId, workspace, Math.ceil(topK / 2), threshold),
  ]);

  // Also get chunks linked to found entities
  const entityChunkIds = new Set<string>();
  for (const entity of entities) {
    const sourceIds = entity.source_chunk_ids as string[];
    if (sourceIds) {
      sourceIds.forEach(id => entityChunkIds.add(id));
    }
  }

  // Get relation-linked chunks
  for (const relation of relations) {
    const sourceIds = relation.source_chunk_ids as string[];
    if (sourceIds) {
      sourceIds.forEach(id => entityChunkIds.add(id));
    }
  }

  // Fetch additional chunks from entities/relations
  const additionalChunks = await getChunksByIds(
    Array.from(entityChunkIds).filter(id => !chunks.find(c => c.id === id)),
    userId
  );

  // Merge chunks, keeping highest similarity
  const chunkMap = new Map<string, ChunkWithScore>();
  for (const chunk of [...chunks, ...additionalChunks]) {
    if (!chunkMap.has(chunk.id) || chunk.similarity > chunkMap.get(chunk.id)!.similarity) {
      chunkMap.set(chunk.id, chunk);
    }
  }

  const mergedChunks = Array.from(chunkMap.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return {
    chunks: mergedChunks,
    entities,
    relations,
    context: buildContext(mergedChunks, entities, relations),
  };
}

/**
 * Build context string from retrieved results
 */
function buildContext(
  chunks: ChunkWithScore[],
  entities: EntityWithScore[],
  relations: RelationWithScore[]
): string {
  const parts: string[] = [];

  // Add entity context
  if (entities.length > 0) {
    parts.push('### Relevant Entities');
    for (const entity of entities) {
      parts.push(`- **${entity.entity_name}** (${entity.entity_type}): ${entity.description || 'No description'}`);
    }
    parts.push('');
  }

  // Add relation context
  if (relations.length > 0) {
    parts.push('### Relationships');
    for (const relation of relations) {
      parts.push(`- ${relation.source_entity_id} → ${relation.relation_type} → ${relation.target_entity_id}: ${relation.description || ''}`);
    }
    parts.push('');
  }

  // Add chunk context
  if (chunks.length > 0) {
    parts.push('### Source Documents');
    chunks.forEach((chunk, index) => {
      parts.push(`[Source ${index + 1}] (similarity: ${chunk.similarity.toFixed(3)})`);
      parts.push(chunk.content);
      parts.push('');
    });
  }

  return parts.join('\n');
}

/**
 * Main retrieval function - routes to appropriate mode
 * @param query - The search query text
 * @param userId - REQUIRED: User ID to filter results (data isolation)
 * @param mode - Query mode (naive, local, global, hybrid, mix)
 * @param workspace - Workspace name (default: 'default')
 * @param topK - Number of results to return
 */
export async function retrieve(
  query: string,
  userId: string,
  mode: QueryMode = 'mix',
  workspace: string = 'default',
  topK: number = DEFAULT_TOP_K
): Promise<RetrievalResult> {
  // Detect if this is a media-related query
  const mediaDetection = detectMediaQuery(query);

  // Adjust topK and threshold for media queries to retrieve more segments
  const effectiveTopK = mediaDetection.isMedia ? Math.max(topK, MEDIA_TOP_K) : topK;
  const effectiveThreshold = mediaDetection.isMedia ? MEDIA_THRESHOLD : DEFAULT_THRESHOLD;

  console.log('[RAG Retrieve] ===== RETRIEVE START =====');
  console.log('[RAG Retrieve] Query:', query.substring(0, 100));
  console.log('[RAG Retrieve] User:', userId);
  console.log('[RAG Retrieve] Mode:', mode);
  console.log('[RAG Retrieve] Media detection:', mediaDetection);
  console.log('[RAG Retrieve] Original topK:', topK, '-> Effective topK:', effectiveTopK);
  console.log('[RAG Retrieve] Threshold:', effectiveThreshold, mediaDetection.isMedia ? '(lowered for media)' : '(default)');

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  let result: RetrievalResult;

  switch (mode) {
    case 'naive':
      result = await retrieveNaive(queryEmbedding, userId, workspace, effectiveTopK, effectiveThreshold);
      break;
    case 'local':
      result = await retrieveLocal(queryEmbedding, userId, workspace, effectiveTopK);
      break;
    case 'global':
      result = await retrieveGlobal(queryEmbedding, userId, workspace, effectiveTopK);
      break;
    case 'hybrid':
      result = await retrieveHybrid(queryEmbedding, userId, workspace, effectiveTopK);
      break;
    case 'mix':
    default:
      result = await retrieveMix(queryEmbedding, userId, workspace, effectiveTopK, effectiveThreshold);
      break;
  }

  // Log retrieval summary
  console.log('[RAG Retrieve] ===== RETRIEVE COMPLETE =====');
  console.log('[RAG Retrieve] Chunks retrieved:', result.chunks.length);
  console.log('[RAG Retrieve] Entities retrieved:', result.entities.length);
  console.log('[RAG Retrieve] Relations retrieved:', result.relations.length);

  // Count media chunks in results
  const videoChunks = result.chunks.filter(c => c.chunk_type === 'video_segment');
  const audioChunks = result.chunks.filter(c => c.chunk_type === 'audio');
  if (videoChunks.length > 0 || audioChunks.length > 0) {
    console.log('[RAG Retrieve] Media chunks in results:', {
      video: videoChunks.length,
      audio: audioChunks.length,
      videoTimeRange: videoChunks.length > 0 ? `${videoChunks[0].timestamp_start}s - ${videoChunks[videoChunks.length - 1].timestamp_end}s` : 'N/A',
    });
  }

  return result;
}

/**
 * Get document info for source references
 */
export async function getDocumentInfo(documentIds: string[]): Promise<Map<string, { fileName: string; fileType: string }>> {
  if (documentIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('id, file_name, file_type')
    .in('id', documentIds);

  if (error) {
    console.error('Error fetching document info:', error);
    return new Map();
  }

  const docMap = new Map<string, { fileName: string; fileType: string }>();
  for (const doc of data || []) {
    docMap.set(doc.id, { fileName: doc.file_name, fileType: doc.file_type });
  }
  return docMap;
}
