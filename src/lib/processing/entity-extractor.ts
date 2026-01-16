import { v4 as uuidv4 } from 'uuid';
import { generateContent } from '@/lib/gemini/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { ExtractionResult } from '@/types';

/**
 * System prompt for entity and relation extraction
 */
const ENTITY_EXTRACTION_SYSTEM_PROMPT = `You are a Knowledge Graph Specialist. Your task is to extract entities and relationships from text.

## Entity Types
- PERSON: Individual people, historical figures, characters
- ORGANIZATION: Companies, institutions, agencies, teams
- LOCATION: Places, cities, countries, addresses
- EVENT: Named events, conferences, incidents
- CONCEPT: Abstract ideas, theories, methodologies
- TECHNOLOGY: Software, hardware, tools, frameworks
- PRODUCT: Physical or digital products
- DATE: Specific dates, time periods

## Output Format
Return a JSON object with two arrays:

{
  "entities": [
    {
      "name": "Entity Name",
      "type": "ENTITY_TYPE",
      "description": "Brief description of the entity in context"
    }
  ],
  "relations": [
    {
      "source": "Source Entity Name",
      "target": "Target Entity Name",
      "type": "RELATIONSHIP_TYPE",
      "description": "Description of how they are related"
    }
  ]
}

## Relationship Types
- WORKS_FOR, FOUNDED, LEADS (person-organization)
- LOCATED_IN, HEADQUARTERS_IN (entity-location)
- CREATED, DEVELOPED, INVENTED (entity-product/technology)
- PARTICIPATED_IN, ORGANIZED (entity-event)
- RELATED_TO, PART_OF, DEPENDS_ON (general)

## Guidelines
1. Only extract clearly mentioned entities, don't infer
2. Use the exact name as it appears in the text
3. Keep descriptions concise (1-2 sentences)
4. Ensure relationship source/target match extracted entity names exactly
5. Skip generic terms that aren't meaningful entities
6. Return valid JSON only, no markdown code blocks`;

/**
 * Field length limits to avoid PostgreSQL errors
 */
const MAX_NAME_LENGTH = 500;
const MAX_TYPE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 2000;

function truncate(text: string | undefined | null, maxLength: number): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength - 3) + '...';
}

/**
 * Extract entities and relations from a chunk of text using Gemini
 */
export async function extractEntitiesFromText(content: string): Promise<ExtractionResult> {
  const startTime = Date.now();
  console.log('[EntityExtractor] 📤 Calling Gemini API for extraction...');
  console.log('[EntityExtractor]    Content length:', content.length, 'chars');

  try {
    const prompt = `${ENTITY_EXTRACTION_SYSTEM_PROMPT}

Extract all entities and relationships from the following text:

---
${content}
---

Return valid JSON only.`;

    console.log('[EntityExtractor]    Prompt length:', prompt.length, 'chars');

    const response = await generateContent(prompt);
    const elapsed = Date.now() - startTime;

    console.log('[EntityExtractor] 📥 Gemini response received in', elapsed, 'ms');
    console.log('[EntityExtractor]    Response length:', response?.length || 0, 'chars');
    console.log('[EntityExtractor]    Response preview:', response?.substring(0, 200) || 'EMPTY');

    // Parse the JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[EntityExtractor] ⚠️ No JSON found in extraction response');
      console.warn('[EntityExtractor]    Full response:', response);
      return { entities: [], relations: [] };
    }

    const result = JSON.parse(jsonMatch[0]) as ExtractionResult;

    console.log('[EntityExtractor] ✅ Parsed result:', {
      entitiesCount: result.entities?.length || 0,
      relationsCount: result.relations?.length || 0,
    });

    // Validate structure
    if (!Array.isArray(result.entities)) {
      console.warn('[EntityExtractor] ⚠️ entities is not an array, defaulting to []');
      result.entities = [];
    }
    if (!Array.isArray(result.relations)) {
      console.warn('[EntityExtractor] ⚠️ relations is not an array, defaulting to []');
      result.relations = [];
    }

    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error('[EntityExtractor] ❌ GEMINI API ERROR after', elapsed, 'ms');
    console.error('[EntityExtractor]    Error type:', (error as Error)?.name);
    console.error('[EntityExtractor]    Error message:', (error as Error)?.message);
    console.error('[EntityExtractor]    Full error:', error);
    return { entities: [], relations: [] };
  }
}

/**
 * Normalize entity name for deduplication
 */
function normalizeEntityName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Validate entity name
 */
function isValidEntityName(name: string): boolean {
  const trimmed = name?.trim() || '';
  return trimmed.length >= 2 && !trimmed.match(/^[\d\s\W]+$/);
}

/**
 * Deduplicate entities from multiple chunks
 */
function deduplicateEntities(
  allEntities: Array<{
    name: string;
    type: string;
    description: string;
    sourceChunkId: string;
  }>
): Map<string, { name: string; type: string; descriptions: string[]; sourceChunkIds: string[] }> {
  const entityMap = new Map<string, {
    name: string;
    type: string;
    descriptions: string[];
    sourceChunkIds: string[];
  }>();

  for (const entity of allEntities) {
    const normalizedName = normalizeEntityName(entity.name);

    if (entityMap.has(normalizedName)) {
      const existing = entityMap.get(normalizedName)!;
      if (!existing.descriptions.includes(entity.description)) {
        existing.descriptions.push(entity.description);
      }
      if (!existing.sourceChunkIds.includes(entity.sourceChunkId)) {
        existing.sourceChunkIds.push(entity.sourceChunkId);
      }
    } else {
      entityMap.set(normalizedName, {
        name: entity.name,
        type: entity.type,
        descriptions: [entity.description],
        sourceChunkIds: [entity.sourceChunkId],
      });
    }
  }

  return entityMap;
}

/**
 * Merge multiple descriptions into one
 */
function mergeDescriptions(descriptions: string[]): string {
  const unique = [...new Set(descriptions.filter(d => d))];
  return unique.join(' ').substring(0, MAX_DESCRIPTION_LENGTH);
}

/**
 * Process entities for a document - extract, deduplicate, and store
 * Uses actual database schema fields
 */
export async function processEntitiesForDocument(
  documentId: string,
  chunks: Array<{ id: string; content: string }>,
  workspace: string = 'default',
  userId?: string
): Promise<{ entitiesCreated: number; relationsCreated: number }> {
  const overallStartTime = Date.now();

  console.log('\n========================================');
  console.log('🔍 ENTITY EXTRACTION TRIGGERED');
  console.log('========================================');
  console.log('Time:', new Date().toISOString());
  console.log('Document ID:', documentId);
  console.log('Workspace:', workspace);
  console.log('Input chunks:', chunks?.length || 0);
  console.log('Provided userId:', userId || 'NOT PROVIDED');
  console.log('========================================\n');

  try {
    // Validate input
    if (!chunks || chunks.length === 0) {
      console.log('[EntityExtractor] ⚠️ No chunks provided, returning early');
      return { entitiesCreated: 0, relationsCreated: 0 };
    }

    // If userId not provided, try to get it from the document
    let effectiveUserId = userId;
    if (!effectiveUserId && documentId) {
      console.log('[EntityExtractor] Fetching user_id from document...');
      const { data: doc, error: docError } = await supabaseAdmin
        .from('documents')
        .select('user_id')
        .eq('id', documentId)
        .single();

      if (docError) {
        console.error('[EntityExtractor] Error fetching document:', docError);
      }
      effectiveUserId = doc?.user_id || undefined;
      console.log('[EntityExtractor] Effective user_id:', effectiveUserId || 'NONE');
    }

    // Collect all extracted entities and relations from chunks
  const allExtractedEntities: Array<{
    name: string;
    type: string;
    description: string;
    sourceChunkId: string;
  }> = [];

  const allExtractedRelations: Array<{
    source: string;
    target: string;
    type: string;
    description: string;
    sourceChunkId: string;
  }> = [];

  // Extract from each chunk
  console.log(`[EntityExtractor] Starting extraction from ${chunks.length} chunks...`);
  let chunkIndex = 0;

  for (const chunk of chunks) {
    chunkIndex++;
    if (chunk.content.length < 50) {
      console.log(`[EntityExtractor] Chunk ${chunkIndex}/${chunks.length}: SKIPPED (too short: ${chunk.content.length} chars)`);
      continue;
    }

    console.log(`[EntityExtractor] Chunk ${chunkIndex}/${chunks.length}: Processing (${chunk.content.length} chars)...`);
    const extraction = await extractEntitiesFromText(chunk.content);
    console.log(`[EntityExtractor] Chunk ${chunkIndex}/${chunks.length}: Got ${extraction.entities?.length || 0} entities, ${extraction.relations?.length || 0} relations`);

    for (const entity of extraction.entities) {
      if (isValidEntityName(entity.name)) {
        allExtractedEntities.push({
          name: truncate(entity.name, MAX_NAME_LENGTH),
          type: truncate(entity.type?.toUpperCase() || 'UNKNOWN', MAX_TYPE_LENGTH),
          description: truncate(entity.description, MAX_DESCRIPTION_LENGTH),
          sourceChunkId: chunk.id,
        });
      }
    }

    for (const relation of extraction.relations) {
      if (isValidEntityName(relation.source) && isValidEntityName(relation.target)) {
        allExtractedRelations.push({
          source: truncate(relation.source, MAX_NAME_LENGTH),
          target: truncate(relation.target, MAX_NAME_LENGTH),
          type: truncate(relation.type?.toUpperCase() || 'RELATED_TO', MAX_TYPE_LENGTH),
          description: truncate(relation.description, MAX_DESCRIPTION_LENGTH),
          sourceChunkId: chunk.id,
        });
      }
    }
  }

  if (allExtractedEntities.length === 0) {
    console.log('[EntityExtractor] No entities extracted');
    return { entitiesCreated: 0, relationsCreated: 0 };
  }

  // Deduplicate entities
  const deduplicatedEntities = deduplicateEntities(allExtractedEntities);
  console.log(`[EntityExtractor] Deduplicated to ${deduplicatedEntities.size} unique entities`);

  // Build entity inserts matching ACTUAL database schema
  const entityNameToId = new Map<string, string>();
  const entityInserts: Array<Record<string, unknown>> = [];

  for (const [normalizedName, entityData] of deduplicatedEntities) {
    const entityId = uuidv4();
    const mergedDescription = mergeDescriptions(entityData.descriptions);

    // ACTUAL database schema (verified via check-entities-schema.js)
    // Schema has BOTH 'name' AND 'entity_name', BOTH 'type' AND 'entity_type'
    // Must provide ALL to satisfy NOT NULL constraints
    const entityInsert: Record<string, unknown> = {
      id: entityId,
      workspace: workspace,
      name: truncate(entityData.name, MAX_NAME_LENGTH),            // Required - primary
      type: truncate(entityData.type, MAX_TYPE_LENGTH),            // Required - primary
      entity_name: truncate(entityData.name, MAX_NAME_LENGTH),     // Required - legacy
      entity_type: truncate(entityData.type, MAX_TYPE_LENGTH),     // Required - legacy
      description: mergedDescription,
      source_chunk_ids: entityData.sourceChunkIds,
      user_id: effectiveUserId || null,                            // Required for RLS
    };

    console.log('[EntityExtractor] Inserting entity:', JSON.stringify(entityInsert, null, 2));
    entityInserts.push(entityInsert);
    entityNameToId.set(normalizedName, entityId);
  }

  // Store entities
  let entitiesCreated = 0;
  if (entityInserts.length > 0) {
    const { error: entityError } = await supabaseAdmin
      .from('entities')
      .insert(entityInserts);

    if (entityError) {
      console.error('[EntityExtractor] Error inserting entities:', entityError);
    } else {
      entitiesCreated = entityInserts.length;
      console.log(`[EntityExtractor] Successfully inserted ${entitiesCreated} entities`);
    }
  }

  // DEBUG: Log entity map for troubleshooting
  console.log('[EntityExtractor] Entity name -> ID map:');
  for (const [name, id] of entityNameToId) {
    console.log(`  "${name}" -> ${id}`);
  }

  // Build relation inserts matching ACTUAL database schema
  const relationInserts: Array<Record<string, unknown>> = [];
  const seenRelations = new Set<string>();

  console.log(`[EntityExtractor] Processing ${allExtractedRelations.length} extracted relations`);

  for (const relation of allExtractedRelations) {
    const sourceNormalized = normalizeEntityName(relation.source);
    const targetNormalized = normalizeEntityName(relation.target);

    console.log(`[EntityExtractor] Relation: "${relation.source}" -> "${relation.target}"`);
    console.log(`[EntityExtractor]   Normalized: "${sourceNormalized}" -> "${targetNormalized}"`);

    const sourceId = entityNameToId.get(sourceNormalized);
    const targetId = entityNameToId.get(targetNormalized);

    console.log(`[EntityExtractor]   sourceId: ${sourceId || 'NOT FOUND'}, targetId: ${targetId || 'NOT FOUND'}`);

    if (!sourceId) {
      console.log(`[EntityExtractor] SKIP relation - sourceId not found for: "${relation.source}" (normalized: "${sourceNormalized}")`);
      continue;
    }
    if (!targetId) {
      console.log(`[EntityExtractor] SKIP relation - targetId not found for: "${relation.target}" (normalized: "${targetNormalized}")`);
      continue;
    }

    const relationKey = `${sourceId}-${relation.type}-${targetId}`;
    if (seenRelations.has(relationKey)) {
      console.log(`[EntityExtractor] SKIP duplicate relation: ${relationKey}`);
      continue;
    }
    seenRelations.add(relationKey);

    // ACTUAL database schema (verified via check-entities-schema.js)
    // Schema has source_entity/target_entity (names) in addition to IDs
    const relationInsert: Record<string, unknown> = {
      id: uuidv4(),
      workspace: workspace,
      source_entity_id: sourceId,
      target_entity_id: targetId,
      source_entity: truncate(relation.source, MAX_NAME_LENGTH),    // Entity name (required)
      target_entity: truncate(relation.target, MAX_NAME_LENGTH),    // Entity name (required)
      relation_type: truncate(relation.type, MAX_TYPE_LENGTH),
      description: truncate(relation.description, MAX_DESCRIPTION_LENGTH),
      source_chunk_ids: [relation.sourceChunkId],
      user_id: effectiveUserId || null,                             // Required for RLS
    };

    console.log('[EntityExtractor] Will insert relation:', JSON.stringify(relationInsert, null, 2));
    relationInserts.push(relationInsert);
  }

  // Store relations
  let relationsCreated = 0;
  console.log(`[EntityExtractor] Attempting to insert ${relationInserts.length} relations`);

  if (relationInserts.length > 0) {
    const { data: insertedData, error: relationError } = await supabaseAdmin
      .from('relations')
      .insert(relationInserts)
      .select();

    if (relationError) {
      console.error('[EntityExtractor] Error inserting relations:', relationError);
      console.error('[EntityExtractor] Error details:', JSON.stringify(relationError, null, 2));
      // Try inserting one by one to find the problematic relation
      console.log('[EntityExtractor] Trying to insert relations one by one...');
      for (const rel of relationInserts) {
        const { error: singleError } = await supabaseAdmin
          .from('relations')
          .insert(rel);
        if (singleError) {
          console.error('[EntityExtractor] Failed to insert relation:', JSON.stringify(rel, null, 2));
          console.error('[EntityExtractor] Error:', singleError);
        } else {
          relationsCreated++;
          console.log('[EntityExtractor] Successfully inserted single relation');
        }
      }
    } else {
      relationsCreated = insertedData?.length || relationInserts.length;
      console.log(`[EntityExtractor] Successfully inserted ${relationsCreated} relations`);
    }
  } else {
    console.log('[EntityExtractor] No relations to insert (relationInserts is empty)');
  }

    const overallElapsed = Date.now() - overallStartTime;
    console.log(`\n========================================`);
    console.log(`✅ ENTITY EXTRACTION COMPLETED`);
    console.log(`========================================`);
    console.log(`Total time: ${overallElapsed}ms`);
    console.log(`Entities created: ${entitiesCreated}`);
    console.log(`Relations created: ${relationsCreated}`);
    console.log(`========================================\n`);

    return { entitiesCreated, relationsCreated };

  } catch (error) {
    const overallElapsed = Date.now() - overallStartTime;
    console.error(`\n========================================`);
    console.error(`❌ ENTITY EXTRACTION FAILED`);
    console.error(`========================================`);
    console.error(`Total time: ${overallElapsed}ms`);
    console.error(`Error type: ${(error as Error)?.name}`);
    console.error(`Error message: ${(error as Error)?.message}`);
    console.error(`Full error:`, error);
    console.error(`========================================\n`);
    return { entitiesCreated: 0, relationsCreated: 0 };
  }
}

/**
 * Get entities for a document
 */
export async function getEntitiesForDocument(documentId: string): Promise<Array<Record<string, unknown>>> {
  const { data: chunks, error: chunksError } = await supabaseAdmin
    .from('chunks')
    .select('id')
    .eq('document_id', documentId);

  if (chunksError || !chunks) {
    return [];
  }

  const chunkIds = chunks.map(c => c.id);

  const { data: entities, error: entitiesError } = await supabaseAdmin
    .from('entities')
    .select('*');

  if (entitiesError || !entities) {
    return [];
  }

  return entities.filter(entity => {
    const sourceChunkIds = entity.source_chunk_ids as string[];
    return sourceChunkIds?.some(id => chunkIds.includes(id));
  });
}

/**
 * Delete entities and relations for a document
 */
export async function deleteEntitiesForDocument(documentId: string): Promise<void> {
  const { data: chunks, error: chunksError } = await supabaseAdmin
    .from('chunks')
    .select('id')
    .eq('document_id', documentId);

  if (chunksError || !chunks) {
    return;
  }

  const chunkIds = chunks.map(c => c.id);

  const { data: entities } = await supabaseAdmin
    .from('entities')
    .select('id, source_chunk_ids');

  if (!entities) return;

  for (const entity of entities) {
    const sourceChunkIds = entity.source_chunk_ids as string[];
    if (!sourceChunkIds) continue;

    const remainingChunkIds = sourceChunkIds.filter(id => !chunkIds.includes(id));

    if (remainingChunkIds.length === 0) {
      await supabaseAdmin
        .from('entities')
        .delete()
        .eq('id', entity.id);

      await supabaseAdmin
        .from('relations')
        .delete()
        .or(`source_entity_id.eq.${entity.id},target_entity_id.eq.${entity.id}`);
    } else if (remainingChunkIds.length < sourceChunkIds.length) {
      await supabaseAdmin
        .from('entities')
        .update({ source_chunk_ids: remainingChunkIds })
        .eq('id', entity.id);
    }
  }
}
