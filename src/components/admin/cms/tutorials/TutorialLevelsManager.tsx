'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TutorialLevel {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  color: string;
  sort_order: number;
}

export function TutorialLevelsManager() {
  const [levels, setLevels] = useState<TutorialLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<TutorialLevel | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name_en: '',
    name_vi: '',
    color: '#3B82F6',
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/admin/cms/tutorials/levels');
      if (res.ok) setLevels(await res.json());
    } catch (error) {
      toast.error('Failed to fetch levels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLevels(); }, []);

  const resetForm = () => {
    setFormData({ slug: '', name_en: '', name_vi: '', color: '#3B82F6', sort_order: levels.length });
    setEditingLevel(null);
  };

  const openEditDialog = (level: TutorialLevel) => {
    setEditingLevel(level);
    setFormData({
      slug: level.slug,
      name_en: level.name_en,
      name_vi: level.name_vi,
      color: level.color,
      sort_order: level.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingLevel
        ? `/api/admin/cms/tutorials/levels`
        : '/api/admin/cms/tutorials/levels';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingLevel ? 'Level updated' : 'Level created');
        setIsDialogOpen(false);
        resetForm();
        fetchLevels();
      } else {
        toast.error('Failed to save level');
      }
    } catch (error) {
      toast.error('Failed to save level');
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
        <CardTitle>Tutorial Levels</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Add Level</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLevel ? 'Edit Level' : 'Create Level'}</DialogTitle>
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
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-12 h-10 p-1" />
                    <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="flex-1" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingLevel ? 'Update' : 'Create'}
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
              <TableHead>Color</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (VI)</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.map((level) => (
              <TableRow key={level.id}>
                <TableCell>{level.sort_order}</TableCell>
                <TableCell><div className="w-6 h-6 rounded" style={{ backgroundColor: level.color }} /></TableCell>
                <TableCell className="font-medium">{level.name_en}</TableCell>
                <TableCell>{level.name_vi}</TableCell>
                <TableCell className="font-mono text-sm">{level.slug}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(level)}><Pencil className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
