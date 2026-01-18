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
import { Plus, Pencil, Trash2, Loader2, FileImage, FileArchive, FileText, Download, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface PressKitItem {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  description_en: string | null;
  description_vi: string | null;
  file_url: string;
  file_type: string;
  file_size_kb: number | null;
  thumbnail_url: string | null;
  category: string;
  sort_order: number;
  is_active: boolean;
  download_count: number;
}

const FILE_TYPES = ['ZIP', 'PDF', 'PNG', 'JPG', 'SVG', 'AI', 'EPS'];
const CATEGORIES = ['logos', 'guidelines', 'screenshots', 'documents', 'general'];

export function PressKitManager() {
  const [items, setItems] = useState<PressKitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PressKitItem | null>(null);
  const [formData, setFormData] = useState({
    slug: '', name_en: '', name_vi: '', description_en: '', description_vi: '',
    file_url: '', file_type: 'PDF', file_size_kb: 0, thumbnail_url: '',
    category: 'general', sort_order: 0, is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/cms/press/kit');
      if (res.ok) setItems(await res.json());
    } catch (error) {
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => {
    setFormData({
      slug: '', name_en: '', name_vi: '', description_en: '', description_vi: '',
      file_url: '', file_type: 'PDF', file_size_kb: 0, thumbnail_url: '',
      category: 'general', sort_order: items.length, is_active: true,
    });
    setEditingItem(null);
  };

  const openCreateDialog = () => { resetForm(); setIsDialogOpen(true); };

  const openEditDialog = (item: PressKitItem) => {
    setEditingItem(item);
    setFormData({
      slug: item.slug, name_en: item.name_en, name_vi: item.name_vi,
      description_en: item.description_en || '', description_vi: item.description_vi || '',
      file_url: item.file_url, file_type: item.file_type, file_size_kb: item.file_size_kb || 0,
      thumbnail_url: item.thumbnail_url || '', category: item.category,
      sort_order: item.sort_order, is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingItem ? `/api/admin/cms/press/kit/${editingItem.id}` : '/api/admin/cms/press/kit';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          description_en: formData.description_en || null,
          description_vi: formData.description_vi || null,
          file_size_kb: formData.file_size_kb || null,
          thumbnail_url: formData.thumbnail_url || null,
        }),
      });
      if (res.ok) {
        toast.success(editingItem ? 'Item updated' : 'Item created');
        setIsDialogOpen(false);
        resetForm();
        fetchItems();
      } else {
        toast.error('Failed to save item');
      }
    } catch (error) {
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/cms/press/kit/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Item deleted'); fetchItems(); }
    } catch (error) { toast.error('Failed to delete'); }
  };

  const toggleActive = async (item: PressKitItem) => {
    try {
      await fetch(`/api/admin/cms/press/kit/${item.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      toast.success(item.is_active ? 'Deactivated' : 'Activated');
      fetchItems();
    } catch (error) { toast.error('Failed to update'); }
  };

  const getFileIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PNG':
      case 'JPG':
      case 'SVG':
      case 'AI':
      case 'EPS':
        return <FileImage className="h-4 w-4" />;
      case 'ZIP':
        return <FileArchive className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (kb: number | null) => {
    if (!kb) return '-';
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Press Kit ({items.length})</CardTitle>
          <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />Add Item</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.sort_order}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      {getFileIcon(item.file_type)}
                      <span>{item.file_type}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name_en}</p>
                      <p className="text-sm text-gray-500">{item.name_vi}</p>
                    </div>
                  </TableCell>
                  <TableCell><span className="capitalize px-2 py-1 bg-gray-100 rounded text-sm">{item.category}</span></TableCell>
                  <TableCell>{formatFileSize(item.file_size_kb)}</TableCell>
                  <TableCell>{item.download_count || 0}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(item)} className={item.is_active ? 'text-green-600' : 'text-gray-400'}>
                      {item.is_active ? <><Eye className="h-4 w-4 mr-1" />Active</> : <><EyeOff className="h-4 w-4 mr-1" />Inactive</>}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                    </Button>
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
          <DialogHeader><DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name (EN)</Label><Input value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value, slug: !editingItem ? generateSlug(e.target.value) : formData.slug })} required /></div>
              <div><Label>Name (VI)</Label><Input value={formData.name_vi} onChange={(e) => setFormData({ ...formData, name_vi: e.target.value })} required /></div>
            </div>
            <div><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Description (EN)</Label><Textarea value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} rows={2} /></div>
              <div><Label>Description (VI)</Label><Textarea value={formData.description_vi} onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })} rows={2} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>File Type</Label>
                <Select value={formData.file_type} onValueChange={(value) => setFormData({ ...formData, file_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>File Size (KB)</Label><Input type="number" value={formData.file_size_kb} onChange={(e) => setFormData({ ...formData, file_size_kb: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>File URL</Label><Input value={formData.file_url} onChange={(e) => setFormData({ ...formData, file_url: e.target.value })} placeholder="https://..." required /></div>
            <div><Label>Thumbnail URL</Label><Input value={formData.thumbnail_url} onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })} placeholder="https://..." /></div>
            <div className="flex items-center gap-6">
              <div><Label>Sort Order</Label><Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="w-24" /></div>
              <div className="flex items-center space-x-2"><Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} /><Label>Active</Label></div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingItem ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
