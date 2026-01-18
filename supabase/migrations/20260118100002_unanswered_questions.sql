-- =============================================
-- Unanswered Questions Table
-- Stores questions that chatbot couldn't answer from FAQs
-- =============================================

-- =============================================
-- 1. CREATE UNANSWERED QUESTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS unanswered_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_id UUID REFERENCES chatbot_widgets(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES widget_conversations(id) ON DELETE SET NULL,

  -- Question content
  question TEXT NOT NULL,

  -- Context (optional - may help when creating FAQ)
  user_context TEXT,

  -- Status for review workflow
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, converted_to_faq, dismissed

  -- If converted to FAQ, reference the created FAQ
  converted_faq_id UUID REFERENCES widget_faqs(id) ON DELETE SET NULL,

  -- Tracking
  occurrence_count INTEGER DEFAULT 1, -- Count similar questions
  first_asked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_asked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Visitor info (if available)
  visitor_id VARCHAR(100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE unanswered_questions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. RLS POLICIES
-- =============================================

-- Widget owners can view their unanswered questions
CREATE POLICY "Widget owners can view unanswered questions" ON unanswered_questions
  FOR SELECT USING (
    widget_id IN (SELECT id FROM chatbot_widgets WHERE user_id = auth.uid())
  );

-- Widget owners can update unanswered questions
CREATE POLICY "Widget owners can update unanswered questions" ON unanswered_questions
  FOR UPDATE USING (
    widget_id IN (SELECT id FROM chatbot_widgets WHERE user_id = auth.uid())
  );

-- Widget owners can delete unanswered questions
CREATE POLICY "Widget owners can delete unanswered questions" ON unanswered_questions
  FOR DELETE USING (
    widget_id IN (SELECT id FROM chatbot_widgets WHERE user_id = auth.uid())
  );

-- Service role has full access (for chat API to insert)
CREATE POLICY "Service role has full access to unanswered questions" ON unanswered_questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- 3. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_unanswered_questions_widget ON unanswered_questions(widget_id);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_status ON unanswered_questions(status);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_created ON unanswered_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_occurrence ON unanswered_questions(occurrence_count DESC);

-- =============================================
-- 4. FUNCTION TO RECORD UNANSWERED QUESTION
-- =============================================

CREATE OR REPLACE FUNCTION record_unanswered_question(
  p_widget_id UUID,
  p_question TEXT,
  p_conversation_id UUID DEFAULT NULL,
  p_visitor_id VARCHAR(100) DEFAULT NULL,
  p_user_context TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_existing_id UUID;
  v_new_id UUID;
BEGIN
  -- Check if similar question exists (simple matching, can be enhanced later)
  SELECT id INTO v_existing_id
  FROM unanswered_questions
  WHERE widget_id = p_widget_id
    AND status = 'pending'
    AND LOWER(question) = LOWER(p_question)
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Update occurrence count
    UPDATE unanswered_questions
    SET
      occurrence_count = occurrence_count + 1,
      last_asked_at = NOW(),
      updated_at = NOW()
    WHERE id = v_existing_id;

    RETURN v_existing_id;
  ELSE
    -- Insert new question
    INSERT INTO unanswered_questions (
      widget_id, question, conversation_id, visitor_id, user_context
    ) VALUES (
      p_widget_id, p_question, p_conversation_id, p_visitor_id, p_user_context
    )
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. FUNCTION TO CONVERT QUESTION TO FAQ
-- =============================================

CREATE OR REPLACE FUNCTION convert_question_to_faq(
  p_question_id UUID,
  p_answer TEXT
)
RETURNS UUID AS $$
DECLARE
  v_widget_id UUID;
  v_question TEXT;
  v_faq_id UUID;
  v_max_order INTEGER;
BEGIN
  -- Get question details
  SELECT widget_id, question INTO v_widget_id, v_question
  FROM unanswered_questions
  WHERE id = p_question_id;

  IF v_widget_id IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  -- Get max sort order
  SELECT COALESCE(MAX(sort_order), 0) INTO v_max_order
  FROM widget_faqs
  WHERE widget_id = v_widget_id;

  -- Create FAQ
  INSERT INTO widget_faqs (widget_id, question, answer, status, sort_order, source)
  VALUES (v_widget_id, v_question, p_answer, 'active', v_max_order + 1, 'from_unanswered')
  RETURNING id INTO v_faq_id;

  -- Update question status
  UPDATE unanswered_questions
  SET
    status = 'converted_to_faq',
    converted_faq_id = v_faq_id,
    updated_at = NOW()
  WHERE id = p_question_id;

  RETURN v_faq_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
