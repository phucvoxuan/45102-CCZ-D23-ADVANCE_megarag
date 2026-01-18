'use client';

import { useState } from 'react';
import { Save, Wand2, RotateCcw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface ChatbotWidget {
  id: string;
  system_prompt: string | null;
  max_tokens: number | null;
}

interface PromptSettingsProps {
  chatbot: ChatbotWidget;
  onUpdate: (data: Partial<ChatbotWidget>) => Promise<void>;
}

const PROMPT_TEMPLATES = [
  {
    name: 'Customer Support',
    prompt: `Bạn là trợ lý hỗ trợ khách hàng thân thiện và chuyên nghiệp.

CÁCH TRẢ LỜI:
- Trả lời dựa trên danh sách FAQ được cung cấp
- Giữ giọng điệu lịch sự, thân thiện và chuyên nghiệp
- Trả lời ngắn gọn, đi thẳng vào vấn đề
- KHÔNG cần trích dẫn nguồn hay đề cập đến FAQ

KHI KHÔNG BIẾT CÂU TRẢ LỜI:
- Xin lỗi khách hàng và thông báo rằng bạn chưa có thông tin về vấn đề này
- Đề nghị kết nối với nhân viên hỗ trợ nếu cần

VÍ DỤ CÁCH TRẢ LỜI:
Khách: "Thời gian giao hàng bao lâu?"
Bot: "Thời gian giao hàng từ 2-5 ngày làm việc tùy khu vực. Nội thành thường 2-3 ngày, ngoại thành 4-5 ngày."`,
  },
  {
    name: 'Sales Assistant',
    prompt: `Bạn là trợ lý tư vấn bán hàng nhiệt tình và am hiểu sản phẩm.

CÁCH TRẢ LỜI:
- Tư vấn sản phẩm/dịch vụ dựa trên FAQ
- Giải thích tính năng và lợi ích rõ ràng
- Trả lời về giá cả, khuyến mãi một cách chính xác
- Nhiệt tình nhưng không ép buộc
- KHÔNG cần trích dẫn nguồn

KHI KHÔNG BIẾT CÂU TRẢ LỜI:
- Thông báo bạn sẽ kiểm tra lại thông tin
- Đề nghị liên hệ hotline để được tư vấn chi tiết

VÍ DỤ CÁCH TRẢ LỜI:
Khách: "Sản phẩm A có bảo hành không?"
Bot: "Sản phẩm A được bảo hành 12 tháng chính hãng. Bạn có thể mang đến bất kỳ chi nhánh nào của chúng tôi để được hỗ trợ."`,
  },
  {
    name: 'Technical Support',
    prompt: `Bạn là chuyên viên hỗ trợ kỹ thuật kiên nhẫn và tận tâm.

CÁCH TRẢ LỜI:
- Hướng dẫn xử lý sự cố theo từng bước rõ ràng
- Giải thích thuật ngữ kỹ thuật bằng ngôn ngữ đơn giản
- Trả lời chính xác dựa trên FAQ kỹ thuật
- KHÔNG cần trích dẫn nguồn

KHI KHÔNG BIẾT CÂU TRẢ LỜI:
- Thông báo vấn đề cần được hỗ trợ từ bộ phận kỹ thuật
- Hướng dẫn cách liên hệ support team

VÍ DỤ CÁCH TRẢ LỜI:
Khách: "Tôi không đăng nhập được"
Bot: "Bạn hãy thử các bước sau:
1. Kiểm tra lại email/username đã nhập đúng chưa
2. Nhấn 'Quên mật khẩu' để reset
3. Xóa cache trình duyệt và thử lại

Nếu vẫn không được, vui lòng liên hệ support@company.com."`,
  },
  {
    name: 'FAQ Bot',
    prompt: `Bạn là trợ lý trả lời câu hỏi thường gặp.

CÁCH TRẢ LỜI:
- Trả lời ngắn gọn, chính xác dựa trên FAQ
- Đi thẳng vào vấn đề, không vòng vo
- Sử dụng ngôn ngữ dễ hiểu
- KHÔNG cần trích dẫn nguồn hay đề cập FAQ

KHI KHÔNG BIẾT CÂU TRẢ LỜI:
- Thông báo ngắn gọn rằng bạn chưa có thông tin về vấn đề này
- Đề xuất liên hệ hỗ trợ trực tiếp

VÍ DỤ CÁCH TRẢ LỜI:
Khách: "Làm sao để đổi mật khẩu?"
Bot: "Vào Cài đặt > Bảo mật > Đổi mật khẩu. Nhập mật khẩu cũ và mật khẩu mới, sau đó nhấn Lưu."`,
  },
];

export function PromptSettings({ chatbot, onUpdate }: PromptSettingsProps) {
  const [systemPrompt, setSystemPrompt] = useState(chatbot.system_prompt || '');
  const [maxTokens, setMaxTokens] = useState(chatbot.max_tokens || 2048);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePromptChange = (value: string) => {
    setSystemPrompt(value);
    setHasChanges(true);
  };

  const handleMaxTokensChange = (value: number[]) => {
    setMaxTokens(value[0]);
    setHasChanges(true);
  };

  const handleApplyTemplate = (template: typeof PROMPT_TEMPLATES[0]) => {
    setSystemPrompt(template.prompt);
    setHasChanges(true);
    toast.success(`Applied "${template.name}" template`);
  };

  const handleReset = () => {
    setSystemPrompt(chatbot.system_prompt || '');
    setMaxTokens(chatbot.max_tokens || 2048);
    setHasChanges(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(systemPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Prompt copied to clipboard');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        system_prompt: systemPrompt || null,
        max_tokens: maxTokens,
      });
      setHasChanges(false);
      toast.success('Prompt settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Templates</CardTitle>
          <CardDescription>
            Quick-start with a pre-made prompt template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROMPT_TEMPLATES.map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="justify-start h-auto py-3"
                onClick={() => handleApplyTemplate(template)}
              >
                <Wand2 className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{template.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Custom instructions that define your chatbot's behavior and personality
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasChanges}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={systemPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="You are a helpful assistant that..."
            rows={12}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {systemPrompt.length} characters
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Settings</CardTitle>
          <CardDescription>
            Configure how the AI generates responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Max Response Tokens</Label>
              <span className="text-sm font-medium">{maxTokens}</span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={handleMaxTokensChange}
              min={256}
              max={4096}
              step={256}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of tokens in the AI response. Higher values allow longer responses
              but may increase latency.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Be specific about the role and personality of your chatbot
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Include instructions for handling edge cases and unknown questions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Define the tone and style of responses (formal, casual, technical, etc.)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Specify any limitations or topics to avoid
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Include examples of ideal responses when possible
            </li>
          </ul>
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
