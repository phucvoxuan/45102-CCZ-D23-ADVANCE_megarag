# 🚀 8 PROMPTS THỰC THI CMS - API Routes + Admin UI + Frontend

> **HƯỚNG DẪN:** Copy từng prompt một vào Claude Code. Hoàn thành prompt trước rồi mới chạy prompt tiếp theo.

---

# 📋 PROMPT 1/8: LANDING CMS (Static Pages + Footer Links)

```
# IMPLEMENT LANDING CMS - Static Pages & Footer Links

## CONTEXT
Database tables đã có:
- cms_static_pages (4 default pages: privacy, terms, gdpr, cookies)
- cms_footer_links (20 default links)
- cms_landing_sections

## NHIỆM VỤ
Tạo API routes và Admin UI để quản lý Landing content.

## BƯỚC 1: TẠO API ROUTES

### 1.1 Static Pages API
Tạo file: `src/app/api/admin/cms/static-pages/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all static pages
export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cms_static_pages')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

// POST create new static page
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  
  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const { data, error } = await supabase
    .from('cms_static_pages')
    .insert({
      ...body,
      created_by: user.id,
      updated_by: user.id
    })
    .select()
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
```

### 1.2 Static Pages by ID API
Tạo file: `src/app/api/admin/cms/static-pages/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET single static page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cms_static_pages')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

// PUT update static page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  
  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data, error } = await supabase
    .from('cms_static_pages')
    .update({
      ...body,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

// DELETE static page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('cms_static_pages')
    .delete()
    .eq('id', id);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
```

### 1.3 Footer Links API
Tạo file: `src/app/api/admin/cms/footer-links/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cms_footer_links')
    .select('*')
    .order('section')
    .order('sort_order');
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data, error } = await supabase
    .from('cms_footer_links')
    .insert(body)
    .select()
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
```

### 1.4 Footer Links by ID API
Tạo file: `src/app/api/admin/cms/footer-links/[id]/route.ts`
(Tương tự static-pages/[id]/route.ts nhưng cho footer_links table)

## BƯỚC 2: TẠO ADMIN UI

### 2.1 Landing CMS Page
Tạo file: `src/app/(admin)/system-admin/content/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StaticPagesManager } from '@/components/admin/cms/StaticPagesManager';
import { FooterLinksManager } from '@/components/admin/cms/FooterLinksManager';

export default function ContentManagementPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Content Management</h1>
      
      <Tabs defaultValue="static-pages">
        <TabsList>
          <TabsTrigger value="static-pages">Static Pages</TabsTrigger>
          <TabsTrigger value="footer-links">Footer Links</TabsTrigger>
        </TabsList>
        
        <TabsContent value="static-pages" className="mt-4">
          <StaticPagesManager />
        </TabsContent>
        
        <TabsContent value="footer-links" className="mt-4">
          <FooterLinksManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 2.2 Static Pages Manager Component
Tạo file: `src/components/admin/cms/StaticPagesManager.tsx`

Component này cần:
- Table hiển thị tất cả static pages
- Button "Add New Page"
- Dialog/Modal để create/edit page
- Markdown editor cho content (sử dụng @uiw/react-md-editor đã cài)
- Toggle cho is_published
- Delete với confirmation
- Bilingual support (EN/VI tabs trong form)

### 2.3 Footer Links Manager Component
Tạo file: `src/components/admin/cms/FooterLinksManager.tsx`

Component này cần:
- Table grouped by section (product, company, resources, legal)
- Drag & drop để reorder (hoặc sort_order input)
- Add/Edit/Delete functionality
- Toggle is_active
- is_external checkbox

## BƯỚC 3: PUBLIC API CHO FRONTEND

### 3.1 Public Static Page API (by slug)
Tạo file: `src/app/api/pages/[slug]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cms_static_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
    
  if (error || !data) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }
  
  return NextResponse.json(data);
}
```

### 3.2 Public Footer Links API
Tạo file: `src/app/api/footer-links/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cms_footer_links')
    .select('*')
    .eq('is_active', true)
    .order('section')
    .order('sort_order');
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Group by section
  const grouped = data.reduce((acc, link) => {
    if (!acc[link.section]) {
      acc[link.section] = [];
    }
    acc[link.section].push(link);
    return acc;
  }, {} as Record<string, typeof data>);
  
  return NextResponse.json(grouped);
}
```

## BƯỚC 4: CẬP NHẬT SIDEBAR NAVIGATION

Thêm link "Content" vào sidebar của system-admin với các sub-items:
- Content (icon: FileText)
  - Static Pages
  - Footer Links

## OUTPUT MONG ĐỢI
- [ ] API routes cho static-pages CRUD
- [ ] API routes cho footer-links CRUD
- [ ] Admin page tại /system-admin/content
- [ ] StaticPagesManager component với Markdown editor
- [ ] FooterLinksManager component grouped by section
- [ ] Public APIs cho frontend
- [ ] Sidebar navigation updated

## TEST
1. Truy cập /system-admin/content
2. Xem danh sách 4 static pages có sẵn
3. Edit một page, save, verify changes
4. Xem 20 footer links grouped by section
5. Add/edit/delete footer link
```

---

# 📋 PROMPT 2/8: BLOG CMS

```
# IMPLEMENT BLOG CMS

## CONTEXT
Database tables đã có:
- cms_blog_categories (5 categories)
- cms_blog_tags (6 tags)
- cms_blog_posts
- cms_blog_post_tags (junction table)

## NHIỆM VỤ
Tạo đầy đủ Blog CMS với categories, tags, posts.

## BƯỚC 1: TẠO API ROUTES

### 1.1 Blog Categories API
Tạo file: `src/app/api/admin/cms/blog/categories/route.ts`
Tạo file: `src/app/api/admin/cms/blog/categories/[id]/route.ts`

### 1.2 Blog Tags API
Tạo file: `src/app/api/admin/cms/blog/tags/route.ts`
Tạo file: `src/app/api/admin/cms/blog/tags/[id]/route.ts`

### 1.3 Blog Posts API
Tạo file: `src/app/api/admin/cms/blog/posts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category');
  const status = searchParams.get('status'); // published, draft, all
  
  let query = supabase
    .from('cms_blog_posts')
    .select(`
      *,
      category:cms_blog_categories(id, slug, name_en, name_vi),
      tags:cms_blog_post_tags(
        tag:cms_blog_tags(id, slug, name_en, name_vi)
      )
    `)
    .order('created_at', { ascending: false });
    
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  if (status === 'published') {
    query = query.eq('is_published', true);
  } else if (status === 'draft') {
    query = query.eq('is_published', false);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { tags, ...postData } = body;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Create post
  const { data: post, error: postError } = await supabase
    .from('cms_blog_posts')
    .insert({
      ...postData,
      created_by: user.id,
      updated_by: user.id,
      published_at: postData.is_published ? new Date().toISOString() : null
    })
    .select()
    .single();
    
  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 500 });
  }
  
  // Add tags if provided
  if (tags && tags.length > 0) {
    const tagRelations = tags.map((tagId: string) => ({
      post_id: post.id,
      tag_id: tagId
    }));
    
    await supabase.from('cms_blog_post_tags').insert(tagRelations);
  }
  
  return NextResponse.json(post);
}
```

Tạo file: `src/app/api/admin/cms/blog/posts/[id]/route.ts`
(GET, PUT, DELETE với handling cho tags)

### 1.4 Image Upload API
Tạo file: `src/app/api/admin/cms/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const folder = formData.get('folder') as string || 'cms';
  
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('public')
    .upload(fileName, file);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('public')
    .getPublicUrl(fileName);
  
  return NextResponse.json({ url: publicUrl });
}
```

## BƯỚC 2: TẠO ADMIN UI

### 2.1 Blog CMS Page
Tạo file: `src/app/(admin)/system-admin/blog/page.tsx`

```typescript
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogPostsManager } from '@/components/admin/cms/blog/BlogPostsManager';
import { BlogCategoriesManager } from '@/components/admin/cms/blog/BlogCategoriesManager';
import { BlogTagsManager } from '@/components/admin/cms/blog/BlogTagsManager';

export default function BlogManagementPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Blog Management</h1>
      
      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-4">
          <BlogPostsManager />
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4">
          <BlogCategoriesManager />
        </TabsContent>
        
        <TabsContent value="tags" className="mt-4">
          <BlogTagsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 2.2 Components cần tạo:
- `src/components/admin/cms/blog/BlogPostsManager.tsx`
  - Table với columns: Title, Category, Status, Author, Date
  - Filter by category, status
  - Search by title
  - Bulk actions (publish, unpublish, delete)
  
- `src/components/admin/cms/blog/BlogPostForm.tsx`
  - Title (EN/VI)
  - Slug (auto-generate từ title)
  - Category dropdown
  - Tags multi-select
  - Featured image upload
  - Excerpt (EN/VI)
  - Content với Markdown editor (EN/VI tabs)
  - Author info (name, avatar, title)
  - is_published toggle
  - is_featured toggle
  
- `src/components/admin/cms/blog/BlogCategoriesManager.tsx`
- `src/components/admin/cms/blog/BlogTagsManager.tsx`

## BƯỚC 3: PUBLIC BLOG PAGES

### 3.1 Blog List API
Tạo file: `src/app/api/blog/route.ts`

### 3.2 Blog Post API (by slug)
Tạo file: `src/app/api/blog/[slug]/route.ts`

## BƯỚC 4: CẬP NHẬT SIDEBAR

Thêm "Blog" vào sidebar với icon Newspaper

## OUTPUT MONG ĐỢI
- [ ] Full CRUD cho blog posts với tags relationship
- [ ] Categories và Tags management
- [ ] Image upload functionality
- [ ] Rich markdown editor
- [ ] Admin UI tại /system-admin/blog
- [ ] Public APIs cho blog frontend

## TEST
1. Truy cập /system-admin/blog
2. Tạo blog post mới với category và tags
3. Upload featured image
4. Publish/unpublish post
5. Verify tags relationship works
```

---

# 📋 PROMPT 3/8: DOCS CMS

```
# IMPLEMENT DOCS CMS

## CONTEXT
Database tables đã có:
- cms_doc_categories (5 categories)
- cms_doc_articles

## NHIỆM VỤ
Tạo Documentation CMS.

## BƯỚC 1: TẠO API ROUTES

### Admin APIs:
- `src/app/api/admin/cms/docs/categories/route.ts`
- `src/app/api/admin/cms/docs/categories/[id]/route.ts`
- `src/app/api/admin/cms/docs/articles/route.ts`
- `src/app/api/admin/cms/docs/articles/[id]/route.ts`

### Public APIs:
- `src/app/api/docs/route.ts` (list categories with article counts)
- `src/app/api/docs/[category]/route.ts` (articles in category)
- `src/app/api/docs/[category]/[slug]/route.ts` (single article)
- `src/app/api/docs/search/route.ts` (full-text search)

## BƯỚC 2: TẠO ADMIN UI

Tạo file: `src/app/(admin)/system-admin/docs/page.tsx`

Components:
- `src/components/admin/cms/docs/DocCategoriesManager.tsx`
  - Icon picker (Lucide icons)
  - Reorder functionality
  
- `src/components/admin/cms/docs/DocArticlesManager.tsx`
  - Filter by category
  - Search
  - Drag to reorder within category
  
- `src/components/admin/cms/docs/DocArticleForm.tsx`
  - Category select
  - Title, slug
  - Content with Markdown editor
  - Excerpt (auto-generate option)
  - Reading time (auto-calculate)
  - is_published, is_featured

## BƯỚC 3: CẬP NHẬT SIDEBAR

Thêm "Docs" với icon BookOpen

## OUTPUT MONG ĐỢI
- [ ] Categories với icon support
- [ ] Articles với category relationship
- [ ] Full-text search API
- [ ] Reading time auto-calculation
- [ ] Admin UI tại /system-admin/docs
```

---

# 📋 PROMPT 4/8: TUTORIALS CMS

```
# IMPLEMENT TUTORIALS CMS

## CONTEXT
Database tables đã có:
- cms_tutorial_levels (3 levels)
- cms_tutorial_topics (6 topics)
- cms_tutorials

## NHIỆM VỤ
Tạo Tutorials CMS với video support.

## BƯỚC 1: TẠO API ROUTES

### Admin APIs:
- `src/app/api/admin/cms/tutorials/levels/route.ts`
- `src/app/api/admin/cms/tutorials/topics/route.ts`
- `src/app/api/admin/cms/tutorials/route.ts`
- `src/app/api/admin/cms/tutorials/[id]/route.ts`

### Public APIs:
- `src/app/api/tutorials/route.ts`
- `src/app/api/tutorials/[slug]/route.ts`

## BƯỚC 2: TẠO ADMIN UI

Tạo file: `src/app/(admin)/system-admin/tutorials/page.tsx`

Components:
- `src/components/admin/cms/tutorials/TutorialLevelsManager.tsx`
- `src/components/admin/cms/tutorials/TutorialTopicsManager.tsx`
- `src/components/admin/cms/tutorials/TutorialsManager.tsx`
- `src/components/admin/cms/tutorials/TutorialForm.tsx`
  - Video URL field (YouTube, Vimeo embed)
  - Thumbnail upload
  - Duration input
  - Level select
  - Topic select
  - View count display (read-only)

## BƯỚC 3: CẬP NHẬT SIDEBAR

Thêm "Tutorials" với icon PlayCircle

## OUTPUT MONG ĐỢI
- [ ] Levels management (Beginner, Intermediate, Advanced)
- [ ] Topics management
- [ ] Tutorials với video support
- [ ] View count tracking
- [ ] Admin UI tại /system-admin/tutorials
```

---

# 📋 PROMPT 5/8: CHANGELOG CMS

```
# IMPLEMENT CHANGELOG CMS

## CONTEXT
Database tables đã có:
- cms_changelog_types (5 types: feature, improvement, fix, security, deprecation)
- cms_changelog_entries

## NHIỆM VỤ
Tạo Changelog CMS.

## BƯỚC 1: TẠO API ROUTES

### Admin APIs:
- `src/app/api/admin/cms/changelog/types/route.ts`
- `src/app/api/admin/cms/changelog/entries/route.ts`
- `src/app/api/admin/cms/changelog/entries/[id]/route.ts`

### Public APIs:
- `src/app/api/changelog/route.ts` (grouped by version/date)

## BƯỚC 2: TẠO ADMIN UI

Tạo file: `src/app/(admin)/system-admin/changelog/page.tsx`

Components:
- `src/components/admin/cms/changelog/ChangelogTypesManager.tsx`
  - Color picker
  - Icon select
  
- `src/components/admin/cms/changelog/ChangelogEntriesManager.tsx`
  - Filter by type, version
  - Group by release date
  
- `src/components/admin/cms/changelog/ChangelogEntryForm.tsx`
  - Type select (with color indicator)
  - Version field
  - Release date picker
  - is_major toggle
  - Title, description, content

## BƯỚC 3: CẬP NHẬT SIDEBAR

Thêm "Changelog" với icon History

## OUTPUT MONG ĐỢI
- [ ] Change types với color coding
- [ ] Entries grouped by version
- [ ] Major release highlighting
- [ ] Admin UI tại /system-admin/changelog
```

---

# 📋 PROMPT 6/8: PRESS CMS

```
# IMPLEMENT PRESS CMS

## CONTEXT
Database tables đã có:
- cms_press_releases
- cms_news_coverage
- cms_press_kit

## NHIỆM VỤ
Tạo Press & News CMS.

## BƯỚC 1: TẠO API ROUTES

### Admin APIs:
- `src/app/api/admin/cms/press/releases/route.ts`
- `src/app/api/admin/cms/press/releases/[id]/route.ts`
- `src/app/api/admin/cms/press/coverage/route.ts`
- `src/app/api/admin/cms/press/coverage/[id]/route.ts`
- `src/app/api/admin/cms/press/kit/route.ts`
- `src/app/api/admin/cms/press/kit/[id]/route.ts`

### Public APIs:
- `src/app/api/press/route.ts`

## BƯỚC 2: TẠO ADMIN UI

Tạo file: `src/app/(admin)/system-admin/press/page.tsx`

Components:
- `src/components/admin/cms/press/PressReleasesManager.tsx`
- `src/components/admin/cms/press/NewsCoverageManager.tsx`
  - External article URL
  - Source name & logo
  
- `src/components/admin/cms/press/PressKitManager.tsx`
  - File upload (logos, brand assets)
  - File type indicator

## BƯỚC 3: CẬP NHẬT SIDEBAR

Thêm "Press" với icon Newspaper

## OUTPUT MONG ĐỢI
- [ ] Press releases management
- [ ] External news coverage curation
- [ ] Press kit file management
- [ ] Admin UI tại /system-admin/press
```

---

# 📋 PROMPT 7/8: CAREERS CMS

```
# IMPLEMENT CAREERS CMS

## CONTEXT
Database tables đã có:
- cms_departments (6 departments)
- cms_job_listings
- cms_job_applications

## NHIỆM VỤ
Tạo Careers/Jobs CMS.

## BƯỚC 1: TẠO API ROUTES

### Admin APIs:
- `src/app/api/admin/cms/careers/departments/route.ts`
- `src/app/api/admin/cms/careers/departments/[id]/route.ts`
- `src/app/api/admin/cms/careers/jobs/route.ts`
- `src/app/api/admin/cms/careers/jobs/[id]/route.ts`
- `src/app/api/admin/cms/careers/applications/route.ts`
- `src/app/api/admin/cms/careers/applications/[id]/route.ts`

### Public APIs:
- `src/app/api/careers/route.ts` (list jobs by department)
- `src/app/api/careers/[slug]/route.ts` (single job)
- `src/app/api/careers/apply/route.ts` (POST - submit application)

## BƯỚC 2: TẠO ADMIN UI

Tạo file: `src/app/(admin)/system-admin/careers/page.tsx`

Components:
- `src/components/admin/cms/careers/DepartmentsManager.tsx`

- `src/components/admin/cms/careers/JobListingsManager.tsx`
  - Filter by department, status
  - Expired jobs indicator
  
- `src/components/admin/cms/careers/JobForm.tsx`
  - Department select
  - Location, employment type, experience level
  - Salary range (optional)
  - Description, requirements, benefits (Markdown)
  - Expiration date picker
  
- `src/components/admin/cms/careers/ApplicationsManager.tsx`
  - Status workflow (new → reviewing → interviewed → offered → hired/rejected)
  - Resume download link
  - Notes field

## BƯỚC 3: CẬP NHẬT SIDEBAR

Thêm "Careers" với icon Briefcase

## OUTPUT MONG ĐỢI
- [ ] Departments management
- [ ] Job listings với expiration
- [ ] Applications tracking với status workflow
- [ ] Public apply API
- [ ] Admin UI tại /system-admin/careers
```

---

# 📋 PROMPT 8/8: SDKs CMS

```
# IMPLEMENT SDKs CMS

## CONTEXT
Database tables đã có:
- cms_sdks (5 SDKs)
- cms_sdk_examples

## NHIỆM VỤ
Tạo SDK Documentation CMS.

## BƯỚC 1: TẠO API ROUTES

### Admin APIs:
- `src/app/api/admin/cms/sdks/route.ts`
- `src/app/api/admin/cms/sdks/[id]/route.ts`
- `src/app/api/admin/cms/sdks/[id]/examples/route.ts`
- `src/app/api/admin/cms/sdks/examples/[id]/route.ts`

### Public APIs:
- `src/app/api/sdks/route.ts`
- `src/app/api/sdks/[slug]/route.ts`

## BƯỚC 2: TẠO ADMIN UI

Tạo file: `src/app/(admin)/system-admin/sdks/page.tsx`

Components:
- `src/components/admin/cms/sdks/SDKsManager.tsx`
  - Language indicator
  - Version display
  - GitHub/npm/pypi links
  
- `src/components/admin/cms/sdks/SDKForm.tsx`
  - Name, language
  - GitHub URL, npm/pypi package names
  - Current version
  - Installation instructions (Markdown)
  - Quickstart guide (Markdown)
  
- `src/components/admin/cms/sdks/SDKExamplesManager.tsx`
  - Code editor với syntax highlighting
  - Language select for highlighting
  - Reorder examples

## BƯỚC 3: CẬP NHẬT SIDEBAR

Thêm "SDKs" với icon Code

## OUTPUT MONG ĐỢI
- [ ] SDKs với version tracking
- [ ] Code examples với syntax highlighting
- [ ] Package manager links
- [ ] Admin UI tại /system-admin/sdks
```

---

# ✅ FINAL PROMPT: SIDEBAR NAVIGATION UPDATE

```
# UPDATE SYSTEM ADMIN SIDEBAR

## NHIỆM VỤ
Cập nhật sidebar navigation của system-admin để bao gồm tất cả CMS sections.

## CẬP NHẬT FILE
Tìm file sidebar component (có thể là `src/components/admin/Sidebar.tsx` hoặc tương tự)

## NAVIGATION STRUCTURE

```typescript
const cmsNavItems = [
  {
    title: 'Content',
    href: '/system-admin/content',
    icon: FileText,
    description: 'Static pages, footer links'
  },
  {
    title: 'Blog',
    href: '/system-admin/blog',
    icon: Newspaper,
    description: 'Blog posts, categories, tags'
  },
  {
    title: 'Docs',
    href: '/system-admin/docs',
    icon: BookOpen,
    description: 'Documentation articles'
  },
  {
    title: 'Tutorials',
    href: '/system-admin/tutorials',
    icon: PlayCircle,
    description: 'Video tutorials'
  },
  {
    title: 'Changelog',
    href: '/system-admin/changelog',
    icon: History,
    description: 'Release notes'
  },
  {
    title: 'Press',
    href: '/system-admin/press',
    icon: Megaphone,
    description: 'Press releases, news'
  },
  {
    title: 'Careers',
    href: '/system-admin/careers',
    icon: Briefcase,
    description: 'Job listings, applications'
  },
  {
    title: 'SDKs',
    href: '/system-admin/sdks',
    icon: Code,
    description: 'SDK documentation'
  }
];
```

## OUTPUT MONG ĐỢI
- [ ] Sidebar có đủ 8 CMS sections
- [ ] Icons hiển thị đúng
- [ ] Active state khi đang ở trang tương ứng
- [ ] Hover states
```

---

# 📊 TỔNG KẾT

| Prompt | CMS System | API Routes | Admin UI |
|--------|------------|------------|----------|
| 1 | Landing (Static + Footer) | 4 files | 3 components |
| 2 | Blog | 8 files | 5 components |
| 3 | Docs | 6 files | 3 components |
| 4 | Tutorials | 6 files | 4 components |
| 5 | Changelog | 4 files | 3 components |
| 6 | Press | 8 files | 3 components |
| 7 | Careers | 8 files | 4 components |
| 8 | SDKs | 6 files | 3 components |
| Final | Sidebar | - | 1 update |

**Tổng: ~50 API route files + ~28 components**

---

# 🚀 THỨ TỰ THỰC HIỆN ĐỀ XUẤT

1. **Prompt 1** - Landing CMS (foundation, thiết lập pattern)
2. **Prompt 2** - Blog CMS (phức tạp nhất, cần hoàn thành sớm)
3. **Prompt 3** - Docs CMS
4. **Prompt 4** - Tutorials CMS
5. **Prompt 5** - Changelog CMS
6. **Prompt 6** - Press CMS
7. **Prompt 7** - Careers CMS
8. **Prompt 8** - SDKs CMS
9. **Final Prompt** - Sidebar update

**Mỗi prompt hoàn thành sẽ cho ra một CMS section hoạt động độc lập!**
