-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Add user isolation to documents and related tables
-- CRITICAL SECURITY FIX: Users should only see their own documents
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. ADD USER_ID COLUMN TO DOCUMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add user_id column to documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add organization_id column to documents (optional, for team features)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON documents(organization_id) WHERE organization_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. ADD USER_ID TO CHUNKS TABLE (inherits from document but useful for direct queries)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE chunks
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chunks_user_id ON chunks(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. ADD USER_ID TO ENTITIES TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE entities
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_entities_user_id ON entities(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. ADD USER_ID TO RELATIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE relations
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_relations_user_id ON relations(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. ADD USER_ID TO CHAT_SESSIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. CREATE RLS POLICIES FOR DOCUMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Service role has full access to documents" ON documents;

-- Users can only view their own documents
CREATE POLICY "Users can view own documents"
ON documents FOR SELECT
USING (user_id = auth.uid());

-- Users can only insert documents for themselves
CREATE POLICY "Users can insert own documents"
ON documents FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can only update their own documents
CREATE POLICY "Users can update own documents"
ON documents FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can only delete their own documents
CREATE POLICY "Users can delete own documents"
ON documents FOR DELETE
USING (user_id = auth.uid());

-- Service role bypass (for admin operations and background processing)
CREATE POLICY "Service role has full access to documents"
ON documents FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. CREATE RLS POLICIES FOR CHUNKS
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own chunks" ON chunks;
DROP POLICY IF EXISTS "Users can insert own chunks" ON chunks;
DROP POLICY IF EXISTS "Users can update own chunks" ON chunks;
DROP POLICY IF EXISTS "Users can delete own chunks" ON chunks;
DROP POLICY IF EXISTS "Service role has full access to chunks" ON chunks;

CREATE POLICY "Users can view own chunks"
ON chunks FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chunks"
ON chunks FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chunks"
ON chunks FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own chunks"
ON chunks FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to chunks"
ON chunks FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. CREATE RLS POLICIES FOR ENTITIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own entities" ON entities;
DROP POLICY IF EXISTS "Users can insert own entities" ON entities;
DROP POLICY IF EXISTS "Users can update own entities" ON entities;
DROP POLICY IF EXISTS "Users can delete own entities" ON entities;
DROP POLICY IF EXISTS "Service role has full access to entities" ON entities;

CREATE POLICY "Users can view own entities"
ON entities FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own entities"
ON entities FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own entities"
ON entities FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own entities"
ON entities FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to entities"
ON entities FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. CREATE RLS POLICIES FOR RELATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own relations" ON relations;
DROP POLICY IF EXISTS "Users can insert own relations" ON relations;
DROP POLICY IF EXISTS "Users can update own relations" ON relations;
DROP POLICY IF EXISTS "Users can delete own relations" ON relations;
DROP POLICY IF EXISTS "Service role has full access to relations" ON relations;

CREATE POLICY "Users can view own relations"
ON relations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own relations"
ON relations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own relations"
ON relations FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own relations"
ON relations FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to relations"
ON relations FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. CREATE RLS POLICIES FOR CHAT_SESSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Service role has full access to chat_sessions" ON chat_sessions;

CREATE POLICY "Users can view own chat sessions"
ON chat_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat sessions"
ON chat_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat sessions"
ON chat_sessions FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own chat sessions"
ON chat_sessions FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to chat_sessions"
ON chat_sessions FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. CREATE RLS POLICIES FOR CHAT_MESSAGES (via session ownership)
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view messages from own sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to own sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can update messages in own sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete messages from own sessions" ON chat_messages;
DROP POLICY IF EXISTS "Service role has full access to chat_messages" ON chat_messages;

CREATE POLICY "Users can view messages from own sessions"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to own sessions"
ON chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in own sessions"
ON chat_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages from own sessions"
ON chat_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Service role has full access to chat_messages"
ON chat_messages FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. UPDATE SEARCH FUNCTIONS TO INCLUDE USER_ID FILTER
-- ═══════════════════════════════════════════════════════════════════════════════

-- Search chunks by semantic similarity (with user isolation)
CREATE OR REPLACE FUNCTION search_chunks(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 10,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    id VARCHAR,
    document_id VARCHAR,
    content TEXT,
    chunk_type VARCHAR,
    similarity FLOAT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.document_id,
        c.content,
        c.chunk_type,
        (1 - (c.content_vector <=> query_embedding))::FLOAT AS similarity
    FROM chunks c
    WHERE c.content_vector IS NOT NULL
      AND 1 - (c.content_vector <=> query_embedding) > match_threshold
      AND (p_user_id IS NULL OR c.user_id = p_user_id)
    ORDER BY c.content_vector <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Search entities by semantic similarity (with user isolation)
CREATE OR REPLACE FUNCTION search_entities(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 20,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    id VARCHAR,
    entity_name VARCHAR,
    entity_type VARCHAR,
    description TEXT,
    similarity FLOAT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.entity_name,
        e.entity_type,
        e.description,
        (1 - (e.content_vector <=> query_embedding))::FLOAT AS similarity
    FROM entities e
    WHERE e.content_vector IS NOT NULL
      AND 1 - (e.content_vector <=> query_embedding) > match_threshold
      AND (p_user_id IS NULL OR e.user_id = p_user_id)
    ORDER BY e.content_vector <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Search relations by semantic similarity (with user isolation)
CREATE OR REPLACE FUNCTION search_relations(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 20,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    id VARCHAR,
    source_entity_id VARCHAR,
    target_entity_id VARCHAR,
    relation_type VARCHAR,
    description TEXT,
    similarity FLOAT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.source_entity_id,
        r.target_entity_id,
        r.relation_type,
        r.description,
        (1 - (r.content_vector <=> query_embedding))::FLOAT AS similarity
    FROM relations r
    WHERE r.content_vector IS NOT NULL
      AND 1 - (r.content_vector <=> query_embedding) > match_threshold
      AND (p_user_id IS NULL OR r.user_id = p_user_id)
    ORDER BY r.content_vector <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUMMARY OF CHANGES:
-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Added user_id column to: documents, chunks, entities, relations, chat_sessions
-- 2. Added organization_id column to documents (for future team features)
-- 3. Enabled RLS on all content tables
-- 4. Created policies so users can only access their own data
-- 5. Updated search functions to support user_id filtering
--
-- IMPORTANT: After running this migration, you MUST update the API code to:
-- 1. Pass user_id when inserting documents/chunks/entities/relations
-- 2. Use authenticated Supabase client (not admin) for user-facing operations
-- ═══════════════════════════════════════════════════════════════════════════════
