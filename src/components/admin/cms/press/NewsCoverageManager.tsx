'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Search, Calendar, Star, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface NewsCoverage {
  id: string;
  publication_name: string;
  publication_logo_url: string | null;
  article_title_en: string;
  article_title_vi: string | null;
  article_url: string;
  excerpt_en: string | null;
  excerpt_vi: string | null;
  author_name: string | null;
  coverage_date: string;
  is_active: boolean;
  is_featured: boolean;
}

export function NewsCoverageManager() {
  const [coverage, setCoverage] = useState<NewsCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoverage, setEditingCoverage] = useState<NewsCoverage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    publication_name: '', publication_logo_url: '', article_title_en: '', article_title_vi: '',
    article_url: '', excerpt_en: '', excerpt_vi: '', author_name: '',
    coverage_date: new Date().toISOString().split('T')[0], is_active: true, is_featured: false,
  });
  const [saving, setSaving] = useState(false);

  const fetchCoverage = async () => {
    try {
      const res = await fetch('/api/admin/cms/press/coverage');
      if (res.ok) setCoverage(await res.json());
    } catch (error) {
      toast.error('Failed to fetch coverage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoverage(); }, []);

  const resetForm = () => {
    setFormData({
      publication_name: '', publication_logo_url: '', article_title_en: '', article_title_vi: '',
      article_url: '', excerpt_en: '', excerpt_vi: '', author_name: '',
      coverage_date: new Date().toISOString().split('T')[0], is_active: true, is_featured: false,
    });
    setEditingCoverage(null);
  };

  const openCreateDialog = () => { resetForm(); setIsDialogOpen(true); };

  const openEditDialog = (item: NewsCoverage) => {
    setEditingCoverage(item);
    setFormData({
      publication_name: item.publication_name, publication_logo_url: item.publication_logo_url || '',
      article_title_en: item.article_title_en, article_title_vi: item.article_title_vi || '',
      article_url: item.article_url, excerpt_en: item.excerpt_en || '', excerpt_vi: item.excerpt_vi || '',
      author_name: item.author_name || '',
      coverage_date: item.coverage_date.split('T')[0],
      is_active: item.is_active, is_featured: item.is_featured,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingCoverage ? `/api/admin/cms/press/coverage/${editingCoverage.id}` : '/api/admin/cms/press/coverage';
      const method = editingCoverage ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          publication_logo_url: formData.publication_logo_url || null,
          article_title_vi: formData.article_title_vi || null,
          excerpt_en: formData.excerpt_en || null,
          excerpt_vi: formData.excerpt_vi || null,
          author_name: formData.author_name || null,
        }),
      });
      if (res.ok) {
        toast.success(editingCoverage ? 'Coverage updated' : 'Coverage created');
        setIsDialogOpen(false);
        resetForm();
        fetchCoverage();
      } else {
        toast.error('Failed to save coverage');
      }
    } catch (error) {
      toast.error('Failed to save coverage');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/cms/press/coverage/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Coverage deleted'); fetchCoverage(); }
    } catch (error) { toast.error('Failed to delete'); }
  };

  const toggleActive = async (item: NewsCoverage) => {
    try {
      await fetch(`/api/admin/cms/press/coverage/${item.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      toast.success(item.is_active ? 'Deactivated' : 'Activated');
      fetchCoverage();
    } catch (error) { toast.error('Failed to update'); }
  };

  const filteredCoverage = coverage.filter((c) => {
    if (searchQuery && !c.article_title_en.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !c.publication_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>News Coverage ({filteredCoverage.length})</CardTitle>
          <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />Add Coverage</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search coverage..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Publication</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoverage.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.publication_logo_url && (
                        <img src={item.publication_logo_url} alt={item.publication_name} className="h-6 w-6 object-contain" />
                      )}
                      <span className="font-medium">{item.publication_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <a href={item.article_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-blue-600 flex items-center gap-1">
                        {item.article_title_en}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {item.article_title_vi && <p className="text-sm text-gray-500">{item.article_title_vi}</p>}
                    </div>
                  </TableCell>
                  <TableCell><Calendar className="inline h-3 w-3 mr-1" />{new Date(item.coverage_date).toLocaleDateString()}</TableCell>
                  <TableCell>{item.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(item)} className={item.is_active ? 'text-green-600' : 'text-gray-400'}>
                      {item.is_active ? <><Eye className="h-4 w-4 mr-1" />Active</> : <><EyeOff className="h-4 w-4 mr-1" />Inactive</>}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingCoverage ? 'Edit Coverage' : 'Add Coverage'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Publication Name</Label><Input value={formData.publication_name} onChange={(e) => setFormData({ ...formData, publication_name: e.target.value })} placeholder="TechCrunch" required /></div>
              <div><Label>Publication Logo URL</Label><Input value={formData.publication_logo_url} onChange={(e) => setFormData({ ...formData, publication_logo_url: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Article Title (EN)</Label><Input value={formData.article_title_en} onChange={(e) => setFormData({ ...formData, article_title_en: e.target.value })} required /></div>
              <div><Label>Article Title (VI)</Label><Input value={formData.article_title_vi} onChange={(e) => setFormData({ ...formData, article_title_vi: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Excerpt (EN)</Label><Textarea value={formData.excerpt_en} onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })} rows={2} /></div>
              <div><Label>Excerpt (VI)</Label><Textarea value={formData.excerpt_vi} onChange={(e) => setFormData({ ...formData, excerpt_vi: e.target.value })} rows={2} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Article URL</Label><Input value={formData.article_url} onChange={(e) => setFormData({ ...formData, article_url: e.target.value })} placeholder="https://..." required /></div>
              <div><Label>Author Name</Label><Input value={formData.author_name} onChange={(e) => setFormData({ ...formData, author_name: e.target.value })} placeholder="John Doe" /></div>
            </div>
            <div>
              <Label>Coverage Date</Label>
              <Input type="date" value={formData.coverage_date} onChange={(e) => setFormData({ ...formData, coverage_date: e.target.value })} required />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2"><Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} /><Label>Active</Label></div>
              <div className="flex items-center space-x-2"><Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} /><Label>Featured</Label></div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingCoverage ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
