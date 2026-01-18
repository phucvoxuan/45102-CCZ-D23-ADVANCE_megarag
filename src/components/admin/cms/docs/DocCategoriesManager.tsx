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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocCategory {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  description_en: string | null;
  description_vi: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

const ICONS = [
  'Rocket', 'Code', 'BookOpen', 'Package', 'AlertTriangle',
  'Settings', 'FileText', 'Database', 'Globe', 'Shield',
  'Zap', 'Terminal', 'Server', 'Cloud', 'Key'
];

export function DocCategoriesManager() {
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocCategory | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name_en: '',
    name_vi: '',
    description_en: '',
    description_vi: '',
    icon: 'FileText',
    sort_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/cms/docs/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      slug: '',
      name_en: '',
      name_vi: '',
      description_en: '',
      description_vi: '',
      icon: 'FileText',
      sort_order: categories.length,
      is_active: true,
    });
    setEditingCategory(null);
  };

  const openEditDialog = (category: DocCategory) => {
    setEditingCategory(category);
    setFormData({
      slug: category.slug,
      name_en: category.name_en,
      name_vi: category.name_vi,
      description_en: category.description_en || '',
      description_vi: category.description_vi || '',
      icon: category.icon || 'FileText',
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingCategory
        ? `/api/admin/cms/docs/categories/${editingCategory.id}`
        : '/api/admin/cms/docs/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingCategory ? 'Category updated' : 'Category created');
        setIsDialogOpen(false);
        resetForm();
        fetchCategories();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save category');
      }
    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? Articles will become uncategorized.')) return;

    try {
      const res = await fetch(`/api/admin/cms/docs/categories/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Category deleted');
        fetchCategories();
      } else {
        toast.error('Failed to delete category');
      }
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Doc Categories</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name_en">Name (EN)</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name_en: e.target.value,
                        slug: !editingCategory ? generateSlug(e.target.value) : formData.slug
                      });
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name_vi">Name (VI)</Label>
                  <Input
                    id="name_vi"
                    value={formData.name_vi}
                    onChange={(e) => setFormData({ ...formData, name_vi: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description_en">Description (EN)</Label>
                <Input
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description_vi">Description (VI)</Label>
                <Input
                  id="description_vi"
                  value={formData.description_vi}
                  onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCategory ? 'Update' : 'Create'}
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
              <TableHead className="w-12">#</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (VI)</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.sort_order}</TableCell>
                <TableCell className="font-mono text-sm">{category.icon}</TableCell>
                <TableCell className="font-medium">{category.name_en}</TableCell>
                <TableCell>{category.name_vi}</TableCell>
                <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
