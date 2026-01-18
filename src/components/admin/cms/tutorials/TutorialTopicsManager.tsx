'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TutorialTopic {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

const ICONS = ['Rocket', 'FileText', 'Search', 'Network', 'Code', 'CheckCircle', 'Database', 'Server', 'Cloud', 'Zap'];

export function TutorialTopicsManager() {
  const [topics, setTopics] = useState<TutorialTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TutorialTopic | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name_en: '',
    name_vi: '',
    icon: 'FileText',
    sort_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/admin/cms/tutorials/topics');
      if (res.ok) setTopics(await res.json());
    } catch (error) {
      toast.error('Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTopics(); }, []);

  const resetForm = () => {
    setFormData({ slug: '', name_en: '', name_vi: '', icon: 'FileText', sort_order: topics.length, is_active: true });
    setEditingTopic(null);
  };

  const openEditDialog = (topic: TutorialTopic) => {
    setEditingTopic(topic);
    setFormData({
      slug: topic.slug,
      name_en: topic.name_en,
      name_vi: topic.name_vi,
      icon: topic.icon || 'FileText',
      sort_order: topic.sort_order,
      is_active: topic.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/cms/tutorials/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingTopic ? 'Topic updated' : 'Topic created');
        setIsDialogOpen(false);
        resetForm();
        fetchTopics();
      } else {
        toast.error('Failed to save topic');
      }
    } catch (error) {
      toast.error('Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tutorial Topics</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Add Topic</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTopic ? 'Edit Topic' : 'Create Topic'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name (EN)</Label>
                  <Input value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required />
                </div>
                <div>
                  <Label>Name (VI)</Label>
                  <Input value={formData.name_vi} onChange={(e) => setFormData({ ...formData, name_vi: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Slug</Label>
                  <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
                </div>
                <div>
                  <Label>Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICONS.map((icon) => (<SelectItem key={icon} value={icon}>{icon}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTopic ? 'Update' : 'Create'}
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
              <TableHead>#</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (VI)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((topic) => (
              <TableRow key={topic.id}>
                <TableCell>{topic.sort_order}</TableCell>
                <TableCell className="font-mono text-sm">{topic.icon}</TableCell>
                <TableCell className="font-medium">{topic.name_en}</TableCell>
                <TableCell>{topic.name_vi}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${topic.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {topic.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(topic)}><Pencil className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
