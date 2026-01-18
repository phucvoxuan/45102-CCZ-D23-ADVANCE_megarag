'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, Database, FileText, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  page_count: number;
  chunk_count: number;
  created_at: string;
}

interface ChatbotWidget {
  id: string;
  knowledge_base_ids: string[] | null;
  rag_mode: string;
}

interface KnowledgeBaseProps {
  chatbot: ChatbotWidget;
  onUpdate: (data: Partial<ChatbotWidget>) => Promise<void>;
}

export function KnowledgeBase({ chatbot, onUpdate }: KnowledgeBaseProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(chatbot.knowledge_base_ids || []);
  const [ragMode, setRagMode] = useState(chatbot.rag_mode || 'naive');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      // Only show processed documents
      setDocuments((data.documents || []).filter((d: Document) => d.status === 'processed'));
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleToggleDocument = (docId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(docId)) {
        return prev.filter((id) => id !== docId);
      }
      return [...prev, docId];
    });
    setHasChanges(true);
  };

  const handleSelectAll = () => {
    const filteredDocs = filteredDocuments;
    if (selectedIds.length === filteredDocs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocs.map((d) => d.id));
    }
    setHasChanges(true);
  };

  const handleRagModeChange = (mode: string) => {
    setRagMode(mode);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        knowledge_base_ids: selectedIds.length > 0 ? selectedIds : null,
        rag_mode: ragMode,
      });
      setHasChanges(false);
      toast.success('Knowledge base settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('text')) return '📃';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('video')) return '🎬';
    return '📁';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RAG Mode</CardTitle>
          <CardDescription>
            Choose how the chatbot retrieves and processes information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={ragMode} onValueChange={handleRagModeChange}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="naive">
                <div className="flex flex-col">
                  <span>Naive RAG</span>
                  <span className="text-xs text-muted-foreground">Simple keyword matching</span>
                </div>
              </SelectItem>
              <SelectItem value="local">
                <div className="flex flex-col">
                  <span>Local RAG</span>
                  <span className="text-xs text-muted-foreground">Document-level context</span>
                </div>
              </SelectItem>
              <SelectItem value="global">
                <div className="flex flex-col">
                  <span>Global RAG</span>
                  <span className="text-xs text-muted-foreground">Cross-document context</span>
                </div>
              </SelectItem>
              <SelectItem value="hybrid">
                <div className="flex flex-col">
                  <span>Hybrid RAG</span>
                  <span className="text-xs text-muted-foreground">Combined approach</span>
                </div>
              </SelectItem>
              <SelectItem value="mix">
                <div className="flex flex-col">
                  <span>Mix RAG</span>
                  <span className="text-xs text-muted-foreground">Best of all modes</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Knowledge Base Documents</CardTitle>
              <CardDescription>
                Select documents the chatbot can reference ({selectedIds.length} selected)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={handleSelectAll}>
                {selectedIds.length === filteredDocuments.length && filteredDocuments.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'No documents found' : 'No processed documents'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Upload and process documents in the Dashboard first'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredDocuments.map((doc) => (
                  <label
                    key={doc.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedIds.includes(doc.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.includes(doc.id)}
                      onCheckedChange={() => handleToggleDocument(doc.id)}
                    />
                    <div className="text-2xl">{getFileIcon(doc.file_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{doc.page_count || 0} pages</span>
                        <span>•</span>
                        <span>{doc.chunk_count || 0} chunks</span>
                      </div>
                    </div>
                    {selectedIds.includes(doc.id) && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
