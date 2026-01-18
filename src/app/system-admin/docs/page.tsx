'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocCategoriesManager } from '@/components/admin/cms/docs/DocCategoriesManager';
import { DocArticlesManager } from '@/components/admin/cms/docs/DocArticlesManager';
import { FolderOpen, FileText } from 'lucide-react';

export default function DocsManagementPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentation Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage documentation categories and articles</p>
      </div>

      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-6">
          <DocArticlesManager />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <DocCategoriesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
