'use client';

import { useState } from 'react';
import { Save, Palette, Type, Square, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ChatbotWidget {
  id: string;
  primary_color: string | null;
  secondary_color: string | null;
  background_color: string | null;
  text_color: string | null;
  border_radius: number | null;
  font_family: string | null;
  theme_mode: string | null;
}

interface AppearanceSettingsProps {
  chatbot: ChatbotWidget;
  onUpdate: (data: Partial<ChatbotWidget>) => Promise<void>;
}

const FONT_OPTIONS = [
  { value: 'system', label: 'System Default' },
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'open-sans', label: 'Open Sans' },
  { value: 'lato', label: 'Lato' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'nunito', label: 'Nunito' },
];

const PRESET_THEMES = [
  {
    name: 'Default Blue',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    background: '#ffffff',
    text: '#1f2937',
  },
  {
    name: 'Purple Dream',
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    background: '#ffffff',
    text: '#1f2937',
  },
  {
    name: 'Green Nature',
    primary: '#10b981',
    secondary: '#34d399',
    background: '#ffffff',
    text: '#1f2937',
  },
  {
    name: 'Orange Sunset',
    primary: '#f97316',
    secondary: '#fb923c',
    background: '#ffffff',
    text: '#1f2937',
  },
  {
    name: 'Dark Mode',
    primary: '#6366f1',
    secondary: '#818cf8',
    background: '#1f2937',
    text: '#f9fafb',
  },
];

export function AppearanceSettings({ chatbot, onUpdate }: AppearanceSettingsProps) {
  const [formData, setFormData] = useState({
    primary_color: chatbot.primary_color || '#3b82f6',
    secondary_color: chatbot.secondary_color || '#60a5fa',
    background_color: chatbot.background_color || '#ffffff',
    text_color: chatbot.text_color || '#1f2937',
    border_radius: chatbot.border_radius ?? 12,
    font_family: chatbot.font_family || 'system',
    theme_mode: chatbot.theme_mode || 'light',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handlePresetSelect = (preset: typeof PRESET_THEMES[0]) => {
    setFormData((prev) => ({
      ...prev,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      background_color: preset.background,
      text_color: preset.text,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        background_color: formData.background_color,
        text_color: formData.text_color,
        border_radius: formData.border_radius,
        font_family: formData.font_family,
        theme_mode: formData.theme_mode,
      });
      setHasChanges(false);
      toast.success('Appearance settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Color Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Presets
          </CardTitle>
          <CardDescription>
            Choose a preset theme or customize colors below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {PRESET_THEMES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className="p-3 border rounded-lg hover:border-primary transition-colors text-left"
              >
                <div className="flex gap-1 mb-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: preset.secondary }}
                  />
                </div>
                <span className="text-xs font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Colors</CardTitle>
          <CardDescription>
            Fine-tune the colors for your chatbot widget
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for buttons and primary elements
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  placeholder="#60a5fa"
                  className="flex-1 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for hover states and accents
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background_color">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="background_color"
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => handleChange('background_color', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.background_color}
                  onChange={(e) => handleChange('background_color', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Chat window background color
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text_color">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="text_color"
                  type="color"
                  value={formData.text_color}
                  onChange={(e) => handleChange('text_color', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.text_color}
                  onChange={(e) => handleChange('text_color', e.target.value)}
                  placeholder="#1f2937"
                  className="flex-1 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Main text color for messages
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography & Shape */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography & Shape
          </CardTitle>
          <CardDescription>
            Customize fonts and border radius
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="font_family">Font Family</Label>
            <Select
              value={formData.font_family}
              onValueChange={(value) => handleChange('font_family', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Border Radius</Label>
              <span className="text-sm text-muted-foreground">
                {formData.border_radius}px
              </span>
            </div>
            <Slider
              value={[formData.border_radius]}
              onValueChange={(value) => handleChange('border_radius', value[0])}
              min={0}
              max={24}
              step={2}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Square</span>
              <span>Rounded</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Theme Mode</Label>
            <div className="flex gap-2">
              <Button
                variant={formData.theme_mode === 'light' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => handleChange('theme_mode', 'light')}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={formData.theme_mode === 'dark' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => handleChange('theme_mode', 'dark')}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={formData.theme_mode === 'auto' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => handleChange('theme_mode', 'auto')}
              >
                Auto
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Auto mode follows the user's system preference
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Square className="h-5 w-5" />
            Preview
          </CardTitle>
          <CardDescription>
            See how your chatbot widget will look
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border rounded-lg overflow-hidden max-w-sm mx-auto"
            style={{
              borderRadius: `${formData.border_radius}px`,
              backgroundColor: formData.background_color,
            }}
          >
            {/* Header */}
            <div
              className="p-4"
              style={{ backgroundColor: formData.primary_color }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20" />
                <div>
                  <p className="font-medium text-white">AI Assistant</p>
                  <p className="text-xs text-white/70">Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-3 min-h-[200px]">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                <div
                  className="rounded-lg p-3 max-w-[80%]"
                  style={{
                    backgroundColor: `${formData.primary_color}15`,
                    borderRadius: `${formData.border_radius}px`,
                  }}
                >
                  <p
                    className="text-sm"
                    style={{ color: formData.text_color }}
                  >
                    Hello! How can I help you today?
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <div
                  className="rounded-lg p-3 max-w-[80%]"
                  style={{
                    backgroundColor: formData.primary_color,
                    borderRadius: `${formData.border_radius}px`,
                  }}
                >
                  <p className="text-sm text-white">
                    I have a question about your services
                  </p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t">
              <div
                className="flex gap-2 items-center p-2 border rounded-lg"
                style={{ borderRadius: `${formData.border_radius}px` }}
              >
                <span
                  className="text-sm flex-1"
                  style={{ color: `${formData.text_color}60` }}
                >
                  Type your message...
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </div>
              </div>
            </div>
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
