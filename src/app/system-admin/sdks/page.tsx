'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SDKsManager } from '@/components/admin/cms/sdks/SDKsManager';
import { SDKExamplesManager } from '@/components/admin/cms/sdks/SDKExamplesManager';

export default function SDKsCMSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SDKs CMS</h1>
        <p className="text-gray-500">Manage SDK documentation and code examples</p>
      </div>

      <Tabs defaultValue="sdks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sdks">SDKs</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="sdks">
          <SDKsManager />
        </TabsContent>

        <TabsContent value="examples">
          <SDKExamplesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
