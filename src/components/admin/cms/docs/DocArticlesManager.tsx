'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Search, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface DocCategory {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  icon: string | null;
}

interface DocArticle {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  content_en: string;
  content_vi: string;
  excerpt_en: string | null;
  excerpt_vi: string | null;
  meta_description_en: string | null;
  meta_description_vi: string | null;
  reading_time: number;
  sort_order: number;
  is_published: boolean;
  is_featured: boolean;
  category_id: string | null;
  category: DocCategory | null;
}

export function DocArticlesManager() {
  const [articles, setArticles] = useState<DocArticle[]>([]);
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<DocArticle | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    slug: '',
    title_en: '',
    title_vi: '',
    content_en: '',
    content_vi: '',
    excerpt_en: '',
    excerpt_vi: '',
    meta_description_en: '',
    meta_description_vi: '',
    sort_order: 0,
    is_published: true,
    is_featured: false,
    category_id: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/cms/docs/articles'),
        fetch('/api/admin/cms/docs/categories')
      ]);

      if (articlesRes.ok) setArticles(await articlesRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      slug: '',
      title_en: '',
      title_vi: '',
      content_en: '',
      content_vi: '',
      excerpt_en: '',
      excerpt_vi: '',
      meta_description_en: '',
      meta_description_vi: '',
      sort_order: articles.length,
      is_published: true,
      is_featured: false,
      category_id: '',
    });
    setEditingArticle(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (article: DocArticle) => {
    setEditingArticle(article);
    setFormData({
      slug: article.slug,
      title_en: article.title_en,
      title_vi: article.title_vi,
      content_en: article.content_en,
      content_vi: article.content_vi,
      excerpt_en: article.excerpt_en || '',
      excerpt_vi: article.excerpt_vi || '',
      meta_description_en: article.meta_description_en || '',
      meta_description_vi: article.meta_description_vi || '',
      sort_order: article.sort_order,
      is_published: article.is_published,
      is_featured: article.is_featured,
      category_id: article.category_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingArticle
        ? `/api/admin/cms/docs/articles/${editingArticle.id}`
        : '/api/admin/cms/docs/articles';
      const method = editingArticle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id || null,
        }),
      });

      if (res.ok) {
        toast.success(editingArticle ? 'Article updated' : 'Article created');
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save article');
      }
    } catch (error) {
      toast.error('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const res = await fetch(`/api/admin/cms/docs/articles/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Article deleted');
        fetchData();
      } else {
        toast.error('Failed to delete article');
      }
    } catch (error) {
      toast.error('Failed to delete article');
    }
  };

  const togglePublished = async (article: DocArticle) => {
    try {
      const res = await fetch(`/api/admin/cms/docs/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !article.is_published }),
      });

      if (res.ok) {
        toast.success(article.is_published ? 'Article unpublished' : 'Article published');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update article');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const filteredArticles = articles.filter((article) => {
    if (filterCategory !== 'all' && article.category_id !== filterCategory) return false;
    if (searchQuery && !article.title_en.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Doc Articles ({filteredArticles.length})</CardTitle>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Article
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reading Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>{article.sort_order}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{article.title_en}</p>
                      <p className="text-sm text-gray-500">{article.title_vi}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {article.category && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {article.category.name_en}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      {article.reading_time} min
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublished(article)}
                      className={article.is_published ? 'text-green-600' : 'text-gray-400'}
                    >
                      {article.is_published ? (
                        <><Eye className="h-4 w-4 mr-1" /> Published</>
                      ) : (
                        <><EyeOff className="h-4 w-4 mr-1" /> Draft</>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(article)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(article.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredArticles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No articles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Article Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                      slug: !editingArticle ? generateSlug(e.target.value) : formData.slug
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
                      <SelectItem key={cat.id} value={cat.id}>{cat.name_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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

            <div className="flex items-center gap-6">
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-24"
                />
              </div>
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
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingArticle ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
