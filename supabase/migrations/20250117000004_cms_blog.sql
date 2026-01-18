-- =============================================
-- CMS Blog Migration
-- Tables: cms_blog_categories, cms_blog_tags, cms_blog_posts, cms_blog_post_tags
-- =============================================

CREATE TABLE IF NOT EXISTS cms_blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_vi VARCHAR(100) NOT NULL,
  description_en TEXT,
  description_vi TEXT,
  color VARCHAR(50) DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_blog_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_vi VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES cms_blog_categories(id) ON DELETE SET NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_vi VARCHAR(255) NOT NULL,
  excerpt_en TEXT,
  excerpt_vi TEXT,
  content_en TEXT NOT NULL,
  content_vi TEXT NOT NULL,
  featured_image_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  author_name VARCHAR(100),
  author_avatar_url TEXT,
  reading_time INTEGER DEFAULT 5,
  meta_title_en VARCHAR(255),
  meta_title_vi VARCHAR(255),
  meta_description_en VARCHAR(500),
  meta_description_vi VARCHAR(500),
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS cms_blog_post_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES cms_blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES cms_blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, tag_id)
);

INSERT INTO cms_blog_categories (slug, name_en, name_vi, color, sort_order) VALUES
('product-updates', 'Product Updates', 'Cập nhật sản phẩm', '#3B82F6', 1),
('engineering', 'Engineering', 'Kỹ thuật', '#10B981', 2),
('tutorials', 'Tutorials', 'Hướng dẫn', '#F59E0B', 3),
('case-studies', 'Case Studies', 'Nghiên cứu điển hình', '#8B5CF6', 4),
('company-news', 'Company News', 'Tin công ty', '#EC4899', 5);

INSERT INTO cms_blog_tags (slug, name_en, name_vi) VALUES
('ai', 'AI', 'AI'),
('rag', 'RAG', 'RAG'),
('vector-search', 'Vector Search', 'Tìm kiếm Vector'),
('knowledge-graph', 'Knowledge Graph', 'Đồ thị tri thức'),
('api', 'API', 'API'),
('python', 'Python', 'Python'),
('javascript', 'JavaScript', 'JavaScript'),
('integration', 'Integration', 'Tích hợp'),
('performance', 'Performance', 'Hiệu năng'),
('security', 'Security', 'Bảo mật');

ALTER TABLE cms_blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active blog categories" ON cms_blog_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage blog categories" ON cms_blog_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Public can read blog tags" ON cms_blog_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog tags" ON cms_blog_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Public can read published blog posts" ON cms_blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage blog posts" ON cms_blog_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Public can read blog post tags" ON cms_blog_post_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog post tags" ON cms_blog_post_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE INDEX idx_blog_posts_search ON cms_blog_posts USING gin(to_tsvector('english', title_en || ' ' || content_en));
CREATE INDEX idx_blog_posts_category ON cms_blog_posts(category_id);
CREATE INDEX idx_blog_posts_slug ON cms_blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON cms_blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_post_tags_post ON cms_blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag ON cms_blog_post_tags(tag_id);
