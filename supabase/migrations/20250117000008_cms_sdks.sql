-- =============================================
-- CMS SDKs Migration
-- Tables: cms_sdks, cms_sdk_examples
-- =============================================

CREATE TABLE IF NOT EXISTS cms_sdks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description_en TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(100),
  package_name VARCHAR(100),
  install_command TEXT,
  docs_url TEXT,
  github_url TEXT,
  npm_url TEXT,
  pypi_url TEXT,
  current_version VARCHAR(50),
  min_language_version VARCHAR(50),
  features JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS cms_sdk_examples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sdk_id UUID REFERENCES cms_sdks(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  title_vi VARCHAR(200) NOT NULL,
  description_en TEXT,
  description_vi TEXT,
  code TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sdk_id, slug)
);

INSERT INTO cms_sdks (slug, name, description_en, description_vi, language, icon, color, package_name, install_command, current_version, min_language_version, sort_order) VALUES
('python', 'Python SDK', 'The official Python SDK for AIDORag. Seamlessly integrate RAG capabilities into your Python applications with type hints and async support.', 'SDK Python chính thức cho AIDORag. Tích hợp liền mạch khả năng RAG vào ứng dụng Python với type hints và hỗ trợ async.', 'Python', '🐍', 'from-blue-500 to-green-500', 'aidorag', 'pip install aidorag', '1.2.0', 'Python 3.8+', 1),
('javascript', 'JavaScript SDK', 'The official JavaScript/TypeScript SDK for AIDORag. Works in both Node.js and browser environments with full TypeScript support.', 'SDK JavaScript/TypeScript chính thức cho AIDORag. Hoạt động trên cả môi trường Node.js và trình duyệt với hỗ trợ TypeScript đầy đủ.', 'JavaScript', '🟨', 'from-yellow-400 to-orange-500', '@aidorag/sdk', 'npm install @aidorag/sdk', '1.1.5', 'Node.js 16+', 2),
('go', 'Go SDK', 'The official Go SDK for AIDORag. High-performance, idiomatic Go implementation with excellent concurrency support.', 'SDK Go chính thức cho AIDORag. Triển khai Go hiệu năng cao, đúng chuẩn với hỗ trợ đồng thời xuất sắc.', 'Go', '🔵', 'from-cyan-400 to-blue-600', 'github.com/aidorag/go-sdk', 'go get github.com/aidorag/go-sdk', '0.9.0', 'Go 1.19+', 3),
('ruby', 'Ruby SDK', 'The official Ruby SDK for AIDORag. Elegant, Ruby-idiomatic interface with Rails integration support.', 'SDK Ruby chính thức cho AIDORag. Giao diện thanh lịch, đúng chuẩn Ruby với hỗ trợ tích hợp Rails.', 'Ruby', '💎', 'from-red-500 to-pink-500', 'aidorag', 'gem install aidorag', '0.8.0', 'Ruby 3.0+', 4);

-- Insert example code for each SDK
INSERT INTO cms_sdk_examples (sdk_id, slug, title_en, title_vi, description_en, description_vi, code, category, sort_order)
SELECT id, 'initialization', 'Initialize Client', 'Khởi tạo Client', 'Basic client initialization', 'Khởi tạo client cơ bản',
  'from aidorag import AIDORag

client = AIDORag(api_key="your-api-key")
print("Connected to AIDORag!")',
  'getting-started', 1
FROM cms_sdks WHERE slug = 'python';

INSERT INTO cms_sdk_examples (sdk_id, slug, title_en, title_vi, description_en, description_vi, code, category, sort_order)
SELECT id, 'upload-document', 'Upload Document', 'Tải lên tài liệu', 'Upload a document for processing', 'Tải lên tài liệu để xử lý',
  'response = client.documents.upload(
    file_path="./document.pdf",
    metadata={"category": "technical"}
)
print(f"Document ID: {response.id}")',
  'documents', 2
FROM cms_sdks WHERE slug = 'python';

INSERT INTO cms_sdk_examples (sdk_id, slug, title_en, title_vi, description_en, description_vi, code, category, sort_order)
SELECT id, 'query', 'Query Documents', 'Truy vấn tài liệu', 'Query your knowledge base', 'Truy vấn cơ sở tri thức',
  'results = client.query(
    question="What is RAG?",
    mode="hybrid",
    top_k=5
)
for result in results:
    print(result.content)',
  'query', 3
FROM cms_sdks WHERE slug = 'python';

INSERT INTO cms_sdk_examples (sdk_id, slug, title_en, title_vi, description_en, description_vi, code, category, sort_order)
SELECT id, 'initialization', 'Initialize Client', 'Khởi tạo Client', 'Basic client initialization', 'Khởi tạo client cơ bản',
  'import { AIDORag } from ''@aidorag/sdk'';

const client = new AIDORag({
  apiKey: ''your-api-key''
});
console.log(''Connected to AIDORag!'');',
  'getting-started', 1
FROM cms_sdks WHERE slug = 'javascript';

INSERT INTO cms_sdk_examples (sdk_id, slug, title_en, title_vi, description_en, description_vi, code, category, sort_order)
SELECT id, 'initialization', 'Initialize Client', 'Khởi tạo Client', 'Basic client initialization', 'Khởi tạo client cơ bản',
  'package main

import (
    "fmt"
    aidorag "github.com/aidorag/go-sdk"
)

func main() {
    client := aidorag.NewClient("your-api-key")
    fmt.Println("Connected to AIDORag!")
}',
  'getting-started', 1
FROM cms_sdks WHERE slug = 'go';

INSERT INTO cms_sdk_examples (sdk_id, slug, title_en, title_vi, description_en, description_vi, code, category, sort_order)
SELECT id, 'initialization', 'Initialize Client', 'Khởi tạo Client', 'Basic client initialization', 'Khởi tạo client cơ bản',
  'require ''aidorag''

client = AIDORag::Client.new(api_key: ''your-api-key'')
puts ''Connected to AIDORag!''',
  'getting-started', 1
FROM cms_sdks WHERE slug = 'ruby';

ALTER TABLE cms_sdks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_sdk_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active SDKs" ON cms_sdks FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage SDKs" ON cms_sdks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY "Public can read active SDK examples" ON cms_sdk_examples FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage SDK examples" ON cms_sdk_examples FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE INDEX idx_sdks_slug ON cms_sdks(slug);
CREATE INDEX idx_sdks_language ON cms_sdks(language);
CREATE INDEX idx_sdk_examples_sdk ON cms_sdk_examples(sdk_id);
CREATE INDEX idx_sdk_examples_category ON cms_sdk_examples(category);
