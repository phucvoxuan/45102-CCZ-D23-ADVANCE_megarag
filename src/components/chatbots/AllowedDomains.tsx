'use client';

import { useState } from 'react';
import { Save, Shield, Plus, Trash2, Globe, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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

interface ChatbotWidget {
  id: string;
  allowed_domains: string[] | null;
  domain_restriction_enabled: boolean | null;
}

interface AllowedDomainsProps {
  chatbot: ChatbotWidget;
  onUpdate: (data: Partial<ChatbotWidget>) => Promise<void>;
}

export function AllowedDomains({ chatbot, onUpdate }: AllowedDomainsProps) {
  const [domains, setDomains] = useState<string[]>(chatbot.allowed_domains || []);
  const [restrictionEnabled, setRestrictionEnabled] = useState(
    chatbot.domain_restriction_enabled ?? false
  );
  const [newDomain, setNewDomain] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const isValidDomain = (domain: string): boolean => {
    // Allow wildcards like *.example.com
    const domainPattern = /^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    // Also allow localhost for development
    if (domain === 'localhost' || domain.startsWith('localhost:')) {
      return true;
    }
    return domainPattern.test(domain);
  };

  const handleAddDomain = () => {
    const domain = newDomain.trim().toLowerCase();

    if (!domain) {
      toast.error('Please enter a domain');
      return;
    }

    // Remove protocol if present
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    if (!isValidDomain(cleanDomain)) {
      toast.error('Please enter a valid domain (e.g., example.com or *.example.com)');
      return;
    }

    if (domains.includes(cleanDomain)) {
      toast.error('This domain is already in the list');
      return;
    }

    setDomains([...domains, cleanDomain]);
    setNewDomain('');
    setHasChanges(true);
  };

  const handleRemoveDomain = (index: number) => {
    setDomains(domains.filter((_, i) => i !== index));
    setDeleteIndex(null);
    setHasChanges(true);
  };

  const handleToggleRestriction = (enabled: boolean) => {
    setRestrictionEnabled(enabled);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (restrictionEnabled && domains.length === 0) {
      toast.error('Please add at least one domain before enabling restrictions');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate({
        allowed_domains: domains.length > 0 ? domains : null,
        domain_restriction_enabled: restrictionEnabled,
      });
      setHasChanges(false);
      toast.success('Domain settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDomain();
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable Restriction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Domain Restriction
          </CardTitle>
          <CardDescription>
            Control where your chatbot widget can be embedded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="restriction_enabled">Enable Domain Restriction</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, the widget will only work on listed domains
              </p>
            </div>
            <Switch
              id="restriction_enabled"
              checked={restrictionEnabled}
              onCheckedChange={handleToggleRestriction}
            />
          </div>

          {!restrictionEnabled && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-600">Restriction Disabled</p>
                  <p className="text-muted-foreground">
                    Your chatbot widget can be embedded on any website. Enable domain restriction for better security.
                  </p>
                </div>
              </div>
            </div>
          )}

          {restrictionEnabled && domains.length === 0 && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">No Domains Added</p>
                  <p className="text-muted-foreground">
                    The widget won't work anywhere until you add allowed domains.
                  </p>
                </div>
              </div>
            </div>
          )}

          {restrictionEnabled && domains.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-600">Restriction Active</p>
                  <p className="text-muted-foreground">
                    Your widget will only work on {domains.length} allowed domain{domains.length > 1 ? 's' : ''}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allowed Domains List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Allowed Domains
          </CardTitle>
          <CardDescription>
            Add domains where the chatbot widget is allowed to be embedded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Domain Input */}
          <div className="space-y-2">
            <Label htmlFor="new_domain">Add Domain</Label>
            <div className="flex gap-2">
              <Input
                id="new_domain"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="example.com or *.example.com"
                className="flex-1"
              />
              <Button onClick={handleAddDomain} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use *.example.com to allow all subdomains
            </p>
          </div>

          {/* Domains List */}
          {domains.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Globe className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No domains added yet</p>
              <p className="text-sm text-muted-foreground">
                Add domains to restrict where your widget can be used
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {domains.map((domain, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{domain}</span>
                    {domain.startsWith('*.') && (
                      <Badge variant="secondary" className="text-xs">
                        Wildcard
                      </Badge>
                    )}
                    {domain === 'localhost' && (
                      <Badge variant="outline" className="text-xs">
                        Development
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteIndex(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Add Common Domains */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Add</CardTitle>
          <CardDescription>
            Commonly used domains for development and testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['localhost', '*.localhost', '127.0.0.1'].map((domain) => (
              <Button
                key={domain}
                variant="outline"
                size="sm"
                disabled={domains.includes(domain)}
                onClick={() => {
                  if (!domains.includes(domain)) {
                    setDomains([...domains, domain]);
                    setHasChanges(true);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                {domain}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle>Security Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <p>Domain restriction helps prevent unauthorized use of your chatbot</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <p>Wildcard domains (*.example.com) allow all subdomains</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5" />
              <p>The restriction is enforced server-side for security</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p>Remember to add your production domain before going live</p>
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-mono font-medium">
                {deleteIndex !== null ? domains[deleteIndex] : ''}
              </span>{' '}
              from the allowed list? The widget will no longer work on this domain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteIndex !== null && handleRemoveDomain(deleteIndex)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
