-- =============================================
-- CMS Changelog Migration
-- Tables: cms_changelog_types, cms_changelog_entries
-- =============================================

CREATE TABLE IF NOT EXISTS cms_changelog_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_vi VARCHAR(100) NOT NULL,
  color VARCHAR(50) DEFAULT '#3B82F6',
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_changelog_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_id UUID REFERENCES cms_changelog_types(id) ON DELETE SET NULL,
  version VARCHAR(50),
  title_en VARCHAR(255) NOT NULL,
  title_vi VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_vi TEXT,
  content_en TEXT NOT NULL,
  content_vi TEXT NOT NULL,
  breaking_changes JSONB DEFAULT '[]',
  deprecations JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT true,
  is_major BOOLEAN DEFAULT false,
  release_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO cms_changelog_types (slug, name_en, name_vi, color, icon, sort_order) VALUES
('feature', 'New Feature', 'Tính năng mới', '#22C55E', 'Sparkles', 1),
('improvement', 'Improvement', 'Cải tiến', '#3B82F6', 'TrendingUp', 2),
('bugfix', 'Bug Fix', 'Sửa lỗi', '#F59E0B', 'Bug', 3),
('security', 'Security', 'Bảo mật', '#EF4444', 'Shield', 4),
('deprecation', 'Deprecation', 'Ngừng hỗ trợ', '#6B7280', 'AlertTriangle', 5),
('breaking', 'Breaking Change', 'Thay đổi quan trọng', '#DC2626', 'AlertOctagon', 6);

ALTER TABLE cms_changelog_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read changelog types" ON cms_changelog_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage changelog types" ON cms_changelog_types FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Public can read published changelog entries" ON cms_changelog_entries FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage changelog entries" ON cms_changelog_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE INDEX idx_changelog_entries_type ON cms_changelog_entries(type_id);
CREATE INDEX idx_changelog_entries_version ON cms_changelog_entries(version);
CREATE INDEX idx_changelog_entries_date ON cms_changelog_entries(release_date DESC);
CREATE INDEX idx_changelog_entries_published ON cms_changelog_entries(is_published, release_date DESC);
