-- =============================================
-- CMS Docs Migration
-- Tables: cms_doc_categories, cms_doc_articles
-- =============================================

CREATE TABLE IF NOT EXISTS cms_doc_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_vi VARCHAR(100) NOT NULL,
  description_en TEXT,
  description_vi TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_doc_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES cms_doc_categories(id) ON DELETE SET NULL,
  slug VARCHAR(200) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_vi VARCHAR(255) NOT NULL,
  content_en TEXT NOT NULL,
  content_vi TEXT NOT NULL,
  excerpt_en VARCHAR(500),
  excerpt_vi VARCHAR(500),
  meta_description_en VARCHAR(500),
  meta_description_vi VARCHAR(500),
  reading_time INTEGER DEFAULT 5,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(category_id, slug)
);

INSERT INTO cms_doc_categories (slug, name_en, name_vi, icon, sort_order) VALUES
('getting-started', 'Getting Started', 'Bắt đầu nhanh', 'Rocket', 1),
('api-reference', 'API Reference', 'Tham khảo API', 'Code', 2),
('guides', 'Guides', 'Hướng dẫn', 'BookOpen', 3),
('sdks', 'SDKs', 'SDKs', 'Package', 4),
('troubleshooting', 'Troubleshooting', 'Khắc phục sự cố', 'AlertTriangle', 5);

ALTER TABLE cms_doc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_doc_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active doc categories" ON cms_doc_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage doc categories" ON cms_doc_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Public can read published doc articles" ON cms_doc_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage doc articles" ON cms_doc_articles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE INDEX idx_doc_articles_search ON cms_doc_articles USING gin(to_tsvector('english', title_en || ' ' || content_en));
CREATE INDEX idx_doc_articles_category ON cms_doc_articles(category_id);
CREATE INDEX idx_doc_articles_slug ON cms_doc_articles(slug);
