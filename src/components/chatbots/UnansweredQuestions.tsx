'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MessageCircleWarning,
  CheckCircle,
  Trash2,
  Send,
  RefreshCw,
  X,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface UnansweredQuestion {
  id: string;
  question: string;
  user_context: string | null;
  status: 'pending' | 'reviewed' | 'converted_to_faq' | 'dismissed';
  occurrence_count: number;
  first_asked_at: string;
  last_asked_at: string;
  visitor_id: string | null;
  converted_faq_id: string | null;
  created_at: string;
}

interface UnansweredQuestionsProps {
  chatbotId: string;
}

export function UnansweredQuestions({ chatbotId }: UnansweredQuestionsProps) {
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [total, setTotal] = useState(0);

  // Convert to FAQ dialog
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<UnansweredQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  // Dismiss dialog
  const [dismissConfirmId, setDismissConfirmId] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/unanswered?status=${statusFilter}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      const data = await response.json();
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load unanswered questions');
    } finally {
      setIsLoading(false);
    }
  }, [chatbotId, statusFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleOpenConvertDialog = (question: UnansweredQuestion) => {
    setSelectedQuestion(question);
    setAnswer('');
    setConvertDialogOpen(true);
  };

  const handleConvertToFaq = async () => {
    if (!selectedQuestion || !answer.trim()) {
      toast.error('Please enter an answer');
      return;
    }

    setIsConverting(true);
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/unanswered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          answer: answer.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to convert to FAQ');

      toast.success('Question converted to FAQ successfully');
      setConvertDialogOpen(false);
      setSelectedQuestion(null);
      setAnswer('');
      fetchQuestions();
    } catch (error) {
      console.error('Error converting to FAQ:', error);
      toast.error('Failed to convert to FAQ');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDismiss = async (questionId: string) => {
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/unanswered`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: [questionId] }),
      });

      if (!response.ok) throw new Error('Failed to dismiss question');

      toast.success('Question dismissed');
      setDismissConfirmId(null);
      fetchQuestions();
    } catch (error) {
      console.error('Error dismissing question:', error);
      toast.error('Failed to dismiss question');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'converted_to_faq':
        return <Badge variant="default" className="bg-green-600">Converted</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircleWarning className="h-6 w-6 text-amber-500" />
              <div>
                <CardTitle>Unanswered Questions</CardTitle>
                <CardDescription>
                  Questions that the chatbot couldn't answer from FAQs
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="converted_to_faq">Converted</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchQuestions}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Total: {total} questions</span>
            {statusFilter === 'pending' && total > 0 && (
              <span className="text-amber-600 font-medium">
                {total} questions need attention
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircleWarning className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {statusFilter === 'pending'
                ? 'No pending unanswered questions!'
                : 'No questions found with this filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(question.status)}
                      {question.occurrence_count > 1 && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Asked {question.occurrence_count}x
                        </Badge>
                      )}
                    </div>

                    <p className="font-medium text-foreground mb-2 break-words">
                      {question.question}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last asked:{' '}
                        {formatDistanceToNow(new Date(question.last_asked_at), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                      {question.visitor_id && (
                        <span>Visitor: {question.visitor_id.substring(0, 8)}...</span>
                      )}
                    </div>
                  </div>

                  {question.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleOpenConvertDialog(question)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Convert to FAQ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDismissConfirmId(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Convert to FAQ Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Convert to FAQ</DialogTitle>
            <DialogDescription>
              Provide an answer to convert this question into a FAQ entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Question</label>
              <p className="p-3 bg-muted rounded-lg text-sm">
                {selectedQuestion?.question}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Answer <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter the answer for this question..."
                rows={4}
                className="resize-none"
              />
            </div>

            {selectedQuestion && selectedQuestion.occurrence_count > 1 && (
              <p className="text-sm text-muted-foreground">
                This question was asked {selectedQuestion.occurrence_count} times.
                Converting it to FAQ will help future visitors.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvertToFaq} disabled={isConverting || !answer.trim()}>
              {isConverting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create FAQ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dismiss Confirmation */}
      <AlertDialog open={!!dismissConfirmId} onOpenChange={() => setDismissConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss this question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the question as dismissed. You can still view it later by filtering dismissed questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => dismissConfirmId && handleDismiss(dismissConfirmId)}>
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
