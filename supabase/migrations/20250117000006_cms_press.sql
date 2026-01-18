-- =============================================
-- CMS Press Migration
-- Tables: cms_press_releases, cms_news_coverage, cms_press_kit
-- =============================================

CREATE TABLE IF NOT EXISTS cms_press_releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(200) UNIQUE NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_vi VARCHAR(255) NOT NULL,
  excerpt_en TEXT,
  excerpt_vi TEXT,
  content_en TEXT NOT NULL,
  content_vi TEXT NOT NULL,
  featured_image_url TEXT,
  pdf_url_en TEXT,
  pdf_url_vi TEXT,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  release_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS cms_news_coverage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  publication_name VARCHAR(200) NOT NULL,
  publication_logo_url TEXT,
  article_title_en VARCHAR(255) NOT NULL,
  article_title_vi VARCHAR(255),
  article_url TEXT NOT NULL,
  excerpt_en TEXT,
  excerpt_vi TEXT,
  author_name VARCHAR(100),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  coverage_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS cms_press_kit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_vi VARCHAR(100) NOT NULL,
  description_en TEXT,
  description_vi TEXT,
  file_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  file_size_kb INTEGER,
  thumbnail_url TEXT,
  category VARCHAR(50) DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

INSERT INTO cms_press_kit (slug, name_en, name_vi, description_en, description_vi, file_type, file_url, category, sort_order) VALUES
('logo-primary', 'Primary Logo', 'Logo chính', 'AIDORag primary logo in various formats', 'Logo chính AIDORag ở nhiều định dạng', 'ZIP', '/press/aidorag-logo-primary.zip', 'logos', 1),
('logo-dark', 'Dark Mode Logo', 'Logo chế độ tối', 'AIDORag logo optimized for dark backgrounds', 'Logo AIDORag tối ưu cho nền tối', 'ZIP', '/press/aidorag-logo-dark.zip', 'logos', 2),
('logo-light', 'Light Mode Logo', 'Logo chế độ sáng', 'AIDORag logo optimized for light backgrounds', 'Logo AIDORag tối ưu cho nền sáng', 'ZIP', '/press/aidorag-logo-light.zip', 'logos', 3),
('brand-guidelines', 'Brand Guidelines', 'Hướng dẫn thương hiệu', 'Complete brand guidelines and usage rules', 'Hướng dẫn thương hiệu và quy tắc sử dụng', 'PDF', '/press/aidorag-brand-guidelines.pdf', 'guidelines', 4),
('product-screenshots', 'Product Screenshots', 'Ảnh chụp sản phẩm', 'High-resolution product screenshots', 'Ảnh chụp sản phẩm độ phân giải cao', 'ZIP', '/press/aidorag-screenshots.zip', 'screenshots', 5),
('fact-sheet', 'Company Fact Sheet', 'Thông tin công ty', 'Key facts and figures about AIDORag', 'Thông tin và số liệu quan trọng về AIDORag', 'PDF', '/press/aidorag-fact-sheet.pdf', 'documents', 6);

ALTER TABLE cms_press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_news_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_press_kit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published press releases" ON cms_press_releases FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage press releases" ON cms_press_releases FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Public can read active news coverage" ON cms_news_coverage FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage news coverage" ON cms_news_coverage FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Public can read active press kit items" ON cms_press_kit FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage press kit" ON cms_press_kit FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE INDEX idx_press_releases_slug ON cms_press_releases(slug);
CREATE INDEX idx_press_releases_date ON cms_press_releases(release_date DESC);
CREATE INDEX idx_press_releases_published ON cms_press_releases(is_published, release_date DESC);
CREATE INDEX idx_news_coverage_date ON cms_news_coverage(coverage_date DESC);
CREATE INDEX idx_press_kit_category ON cms_press_kit(category);
