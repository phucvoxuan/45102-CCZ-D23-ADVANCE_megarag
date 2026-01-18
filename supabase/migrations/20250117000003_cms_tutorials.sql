-- =============================================
-- CMS Tutorials Migration
-- Tables: cms_tutorial_levels, cms_tutorial_topics, cms_tutorials
-- =============================================

CREATE TABLE IF NOT EXISTS cms_tutorial_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_vi VARCHAR(100) NOT NULL,
  color VARCHAR(50) DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_tutorial_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_vi VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_tutorials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID REFERENCES cms_tutorial_levels(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES cms_tutorial_topics(id) ON DELETE SET NULL,
  slug VARCHAR(200) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_vi VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_vi TEXT,
  content_en TEXT NOT NULL,
  content_vi TEXT NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 10,
  reading_time INTEGER DEFAULT 5,
  prerequisites JSONB DEFAULT '[]',
  learning_outcomes JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(topic_id, slug)
);

INSERT INTO cms_tutorial_levels (slug, name_en, name_vi, color, sort_order) VALUES
('beginner', 'Beginner', 'Cơ bản', '#22C55E', 1),
('intermediate', 'Intermediate', 'Trung cấp', '#F59E0B', 2),
('advanced', 'Advanced', 'Nâng cao', '#EF4444', 3);

INSERT INTO cms_tutorial_topics (slug, name_en, name_vi, icon, sort_order) VALUES
('getting-started', 'Getting Started', 'Bắt đầu', 'Rocket', 1),
('document-processing', 'Document Processing', 'Xử lý tài liệu', 'FileText', 2),
('vector-search', 'Vector Search', 'Tìm kiếm vector', 'Search', 3),
('knowledge-graph', 'Knowledge Graph', 'Đồ thị tri thức', 'Network', 4),
('api-integration', 'API Integration', 'Tích hợp API', 'Code', 5),
('best-practices', 'Best Practices', 'Thực hành tốt', 'CheckCircle', 6);

ALTER TABLE cms_tutorial_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_tutorial_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read tutorial levels" ON cms_tutorial_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage tutorial levels" ON cms_tutorial_levels FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Public can read active tutorial topics" ON cms_tutorial_topics FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tutorial topics" ON cms_tutorial_topics FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Public can read published tutorials" ON cms_tutorials FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage tutorials" ON cms_tutorials FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE INDEX idx_tutorials_search ON cms_tutorials USING gin(to_tsvector('english', title_en || ' ' || content_en));
CREATE INDEX idx_tutorials_level ON cms_tutorials(level_id);
CREATE INDEX idx_tutorials_topic ON cms_tutorials(topic_id);
CREATE INDEX idx_tutorials_slug ON cms_tutorials(slug);
