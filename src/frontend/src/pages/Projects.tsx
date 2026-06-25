import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Project } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, GitBranch, ExternalLink, Trash2, Settings } from 'lucide-react';

export function Projects() {
  const queryClient = useQueryClient();
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('projects'),
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => api.delete(`projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteDialog(null);
    },
  });

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'deployed':
        return <Badge variant="success">Deployed</Badge>;
      case 'building':
        return <Badge variant="warning">Building</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-2">
            Projects
          </h1>
          <p className="text-text-secondary">
            Manage your deployments and projects
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects && projects.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Projects</CardTitle>
            <CardDescription>
              All your projects and their deployment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Repository</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <a
                          href={project.git_repo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-primary hover:underline"
                        >
                          <GitBranch className="h-4 w-4" />
                          {project.git_repo.split('/').pop()}
                        </a>
                      </TableCell>
                      <TableCell>{project.git_branch}</TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>
                        <a
                          href={`https://${project.subdomain}.vallexis.app`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-primary hover:underline"
                        >
                          {project.subdomain}.vallexis.app
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link to={`/dashboard/deploys/${project.id}`}>
                              <Settings className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog(project.id)}
                            className="text-error hover:text-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-border-subtle rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{project.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(project.status)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link to={`/dashboard/deploys/${project.id}`}>
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog(project.id)}
                        className="text-error hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-text-muted" />
                      <a
                        href={project.git_repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-primary hover:underline"
                      >
                        {project.git_repo.split('/').pop()}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">Branch:</span>
                      <span>{project.git_branch}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3 text-text-muted" />
                      <a
                        href={`https://${project.subdomain}.vallexis.app`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-primary hover:underline"
                      >
                        {project.subdomain}.vallexis.app
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="text-6xl">🚀</div>
              <h3 className="font-heading text-xl font-semibold">No projects yet</h3>
              <p className="text-text-secondary max-w-md">
                Get started by creating your first project. Connect your Git repository and deploy in seconds.
              </p>
              <Button asChild>
                <Link to="/dashboard/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Project</CardTitle>
              <CardDescription>
                Are you sure you want to delete this project? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteDialog)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
