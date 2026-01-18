-- =============================================
-- CMS Landing Content Migration
-- Tables: cms_static_pages, cms_footer_links, cms_landing_sections
-- =============================================

-- Bảng quản lý các trang tĩnh (Legal, Privacy, Terms, About, etc.)
CREATE TABLE IF NOT EXISTS cms_static_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_vi VARCHAR(255) NOT NULL,
  content_en TEXT NOT NULL,
  content_vi TEXT NOT NULL,
  meta_description_en VARCHAR(500),
  meta_description_vi VARCHAR(500),
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Bảng quản lý Footer links
CREATE TABLE IF NOT EXISTS cms_footer_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section VARCHAR(50) NOT NULL,
  label_en VARCHAR(100) NOT NULL,
  label_vi VARCHAR(100) NOT NULL,
  href VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_external BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng quản lý Landing Page sections
CREATE TABLE IF NOT EXISTS cms_landing_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key VARCHAR(100) UNIQUE NOT NULL,
  title_en VARCHAR(255),
  title_vi VARCHAR(255),
  subtitle_en TEXT,
  subtitle_vi TEXT,
  content_json JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default footer links
INSERT INTO cms_footer_links (section, label_en, label_vi, href, sort_order) VALUES
('product', 'Features', 'Tính năng', '/product/features', 1),
('product', 'Pricing', 'Bảng giá', '/pricing', 2),
('product', 'How It Works', 'Cách hoạt động', '/product/how-it-works', 3),
('product', 'API Docs', 'Tài liệu API', '/docs/api', 4),
('product', 'Changelog', 'Nhật ký thay đổi', '/changelog', 5),
('company', 'About Us', 'Về chúng tôi', '/about', 1),
('company', 'Blog', 'Blog', '/blog', 2),
('company', 'Careers', 'Tuyển dụng', '/careers', 3),
('company', 'Contact', 'Liên hệ', '/contact', 4),
('company', 'Press', 'Báo chí', '/press', 5),
('resources', 'Documentation', 'Tài liệu', '/docs', 1),
('resources', 'Tutorials', 'Hướng dẫn', '/tutorials', 2),
('resources', 'Community', 'Cộng đồng', '/community', 3),
('resources', 'Support', 'Hỗ trợ', '/support', 4),
('resources', 'Status', 'Trạng thái', '/status', 5),
('legal', 'Privacy Policy', 'Chính sách bảo mật', '/privacy', 1),
('legal', 'Terms of Service', 'Điều khoản dịch vụ', '/terms', 2),
('legal', 'Cookie Policy', 'Chính sách Cookie', '/cookies', 3),
('legal', 'GDPR', 'GDPR', '/gdpr', 4),
('legal', 'Security', 'Bảo mật', '/security', 5);

-- Insert default static pages
INSERT INTO cms_static_pages (slug, title_en, title_vi, content_en, content_vi, meta_description_en, meta_description_vi) VALUES
('privacy-policy', 'Privacy Policy', 'Chính sách Bảo mật',
'# Privacy Policy

**Last updated: January 2025**

## Introduction
Your privacy is important to us. This Privacy Policy explains how AIDORag ("we", "us", or "our") collects, uses, and protects your personal information.

## Information We Collect
- Account information (email, name)
- Usage data (documents uploaded, queries made)
- Device information (browser type, IP address)

## How We Use Your Information
- To provide and maintain our service
- To notify you about changes
- To provide customer support
- To detect and prevent fraud

## Data Security
We implement appropriate security measures to protect your data.

## Contact Us
If you have questions about this Privacy Policy, please contact us at info@aidorag.ai',

'# Chính sách Bảo mật

**Cập nhật lần cuối: Tháng 1, 2025**

## Giới thiệu
Quyền riêng tư của bạn rất quan trọng với chúng tôi. Chính sách Bảo mật này giải thích cách AIDORag ("chúng tôi") thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.

## Thông tin Chúng tôi Thu thập
- Thông tin tài khoản (email, tên)
- Dữ liệu sử dụng (tài liệu tải lên, truy vấn)
- Thông tin thiết bị (loại trình duyệt, địa chỉ IP)

## Cách Chúng tôi Sử dụng Thông tin
- Để cung cấp và duy trì dịch vụ
- Để thông báo về các thay đổi
- Để hỗ trợ khách hàng
- Để phát hiện và ngăn chặn gian lận

## Bảo mật Dữ liệu
Chúng tôi triển khai các biện pháp bảo mật phù hợp để bảo vệ dữ liệu của bạn.

## Liên hệ
Nếu bạn có câu hỏi về Chính sách Bảo mật này, vui lòng liên hệ info@aidorag.ai',
'Learn about how AIDORag protects your privacy and handles your data.',
'Tìm hiểu cách AIDORag bảo vệ quyền riêng tư và xử lý dữ liệu của bạn.'),

('terms-of-service', 'Terms of Service', 'Điều khoản Dịch vụ',
'# Terms of Service

**Last updated: January 2025**

## Acceptance of Terms
By accessing AIDORag, you agree to these Terms of Service.

## Use of Service
- You must be 18 years or older
- You are responsible for your account security
- You agree not to misuse our services

## Intellectual Property
All content and materials on AIDORag are protected by intellectual property laws.

## Limitation of Liability
AIDORag is provided "as is" without warranties.

## Contact
Questions? Contact us at info@aidorag.ai',

'# Điều khoản Dịch vụ

**Cập nhật lần cuối: Tháng 1, 2025**

## Chấp nhận Điều khoản
Bằng việc truy cập AIDORag, bạn đồng ý với các Điều khoản Dịch vụ này.

## Sử dụng Dịch vụ
- Bạn phải từ 18 tuổi trở lên
- Bạn chịu trách nhiệm về bảo mật tài khoản
- Bạn đồng ý không lạm dụng dịch vụ

## Sở hữu Trí tuệ
Tất cả nội dung trên AIDORag được bảo vệ bởi luật sở hữu trí tuệ.

## Giới hạn Trách nhiệm
AIDORag được cung cấp "nguyên trạng" không có bảo đảm.

## Liên hệ
Có câu hỏi? Liên hệ info@aidorag.ai',
'Read the Terms of Service for using AIDORag.',
'Đọc Điều khoản Dịch vụ khi sử dụng AIDORag.'),

('gdpr', 'GDPR Compliance', 'Tuân thủ GDPR',
'# GDPR Compliance

**Last updated: January 2025**

## Your Rights Under GDPR
As a user in the EU, you have the following rights:

### Right to Access
You can request a copy of your personal data.

### Right to Rectification
You can request correction of inaccurate data.

### Right to Erasure
You can request deletion of your data ("right to be forgotten").

### Right to Data Portability
You can request your data in a machine-readable format.

### Right to Object
You can object to processing of your personal data.

## How to Exercise Your Rights
Contact our Data Protection Officer at info@aidorag.ai',

'# Tuân thủ GDPR

**Cập nhật lần cuối: Tháng 1, 2025**

## Quyền của Bạn Theo GDPR
Là người dùng tại EU, bạn có các quyền sau:

### Quyền Truy cập
Bạn có thể yêu cầu bản sao dữ liệu cá nhân.

### Quyền Sửa đổi
Bạn có thể yêu cầu sửa dữ liệu không chính xác.

### Quyền Xóa
Bạn có thể yêu cầu xóa dữ liệu ("quyền được lãng quên").

### Quyền Di chuyển Dữ liệu
Bạn có thể yêu cầu dữ liệu ở định dạng máy có thể đọc.

### Quyền Phản đối
Bạn có thể phản đối việc xử lý dữ liệu cá nhân.

## Cách Thực hiện Quyền
Liên hệ Nhân viên Bảo vệ Dữ liệu tại info@aidorag.ai',
'Learn about your GDPR rights when using AIDORag.',
'Tìm hiểu quyền GDPR của bạn khi sử dụng AIDORag.'),

('cookies', 'Cookie Policy', 'Chính sách Cookie',
'# Cookie Policy

**Last updated: January 2025**

## What Are Cookies?
Cookies are small text files stored on your device when you visit our website.

## Types of Cookies We Use

### Essential Cookies
Required for the website to function properly.

### Analytics Cookies
Help us understand how visitors use our site.

### Functional Cookies
Remember your preferences.

## Managing Cookies
You can control cookies through your browser settings.

## Contact
Questions about cookies? Contact info@aidorag.ai',

'# Chính sách Cookie

**Cập nhật lần cuối: Tháng 1, 2025**

## Cookie là gì?
Cookie là các tệp văn bản nhỏ được lưu trên thiết bị khi bạn truy cập website.

## Các Loại Cookie Chúng tôi Sử dụng

### Cookie Thiết yếu
Cần thiết để website hoạt động đúng.

### Cookie Phân tích
Giúp chúng tôi hiểu cách khách truy cập sử dụng trang.

### Cookie Chức năng
Ghi nhớ tùy chọn của bạn.

## Quản lý Cookie
Bạn có thể kiểm soát cookie qua cài đặt trình duyệt.

## Liên hệ
Có câu hỏi về cookie? Liên hệ info@aidorag.ai',
'Learn about how AIDORag uses cookies.',
'Tìm hiểu cách AIDORag sử dụng cookie.');

-- Enable RLS
ALTER TABLE cms_static_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_landing_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read, Admin write
CREATE POLICY "Public can read published static pages" ON cms_static_pages
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage static pages" ON cms_static_pages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Public can read active footer links" ON cms_footer_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage footer links" ON cms_footer_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Public can read active landing sections" ON cms_landing_sections
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage landing sections" ON cms_landing_sections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin'))
  );

-- Indexes
CREATE INDEX idx_cms_static_pages_slug ON cms_static_pages(slug);
CREATE INDEX idx_cms_footer_links_section ON cms_footer_links(section);
CREATE INDEX idx_cms_landing_sections_key ON cms_landing_sections(section_key);
