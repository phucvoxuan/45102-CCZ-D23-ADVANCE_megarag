-- =============================================
-- CMS Careers Migration
-- Tables: cms_departments, cms_job_listings, cms_job_applications
-- =============================================

CREATE TABLE IF NOT EXISTS cms_departments (
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

CREATE TABLE IF NOT EXISTS cms_job_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES cms_departments(id) ON DELETE SET NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_vi VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  requirements_en TEXT,
  requirements_vi TEXT,
  responsibilities_en TEXT,
  responsibilities_vi TEXT,
  benefits_en TEXT,
  benefits_vi TEXT,
  location_en VARCHAR(200),
  location_vi VARCHAR(200),
  employment_type VARCHAR(50) DEFAULT 'full-time',
  experience_level VARCHAR(50) DEFAULT 'mid',
  salary_range_min INTEGER,
  salary_range_max INTEGER,
  salary_currency VARCHAR(10) DEFAULT 'USD',
  is_remote BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  application_deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS cms_job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES cms_job_listings(id) ON DELETE SET NULL,
  applicant_name VARCHAR(200) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  applicant_phone VARCHAR(50),
  applicant_linkedin VARCHAR(500),
  applicant_portfolio VARCHAR(500),
  resume_url TEXT,
  cover_letter TEXT,
  additional_info JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'new',
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO cms_departments (slug, name_en, name_vi, icon, sort_order) VALUES
('engineering', 'Engineering', 'Kỹ thuật', 'Code', 1),
('product', 'Product', 'Sản phẩm', 'Package', 2),
('design', 'Design', 'Thiết kế', 'Palette', 3),
('marketing', 'Marketing', 'Marketing', 'Megaphone', 4),
('sales', 'Sales', 'Kinh doanh', 'TrendingUp', 5),
('operations', 'Operations', 'Vận hành', 'Settings', 6),
('customer-success', 'Customer Success', 'Hỗ trợ khách hàng', 'Users', 7);

ALTER TABLE cms_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active departments" ON cms_departments FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage departments" ON cms_departments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Public can read published job listings" ON cms_job_listings FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage job listings" ON cms_job_listings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Applicants can create applications" ON cms_job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Applicants can view their own applications" ON cms_job_applications FOR SELECT
  USING (applicant_email = current_setting('request.jwt.claims', true)::json->>'email');
CREATE POLICY "Admins can manage job applications" ON cms_job_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE INDEX idx_job_listings_department ON cms_job_listings(department_id);
CREATE INDEX idx_job_listings_slug ON cms_job_listings(slug);
CREATE INDEX idx_job_listings_published ON cms_job_listings(is_published, published_at DESC);
CREATE INDEX idx_job_listings_type ON cms_job_listings(employment_type);
CREATE INDEX idx_job_listings_level ON cms_job_listings(experience_level);
CREATE INDEX idx_job_applications_job ON cms_job_applications(job_id);
CREATE INDEX idx_job_applications_status ON cms_job_applications(status);
CREATE INDEX idx_job_applications_email ON cms_job_applications(applicant_email);
