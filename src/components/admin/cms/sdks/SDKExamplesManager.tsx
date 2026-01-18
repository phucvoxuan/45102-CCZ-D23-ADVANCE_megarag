'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Search, Code, Star } from 'lucide-react';
import { toast } from 'sonner';

interface SDK { id: string; slug: string; name: string; language: string; }
interface SDKExample {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  description_en: string | null;
  description_vi: string | null;
  code: string;
  sort_order: number;
  is_published: boolean;
  is_featured: boolean;
  sdk_id: string;
  sdk: SDK | null;
}

export function SDKExamplesManager() {
  const [examples, setExamples] = useState<SDKExample[]>([]);
  const [sdks, setSDKs] = useState<SDK[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExample, setEditingExample] = useState<SDKExample | null>(null);
  const [filterSDK, setFilterSDK] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    slug: '', title_en: '', title_vi: '', description_en: '', description_vi: '',
    code: '', sort_order: 0, is_published: true, is_featured: false, sdk_id: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [examplesRes, sdksRes] = await Promise.all([
        fetch('/api/admin/cms/sdks/examples'),
        fetch('/api/admin/cms/sdks')
      ]);
      if (examplesRes.ok) setExamples(await examplesRes.json());
      if (sdksRes.ok) setSDKs(await sdksRes.json());
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormData({
      slug: '', title_en: '', title_vi: '', description_en: '', description_vi: '',
      code: '', sort_order: examples.length, is_published: true, is_featured: false, sdk_id: '',
    });
    setEditingExample(null);
  };

  const openCreateDialog = () => { resetForm(); setIsDialogOpen(true); };

  const openEditDialog = (example: SDKExample) => {
    setEditingExample(example);
    setFormData({
      slug: example.slug, title_en: example.title_en, title_vi: example.title_vi,
      description_en: example.description_en || '', description_vi: example.description_vi || '',
      code: example.code, sort_order: example.sort_order,
      is_published: example.is_published, is_featured: example.is_featured,
      sdk_id: example.sdk_id,
    });
    setIsDialogOpen(true);
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sdk_id) {
      toast.error('Please select an SDK');
      return;
    }
    setSaving(true);
    try {
      const url = editingExample ? `/api/admin/cms/sdks/examples/${editingExample.id}` : '/api/admin/cms/sdks/examples';
      const method = editingExample ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          description_en: formData.description_en || null,
          description_vi: formData.description_vi || null,
        }),
      });
      if (res.ok) {
        toast.success(editingExample ? 'Example updated' : 'Example created');
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error('Failed to save example');
      }
    } catch (error) {
      toast.error('Failed to save example');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/cms/sdks/examples/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Example deleted'); fetchData(); }
    } catch (error) { toast.error('Failed to delete'); }
  };

  const togglePublished = async (example: SDKExample) => {
    try {
      await fetch(`/api/admin/cms/sdks/examples/${example.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !example.is_published }),
      });
      toast.success(example.is_published ? 'Unpublished' : 'Published');
      fetchData();
    } catch (error) { toast.error('Failed to update'); }
  };

  const filteredExamples = examples.filter((e) => {
    if (filterSDK !== 'all' && e.sdk_id !== filterSDK) return false;
    if (searchQuery && !e.title_en.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>SDK Examples ({filteredExamples.length})</CardTitle>
          <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />New Example</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search examples..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterSDK} onValueChange={setFilterSDK}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="SDK" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SDKs</SelectItem>
                {sdks.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>SDK</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExamples.map((example) => (
                <TableRow key={example.id}>
                  <TableCell>{example.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{example.title_en}</p>
                        <p className="text-sm text-gray-500">{example.title_vi}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><span className="px-2 py-1 bg-gray-100 rounded text-sm">{example.sdk?.name}</span></TableCell>
                  <TableCell>{example.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => togglePublished(example)} className={example.is_published ? 'text-green-600' : 'text-gray-400'}>
                      {example.is_published ? <><Eye className="h-4 w-4 mr-1" />Published</> : <><EyeOff className="h-4 w-4 mr-1" />Draft</>}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(example)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(example.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingExample ? 'Edit Example' : 'Create Example'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Title (EN)</Label><Input value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value, slug: !editingExample ? generateSlug(e.target.value) : formData.slug })} required /></div>
              <div><Label>Title (VI)</Label><Input value={formData.title_vi} onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })} required /></div>
              <div>
                <Label>SDK</Label>
                <Select value={formData.sdk_id} onValueChange={(value) => setFormData({ ...formData, sdk_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select SDK" /></SelectTrigger>
                  <SelectContent>
                    {sdks.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Description (EN)</Label><Textarea value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} rows={2} /></div>
              <div><Label>Description (VI)</Label><Textarea value={formData.description_vi} onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })} rows={2} /></div>
            </div>
            <div>
              <Label>Code</Label>
              <Textarea value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} rows={15} className="font-mono text-sm" placeholder="// Your code example here..." required />
            </div>
            <div className="flex items-center gap-6">
              <div><Label>Sort Order</Label><Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="w-24" /></div>
              <div className="flex items-center space-x-2"><Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} /><Label>Published</Label></div>
              <div className="flex items-center space-x-2"><Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} /><Label>Featured</Label></div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingExample ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
