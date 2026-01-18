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
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Github, Package } from 'lucide-react';
import { toast } from 'sonner';

interface SDK {
  id: string;
  slug: string;
  name: string;
  language: string;
  description_en: string;
  description_vi: string;
  icon: string | null;
  color: string | null;
  package_name: string | null;
  install_command: string | null;
  docs_url: string | null;
  github_url: string | null;
  npm_url: string | null;
  pypi_url: string | null;
  current_version: string | null;
  min_language_version: string | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
}

export function SDKsManager() {
  const [sdks, setSDKs] = useState<SDK[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSDK, setEditingSDK] = useState<SDK | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    language: '',
    description_en: '',
    description_vi: '',
    icon: '',
    color: '',
    package_name: '',
    install_command: '',
    docs_url: '',
    github_url: '',
    npm_url: '',
    pypi_url: '',
    current_version: '',
    min_language_version: '',
    sort_order: 0,
    is_active: true,
    is_featured: false,
  });
  const [saving, setSaving] = useState(false);

  const fetchSDKs = async () => {
    try {
      const res = await fetch('/api/admin/cms/sdks');
      if (res.ok) setSDKs(await res.json());
    } catch (error) {
      toast.error('Failed to fetch SDKs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSDKs();
  }, []);

  const resetForm = () => {
    setFormData({
      slug: '',
      name: '',
      language: '',
      description_en: '',
      description_vi: '',
      icon: '',
      color: '',
      package_name: '',
      install_command: '',
      docs_url: '',
      github_url: '',
      npm_url: '',
      pypi_url: '',
      current_version: '',
      min_language_version: '',
      sort_order: sdks.length,
      is_active: true,
      is_featured: false,
    });
    setEditingSDK(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (sdk: SDK) => {
    setEditingSDK(sdk);
    setFormData({
      slug: sdk.slug,
      name: sdk.name,
      language: sdk.language,
      description_en: sdk.description_en,
      description_vi: sdk.description_vi,
      icon: sdk.icon || '',
      color: sdk.color || '',
      package_name: sdk.package_name || '',
      install_command: sdk.install_command || '',
      docs_url: sdk.docs_url || '',
      github_url: sdk.github_url || '',
      npm_url: sdk.npm_url || '',
      pypi_url: sdk.pypi_url || '',
      current_version: sdk.current_version || '',
      min_language_version: sdk.min_language_version || '',
      sort_order: sdk.sort_order,
      is_active: sdk.is_active,
      is_featured: sdk.is_featured,
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
      const url = editingSDK
        ? `/api/admin/cms/sdks/${editingSDK.id}`
        : '/api/admin/cms/sdks';
      const method = editingSDK ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: formData.slug,
          name: formData.name,
          language: formData.language,
          description_en: formData.description_en,
          description_vi: formData.description_vi,
          icon: formData.icon || null,
          color: formData.color || null,
          package_name: formData.package_name || null,
          install_command: formData.install_command || null,
          docs_url: formData.docs_url || null,
          github_url: formData.github_url || null,
          npm_url: formData.npm_url || null,
          pypi_url: formData.pypi_url || null,
          current_version: formData.current_version || null,
          min_language_version: formData.min_language_version || null,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
        }),
      });
      if (res.ok) {
        toast.success(editingSDK ? 'SDK updated' : 'SDK created');
        setIsDialogOpen(false);
        resetForm();
        fetchSDKs();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to save SDK');
      }
    } catch (error) {
      toast.error('Failed to save SDK');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will also delete all examples.')) return;
    try {
      const res = await fetch(`/api/admin/cms/sdks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('SDK deleted');
        fetchSDKs();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (sdk: SDK) => {
    try {
      await fetch(`/api/admin/cms/sdks/${sdk.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !sdk.is_active }),
      });
      toast.success(sdk.is_active ? 'Deactivated' : 'Activated');
      fetchSDKs();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>SDKs ({sdks.length})</CardTitle>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New SDK
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>SDK</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Links</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sdks.map((sdk) => (
                <TableRow key={sdk.id}>
                  <TableCell>{sdk.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sdk.icon && <span className="text-xl">{sdk.icon}</span>}
                      <div>
                        <p className="font-medium">{sdk.name}</p>
                        <p className="text-sm text-gray-500 font-mono">{sdk.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {sdk.language}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{sdk.current_version || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {sdk.github_url && (
                        <a
                          href={sdk.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      )}
                      {sdk.npm_url && (
                        <a
                          href={sdk.npm_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Package className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(sdk)}
                      className={sdk.is_active ? 'text-green-600' : 'text-gray-400'}
                    >
                      {sdk.is_active ? (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Draft
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(sdk)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(sdk.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSDK ? 'Edit SDK' : 'Create SDK'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: !editingSDK ? generateSlug(e.target.value) : formData.slug,
                    })
                  }
                  placeholder="JavaScript SDK"
                  required
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Language</Label>
                <Input
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  placeholder="JavaScript"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Version</Label>
                <Input
                  value={formData.current_version}
                  onChange={(e) =>
                    setFormData({ ...formData, current_version: e.target.value })
                  }
                  placeholder="1.0.0"
                />
              </div>
              <div>
                <Label>Min Language Version</Label>
                <Input
                  value={formData.min_language_version}
                  onChange={(e) =>
                    setFormData({ ...formData, min_language_version: e.target.value })
                  }
                  placeholder="Node.js 16+"
                />
              </div>
              <div>
                <Label>Icon (emoji)</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🟨"
                />
              </div>
              <div>
                <Label>Color (Tailwind gradient)</Label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="from-yellow-400 to-orange-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Package Name</Label>
                <Input
                  value={formData.package_name}
                  onChange={(e) =>
                    setFormData({ ...formData, package_name: e.target.value })
                  }
                  placeholder="@aidorag/sdk"
                />
              </div>
              <div>
                <Label>Install Command</Label>
                <Input
                  value={formData.install_command}
                  onChange={(e) =>
                    setFormData({ ...formData, install_command: e.target.value })
                  }
                  placeholder="npm install @aidorag/sdk"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>GitHub URL</Label>
                <Input
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <Label>NPM/Package URL</Label>
                <Input
                  value={formData.npm_url}
                  onChange={(e) => setFormData({ ...formData, npm_url: e.target.value })}
                  placeholder="https://npmjs.com/..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Docs URL</Label>
                <Input
                  value={formData.docs_url}
                  onChange={(e) => setFormData({ ...formData, docs_url: e.target.value })}
                  placeholder="https://docs.aidorag.ai/sdks/..."
                />
              </div>
              <div>
                <Label>PyPI URL (for Python)</Label>
                <Input
                  value={formData.pypi_url}
                  onChange={(e) => setFormData({ ...formData, pypi_url: e.target.value })}
                  placeholder="https://pypi.org/..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Description (EN)</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) =>
                    setFormData({ ...formData, description_en: e.target.value })
                  }
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label>Description (VI)</Label>
                <Textarea
                  value={formData.description_vi}
                  onChange={(e) =>
                    setFormData({ ...formData, description_vi: e.target.value })
                  }
                  rows={3}
                  required
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
                <Label>Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked })
                  }
                />
                <Label>Featured</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSDK ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
