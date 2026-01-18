'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PressReleasesManager } from '@/components/admin/cms/press/PressReleasesManager';
import { NewsCoverageManager } from '@/components/admin/cms/press/NewsCoverageManager';
import { PressKitManager } from '@/components/admin/cms/press/PressKitManager';
import { PressVideosManager } from '@/components/admin/cms/press/PressVideosManager';
import { CompanyFactsManager } from '@/components/admin/cms/press/CompanyFactsManager';

export default function PressCMSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Press CMS</h1>
        <p className="text-gray-500">Manage press releases, news coverage, videos, press kit, and company facts</p>
      </div>

      <Tabs defaultValue="releases" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="releases">Press Releases</TabsTrigger>
          <TabsTrigger value="coverage">News Coverage</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="kit">Press Kit</TabsTrigger>
          <TabsTrigger value="facts">Company Facts</TabsTrigger>
        </TabsList>

        <TabsContent value="releases">
          <PressReleasesManager />
        </TabsContent>

        <TabsContent value="coverage">
          <NewsCoverageManager />
        </TabsContent>

        <TabsContent value="videos">
          <PressVideosManager />
        </TabsContent>

        <TabsContent value="kit">
          <PressKitManager />
        </TabsContent>

        <TabsContent value="facts">
          <CompanyFactsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
