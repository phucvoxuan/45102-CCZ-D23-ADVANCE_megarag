'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChangelogTypesManager } from '@/components/admin/cms/changelog/ChangelogTypesManager';
import { ChangelogEntriesManager } from '@/components/admin/cms/changelog/ChangelogEntriesManager';

export default function ChangelogCMSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Changelog CMS</h1>
        <p className="text-gray-500">Manage changelog entries and release notes</p>
      </div>

      <Tabs defaultValue="entries" className="space-y-6">
        <TabsList>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <ChangelogEntriesManager />
        </TabsContent>

        <TabsContent value="types">
          <ChangelogTypesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
