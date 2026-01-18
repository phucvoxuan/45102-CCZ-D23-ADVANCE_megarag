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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Department {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  description_en: string | null;
  description_vi: string | null;
  sort_order: number;
  is_active: boolean;
}

export function DepartmentsManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    slug: '', name_en: '', name_vi: '', description_en: '', description_vi: '',
    sort_order: 0, is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/admin/cms/careers/departments');
      if (res.ok) setDepartments(await res.json());
    } catch (error) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const resetForm = () => {
    setFormData({ slug: '', name_en: '', name_vi: '', description_en: '', description_vi: '', sort_order: departments.length, is_active: true });
    setEditingDept(null);
  };

  const openEditDialog = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      slug: dept.slug, name_en: dept.name_en, name_vi: dept.name_vi,
      description_en: dept.description_en || '', description_vi: dept.description_vi || '',
      sort_order: dept.sort_order, is_active: dept.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/cms/careers/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          description_en: formData.description_en || null,
          description_vi: formData.description_vi || null,
        }),
      });
      if (res.ok) {
        toast.success(editingDept ? 'Department updated' : 'Department created');
        setIsDialogOpen(false);
        resetForm();
        fetchDepartments();
      } else {
        toast.error('Failed to save department');
      }
    } catch (error) {
      toast.error('Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Departments</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Add Department</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name (EN)</Label><Input value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required /></div>
                <div><Label>Name (VI)</Label><Input value={formData.name_vi} onChange={(e) => setFormData({ ...formData, name_vi: e.target.value })} required /></div>
              </div>
              <div><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Description (EN)</Label><Textarea value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} rows={2} /></div>
                <div><Label>Description (VI)</Label><Textarea value={formData.description_vi} onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })} rows={2} /></div>
              </div>
              <div className="flex items-center gap-4">
                <div><Label>Sort Order</Label><Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="w-24" /></div>
                <div className="flex items-center space-x-2"><Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} /><Label>Active</Label></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingDept ? 'Update' : 'Create'}</Button>
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
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (VI)</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell>{dept.sort_order}</TableCell>
                <TableCell className="font-medium">{dept.name_en}</TableCell>
                <TableCell>{dept.name_vi}</TableCell>
                <TableCell className="font-mono text-sm">{dept.slug}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${dept.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {dept.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(dept)}><Pencil className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
