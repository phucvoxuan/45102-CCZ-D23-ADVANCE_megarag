'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Trash2,
  RefreshCw,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'processed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export default function AdminDocumentsPage() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/documents?${params}`);
      const data = await res.json();

      let docs = data.documents || [];
      if (search) {
        docs = docs.filter((d: Document) =>
          d.file_name.toLowerCase().includes(search.toLowerCase())
        );
      }
      setDocuments(docs);
      setPagination({
        page: currentPage,
        limit: 20,
        total: docs.length,
        total_pages: Math.ceil(docs.length / 20),
      });
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, search]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" /> {String(t('admin.documentsPage.completed'))}
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> {String(t('admin.documentsPage.processing'))}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" /> {String(t('admin.documentsPage.pending'))}
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> {String(t('admin.documentsPage.failed'))}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎬';
    if (fileType.includes('audio')) return '🎵';
    return '📄';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{String(t('admin.documentsPage.title'))}</h1>
          <p className="text-muted-foreground">
            {String(t('admin.documentsPage.subtitle'))}
          </p>
        </div>
        <Button onClick={fetchDocuments} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {String(t('admin.documentsPage.refresh'))}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={String(t('admin.documentsPage.searchPlaceholder'))}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={String(t('admin.documentsPage.filterByStatus'))} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{String(t('admin.documentsPage.allStatus'))}</SelectItem>
                <SelectItem value="completed">{String(t('admin.documentsPage.completed'))}</SelectItem>
                <SelectItem value="processing">{String(t('admin.documentsPage.processing'))}</SelectItem>
                <SelectItem value="pending">{String(t('admin.documentsPage.pending'))}</SelectItem>
                <SelectItem value="failed">{String(t('admin.documentsPage.failed'))}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>{String(t('admin.documentsPage.allDocuments'))}</CardTitle>
          <CardDescription>
            {documents.length} {String(t('admin.documentsPage.documentsTotal'))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <FileText className="h-12 w-12 mb-2" />
              <p>{String(t('admin.documentsPage.noDocuments'))}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{String(t('admin.documentsPage.document'))}</TableHead>
                  <TableHead>{String(t('admin.documentsPage.type'))}</TableHead>
                  <TableHead>{String(t('admin.documentsPage.size'))}</TableHead>
                  <TableHead>{String(t('admin.documentsPage.status'))}</TableHead>
                  <TableHead>{String(t('admin.documentsPage.created'))}</TableHead>
                  <TableHead className="text-right">{String(t('admin.documentsPage.actions'))}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getFileIcon(doc.file_type)}</span>
                        <span className="font-medium truncate max-w-[200px]">
                          {doc.file_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {doc.file_type.split('/').pop()}
                      </code>
                    </TableCell>
                    <TableCell>{formatBytes(doc.file_size)}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === doc.id}
                          >
                            {deletingId === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{String(t('admin.documentsPage.deleteDocument'))}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {String(t('admin.documentsPage.deleteConfirm'))} &quot;{doc.file_name}&quot;? {String(t('admin.documentsPage.deleteWarning'))}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{String(t('common.cancel'))}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(doc.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {String(t('common.delete'))}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {String(t('admin.documentsPage.page'))} {pagination.page} {String(t('admin.documentsPage.of'))} {pagination.total_pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {String(t('admin.documentsPage.previous'))}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                  disabled={currentPage === pagination.total_pages}
                >
                  {String(t('admin.documentsPage.next'))}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
