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
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Search, Calendar, Star } from 'lucide-react';
import { toast } from 'sonner';

interface ChangelogType { id: string; slug: string; name_en: string; name_vi: string; color: string; icon: string | null; }
interface ChangelogEntry {
  id: string;
  version: string;
  title_en: string;
  title_vi: string;
  content_en: string;
  content_vi: string;
  release_date: string;
  is_major: boolean;
  is_published: boolean;
  type_id: string | null;
  type: ChangelogType | null;
}

export function ChangelogEntriesManager() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [types, setTypes] = useState<ChangelogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    version: '', title_en: '', title_vi: '', content_en: '', content_vi: '',
    release_date: new Date().toISOString().split('T')[0], is_major: false, is_published: true, type_id: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [entriesRes, typesRes] = await Promise.all([
        fetch('/api/admin/cms/changelog/entries'),
        fetch('/api/admin/cms/changelog/types')
      ]);
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (typesRes.ok) setTypes(await typesRes.json());
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormData({
      version: '', title_en: '', title_vi: '', content_en: '', content_vi: '',
      release_date: new Date().toISOString().split('T')[0], is_major: false, is_published: true, type_id: '',
    });
    setEditingEntry(null);
  };

  const openCreateDialog = () => { resetForm(); setIsDialogOpen(true); };

  const openEditDialog = (entry: ChangelogEntry) => {
    setEditingEntry(entry);
    setFormData({
      version: entry.version, title_en: entry.title_en, title_vi: entry.title_vi,
      content_en: entry.content_en, content_vi: entry.content_vi,
      release_date: entry.release_date.split('T')[0], is_major: entry.is_major,
      is_published: entry.is_published, type_id: entry.type_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingEntry ? `/api/admin/cms/changelog/entries/${editingEntry.id}` : '/api/admin/cms/changelog/entries';
      const method = editingEntry ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, type_id: formData.type_id || null }),
      });
      if (res.ok) {
        toast.success(editingEntry ? 'Entry updated' : 'Entry created');
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error('Failed to save entry');
      }
    } catch (error) {
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/cms/changelog/entries/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Entry deleted'); fetchData(); }
    } catch (error) { toast.error('Failed to delete'); }
  };

  const togglePublished = async (entry: ChangelogEntry) => {
    try {
      await fetch(`/api/admin/cms/changelog/entries/${entry.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !entry.is_published }),
      });
      toast.success(entry.is_published ? 'Unpublished' : 'Published');
      fetchData();
    } catch (error) { toast.error('Failed to update'); }
  };

  const filteredEntries = entries.filter((e) => {
    if (filterType !== 'all' && e.type_id !== filterType) return false;
    if (searchQuery && !e.version.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !e.title_en.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Changelog Entries ({filteredEntries.length})</CardTitle>
          <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />New Entry</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search version or title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name_en}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Release Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {entry.is_major && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      <span className="font-mono font-medium">{entry.version}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{entry.title_en}</p>
                      <p className="text-sm text-gray-500">{entry.title_vi}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.type && (
                      <span className="px-2 py-1 rounded text-xs text-white" style={{ backgroundColor: entry.type.color }}>
                        {entry.type.name_en}
                      </span>
                    )}
                  </TableCell>
                  <TableCell><Calendar className="inline h-3 w-3 mr-1" />{new Date(entry.release_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => togglePublished(entry)} className={entry.is_published ? 'text-green-600' : 'text-gray-400'}>
                      {entry.is_published ? <><Eye className="h-4 w-4 mr-1" />Published</> : <><EyeOff className="h-4 w-4 mr-1" />Draft</>}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(entry)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingEntry ? 'Edit Entry' : 'Create Entry'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Version</Label><Input value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} placeholder="v1.0.0" required /></div>
              <div>
                <Label>Type</Label>
                <Select value={formData.type_id || 'none'} onValueChange={(value) => setFormData({ ...formData, type_id: value === 'none' ? '' : value })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {types.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name_en}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Release Date</Label><Input type="date" value={formData.release_date} onChange={(e) => setFormData({ ...formData, release_date: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title (EN)</Label><Input value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value })} required /></div>
              <div><Label>Title (VI)</Label><Input value={formData.title_vi} onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })} required /></div>
            </div>
            <Tabs defaultValue="en">
              <TabsList><TabsTrigger value="en">English</TabsTrigger><TabsTrigger value="vi">Vietnamese</TabsTrigger></TabsList>
              <TabsContent value="en" className="space-y-4">
                <div><Label>Content (EN) - Markdown</Label><Textarea value={formData.content_en} onChange={(e) => setFormData({ ...formData, content_en: e.target.value })} rows={10} className="font-mono" required /></div>
              </TabsContent>
              <TabsContent value="vi" className="space-y-4">
                <div><Label>Content (VI) - Markdown</Label><Textarea value={formData.content_vi} onChange={(e) => setFormData({ ...formData, content_vi: e.target.value })} rows={10} className="font-mono" required /></div>
              </TabsContent>
            </Tabs>
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2"><Switch checked={formData.is_major} onCheckedChange={(checked) => setFormData({ ...formData, is_major: checked })} /><Label>Major Release</Label></div>
              <div className="flex items-center space-x-2"><Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} /><Label>Published</Label></div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingEntry ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
