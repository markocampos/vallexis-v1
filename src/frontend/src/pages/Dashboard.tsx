import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Database, HardDrive, Plus } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          Dashboard
        </h1>
        <p className="text-text-secondary">
          Welcome back! Here's an overview of your projects and usage.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Quick Deploy
            </CardTitle>
            <CardDescription>Deploy your projects in seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <a href="/dashboard/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Projects
            </CardTitle>
            <CardDescription>Manage your deployments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-sm text-text-secondary">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage
            </CardTitle>
            <CardDescription>Your storage usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2 GB</div>
            <p className="text-sm text-text-secondary">of 2 GB used</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest deployments and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border-subtle pb-4">
              <div>
                <p className="font-medium">my-saas-app</p>
                <p className="text-sm text-text-secondary">Deployed successfully</p>
              </div>
              <Badge variant="success">Success</Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border-subtle pb-4">
              <div>
                <p className="font-medium">portfolio-site</p>
                <p className="text-sm text-text-secondary">Building...</p>
              </div>
              <Badge variant="warning">Building</Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-medium">api-gateway</p>
                <p className="text-sm text-text-secondary">Deploy failed</p>
              </div>
              <Badge variant="destructive">Failed</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
