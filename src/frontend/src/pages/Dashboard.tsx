import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Project, StorageStats } from '@/types';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PLAN_LIMITS, APP_DOMAIN } from '@/lib/config';
import { 
  FolderKanban, 
  HardDrive, 
  Plus, 
  ArrowRight, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  GitBranch, 
  ExternalLink, 
  CreditCard 
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();

  const { data: projects, isLoading: projectsLoading, isError: projectsError, refetch: refetchProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<{ data: Project[] }>('projects').then(r => r.data),
  });

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['storage-stats'],
    queryFn: () => api.get<StorageStats>('storage/stats'),
  });

  const projectCount = projects?.length ?? 0;
  const userPlan = (user?.plan || 'free') as 'free' | 'starter' | 'pro';
  const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

  const storageUsed = stats ? (stats.used / (1024 * 1024 * 1024)).toFixed(2) : '0.00';
  const storageLimit = limits.storage;
  const storagePercent = Math.min(100, Math.round(((stats?.used || 0) / (limits.storage * 1024 * 1024 * 1024)) * 100));

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="h-3.5 w-3.5 text-success" />;
      case 'building':
        return <Clock className="h-3.5 w-3.5 text-warning animate-pulse" />;
      case 'failed':
        return <XCircle className="h-3.5 w-3.5 text-error" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-text-muted" />;
    }
  };

  if (projectsLoading || statsLoading) {
    return (
      <div className="space-y-6 font-body">
        {/* Standard Loading Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <div className="h-6 w-32 bg-bg-card rounded animate-pulse" />
            <div className="h-4 w-64 bg-bg-card rounded animate-pulse mt-1.5" />
          </div>
          <div className="h-10 w-28 bg-bg-card rounded animate-pulse" />
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (projectsError || statsError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <Card variant="outlined" className="p-6 max-w-md border-error/20 space-y-4">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <XCircle className="h-6 w-6 text-error" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base font-bold text-text-primary">Failed to load Dashboard</h3>
            <p className="text-xs text-text-secondary">There was an error loading your container applications or stats.</p>
          </div>
          <Button onClick={() => { refetchProjects(); refetchStats(); }} className="h-10 w-full bg-blue-primary">
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
            <h1 className="font-heading text-lg font-bold text-text-primary">Dashboard</h1>
            <p className="text-xs text-text-secondary">Overview of your container applications and resource consumption.</p>
          </div>
          <Button variant="primary" asChild className="h-10 px-4">
            <Link to="/dashboard/projects/new" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </FadeIn>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Active Projects */}
        <FadeIn delay={50}>
          <Card className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs uppercase font-semibold text-text-secondary">Active Projects</span>
              <FolderKanban className="h-4 w-4 text-blue-glow" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-text-primary leading-tight font-mono">
                {projectCount} / {limits.projects}
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted mt-1">
                <span className="text-success font-semibold">● {projects?.filter(p => p.status === 'deployed').length || 0} active</span>
                <span>·</span>
                <span className="text-warning">● {projects?.filter(p => p.status === 'building').length || 0} building</span>
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Stat 2: Object Storage */}
        <FadeIn delay={100}>
          <Card className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs uppercase font-semibold text-text-secondary">Object Storage</span>
              <HardDrive className="h-4 w-4 text-purple-glow" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-text-primary leading-tight font-mono">
                {storageUsed} / {storageLimit} GB
              </div>
              <div className="w-full bg-bg-deep h-1.5 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-purple-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1.5">{stats?.file_count || 0} files stored · {storagePercent}% of quota</p>
            </div>
          </Card>
        </FadeIn>

        {/* Stat 3: Current Plan */}
        <FadeIn delay={150}>
          <Card className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs uppercase font-semibold text-text-secondary">Subscription Plan</span>
              <CreditCard className="h-4 w-4 text-success" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-text-primary leading-tight">
                {limits.name}
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className="text-xs text-text-muted">Quota resets monthly</span>
                <Link 
                  to="/dashboard/billing" 
                  className="text-xs text-blue-primary hover:text-blue-glow transition-colors inline-flex items-center gap-0.5"
                >
                  Manage <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Stat 4: API Status */}
        <FadeIn delay={200}>
          <Card className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs uppercase font-semibold text-text-secondary">API Status</span>
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-success leading-tight flex items-center gap-1">
                Operational
              </div>
              <div className="text-xs text-text-muted mt-1.5 font-mono">All services healthy</div>
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Main Panel */}
      <FadeIn delay={250}>
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h2 className="font-heading text-base font-bold text-text-primary">Container Applications</h2>
              <p className="text-xs text-text-secondary">Connected repositories and active service domains</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-10 text-text-secondary hover:text-text-primary">
              <Link to="/dashboard/projects" className="flex items-center gap-1.5">
                Manage all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {projectCount > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects?.map((project) => (
                <Card 
                  key={project.id} 
                  variant="outlined"
                  className="p-4 flex flex-col justify-between gap-3 hover:border-border-interactive transition-all relative overflow-hidden h-full"
                >
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-blue-primary/5 to-transparent rounded-bl-[24px] pointer-events-none" />
                  
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-text-primary group-hover:text-blue-glow transition-colors truncate">
                          {project.name}
                        </span>
                        <span className="flex-shrink-0">
                          {getStatusIcon(project.status)}
                        </span>
                        <Badge 
                          variant={
                            project.status === 'deployed' ? 'success' :
                            project.status === 'building' ? 'warning' :
                            project.status === 'failed' ? 'destructive' : 'secondary'
                          }
                          className="text-[10px] py-0.5 px-1.5 uppercase font-mono"
                        >
                          {project.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-1 min-w-0">
                        <a
                          href={`https://${project.subdomain}.${APP_DOMAIN}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-text-secondary hover:text-blue-glow inline-flex items-center gap-0.5 truncate"
                        >
                          {project.subdomain}.{APP_DOMAIN} <ExternalLink className="h-3 w-3" />
                        </a>
                        <button
                          onClick={() => handleCopyUrl(`${project.subdomain}.${APP_DOMAIN}`, project.id)}
                          className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-bg-card transition-colors cursor-pointer"
                          title="Copy subdomain URL"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                        {copiedId === project.id && (
                          <span className="text-[10px] text-success animate-fade-in font-medium">Copied!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deployment Status */}
                  {project.status === 'deployed' ? (
                    <div className="bg-bg-deep/30 rounded-lg p-2 border border-border-subtle/40 text-xs flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      <span className="text-success font-semibold">Live</span>
                      <span className="text-text-muted">·</span>
                      <span className="text-text-secondary font-mono">{project.subdomain}.{APP_DOMAIN}</span>
                    </div>
                  ) : project.status === 'building' ? (
                    <div className="bg-bg-deep/30 rounded-lg p-2 border border-border-subtle/40 text-xs space-y-1">
                      <div className="flex justify-between text-text-secondary">
                        <span className="font-semibold text-[10px]">Building container image...</span>
                        <span className="font-mono text-[10px] animate-pulse">In Progress</span>
                      </div>
                      <div className="h-1.5 bg-bg-surface/50 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-warning to-purple-primary h-full rounded-full animate-shimmer" style={{ width: '65%' }} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-bg-deep/30 rounded-lg p-2 border border-border-subtle/40 text-xs text-text-muted flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-error" />
                      Container processes offline
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs border-t border-border-subtle/50 pt-2">
                    <div className="flex items-center gap-1.5 text-text-muted min-w-0">
                      <GitBranch className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" />
                      <span className="truncate text-text-secondary font-mono text-[10px]">{project.git_repo.split('/').pop()}</span>
                      <span className="flex-shrink-0">·</span>
                      <span className="truncate font-mono text-[10px]">{project.git_branch}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      asChild 
                      className="h-10 border-border-interactive hover:bg-bg-card text-text-primary flex-shrink-0 px-3 cursor-pointer"
                    >
                      <Link to={`/dashboard/deploys/${project.id}`} className="flex items-center gap-1">
                        Manage <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border-subtle/60 rounded-xl bg-bg-surface/5">
              <div className="w-12 h-12 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center mx-auto mb-3">
                <FolderKanban className="h-6 w-6 text-text-muted" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">No active projects yet</h3>
              <p className="text-xs text-text-secondary mb-4 max-w-xs mx-auto">
                Connect a repository to deploy your web application container.
              </p>
              <Button asChild className="bg-blue-primary hover:bg-blue-vivid text-white h-10 px-4 cursor-pointer">
                <Link to="/dashboard/projects/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Connect Repository
                </Link>
              </Button>
            </div>
          )}
        </Card>
      </FadeIn>
    </div>
  );
}
