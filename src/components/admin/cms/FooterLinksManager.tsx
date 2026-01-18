'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Pencil, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FooterLink {
  id: string;
  section: string;
  label_en: string;
  label_vi: string;
  url: string;
  is_external: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const SECTIONS = ['product', 'company', 'resources', 'legal'];

export function FooterLinksManager() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [formData, setFormData] = useState({
    section: 'product',
    label_en: '',
    label_vi: '',
    url: '',
    is_external: false,
    is_active: true,
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/admin/cms/footer-links');
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      }
    } catch (error) {
      toast.error('Failed to fetch footer links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.section]) {
      acc[link.section] = [];
    }
    acc[link.section].push(link);
    return acc;
  }, {} as Record<string, FooterLink[]>);

  const resetForm = () => {
    setFormData({
      section: 'product',
      label_en: '',
      label_vi: '',
      url: '',
      is_external: false,
      is_active: true,
      sort_order: 0,
    });
    setEditingLink(null);
  };

  const openCreateDialog = (section?: string) => {
    resetForm();
    if (section) {
      const sectionLinks = groupedLinks[section] || [];
      const maxOrder = Math.max(0, ...sectionLinks.map(l => l.sort_order));
      setFormData(prev => ({ ...prev, section, sort_order: maxOrder + 1 }));
    }
    setIsDialogOpen(true);
  };

  const openEditDialog = (link: FooterLink) => {
    setEditingLink(link);
    setFormData({
      section: link.section,
      label_en: link.label_en,
      label_vi: link.label_vi,
      url: link.url,
      is_external: link.is_external,
      is_active: link.is_active,
      sort_order: link.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingLink
        ? `/api/admin/cms/footer-links/${editingLink.id}`
        : '/api/admin/cms/footer-links';
      const method = editingLink ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingLink ? 'Link updated' : 'Link created');
        setIsDialogOpen(false);
        resetForm();
        fetchLinks();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save link');
      }
    } catch (error) {
      toast.error('Failed to save link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const res = await fetch(`/api/admin/cms/footer-links/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Link deleted');
        fetchLinks();
      } else {
        toast.error('Failed to delete link');
      }
    } catch (error) {
      toast.error('Failed to delete link');
    }
  };

  const toggleActive = async (link: FooterLink) => {
    try {
      const res = await fetch(`/api/admin/cms/footer-links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !link.is_active }),
      });

      if (res.ok) {
        toast.success(link.is_active ? 'Link deactivated' : 'Link activated');
        fetchLinks();
      }
    } catch (error) {
      toast.error('Failed to update link');
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Footer Links</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openCreateDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLink ? 'Edit Link' : 'Create New Link'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select
                    value={formData.section}
                    onValueChange={(value) => setFormData({ ...formData, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section.charAt(0).toUpperCase() + section.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="label_en">Label (EN)</Label>
                <Input
                  id="label_en"
                  value={formData.label_en}
                  onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="label_vi">Label (VI)</Label>
                <Input
                  id="label_vi"
                  value={formData.label_vi}
                  onChange={(e) => setFormData({ ...formData, label_vi: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="/about or https://external.com"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_external"
                    checked={formData.is_external}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_external: checked })}
                  />
                  <Label htmlFor="is_external">External Link</Label>
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
                  {editingLink ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={SECTIONS} className="w-full">
          {SECTIONS.map((section) => (
            <AccordionItem key={section} value={section}>
              <AccordionTrigger className="text-lg font-semibold capitalize">
                {section} ({(groupedLinks[section] || []).length} links)
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex justify-end mb-2">
                  <Button variant="outline" size="sm" onClick={() => openCreateDialog(section)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add to {section}
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Label (EN)</TableHead>
                      <TableHead>Label (VI)</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(groupedLinks[section] || [])
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((link) => (
                        <TableRow key={link.id} className={!link.is_active ? 'opacity-50' : ''}>
                          <TableCell className="font-mono text-sm">{link.sort_order}</TableCell>
                          <TableCell>{link.label_en}</TableCell>
                          <TableCell>{link.label_vi}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {link.url}
                            {link.is_external && <ExternalLink className="inline h-3 w-3 ml-1" />}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={link.is_active}
                              onCheckedChange={() => toggleActive(link)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(link)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(link.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {(!groupedLinks[section] || groupedLinks[section].length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                          No links in this section
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
