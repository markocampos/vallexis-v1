import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QueryErrorState } from '@/components/ui/query-error';
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

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
  git_repo: string;
  git_branch: string;
  subdomain: string;
}

interface StorageStats {
  used: number;
  limit: number;
  file_count: number;
}

export function Dashboard() {
  const { user } = useAuth();

  const { data: projects, isLoading: projectsLoading, isError: projectsError, refetch: refetchProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('projects'),
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'building':
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-error" />;
      default:
        return <Activity className="h-4 w-4 text-text-muted" />;
    }
  };

  if (projectsLoading || statsLoading) {
    return (
      <div className="space-y-4 font-body">
        <div className="border-b border-border-subtle pb-3">
          <div className="h-5 w-32 bg-bg-card rounded animate-pulse" />
          <div className="h-3 w-64 bg-bg-card rounded animate-pulse mt-1" />
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3.5 rounded-xl glass border border-border-subtle bg-bg-surface/10 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (projectsError || statsError) {
    return (
      <QueryErrorState
        message="Failed to load dashboard data."
        onRetry={() => { refetchProjects(); refetchStats(); }}
      />
    );
  }

  return (
    <div className="space-y-4 font-body">
      {/* Dashboard Top Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-subtle pb-3">
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs text-text-secondary">
              Overview of your container applications and resource consumption.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" asChild className="bg-blue-primary hover:bg-blue-vivid text-white shadow-sm rounded-lg text-xs h-8 px-3">
              <Link to="/dashboard/projects/new" className="flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" />
                New Project
              </Link>
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Active Projects */}
        <FadeIn delay={50}>
          <div className="relative p-3.5 rounded-xl glass border border-border-subtle bg-bg-surface/10 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-text-secondary">Active Projects</span>
              <FolderKanban className="h-4 w-4 text-blue-glow" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-text-primary leading-tight font-mono">
                {projectCount} / {limits.projects}
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">Projects allocation limit</p>
            </div>
          </div>
        </FadeIn>

        {/* Stat 2: Object Storage */}
        <FadeIn delay={100}>
          <div className="relative p-3.5 rounded-xl glass border border-border-subtle bg-bg-surface/10 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-text-secondary">Object Storage</span>
              <HardDrive className="h-4 w-4 text-purple-glow" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-text-primary leading-tight font-mono">
                {storageUsed} / {storageLimit} GB
              </div>
              <div className="w-full bg-bg-deep h-1 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-purple-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-1">{storagePercent}% capacity consumed</p>
            </div>
          </div>
        </FadeIn>

        {/* Stat 3: Current Plan */}
        <FadeIn delay={150}>
          <div className="relative p-3.5 rounded-xl glass border border-border-subtle bg-bg-surface/10 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-text-secondary">Subscription Plan</span>
              <CreditCard className="h-4 w-4 text-success" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold text-text-primary leading-tight">
                {limits.name}
              </div>
              <Link 
                to="/dashboard/billing" 
                className="text-[10px] text-blue-primary hover:text-blue-glow transition-colors mt-0.5 inline-flex items-center gap-0.5"
              >
                Manage subscription <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* Stat 4: Edge Status */}
        <FadeIn delay={200}>
          <div className="relative p-3.5 rounded-xl glass border border-border-subtle bg-bg-surface/10 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-text-secondary">Edge Network</span>
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold text-success leading-tight flex items-center gap-1.5">
                Operational
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">All systems operational</p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Main Panel */}
      <FadeIn delay={250}>
        <div className="rounded-xl glass border border-border-subtle p-4">
          <div className="flex items-center justify-between mb-4 border-b border-border-subtle/50 pb-2.5">
            <div>
              <h2 className="font-heading text-sm sm:text-base font-bold text-text-primary">Container Applications</h2>
              <p className="text-[11px] text-text-secondary">Connected repositories and service domains</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-2.5 text-text-secondary hover:text-text-primary">
              <Link to="/dashboard/projects" className="flex items-center gap-1">
                Manage all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {projectCount > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects?.map((project) => (
                <div 
                  key={project.id} 
                  className="p-3.5 rounded-xl border border-border-subtle bg-bg-surface/30 glass hover:border-border-interactive transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text-primary group-hover:text-blue-glow transition-colors truncate">
                          {project.name}
                        </span>
                        <span className="flex-shrink-0">
                          {getStatusIcon(project.status)}
                        </span>
                      </div>
                      <a
                        href={`https://${project.subdomain}.${APP_DOMAIN}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-text-secondary hover:text-blue-glow inline-flex items-center gap-1 mt-0.5 truncate"
                      >
                        {project.subdomain}.{APP_DOMAIN} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <Badge 
                      variant={
                        project.status === 'deployed' ? 'success' :
                        project.status === 'building' ? 'warning' :
                        project.status === 'failed' ? 'destructive' : 'secondary'
                      }
                      className="text-[10px] py-0 px-2 uppercase tracking-wide font-mono flex-shrink-0"
                    >
                      {project.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] border-t border-border-subtle/50 pt-2.5">
                    <div className="flex items-center gap-1.5 text-text-muted min-w-0">
                      <GitBranch className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{project.git_repo.split('/').pop()}</span>
                      <span className="flex-shrink-0">·</span>
                      <span className="truncate">{project.git_branch}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      asChild 
                      className="h-7 text-xs border-border-interactive hover:bg-bg-card text-text-primary flex-shrink-0 px-2.5"
                    >
                      <Link to={`/dashboard/deploys/${project.id}`} className="flex items-center gap-0.5">
                        Manage <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border-subtle/60 rounded-xl bg-bg-surface/5">
              <div className="w-10 h-10 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center mx-auto mb-3">
                <FolderKanban className="h-5 w-5 text-text-muted" />
              </div>
              <p className="text-xs font-semibold text-text-primary mb-1">No active projects yet</p>
              <p className="text-[11px] text-text-secondary mb-4 max-w-xs mx-auto">
                Connect your Github repository to deploy your web application container now.
              </p>
              <Button size="sm" asChild className="bg-blue-primary hover:bg-blue-vivid text-white text-xs h-8 px-4 rounded-lg">
                <Link to="/dashboard/projects/new">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Connect Repository
                </Link>
              </Button>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
