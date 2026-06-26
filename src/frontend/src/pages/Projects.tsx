import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Project } from '@/types';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { QueryErrorState } from '@/components/ui/query-error';
import { useToast } from '@/components/ui/toaster';
import { APP_DOMAIN } from '@/lib/config';
import { Plus, GitBranch, ExternalLink, Trash2, Settings, FolderKanban } from 'lucide-react';

export function Projects() {
  const queryClient = useQueryClient();
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const { toast } = useToast();

  const { data: projects, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('projects'),
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => api.delete(`projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteDialog(null);
    },
    onError: () => {
      toast({ title: 'Delete failed', description: 'Could not delete the project.', variant: 'error' });
    },
  });

  const getStatusStyle = (status: Project['status']) => {
    switch (status) {
      case 'deployed':
        return 'success';
      case 'building':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" text="Loading projects..." />
      </div>
    );
  }

  if (isError) {
    return <QueryErrorState message="Failed to load projects." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-3 sm:space-y-4 font-body">
      <FadeIn>
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-bold mb-1">
              Projects
            </h1>
            <p className="text-xs text-text-secondary">
              Manage your deployments and projects
            </p>
          </div>
          <Button size="sm" asChild className="bg-blue-primary hover:bg-blue-vivid text-white text-xs h-8 px-3 rounded-lg">
            <Link to="/dashboard/projects/new">
              <Plus className="mr-1 h-3.5 w-3.5" />
              New Project
            </Link>
          </Button>
        </div>
      </FadeIn>

      {projects && projects.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <FadeIn key={project.id} delay={i * 100}>
              <div className="group relative p-3.5 sm:p-4 rounded-xl glass card-hover h-full">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-primary/10 to-transparent rounded-bl-[30px] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary truncate">{project.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={getStatusStyle(project.status) as any} className="text-[9px] px-1.5 py-0">
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button variant="ghost" size="icon" asChild className="h-7 w-7" aria-label="Project settings">
                        <Link to={`/dashboard/deploys/${project.id}?tab=settings`}>
                          <Settings className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog(project.id)}
                        className="h-7 w-7 text-error hover:text-error hover:bg-error/10"
                        aria-label="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-text-secondary min-w-0">
                      <GitBranch className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
                      <a
                        href={project.git_repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-primary hover:underline truncate"
                      >
                        {project.git_repo.split('/').pop()}
                      </a>
                      <span className="text-text-muted flex-shrink-0">·</span>
                      <span className="text-text-muted truncate">{project.git_branch}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ExternalLink className="h-3 w-3 text-text-muted flex-shrink-0" />
                      <a
                        href={`https://${project.subdomain}.${APP_DOMAIN}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-blue-primary transition-colors truncate text-[11px]"
                      >
                        {project.subdomain}.{APP_DOMAIN}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      ) : (
        <FadeIn>
          <div className="rounded-2xl glass p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="h-8 w-8 text-blue-glow" />
            </div>
            <h3 className="font-heading text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-text-secondary max-w-md mx-auto mb-6">
              Get started by creating your first project. Connect your Git repository and deploy in seconds.
            </p>
            <Button asChild className="bg-blue-primary hover:bg-blue-vivid">
              <Link to="/dashboard/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Link>
            </Button>
          </div>
        </FadeIn>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-5 sm:p-6 rounded-2xl glass">
            <h3 className="font-heading text-lg font-semibold mb-2">Delete Project</h3>
            <p className="text-text-secondary text-sm mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
