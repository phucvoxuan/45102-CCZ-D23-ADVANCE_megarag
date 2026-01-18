'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogPostsManager } from '@/components/admin/cms/blog/BlogPostsManager';
import { BlogCategoriesManager } from '@/components/admin/cms/blog/BlogCategoriesManager';
import { BlogTagsManager } from '@/components/admin/cms/blog/BlogTagsManager';
import { FileText, FolderOpen, Tags } from 'lucide-react';

export default function BlogManagementPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage blog posts, categories, and tags</p>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <BlogPostsManager />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <BlogCategoriesManager />
        </TabsContent>

        <TabsContent value="tags" className="mt-6">
          <BlogTagsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
