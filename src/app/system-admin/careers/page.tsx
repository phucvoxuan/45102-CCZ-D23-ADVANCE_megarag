'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DepartmentsManager } from '@/components/admin/cms/careers/DepartmentsManager';
import { JobListingsManager } from '@/components/admin/cms/careers/JobListingsManager';
import { JobApplicationsManager } from '@/components/admin/cms/careers/JobApplicationsManager';

export default function CareersCMSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Careers CMS</h1>
        <p className="text-gray-500">Manage job listings, departments, and applications</p>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">Job Listings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <JobListingsManager />
        </TabsContent>

        <TabsContent value="applications">
          <JobApplicationsManager />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
