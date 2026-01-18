-- =============================================
-- CMS Press Videos and Company Facts Migration
-- Tables: cms_press_videos, cms_company_facts
-- =============================================

-- Press Videos Table
CREATE TABLE IF NOT EXISTS cms_press_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  title_vi VARCHAR(200) NOT NULL,
  description_en TEXT,
  description_vi TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  video_type VARCHAR(50) DEFAULT 'youtube', -- youtube, vimeo, direct
  duration VARCHAR(20), -- e.g., "3:45"
  event_date DATE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Company Facts Table
CREATE TABLE IF NOT EXISTS cms_company_facts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  label_en VARCHAR(100) NOT NULL,
  label_vi VARCHAR(100) NOT NULL,
  value VARCHAR(50) NOT NULL,
  description_en TEXT,
  description_vi TEXT,
  icon VARCHAR(50), -- Icon name (optional)
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Insert default company facts (user can edit these)
INSERT INTO cms_company_facts (slug, label_en, label_vi, value, sort_order) VALUES
('founded', 'Founded', 'Thành lập', '2024', 1),
('users', 'Active Users', 'Người dùng', 'Beta', 2),
('documents', 'Documents Processed', 'Tài liệu xử lý', 'Growing', 3),
('countries', 'Countries', 'Quốc gia', 'Global', 4);

-- Enable RLS
ALTER TABLE cms_press_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_company_facts ENABLE ROW LEVEL SECURITY;

-- Policies for Press Videos
CREATE POLICY "Public can read active press videos" ON cms_press_videos
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage press videos" ON cms_press_videos
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')
  ));

-- Policies for Company Facts
CREATE POLICY "Public can read active company facts" ON cms_company_facts
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage company facts" ON cms_company_facts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')
  ));

-- Indexes
CREATE INDEX idx_press_videos_sort ON cms_press_videos(sort_order);
CREATE INDEX idx_press_videos_active ON cms_press_videos(is_active, sort_order);
CREATE INDEX idx_company_facts_sort ON cms_company_facts(sort_order);
CREATE INDEX idx_company_facts_active ON cms_company_facts(is_active, sort_order);
