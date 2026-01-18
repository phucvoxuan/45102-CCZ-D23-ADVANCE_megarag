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
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Search, Clock, Play } from 'lucide-react';
import { toast } from 'sonner';

interface TutorialLevel { id: string; slug: string; name_en: string; name_vi: string; color: string; }
interface TutorialTopic { id: string; slug: string; name_en: string; name_vi: string; icon: string | null; }
interface Tutorial {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  description_en: string | null;
  description_vi: string | null;
  content_en: string;
  content_vi: string;
  thumbnail_url: string | null;
  video_url: string | null;
  duration_minutes: number;
  reading_time: number;
  view_count: number;
  sort_order: number;
  is_published: boolean;
  is_featured: boolean;
  level_id: string | null;
  topic_id: string | null;
  level: TutorialLevel | null;
  topic: TutorialTopic | null;
}

export function TutorialsManager() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [levels, setLevels] = useState<TutorialLevel[]>([]);
  const [topics, setTopics] = useState<TutorialTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    slug: '', title_en: '', title_vi: '', description_en: '', description_vi: '',
    content_en: '', content_vi: '', thumbnail_url: '', video_url: '',
    duration_minutes: 10, sort_order: 0, is_published: true, is_featured: false,
    level_id: '', topic_id: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [tutorialsRes, levelsRes, topicsRes] = await Promise.all([
        fetch('/api/admin/cms/tutorials'),
        fetch('/api/admin/cms/tutorials/levels'),
        fetch('/api/admin/cms/tutorials/topics')
      ]);
      if (tutorialsRes.ok) setTutorials(await tutorialsRes.json());
      if (levelsRes.ok) setLevels(await levelsRes.json());
      if (topicsRes.ok) setTopics(await topicsRes.json());
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
      content_en: '', content_vi: '', thumbnail_url: '', video_url: '',
      duration_minutes: 10, sort_order: tutorials.length, is_published: true, is_featured: false,
      level_id: '', topic_id: '',
    });
    setEditingTutorial(null);
  };

  const openCreateDialog = () => { resetForm(); setIsDialogOpen(true); };

  const openEditDialog = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setFormData({
      slug: tutorial.slug, title_en: tutorial.title_en, title_vi: tutorial.title_vi,
      description_en: tutorial.description_en || '', description_vi: tutorial.description_vi || '',
      content_en: tutorial.content_en, content_vi: tutorial.content_vi,
      thumbnail_url: tutorial.thumbnail_url || '', video_url: tutorial.video_url || '',
      duration_minutes: tutorial.duration_minutes, sort_order: tutorial.sort_order,
      is_published: tutorial.is_published, is_featured: tutorial.is_featured,
      level_id: tutorial.level_id || '', topic_id: tutorial.topic_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingTutorial ? `/api/admin/cms/tutorials/${editingTutorial.id}` : '/api/admin/cms/tutorials';
      const method = editingTutorial ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, level_id: formData.level_id || null, topic_id: formData.topic_id || null }),
      });
      if (res.ok) {
        toast.success(editingTutorial ? 'Tutorial updated' : 'Tutorial created');
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error('Failed to save tutorial');
      }
    } catch (error) {
      toast.error('Failed to save tutorial');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/cms/tutorials/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Tutorial deleted'); fetchData(); }
    } catch (error) { toast.error('Failed to delete'); }
  };

  const togglePublished = async (tutorial: Tutorial) => {
    try {
      await fetch(`/api/admin/cms/tutorials/${tutorial.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !tutorial.is_published }),
      });
      toast.success(tutorial.is_published ? 'Unpublished' : 'Published');
      fetchData();
    } catch (error) { toast.error('Failed to update'); }
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const filteredTutorials = tutorials.filter((t) => {
    if (filterTopic !== 'all' && t.topic_id !== filterTopic) return false;
    if (searchQuery && !t.title_en.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tutorials ({filteredTutorials.length})</CardTitle>
          <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />New Tutorial</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterTopic} onValueChange={setFilterTopic}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Topic" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name_en}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTutorials.map((tutorial) => (
                <TableRow key={tutorial.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tutorial.video_url && <Play className="h-4 w-4 text-blue-500" />}
                      <div>
                        <p className="font-medium">{tutorial.title_en}</p>
                        <p className="text-sm text-gray-500">{tutorial.title_vi}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tutorial.level && (
                      <span className="px-2 py-1 rounded text-xs text-white" style={{ backgroundColor: tutorial.level.color }}>
                        {tutorial.level.name_en}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{tutorial.topic?.name_en}</TableCell>
                  <TableCell><Clock className="inline h-3 w-3 mr-1" />{tutorial.duration_minutes}m</TableCell>
                  <TableCell>{tutorial.view_count}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => togglePublished(tutorial)} className={tutorial.is_published ? 'text-green-600' : 'text-gray-400'}>
                      {tutorial.is_published ? <><Eye className="h-4 w-4 mr-1" />Published</> : <><EyeOff className="h-4 w-4 mr-1" />Draft</>}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(tutorial)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(tutorial.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingTutorial ? 'Edit Tutorial' : 'Create Tutorial'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title (EN)</Label><Input value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value, slug: !editingTutorial ? generateSlug(e.target.value) : formData.slug })} required /></div>
              <div><Label>Title (VI)</Label><Input value={formData.title_vi} onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required /></div>
              <div>
                <Label>Level</Label>
                <Select value={formData.level_id || 'none'} onValueChange={(value) => setFormData({ ...formData, level_id: value === 'none' ? '' : value })}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {levels.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name_en}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Topic</Label>
                <Select value={formData.topic_id || 'none'} onValueChange={(value) => setFormData({ ...formData, topic_id: value === 'none' ? '' : value })}>
                  <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {topics.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name_en}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Video URL</Label><Input value={formData.video_url} onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} placeholder="YouTube/Vimeo URL" /></div>
              <div><Label>Thumbnail URL</Label><Input value={formData.thumbnail_url} onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })} /></div>
            </div>
            <div><Label>Duration (minutes)</Label><Input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })} className="w-32" /></div>
            <Tabs defaultValue="en">
              <TabsList><TabsTrigger value="en">English</TabsTrigger><TabsTrigger value="vi">Vietnamese</TabsTrigger></TabsList>
              <TabsContent value="en" className="space-y-4">
                <div><Label>Description (EN)</Label><Textarea value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} rows={2} /></div>
                <div><Label>Content (EN)</Label><Textarea value={formData.content_en} onChange={(e) => setFormData({ ...formData, content_en: e.target.value })} rows={10} className="font-mono" required /></div>
              </TabsContent>
              <TabsContent value="vi" className="space-y-4">
                <div><Label>Description (VI)</Label><Textarea value={formData.description_vi} onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })} rows={2} /></div>
                <div><Label>Content (VI)</Label><Textarea value={formData.content_vi} onChange={(e) => setFormData({ ...formData, content_vi: e.target.value })} rows={10} className="font-mono" required /></div>
              </TabsContent>
            </Tabs>
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2"><Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} /><Label>Published</Label></div>
              <div className="flex items-center space-x-2"><Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} /><Label>Featured</Label></div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingTutorial ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
