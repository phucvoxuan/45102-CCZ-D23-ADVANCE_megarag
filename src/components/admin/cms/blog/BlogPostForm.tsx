'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface BlogCategory {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  color: string;
}

interface BlogTag {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  excerpt_en: string | null;
  excerpt_vi: string | null;
  content_en: string;
  content_vi: string;
  featured_image_url: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  reading_time: number;
  is_published: boolean;
  is_featured: boolean;
  category_id: string | null;
  tags: BlogTag[];
}

interface Props {
  post: BlogPost | null;
  categories: BlogCategory[];
  tags: BlogTag[];
  onSaved: () => void;
  onCancel: () => void;
}

export function BlogPostForm({ post, categories, tags, onSaved, onCancel }: Props) {
  const [formData, setFormData] = useState({
    slug: post?.slug || '',
    title_en: post?.title_en || '',
    title_vi: post?.title_vi || '',
    excerpt_en: post?.excerpt_en || '',
    excerpt_vi: post?.excerpt_vi || '',
    content_en: post?.content_en || '',
    content_vi: post?.content_vi || '',
    featured_image_url: post?.featured_image_url || '',
    author_name: post?.author_name || '',
    author_avatar_url: post?.author_avatar_url || '',
    reading_time: post?.reading_time || 5,
    is_published: post?.is_published || false,
    is_featured: post?.is_featured || false,
    category_id: post?.category_id || '',
    tags: post?.tags?.map(t => t.id) || [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const calculateReadingTime = (content: string) => {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('folder', 'blog');

    try {
      const res = await fetch('/api/admin/cms/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setFormData({ ...formData, featured_image_url: url });
        toast.success('Image uploaded');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to upload image');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = post
        ? `/api/admin/cms/blog/posts/${post.id}`
        : '/api/admin/cms/blog/posts';
      const method = post ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        category_id: formData.category_id || null,
        reading_time: calculateReadingTime(formData.content_en),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(post ? 'Post updated' : 'Post created');
        onSaved();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save post');
      }
    } catch (error) {
      toast.error('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    const newTags = formData.tags.includes(tagId)
      ? formData.tags.filter(id => id !== tagId)
      : [...formData.tags, tagId];
    setFormData({ ...formData, tags: newTags });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title_en">Title (EN)</Label>
          <Input
            id="title_en"
            value={formData.title_en}
            onChange={(e) => {
              setFormData({
                ...formData,
                title_en: e.target.value,
                slug: !post ? generateSlug(e.target.value) : formData.slug
              });
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="title_vi">Title (VI)</Label>
          <Input
            id="title_vi"
            value={formData.title_vi}
            onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Category</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }} />
                    {cat.name_en}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                formData.tags.includes(tag.id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {tag.name_en}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Image */}
      <div>
        <Label>Featured Image</Label>
        <div className="mt-2">
          {formData.featured_image_url ? (
            <div className="relative inline-block">
              <img
                src={formData.featured_image_url}
                alt="Featured"
                className="h-32 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, featured_image_url: '' })}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Image
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Excerpt & Content */}
      <Tabs defaultValue="en" className="w-full">
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="vi">Vietnamese</TabsTrigger>
        </TabsList>

        <TabsContent value="en" className="space-y-4">
          <div>
            <Label htmlFor="excerpt_en">Excerpt (EN)</Label>
            <Textarea
              id="excerpt_en"
              value={formData.excerpt_en}
              onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })}
              rows={2}
              placeholder="Brief description for listings..."
            />
          </div>
          <div>
            <Label htmlFor="content_en">Content (EN) - Markdown</Label>
            <Textarea
              id="content_en"
              value={formData.content_en}
              onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
              rows={15}
              className="font-mono"
              required
            />
          </div>
        </TabsContent>

        <TabsContent value="vi" className="space-y-4">
          <div>
            <Label htmlFor="excerpt_vi">Excerpt (VI)</Label>
            <Textarea
              id="excerpt_vi"
              value={formData.excerpt_vi}
              onChange={(e) => setFormData({ ...formData, excerpt_vi: e.target.value })}
              rows={2}
              placeholder="Mô tả ngắn gọn..."
            />
          </div>
          <div>
            <Label htmlFor="content_vi">Content (VI) - Markdown</Label>
            <Textarea
              id="content_vi"
              value={formData.content_vi}
              onChange={(e) => setFormData({ ...formData, content_vi: e.target.value })}
              rows={15}
              className="font-mono"
              required
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Author Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="author_name">Author Name</Label>
          <Input
            id="author_name"
            value={formData.author_name}
            onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div>
          <Label htmlFor="author_avatar_url">Author Avatar URL</Label>
          <Input
            id="author_avatar_url"
            value={formData.author_avatar_url}
            onChange={(e) => setFormData({ ...formData, author_avatar_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_published"
            checked={formData.is_published}
            onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
          />
          <Label htmlFor="is_published">Published</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_featured"
            checked={formData.is_featured}
            onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
          />
          <Label htmlFor="is_featured">Featured</Label>
        </div>
        <div className="text-sm text-gray-500">
          Est. reading time: {calculateReadingTime(formData.content_en)} min
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {post ? 'Update Post' : 'Create Post'}
        </Button>
      </div>
    </form>
  );
}
