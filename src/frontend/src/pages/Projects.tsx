import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Project } from '@/types';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { APP_DOMAIN } from '@/lib/config';
import { Plus, GitBranch, ExternalLink, Settings, FolderKanban, XCircle } from 'lucide-react';

export function Projects() {
  const { data: projects, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<{ data: Project[] }>('projects').then(r => r.data),
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = (domain: string, id: string) => {
    try {
      navigator.clipboard.writeText(`https://${domain}`);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = `https://${domain}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusStyle = (status: Project['status']): 'success' | 'warning' | 'destructive' | 'secondary' => {
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
      <div className="space-y-6 font-body">
        {/* Loading header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <div className="h-6 w-32 bg-bg-card rounded animate-pulse" />
            <div className="h-4 w-64 bg-bg-card rounded animate-pulse mt-1.5" />
          </div>
          <div className="h-10 w-28 bg-bg-card rounded animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <Card variant="outlined" className="p-6 max-w-md border-error/20 space-y-4">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <XCircle className="h-6 w-6 text-error" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base font-bold text-text-primary">Failed to load Projects</h3>
            <p className="text-xs text-text-secondary">There was an error loading your projects page.</p>
          </div>
          <Button onClick={() => refetch()} className="h-10 w-full bg-blue-primary">
            Retry Loading
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      {/* Standard Page Header */}
      <FadeIn>
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <h1 className="font-heading text-lg font-bold text-text-primary">Projects</h1>
            <p className="text-xs text-text-secondary">Manage your deployments and projects</p>
          </div>
          <Button variant="primary" asChild className="h-10 px-4">
            <Link to="/dashboard/projects/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </FadeIn>

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <FadeIn key={project.id} delay={i * 50}>
              <Card className="p-4 h-full flex flex-col justify-between hover:border-border-interactive transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-primary/10 to-transparent rounded-bl-[30px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="relative space-y-4 flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading text-base font-bold text-text-primary group-hover:text-blue-glow transition-colors truncate">{project.name}</h3>
                        <Badge variant={getStatusStyle(project.status)} className="text-[10px] px-1.5 py-0.5 uppercase tracking-wide font-mono">
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button variant="ghost" size="icon" asChild className="h-10 w-10 cursor-pointer" aria-label="Project settings">
                        <Link to={`/dashboard/deploys/${project.id}?tab=settings`}>
                          <Settings className="h-4 w-4 text-text-secondary hover:text-text-primary" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Deployment status */}
                  {project.status === 'deployed' ? (
                    <div className="bg-bg-deep/40 rounded-lg p-2 border border-border-subtle/50 text-xs flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      <span className="text-success font-semibold">Live</span>
                    </div>
                  ) : project.status === 'building' ? (
                    <div className="bg-bg-deep/40 rounded-lg p-2 border border-border-subtle/50 text-xs space-y-1">
                      <div className="flex justify-between text-text-secondary">
                        <span className="text-[10px]">Building image...</span>
                        <span className="font-mono text-[10px] animate-pulse">Running</span>
                      </div>
                      <div className="h-1.5 bg-bg-surface/50 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-warning to-purple-primary h-full rounded-full animate-shimmer" style={{ width: '65%' }} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-bg-deep/40 rounded-lg p-2 border border-border-subtle/50 text-xs text-text-muted flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-error" />
                      Container offline
                    </div>
                  )}

                  <div className="space-y-2 text-xs pt-2 border-t border-border-subtle/30">
                    <div className="flex items-center gap-1.5 text-text-secondary min-w-0">
                      <GitBranch className="h-4 w-4 text-text-muted flex-shrink-0" />
                      <a
                        href={project.git_repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-primary hover:underline truncate font-mono text-[11px]"
                      >
                        {project.git_repo.split('/').pop()}
                      </a>
                      <span className="text-text-muted flex-shrink-0">·</span>
                      <span className="text-text-muted truncate font-mono text-[10px]">{project.git_branch}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ExternalLink className="h-4 w-4 text-text-muted flex-shrink-0" />
                      <a
                        href={`https://${project.subdomain}.${APP_DOMAIN}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-blue-primary transition-colors truncate text-[11px]"
                      >
                        {project.subdomain}.{APP_DOMAIN}
                      </a>
                      <button
                        onClick={() => handleCopyUrl(`${project.subdomain}.${APP_DOMAIN}`, project.id)}
                        className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-bg-card transition-colors cursor-pointer"
                        title="Copy subdomain URL"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                      {copiedId === project.id && (
                        <span className="text-[10px] text-success animate-fade-in font-medium ml-1">Copied!</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      ) : (
        <FadeIn>
          <Card className="p-8 text-center max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center mx-auto">
              <FolderKanban className="h-6 w-6 text-blue-glow" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-bold text-text-primary">No projects yet</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Get started by creating your first project. Connect your Git repository and deploy in seconds.
              </p>
            </div>
            <Button variant="primary" asChild className="h-10 px-4 cursor-pointer">
              <Link to="/dashboard/projects/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Create Your First Project
              </Link>
            </Button>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}
