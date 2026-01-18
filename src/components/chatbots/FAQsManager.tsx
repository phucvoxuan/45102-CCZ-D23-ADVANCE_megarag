'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircleQuestion,
  Wand2,
  Upload,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  status: 'active' | 'inactive';
  sort_order: number;
  source: string;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string;
  file_name: string;
  status: string;
  chunks_count: number;
}

interface FAQsManagerProps {
  chatbotId: string;
}

export function FAQsManager({ chatbotId }: FAQsManagerProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-generate dialog
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [generateCount, setGenerateCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // CSV Import dialog
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Embedding status
  const [embeddingStatus, setEmbeddingStatus] = useState<{
    total: number;
    withEmbedding: number;
    withoutEmbedding: number;
    coverage: number;
  } | null>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchFaqs = useCallback(async () => {
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/faqs`);
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      const data = await response.json();
      setFaqs(data.faqs || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setIsLoading(false);
    }
  }, [chatbotId]);

  const fetchEmbeddingStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/faqs/backfill-embeddings`);
      if (!response.ok) return;
      const data = await response.json();
      setEmbeddingStatus(data);
    } catch (error) {
      console.error('Error fetching embedding status:', error);
    }
  }, [chatbotId]);

  const handleBackfillEmbeddings = async () => {
    setIsBackfilling(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/faqs/backfill-embeddings`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to backfill embeddings');

      const data = await response.json();
      toast.success(`Generated embeddings for ${data.processed} FAQs`);
      fetchEmbeddingStatus();
    } catch (error) {
      console.error('Error backfilling embeddings:', error);
      toast.error('Failed to generate embeddings');
    } finally {
      setIsBackfilling(false);
    }
  };

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data.documents?.filter((d: Document) => d.status === 'processed') || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
    fetchEmbeddingStatus();
  }, [fetchFaqs, fetchEmbeddingStatus]);

  const handleAdd = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create FAQ');

      const data = await response.json();
      setFaqs((prev) => [...prev, data.faq]);
      setShowAddDialog(false);
      setFormData({ question: '', answer: '', status: 'active' });
      toast.success('FAQ created successfully');
    } catch (error) {
      toast.error('Failed to create FAQ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingFaq) return;
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/faqs/${editingFaq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update FAQ');

      const data = await response.json();
      setFaqs((prev) => prev.map((f) => (f.id === editingFaq.id ? data.faq : f)));
      setEditingFaq(null);
      setFormData({ question: '', answer: '', status: 'active' });
      toast.success('FAQ updated successfully');
    } catch (error) {
      toast.error('Failed to update FAQ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/faqs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete FAQ');

      setFaqs((prev) => prev.filter((f) => f.id !== id));
      setDeleteConfirmId(null);
      toast.success('FAQ deleted');
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
  };

  const handleToggleStatus = async (faq: FAQ) => {
    const newStatus = faq.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/faqs/${faq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, status: newStatus } : f))
      );
      toast.success(`FAQ ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleGenerateFaqs = async () => {
    if (selectedDocs.length === 0) {
      toast.error('Please select at least one document');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/faqs/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: selectedDocs,
          count: generateCount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate FAQs');
      }

      const data = await response.json();
      toast.success(`Generated ${data.count} FAQs successfully`);
      setShowGenerateDialog(false);
      setSelectedDocs([]);
      fetchFaqs();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate FAQs';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim()) {
      toast.error('Please paste CSV content or upload a file');
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/faqs/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: csvContent }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import FAQs');
      }

      const data = await response.json();
      toast.success(`Imported ${data.imported} FAQs successfully`);
      if (data.skipped > 0) {
        toast.warning(`Skipped ${data.skipped} invalid rows`);
      }
      setShowImportDialog(false);
      setCsvContent('');
      fetchFaqs();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to import FAQs';
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCsvContent(e.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/faqs/import`);
      if (!response.ok) throw new Error('Failed to download template');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'faq_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const openEditDialog = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      status: faq.status,
    });
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingFaq(null);
    setFormData({ question: '', answer: '', status: 'active' });
  };

  const openGenerateDialog = () => {
    setShowGenerateDialog(true);
    fetchDocuments();
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ai_generated':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">AI Generated</Badge>;
      case 'imported':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Imported</Badge>;
      case 'from_unanswered':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">From Unanswered</Badge>;
      default:
        return <Badge variant="outline">Manual</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>FAQs</CardTitle>
              <CardDescription>
                Manage frequently asked questions for your chatbot. The chatbot will use these FAQs to answer visitor questions.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={openGenerateDialog}>
                <Wand2 className="h-4 w-4 mr-2" />
                Auto-Generate
              </Button>
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircleQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No FAQs yet</h3>
              <p className="text-muted-foreground mb-4">
                Add frequently asked questions to help your chatbot respond accurately
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={openGenerateDialog}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Auto-Generate from Documents
                </Button>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First FAQ
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Embedding Status Bar */}
              {embeddingStatus && embeddingStatus.total > 0 && (
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="font-medium">Vector Search: </span>
                      {embeddingStatus.coverage === 100 ? (
                        <span className="text-green-600">Fully optimized</span>
                      ) : (
                        <span className="text-amber-600">
                          {embeddingStatus.withEmbedding}/{embeddingStatus.total} FAQs indexed ({embeddingStatus.coverage}%)
                        </span>
                      )}
                    </div>
                  </div>
                  {embeddingStatus.withoutEmbedding > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBackfillEmbeddings}
                      disabled={isBackfilling}
                    >
                      {isBackfilling ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          Indexing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Index {embeddingStatus.withoutEmbedding} FAQs
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground mb-4">
                {faqs.length} FAQ{faqs.length > 1 ? 's' : ''} • {faqs.filter(f => f.status === 'active').length} active
              </p>
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{faq.question}</p>
                    </div>
                    <Badge variant={faq.status === 'active' ? 'default' : 'secondary'}>
                      {faq.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(faq);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(faq.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      {expandedId === faq.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {expandedId === faq.id && (
                    <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
                      <div className="pt-3">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Answer:</p>
                        <p className="text-sm whitespace-pre-wrap">{faq.answer}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          {getSourceBadge(faq.source)}
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => handleToggleStatus(faq)}
                          >
                            {faq.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingFaq} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
            <DialogDescription>
              {editingFaq
                ? 'Update the question and answer'
                : 'Add a frequently asked question and its answer'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                placeholder="What is your return policy?"
              />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))}
                placeholder="We offer a 30-day return policy for all items..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={editingFaq ? handleUpdate : handleAdd} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : editingFaq ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Auto-Generate FAQs from Documents
            </DialogTitle>
            <DialogDescription>
              Select documents from your Knowledge Base to automatically generate FAQ questions and answers using AI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Documents</Label>
              {isLoadingDocs ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <Database className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No processed documents found. Upload documents first.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {documents.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                    >
                      <Checkbox
                        checked={selectedDocs.includes(doc.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDocs((prev) => [...prev, doc.id]);
                          } else {
                            setSelectedDocs((prev) => prev.filter((id) => id !== doc.id));
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">{doc.chunks_count} chunks</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Number of FAQs to Generate</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={generateCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 10;
                    setGenerateCount(Math.min(100, Math.max(1, value)));
                  }}
                  className="w-24"
                  placeholder="10"
                />
                <span className="text-sm text-muted-foreground">FAQs (1-100)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: For multiple documents, consider generating more FAQs. AI will create relevant Q&As based on the content.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateFaqs}
              disabled={isGenerating || selectedDocs.length === 0}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate {generateCount} FAQs
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import FAQs from CSV
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file or paste CSV content to import FAQs in bulk.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV File
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div className="space-y-2">
              <Label>CSV Content</Label>
              <Textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={`question,answer
"What is your return policy?","We offer 30-day returns"
"How long is shipping?","2-5 business days"`}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Format: question,answer (first row is header, use quotes for values with commas)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportCsv} disabled={isImporting || !csvContent.trim()}>
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import FAQs
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
