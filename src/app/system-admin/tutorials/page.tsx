'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TutorialsManager } from '@/components/admin/cms/tutorials/TutorialsManager';
import { TutorialLevelsManager } from '@/components/admin/cms/tutorials/TutorialLevelsManager';
import { TutorialTopicsManager } from '@/components/admin/cms/tutorials/TutorialTopicsManager';
import { PlayCircle, BarChart3, FolderOpen } from 'lucide-react';

export default function TutorialsManagementPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tutorials Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage video tutorials, levels, and topics</p>
      </div>

      <Tabs defaultValue="tutorials" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="tutorials" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Tutorials
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Levels
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Topics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutorials" className="mt-6">
          <TutorialsManager />
        </TabsContent>

        <TabsContent value="levels" className="mt-6">
          <TutorialLevelsManager />
        </TabsContent>

        <TabsContent value="topics" className="mt-6">
          <TutorialTopicsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
