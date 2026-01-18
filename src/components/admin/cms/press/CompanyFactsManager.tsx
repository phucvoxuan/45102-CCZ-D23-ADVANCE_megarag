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
import { Plus, Pencil, Trash2, Loader2, BarChart3, Eye, EyeOff, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyFact {
  id: string;
  slug: string;
  label_en: string;
  label_vi: string;
  value: string;
  description_en: string | null;
  description_vi: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export function CompanyFactsManager() {
  const [facts, setFacts] = useState<CompanyFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFact, setEditingFact] = useState<CompanyFact | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    label_en: '',
    label_vi: '',
    value: '',
    description_en: '',
    description_vi: '',
    icon: '',
    sort_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchFacts = async () => {
    try {
      const res = await fetch('/api/admin/cms/press/facts');
      if (res.ok) setFacts(await res.json());
    } catch (error) {
      toast.error('Failed to fetch company facts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacts();
  }, []);

  const resetForm = () => {
    setFormData({
      slug: '',
      label_en: '',
      label_vi: '',
      value: '',
      description_en: '',
      description_vi: '',
      icon: '',
      sort_order: facts.length,
      is_active: true,
    });
    setEditingFact(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (fact: CompanyFact) => {
    setEditingFact(fact);
    setFormData({
      slug: fact.slug,
      label_en: fact.label_en,
      label_vi: fact.label_vi,
      value: fact.value,
      description_en: fact.description_en || '',
      description_vi: fact.description_vi || '',
      icon: fact.icon || '',
      sort_order: fact.sort_order,
      is_active: fact.is_active,
    });
    setIsDialogOpen(true);
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingFact
        ? `/api/admin/cms/press/facts/${editingFact.id}`
        : '/api/admin/cms/press/facts';
      const method = editingFact ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          description_en: formData.description_en || null,
          description_vi: formData.description_vi || null,
          icon: formData.icon || null,
        }),
      });
      if (res.ok) {
        toast.success(editingFact ? 'Fact updated' : 'Fact created');
        setIsDialogOpen(false);
        resetForm();
        fetchFacts();
      } else {
        toast.error('Failed to save fact');
      }
    } catch (error) {
      toast.error('Failed to save fact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fact?')) return;
    try {
      const res = await fetch(`/api/admin/cms/press/facts/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Fact deleted');
        fetchFacts();
      }
    } catch (error) {
      toast.error('Failed to delete fact');
    }
  };

  const toggleActive = async (fact: CompanyFact) => {
    try {
      await fetch(`/api/admin/cms/press/facts/${fact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !fact.is_active }),
      });
      toast.success(fact.is_active ? 'Fact hidden' : 'Fact visible');
      fetchFacts();
    } catch (error) {
      toast.error('Failed to update fact');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Company Facts ({facts.length})
          </CardTitle>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Fact
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Manage the statistics displayed in the Company Facts section of the Press page.
            These values are shown to visitors and press contacts.
          </p>
          {facts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No facts yet. Click &quot;Add Fact&quot; to create your first company fact.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Label (EN)</TableHead>
                  <TableHead>Label (VI)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facts.map((fact) => (
                  <TableRow key={fact.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        {fact.sort_order}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xl font-bold text-blue-600">{fact.value}</span>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{fact.label_en}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-gray-600">{fact.label_vi}</p>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(fact)}
                        className={fact.is_active ? 'text-green-600' : 'text-gray-400'}
                      >
                        {fact.is_active ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hidden
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(fact)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(fact.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Preview Section */}
          {facts.filter((f) => f.is_active).length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Preview (Active Facts)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {facts
                  .filter((f) => f.is_active)
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((fact) => (
                    <div
                      key={fact.id}
                      className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 text-center"
                    >
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {fact.value}
                      </div>
                      <p className="text-sm text-gray-600">{fact.label_en}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFact ? 'Edit Fact' : 'Add Fact'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Value (displayed as statistic)</Label>
              <Input
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="e.g., 2024, 10K+, 50+, Beta"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the main number/text displayed prominently
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Label (EN)</Label>
                <Input
                  value={formData.label_en}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      label_en: e.target.value,
                      slug: !editingFact ? generateSlug(e.target.value) : formData.slug,
                    })
                  }
                  placeholder="e.g., Founded, Users, Countries"
                  required
                />
              </div>
              <div>
                <Label>Label (VI)</Label>
                <Input
                  value={formData.label_vi}
                  onChange={(e) => setFormData({ ...formData, label_vi: e.target.value })}
                  placeholder="e.g., Thành lập, Người dùng"
                  required
                />
              </div>
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Description (EN) - Optional</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) =>
                    setFormData({ ...formData, description_en: e.target.value })
                  }
                  rows={2}
                  placeholder="Additional context..."
                />
              </div>
              <div>
                <Label>Description (VI) - Optional</Label>
                <Textarea
                  value={formData.description_vi}
                  onChange={(e) =>
                    setFormData({ ...formData, description_vi: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                  }
                  className="w-24"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label>Visible on Press page</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingFact ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
