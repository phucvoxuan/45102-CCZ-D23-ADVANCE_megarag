'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import { Trash2, Loader2, Search, Mail, Phone, FileText, ExternalLink, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface JobApplication {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  job: {
    id: string;
    slug: string;
    title_en: string;
    title_vi: string;
    department: { name_en: string; name_vi: string } | null;
  } | null;
}

const STATUSES = ['new', 'reviewing', 'interview', 'offer', 'hired', 'rejected'];
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-purple-100 text-purple-800',
  offer: 'bg-green-100 text-green-800',
  hired: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

export function JobApplicationsManager() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/admin/cms/careers/applications');
      if (res.ok) setApplications(await res.json());
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const openViewDialog = (app: JobApplication) => {
    setSelectedApp(app);
    setNotes(app.notes || '');
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/cms/careers/applications/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      toast.success('Status updated');
      fetchApplications();
    } catch (error) { toast.error('Failed to update'); }
  };

  const saveNotes = async () => {
    if (!selectedApp) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/cms/careers/applications/${selectedApp.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      toast.success('Notes saved');
      fetchApplications();
    } catch (error) { toast.error('Failed to save notes'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/cms/careers/applications/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Application deleted'); fetchApplications(); setSelectedApp(null); }
    } catch (error) { toast.error('Failed to delete'); }
  };

  const filteredApps = applications.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchQuery && !a.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !a.applicant_email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Job Applications ({filteredApps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search applicants..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map((s) => (<SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{app.applicant_name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" />{app.applicant_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{app.job?.title_en}</p>
                      <p className="text-sm text-gray-500">{app.job?.department?.name_en}</p>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Select value={app.status} onValueChange={(value) => updateStatus(app.id, value)}>
                      <SelectTrigger className={`w-[120px] ${STATUS_COLORS[app.status]}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (<SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openViewDialog(app)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(app.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Application Details</DialogTitle></DialogHeader>
          {selectedApp && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Applicant</Label>
                  <p className="font-medium">{selectedApp.applicant_name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Applied For</Label>
                  <p className="font-medium">{selectedApp.job?.title_en}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="flex items-center gap-1"><Mail className="h-4 w-4" />{selectedApp.applicant_email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Phone</Label>
                  <p className="flex items-center gap-1"><Phone className="h-4 w-4" />{selectedApp.applicant_phone || '-'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                {selectedApp.resume_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedApp.resume_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />Resume
                    </a>
                  </Button>
                )}
                {selectedApp.linkedin_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedApp.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />LinkedIn
                    </a>
                  </Button>
                )}
                {selectedApp.portfolio_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedApp.portfolio_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />Portfolio
                    </a>
                  </Button>
                )}
              </div>
              {selectedApp.cover_letter && (
                <div>
                  <Label className="text-gray-500">Cover Letter</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">{selectedApp.cover_letter}</p>
                </div>
              )}
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Add notes about this application..." />
                <Button onClick={saveNotes} disabled={saving} className="mt-2">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
