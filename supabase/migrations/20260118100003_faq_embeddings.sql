-- =============================================
-- FAQ Vector Embeddings Migration
-- Optimize FAQ search using semantic similarity
-- Reduces token cost by finding relevant FAQs first
-- =============================================

-- =============================================
-- 1. ADD EMBEDDING COLUMN TO widget_faqs
-- =============================================

-- Add question_embedding column (768 dimensions for Gemini text-embedding-004)
ALTER TABLE widget_faqs
ADD COLUMN IF NOT EXISTS question_embedding VECTOR(768);

-- =============================================
-- 2. CREATE INDEX FOR VECTOR SIMILARITY SEARCH
-- =============================================

-- Create HNSW index for fast approximate nearest neighbor search
-- Using cosine distance which works well for text embeddings
CREATE INDEX IF NOT EXISTS idx_widget_faqs_embedding
ON widget_faqs
USING hnsw (question_embedding vector_cosine_ops)
WHERE question_embedding IS NOT NULL;

-- =============================================
-- 3. FUNCTION TO SEARCH SIMILAR FAQs
-- =============================================

-- Search FAQs by semantic similarity
-- Returns top N FAQs ordered by similarity score
CREATE OR REPLACE FUNCTION search_similar_faqs(
  p_query_embedding VECTOR(768),
  p_widget_id UUID,
  p_limit INTEGER DEFAULT 5,
  p_similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  status VARCHAR,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.question,
    f.answer,
    f.status,
    1 - (f.question_embedding <=> p_query_embedding) AS similarity
  FROM widget_faqs f
  WHERE f.widget_id = p_widget_id
    AND f.status = 'active'
    AND f.question_embedding IS NOT NULL
    AND 1 - (f.question_embedding <=> p_query_embedding) >= p_similarity_threshold
  ORDER BY f.question_embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. FUNCTION TO UPDATE SINGLE FAQ EMBEDDING
-- =============================================

-- Update embedding for a single FAQ (called after create/update)
CREATE OR REPLACE FUNCTION update_faq_embedding(
  p_faq_id UUID,
  p_embedding VECTOR(768)
)
RETURNS VOID AS $$
BEGIN
  UPDATE widget_faqs
  SET
    question_embedding = p_embedding,
    updated_at = NOW()
  WHERE id = p_faq_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. FUNCTION TO CHECK EMBEDDING STATUS
-- =============================================

-- Get count of FAQs with/without embeddings for a widget
CREATE OR REPLACE FUNCTION get_faq_embedding_status(p_widget_id UUID)
RETURNS TABLE (
  total_faqs INTEGER,
  with_embedding INTEGER,
  without_embedding INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_faqs,
    COUNT(question_embedding)::INTEGER AS with_embedding,
    (COUNT(*) - COUNT(question_embedding))::INTEGER AS without_embedding
  FROM widget_faqs
  WHERE widget_id = p_widget_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN widget_faqs.question_embedding IS 'Vector embedding of FAQ question for semantic search (768 dimensions from Gemini text-embedding-004)';
COMMENT ON FUNCTION search_similar_faqs IS 'Search FAQs by semantic similarity using vector embeddings. Returns top N most similar FAQs.';
COMMENT ON FUNCTION update_faq_embedding IS 'Update the embedding vector for a single FAQ.';
COMMENT ON FUNCTION get_faq_embedding_status IS 'Get statistics about FAQ embedding coverage for a widget.';
