import { supabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, CheckCircle, Clock, XCircle, HardDrive } from 'lucide-react';

async function getDocumentStats() {
  // Get recent documents with user info
  const { data: documents } = await supabaseAdmin
    .from('documents')
    .select(`
      id,
      file_name,
      file_type,
      file_size,
      status,
      chunks_count,
      created_at,
      user_id,
      profiles:user_id (email, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Get total counts by status
  const { count: totalDocuments } = await supabaseAdmin
    .from('documents')
    .select('*', { count: 'exact', head: true });

  const { count: processedCount } = await supabaseAdmin
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processed');

  const { count: pendingCount } = await supabaseAdmin
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: failedCount } = await supabaseAdmin
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed');

  // Get total chunks
  const { count: totalChunks } = await supabaseAdmin
    .from('chunks')
    .select('*', { count: 'exact', head: true });

  // Calculate total storage
  const { data: storageDocs } = await supabaseAdmin
    .from('documents')
    .select('file_size');

  const totalStorage = storageDocs?.reduce((acc, doc) => acc + (doc.file_size || 0), 0) || 0;

  return {
    documents: documents || [],
    totalDocuments: totalDocuments || 0,
    processedCount: processedCount || 0,
    pendingCount: pendingCount || 0,
    failedCount: failedCount || 0,
    totalChunks: totalChunks || 0,
    totalStorage,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function DocumentsPage() {
  const stats = await getDocumentStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Processed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents Overview</h1>
        <p className="text-muted-foreground">Platform-wide document statistics and management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.totalDocuments.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Processed</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats.processedCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pendingCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Failed</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600">{stats.failedCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Chunks</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.totalChunks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Storage</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-purple-600">{formatBytes(stats.totalStorage)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>Last 50 uploaded documents across all users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {doc.file_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(doc.profiles as { email?: string })?.email || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.file_type?.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatBytes(doc.file_size || 0)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(doc.status)}
                  </TableCell>
                  <TableCell>
                    {doc.chunks_count || 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {stats.documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No documents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
