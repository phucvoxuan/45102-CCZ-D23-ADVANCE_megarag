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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StaticPage {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  content_en: string;
  content_vi: string;
  meta_description_en: string | null;
  meta_description_vi: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function StaticPagesManager() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    title_en: '',
    title_vi: '',
    content_en: '',
    content_vi: '',
    meta_description_en: '',
    meta_description_vi: '',
    is_published: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/admin/cms/static-pages');
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (error) {
      toast.error('Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const resetForm = () => {
    setFormData({
      slug: '',
      title_en: '',
      title_vi: '',
      content_en: '',
      content_vi: '',
      meta_description_en: '',
      meta_description_vi: '',
      is_published: true,
    });
    setEditingPage(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (page: StaticPage) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title_en: page.title_en,
      title_vi: page.title_vi,
      content_en: page.content_en,
      content_vi: page.content_vi,
      meta_description_en: page.meta_description_en || '',
      meta_description_vi: page.meta_description_vi || '',
      is_published: page.is_published,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingPage
        ? `/api/admin/cms/static-pages/${editingPage.id}`
        : '/api/admin/cms/static-pages';
      const method = editingPage ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingPage ? 'Page updated' : 'Page created');
        setIsDialogOpen(false);
        resetForm();
        fetchPages();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save page');
      }
    } catch (error) {
      toast.error('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const res = await fetch(`/api/admin/cms/static-pages/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Page deleted');
        fetchPages();
      } else {
        toast.error('Failed to delete page');
      }
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  const togglePublished = async (page: StaticPage) => {
    try {
      const res = await fetch(`/api/admin/cms/static-pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !page.is_published }),
      });

      if (res.ok) {
        toast.success(page.is_published ? 'Page unpublished' : 'Page published');
        fetchPages();
      }
    } catch (error) {
      toast.error('Failed to update page');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Static Pages</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPage ? 'Edit Page' : 'Create New Page'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="page-slug"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Published</Label>
                </div>
              </div>

              <Tabs defaultValue="en" className="w-full">
                <TabsList>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="vi">Vietnamese</TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="space-y-4">
                  <div>
                    <Label htmlFor="title_en">Title (EN)</Label>
                    <Input
                      id="title_en"
                      value={formData.title_en}
                      onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="meta_description_en">Meta Description (EN)</Label>
                    <Input
                      id="meta_description_en"
                      value={formData.meta_description_en}
                      onChange={(e) => setFormData({ ...formData, meta_description_en: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="content_en">Content (EN) - Markdown</Label>
                    <Textarea
                      id="content_en"
                      value={formData.content_en}
                      onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                      rows={12}
                      className="font-mono"
                      required
                    />
                  </div>
                </TabsContent>

                <TabsContent value="vi" className="space-y-4">
                  <div>
                    <Label htmlFor="title_vi">Title (VI)</Label>
                    <Input
                      id="title_vi"
                      value={formData.title_vi}
                      onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="meta_description_vi">Meta Description (VI)</Label>
                    <Input
                      id="meta_description_vi"
                      value={formData.meta_description_vi}
                      onChange={(e) => setFormData({ ...formData, meta_description_vi: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="content_vi">Content (VI) - Markdown</Label>
                    <Textarea
                      id="content_vi"
                      value={formData.content_vi}
                      onChange={(e) => setFormData({ ...formData, content_vi: e.target.value })}
                      rows={12}
                      className="font-mono"
                      required
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPage ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Title (EN)</TableHead>
              <TableHead>Title (VI)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-mono text-sm">{page.slug}</TableCell>
                <TableCell>{page.title_en}</TableCell>
                <TableCell>{page.title_vi}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublished(page)}
                    className={page.is_published ? 'text-green-600' : 'text-gray-400'}
                  >
                    {page.is_published ? (
                      <><Eye className="h-4 w-4 mr-1" /> Published</>
                    ) : (
                      <><EyeOff className="h-4 w-4 mr-1" /> Draft</>
                    )}
                  </Button>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(page.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(page)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(page.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {pages.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No pages found. Create your first page!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
