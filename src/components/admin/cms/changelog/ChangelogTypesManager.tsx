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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChangelogType {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  color: string;
  icon: string | null;
  sort_order: number;
}

const ICONS = ['Sparkles', 'Bug', 'Wrench', 'Zap', 'Shield', 'Trash2', 'AlertTriangle', 'ArrowUp', 'Settings', 'Lock'];

export function ChangelogTypesManager() {
  const [types, setTypes] = useState<ChangelogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ChangelogType | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name_en: '',
    name_vi: '',
    color: '#3B82F6',
    icon: 'Sparkles',
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/admin/cms/changelog/types');
      if (res.ok) setTypes(await res.json());
    } catch (error) {
      toast.error('Failed to fetch types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const resetForm = () => {
    setFormData({ slug: '', name_en: '', name_vi: '', color: '#3B82F6', icon: 'Sparkles', sort_order: types.length });
    setEditingType(null);
  };

  const openEditDialog = (type: ChangelogType) => {
    setEditingType(type);
    setFormData({
      slug: type.slug,
      name_en: type.name_en,
      name_vi: type.name_vi,
      color: type.color,
      icon: type.icon || 'Sparkles',
      sort_order: type.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/cms/changelog/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingType ? 'Type updated' : 'Type created');
        setIsDialogOpen(false);
        resetForm();
        fetchTypes();
      } else {
        toast.error('Failed to save type');
      }
    } catch (error) {
      toast.error('Failed to save type');
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
        <CardTitle>Changelog Types</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Add Type</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? 'Edit Type' : 'Create Type'}</DialogTitle>
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
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-12 h-10 p-1" />
                  <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingType ? 'Update' : 'Create'}
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
              <TableHead>Icon</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (VI)</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((type) => (
              <TableRow key={type.id}>
                <TableCell>{type.sort_order}</TableCell>
                <TableCell><div className="w-6 h-6 rounded" style={{ backgroundColor: type.color }} /></TableCell>
                <TableCell className="font-mono text-sm">{type.icon}</TableCell>
                <TableCell className="font-medium">{type.name_en}</TableCell>
                <TableCell>{type.name_vi}</TableCell>
                <TableCell className="font-mono text-sm">{type.slug}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(type)}><Pencil className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
