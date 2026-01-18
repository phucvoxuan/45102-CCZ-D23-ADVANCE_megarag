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
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Search, Calendar, Star } from 'lucide-react';
import { toast } from 'sonner';

interface PressRelease {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  excerpt_en: string | null;
  excerpt_vi: string | null;
  content_en: string;
  content_vi: string;
  release_date: string;
  is_published: boolean;
  is_featured: boolean;
}

export function PressReleasesManager() {
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<PressRelease | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    slug: '', title_en: '', title_vi: '', excerpt_en: '', excerpt_vi: '',
    content_en: '', content_vi: '', release_date: new Date().toISOString().split('T')[0],
    is_published: true, is_featured: false,
  });
  const [saving, setSaving] = useState(false);

  const fetchReleases = async () => {
    try {
      const res = await fetch('/api/admin/cms/press/releases');
      if (res.ok) setReleases(await res.json());
    } catch (error) {
      toast.error('Failed to fetch releases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReleases(); }, []);

  const resetForm = () => {
    setFormData({
      slug: '', title_en: '', title_vi: '', excerpt_en: '', excerpt_vi: '',
      content_en: '', content_vi: '', release_date: new Date().toISOString().split('T')[0],
      is_published: true, is_featured: false,
    });
    setEditingRelease(null);
  };

  const openCreateDialog = () => { resetForm(); setIsDialogOpen(true); };

  const openEditDialog = (release: PressRelease) => {
    setEditingRelease(release);
    setFormData({
      slug: release.slug, title_en: release.title_en, title_vi: release.title_vi,
      excerpt_en: release.excerpt_en || '', excerpt_vi: release.excerpt_vi || '',
      content_en: release.content_en, content_vi: release.content_vi,
      release_date: release.release_date.split('T')[0],
      is_published: release.is_published, is_featured: release.is_featured,
    });
    setIsDialogOpen(true);
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingRelease ? `/api/admin/cms/press/releases/${editingRelease.id}` : '/api/admin/cms/press/releases';
      const method = editingRelease ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success(editingRelease ? 'Release updated' : 'Release created');
        setIsDialogOpen(false);
        resetForm();
        fetchReleases();
      } else {
        toast.error('Failed to save release');
      }
    } catch (error) {
      toast.error('Failed to save release');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/cms/press/releases/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Release deleted'); fetchReleases(); }
    } catch (error) { toast.error('Failed to delete'); }
  };

  const togglePublished = async (release: PressRelease) => {
    try {
      await fetch(`/api/admin/cms/press/releases/${release.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !release.is_published }),
      });
      toast.success(release.is_published ? 'Unpublished' : 'Published');
      fetchReleases();
    } catch (error) { toast.error('Failed to update'); }
  };

  const filteredReleases = releases.filter((r) => {
    if (searchQuery && !r.title_en.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Press Releases ({filteredReleases.length})</CardTitle>
          <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />New Release</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search releases..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReleases.map((release) => (
                <TableRow key={release.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{release.title_en}</p>
                      <p className="text-sm text-gray-500">{release.title_vi}</p>
                    </div>
                  </TableCell>
                  <TableCell><Calendar className="inline h-3 w-3 mr-1" />{new Date(release.release_date).toLocaleDateString()}</TableCell>
                  <TableCell>{release.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => togglePublished(release)} className={release.is_published ? 'text-green-600' : 'text-gray-400'}>
                      {release.is_published ? <><Eye className="h-4 w-4 mr-1" />Published</> : <><EyeOff className="h-4 w-4 mr-1" />Draft</>}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(release)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(release.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRelease ? 'Edit Release' : 'Create Release'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title (EN)</Label><Input value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value, slug: !editingRelease ? generateSlug(e.target.value) : formData.slug })} required /></div>
              <div><Label>Title (VI)</Label><Input value={formData.title_vi} onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required /></div>
              <div><Label>Publish Date</Label><Input type="date" value={formData.release_date} onChange={(e) => setFormData({ ...formData, release_date: e.target.value })} required /></div>
            </div>
            <Tabs defaultValue="en">
              <TabsList><TabsTrigger value="en">English</TabsTrigger><TabsTrigger value="vi">Vietnamese</TabsTrigger></TabsList>
              <TabsContent value="en" className="space-y-4">
                <div><Label>Excerpt (EN)</Label><Textarea value={formData.excerpt_en} onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })} rows={2} /></div>
                <div><Label>Content (EN)</Label><Textarea value={formData.content_en} onChange={(e) => setFormData({ ...formData, content_en: e.target.value })} rows={10} className="font-mono" required /></div>
              </TabsContent>
              <TabsContent value="vi" className="space-y-4">
                <div><Label>Excerpt (VI)</Label><Textarea value={formData.excerpt_vi} onChange={(e) => setFormData({ ...formData, excerpt_vi: e.target.value })} rows={2} /></div>
                <div><Label>Content (VI)</Label><Textarea value={formData.content_vi} onChange={(e) => setFormData({ ...formData, content_vi: e.target.value })} rows={10} className="font-mono" required /></div>
              </TabsContent>
            </Tabs>
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2"><Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} /><Label>Published</Label></div>
              <div className="flex items-center space-x-2"><Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} /><Label>Featured</Label></div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingRelease ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
