'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StaticPagesManager } from '@/components/admin/cms/StaticPagesManager';
import { FooterLinksManager } from '@/components/admin/cms/FooterLinksManager';
import { FileText, Link as LinkIcon } from 'lucide-react';

export default function ContentManagementPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage static pages and footer links</p>
      </div>

      <Tabs defaultValue="static-pages" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="static-pages" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Static Pages
          </TabsTrigger>
          <TabsTrigger value="footer-links" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Footer Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="static-pages" className="mt-6">
          <StaticPagesManager />
        </TabsContent>

        <TabsContent value="footer-links" className="mt-6">
          <FooterLinksManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
