'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Server, Database, CreditCard, Mail } from 'lucide-react';

export default function SystemSettingsPage() {
  // Check which services are configured
  const services = [
    {
      name: 'Supabase',
      icon: Database,
      status: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      description: 'Database and authentication',
    },
    {
      name: 'Google AI (Gemini)',
      icon: Server,
      status: true, // Assuming API key is set
      description: 'Embeddings and LLM',
    },
    {
      name: 'Stripe',
      icon: CreditCard,
      status: process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true',
      description: 'Payment processing',
    },
    {
      name: 'Payhip',
      icon: CreditCard,
      status: process.env.NEXT_PUBLIC_PAYHIP_ENABLED === 'true',
      description: 'Alternative payment provider',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Platform configuration and status</p>
      </div>

      {/* Super Admin Info */}
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Super Admin Access
          </CardTitle>
          <CardDescription>
            You have full system administration privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Admin Email:</strong> phucvoxuan@gmail.com
            </p>
            <p className="text-sm text-muted-foreground">
              Only this email can access the System Admin panel. To change this, update the SUPER_ADMIN_EMAIL
              constant in <code className="bg-muted px-1 rounded">src/app/system-admin/layout.tsx</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>External services configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <service.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">{service.description}</div>
                  </div>
                </div>
                <Badge variant={service.status ? 'default' : 'secondary'}>
                  {service.status ? 'Configured' : 'Not Configured'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>Current deployment configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Node Environment</div>
              <div className="font-medium">{process.env.NODE_ENV}</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">App URL</div>
              <div className="font-medium truncate">
                {process.env.NEXT_PUBLIC_APP_URL || 'Not set'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>To add another Super Admin:</strong> Modify the SUPER_ADMIN_EMAIL check in
              the layout file to use an array of emails, or implement a roles table in Supabase.
            </p>
            <p>
              <strong>Payment Provider Toggle:</strong> Set NEXT_PUBLIC_STRIPE_ENABLED and
              NEXT_PUBLIC_PAYHIP_ENABLED in your .env file.
            </p>
            <p>
              <strong>Database migrations:</strong> Run SQL migrations in Supabase SQL Editor
              for schema changes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
