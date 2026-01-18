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
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Search, MapPin, Briefcase, Home } from 'lucide-react';
import { toast } from 'sonner';

interface Department { id: string; slug: string; name_en: string; name_vi: string; }
interface JobListing {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  description_en: string;
  description_vi: string;
  requirements_en: string | null;
  requirements_vi: string | null;
  benefits_en: string | null;
  benefits_vi: string | null;
  location_en: string | null;
  location_vi: string | null;
  employment_type: string;
  experience_level: string;
  salary_range_min: number | null;
  salary_range_max: number | null;
  salary_currency: string;
  is_remote: boolean;
  is_published: boolean;
  department_id: string | null;
  department: Department | null;
}

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship'];
const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead', 'executive'];

export function JobListingsManager() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [filterDept, setFilterDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    slug: '', title_en: '', title_vi: '', description_en: '', description_vi: '',
    requirements_en: '', requirements_vi: '', benefits_en: '', benefits_vi: '',
    location_en: '', location_vi: '', employment_type: 'full-time', experience_level: 'mid',
    salary_range_min: '', salary_range_max: '', salary_currency: 'USD',
    is_remote: false, is_published: true, department_id: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [jobsRes, deptsRes] = await Promise.all([
        fetch('/api/admin/cms/careers/jobs'),
        fetch('/api/admin/cms/careers/departments')
      ]);
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (deptsRes.ok) setDepartments(await deptsRes.json());
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
      requirements_en: '', requirements_vi: '', benefits_en: '', benefits_vi: '',
      location_en: '', location_vi: '', employment_type: 'full-time', experience_level: 'mid',
      salary_range_min: '', salary_range_max: '', salary_currency: 'USD',
      is_remote: false, is_published: true, department_id: '',
    });
    setEditingJob(null);
  };

  const openCreateDialog = () => { resetForm(); setIsDialogOpen(true); };

  const openEditDialog = (job: JobListing) => {
    setEditingJob(job);
    setFormData({
      slug: job.slug, title_en: job.title_en, title_vi: job.title_vi,
      description_en: job.description_en, description_vi: job.description_vi,
      requirements_en: job.requirements_en || '', requirements_vi: job.requirements_vi || '',
      benefits_en: job.benefits_en || '', benefits_vi: job.benefits_vi || '',
      location_en: job.location_en || '', location_vi: job.location_vi || '',
      employment_type: job.employment_type, experience_level: job.experience_level,
      salary_range_min: job.salary_range_min?.toString() || '',
      salary_range_max: job.salary_range_max?.toString() || '',
      salary_currency: job.salary_currency || 'USD',
      is_remote: job.is_remote, is_published: job.is_published,
      department_id: job.department_id || '',
    });
    setIsDialogOpen(true);
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingJob ? `/api/admin/cms/careers/jobs/${editingJob.id}` : '/api/admin/cms/careers/jobs';
      const method = editingJob ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: formData.slug,
          title_en: formData.title_en,
          title_vi: formData.title_vi,
          description_en: formData.description_en,
          description_vi: formData.description_vi,
          requirements_en: formData.requirements_en || null,
          requirements_vi: formData.requirements_vi || null,
          benefits_en: formData.benefits_en || null,
          benefits_vi: formData.benefits_vi || null,
          location_en: formData.location_en || null,
          location_vi: formData.location_vi || null,
          employment_type: formData.employment_type,
          experience_level: formData.experience_level,
          salary_range_min: formData.salary_range_min ? parseInt(formData.salary_range_min) : null,
          salary_range_max: formData.salary_range_max ? parseInt(formData.salary_range_max) : null,
          salary_currency: formData.salary_currency,
          is_remote: formData.is_remote,
          is_published: formData.is_published,
          department_id: formData.department_id || null,
        }),
      });
      if (res.ok) {
        toast.success(editingJob ? 'Job updated' : 'Job created');
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error('Failed to save job');
      }
    } catch (error) {
      toast.error('Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/cms/careers/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Job deleted'); fetchData(); }
    } catch (error) { toast.error('Failed to delete'); }
  };

  const togglePublished = async (job: JobListing) => {
    try {
      await fetch(`/api/admin/cms/careers/jobs/${job.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !job.is_published }),
      });
      toast.success(job.is_published ? 'Unpublished' : 'Published');
      fetchData();
    } catch (error) { toast.error('Failed to update'); }
  };

  const filteredJobs = jobs.filter((j) => {
    if (filterDept !== 'all' && j.department_id !== filterDept) return false;
    if (searchQuery && !j.title_en.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Job Listings ({filteredJobs.length})</CardTitle>
          <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />New Job</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search jobs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name_en}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{job.title_en}</p>
                      <p className="text-sm text-gray-500">{job.title_vi}</p>
                    </div>
                  </TableCell>
                  <TableCell>{job.department?.name_en}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {job.is_remote ? <Home className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {job.location_en || '-'}
                    </span>
                  </TableCell>
                  <TableCell><Briefcase className="inline h-3 w-3 mr-1" /><span className="capitalize">{job.employment_type}</span></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => togglePublished(job)} className={job.is_published ? 'text-green-600' : 'text-gray-400'}>
                      {job.is_published ? <><Eye className="h-4 w-4 mr-1" />Published</> : <><EyeOff className="h-4 w-4 mr-1" />Draft</>}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(job)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(job.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingJob ? 'Edit Job' : 'Create Job'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title (EN)</Label><Input value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value, slug: !editingJob ? generateSlug(e.target.value) : formData.slug })} required /></div>
              <div><Label>Title (VI)</Label><Input value={formData.title_vi} onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required /></div>
              <div>
                <Label>Department</Label>
                <Select value={formData.department_id || 'none'} onValueChange={(value) => setFormData({ ...formData, department_id: value === 'none' ? '' : value })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name_en}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Location (EN)</Label><Input value={formData.location_en} onChange={(e) => setFormData({ ...formData, location_en: e.target.value })} placeholder="Ho Chi Minh City" /></div>
              <div><Label>Location (VI)</Label><Input value={formData.location_vi} onChange={(e) => setFormData({ ...formData, location_vi: e.target.value })} placeholder="TP. Hồ Chí Minh" /></div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <Label>Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (<SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value) => setFormData({ ...formData, experience_level: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((l) => (<SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Min Salary</Label><Input type="number" value={formData.salary_range_min} onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })} placeholder="2000" /></div>
              <div><Label>Max Salary</Label><Input type="number" value={formData.salary_range_max} onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })} placeholder="4000" /></div>
              <div className="flex items-end pb-2"><div className="flex items-center space-x-2"><Switch checked={formData.is_remote} onCheckedChange={(checked) => setFormData({ ...formData, is_remote: checked })} /><Label>Remote</Label></div></div>
            </div>
            <Tabs defaultValue="en">
              <TabsList><TabsTrigger value="en">English</TabsTrigger><TabsTrigger value="vi">Vietnamese</TabsTrigger></TabsList>
              <TabsContent value="en" className="space-y-4">
                <div><Label>Description (EN)</Label><Textarea value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} rows={6} className="font-mono" required /></div>
                <div><Label>Requirements (EN)</Label><Textarea value={formData.requirements_en} onChange={(e) => setFormData({ ...formData, requirements_en: e.target.value })} rows={4} className="font-mono" /></div>
                <div><Label>Benefits (EN)</Label><Textarea value={formData.benefits_en} onChange={(e) => setFormData({ ...formData, benefits_en: e.target.value })} rows={4} className="font-mono" /></div>
              </TabsContent>
              <TabsContent value="vi" className="space-y-4">
                <div><Label>Description (VI)</Label><Textarea value={formData.description_vi} onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })} rows={6} className="font-mono" required /></div>
                <div><Label>Requirements (VI)</Label><Textarea value={formData.requirements_vi} onChange={(e) => setFormData({ ...formData, requirements_vi: e.target.value })} rows={4} className="font-mono" /></div>
                <div><Label>Benefits (VI)</Label><Textarea value={formData.benefits_vi} onChange={(e) => setFormData({ ...formData, benefits_vi: e.target.value })} rows={4} className="font-mono" /></div>
              </TabsContent>
            </Tabs>
            <div className="flex items-center space-x-2"><Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} /><Label>Published</Label></div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingJob ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
