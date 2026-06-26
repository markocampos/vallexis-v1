import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { APP_DOMAIN } from '@/lib/config';
import { 
  Play, 
  RefreshCw, 
  X, 
  Terminal, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Settings as SettingsIcon, 
  Trash2, 
  AlertTriangle,
  GitBranch,
  ExternalLink,
  Code
} from 'lucide-react';

interface Deploy {
  id: string;
  project_id: string;
  status: 'pending' | 'building' | 'deployed' | 'failed';
  created_at: string;
  completed_at?: string;
  commit_hash?: string;
  commit_message?: string;
}

export function Deploys() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get('tab') === 'settings' ? 'settings' : 'deployments';
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const { data: deploys, isLoading } = useQuery({
    queryKey: ['deploys', projectId],
    queryFn: () => api.get<Deploy[]>(`projects/${projectId}/deploys`),
    enabled: !!projectId,
  });

  const { data: currentDeploy } = useQuery({
    queryKey: ['current-deploy', projectId],
    queryFn: () => api.get<Deploy>(`projects/${projectId}/deploys/current`),
    enabled: !!projectId,
    refetchInterval: isStreaming ? 2000 : false,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<any[]>('projects'),
  });

  const project = projects?.find((p) => p.id === projectId);

  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/dashboard/projects');
    },
    onError: () => {
      toast({ title: 'Delete failed', description: 'Could not delete the project.', variant: 'error' });
    },
  });

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const startLogStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const eventSource = new EventSource(`${apiUrl}/projects/${projectId}/deploys/stream`);

    eventSourceRef.current = eventSource;
    setIsStreaming(true);
    setLogs([]);

    eventSource.onmessage = (event) => {
      setLogs(prev => [...prev, event.data]);
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
    };

    eventSource.addEventListener('deploy_complete', () => {
      eventSource.close();
      setIsStreaming(false);
    });
  };

  const stopLogStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  };

  const triggerDeploy = async () => {
    try {
      await api.post(`projects/${projectId}/deploys`, {});
      startLogStreaming();
    } catch (error) {
      toast({ title: 'Deploy failed', description: error instanceof Error ? error.message : 'Could not trigger deployment.', variant: 'error' });
    }
  };

  const getStatusIcon = (status: Deploy['status']) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-error" />;
      case 'building':
        return <RefreshCw className="h-4 w-4 text-warning animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-text-muted" />;
    }
  };

  const getStatusBadge = (status: Deploy['status']) => {
    switch (status) {
      case 'deployed':
        return <Badge variant="success">Deployed</Badge>;
      case 'building':
        return <Badge variant="warning">Building</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" text="Loading deployments..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 font-body">
      {/* Top Header */}
      <FadeIn>
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight">
              {project ? project.name : 'Project Deployments'}
            </h1>
            <p className="text-xs text-text-secondary">
              Manage commits, terminal log streams, and environment details.
            </p>
          </div>
          
          {activeTab === 'deployments' && (
            <Button
              size="sm"
              onClick={triggerDeploy}
              disabled={isStreaming}
              className="bg-blue-primary hover:bg-blue-vivid text-white text-xs h-8 px-3 rounded-lg"
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Deploy Now
            </Button>
          )}
        </div>
      </FadeIn>

      {/* Tabs Menu */}
      <FadeIn delay={50}>
        <div className="flex gap-1 p-1 rounded-xl glass w-fit">
          <button
            onClick={() => setSearchParams({ tab: 'deployments' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'deployments'
                ? 'bg-bg-card text-text-primary border border-border-interactive/30'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Deployments
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'settings' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'settings'
                ? 'bg-bg-card text-text-primary border border-border-interactive/30'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <SettingsIcon className="h-3.5 w-3.5" />
            Project Settings
          </button>
        </div>
      </FadeIn>

      {/* Deployments Tab Content */}
      {activeTab === 'deployments' && (
        <div className="space-y-4">
          {/* Current Deployment Logs */}
          {currentDeploy ? (
            <FadeIn delay={100}>
              <div className="rounded-xl glass border border-border-subtle p-4 bg-bg-surface/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 flex items-center justify-center">
                      <Terminal className="h-4.5 w-4.5 text-blue-glow" />
                    </div>
                    <div>
                      <h2 className="font-heading text-sm font-semibold text-text-primary">Current Deployment</h2>
                      <p className="text-[11px] text-text-secondary truncate max-w-sm">
                        {currentDeploy.commit_message || 'No commit message'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {getStatusIcon(currentDeploy.status)}
                    {getStatusBadge(currentDeploy.status)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] text-text-muted mb-3.5 border-b border-border-subtle/50 pb-2">
                  <span>Commit: {currentDeploy.commit_hash?.slice(0, 7) || 'N/A'}</span>
                  <span>·</span>
                  <span>Started: {new Date(currentDeploy.created_at).toLocaleString()}</span>
                  {currentDeploy.completed_at && (
                    <>
                      <span>·</span>
                      <span>Completed: {new Date(currentDeploy.completed_at).toLocaleString()}</span>
                    </>
                  )}
                </div>

                {/* Log Terminal */}
                <div className="relative">
                  <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                    {isStreaming ? (
                      <Button size="sm" variant="outline" onClick={stopLogStreaming} className="h-7 text-[10px] px-2.5 glass border-border-subtle">
                        <X className="h-3 w-3 mr-1" /> Stop Streaming
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={startLogStreaming} className="h-7 text-[10px] px-2.5 glass border-border-subtle">
                        <RefreshCw className="h-3 w-3 mr-1" /> Stream Logs
                      </Button>
                    )}
                  </div>
                  <div
                    ref={logContainerRef}
                    className="bg-bg-deep/70 border border-border-subtle rounded-lg p-3 h-48 sm:h-64 overflow-y-auto font-mono text-[10.5px] leading-relaxed scrollbar-thin"
                  >
                    {logs.length > 0 ? (
                      logs.map((log, index) => (
                        <div key={index} className="py-0.5 break-all hover:bg-bg-card/25">
                          <span className="text-text-muted select-none mr-2">{String(index + 1).padStart(3, ' ')}</span>
                          <span className="text-text-secondary">{log}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-text-muted flex items-center justify-center h-full text-xs">
                        {isStreaming ? 'Waiting for logs...' : 'Click "Stream Logs" to load active container log output'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </FadeIn>
          ) : (
            <FadeIn delay={100}>
              <div className="rounded-xl glass border border-border-subtle p-6 text-center text-xs text-text-muted">
                No active deployment session found. Trigger a deploy to monitor console logs.
              </div>
            </FadeIn>
          )}

          {/* Deployment History */}
          <FadeIn delay={150}>
            <div className="rounded-xl glass border border-border-subtle p-4 bg-bg-surface/10">
              <h2 className="font-heading text-sm font-semibold text-text-primary mb-3">Deployment History</h2>

              {deploys && deploys.length > 0 ? (
                <div className="space-y-2">
                  {deploys.map((deploy) => (
                    <div
                      key={deploy.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-border-subtle bg-bg-surface/30 hover:border-border-interactive transition-all"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="mt-0.5">{getStatusIcon(deploy.status)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-text-primary truncate">{deploy.commit_message || 'No commit message'}</p>
                          <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                            {deploy.commit_hash?.slice(0, 7) || 'N/A'} · {new Date(deploy.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 self-end sm:self-center">
                        {getStatusBadge(deploy.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-text-muted text-xs">
                  No deployment history yet
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      )}

      {/* Project Settings Tab Content */}
      {activeTab === 'settings' && (
        <FadeIn delay={100}>
          <div className="space-y-4">
            {/* General Info Card */}
            <div className="rounded-xl glass border border-border-subtle p-4 bg-bg-surface/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-primary/10 flex items-center justify-center border border-blue-primary/20">
                  <SettingsIcon className="h-4 w-4 text-blue-glow" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-semibold text-text-primary">Project Configuration</h2>
                  <p className="text-[10px] text-text-secondary">Core metadata for this container project</p>
                </div>
              </div>

              {project ? (
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="grid grid-cols-[110px_1fr] gap-2 border-b border-border-subtle/50 pb-2">
                    <span className="text-text-secondary">Project Name:</span>
                    <span className="text-text-primary font-bold">{project.name}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 border-b border-border-subtle/50 pb-2">
                    <span className="text-text-secondary">Project ID:</span>
                    <span className="font-mono text-[10.5px] text-text-primary bg-bg-deep px-1.5 py-0.5 rounded border border-border-subtle select-all w-fit">{project.id}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 border-b border-border-subtle/50 pb-2">
                    <span className="text-text-secondary">Repository:</span>
                    <div className="flex items-center gap-1 text-blue-primary truncate">
                      <GitBranch className="h-3.5 w-3.5 flex-shrink-0" />
                      <a href={project.git_repo} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{project.git_repo}</a>
                    </div>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2 border-b border-border-subtle/50 pb-2">
                    <span className="text-text-secondary">Branch:</span>
                    <span className="font-mono text-text-primary font-semibold">{project.git_branch}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-2">
                    <span className="text-text-secondary">URL Subdomain:</span>
                    <div className="flex items-center gap-1 text-blue-glow truncate">
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <a href={`https://${project.subdomain}.${APP_DOMAIN}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{project.subdomain}.{APP_DOMAIN}</a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-text-muted">Loading configuration...</div>
              )}
            </div>

            {/* CLI Guide Card */}
            <div className="rounded-xl glass border border-border-subtle p-4 bg-bg-surface/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-primary/10 flex items-center justify-center border border-purple-primary/20">
                  <Code className="h-4 w-4 text-purple-glow" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-semibold text-text-primary">Deploy via Vallexis CLI</h2>
                  <p className="text-[10px] text-text-secondary">Deploy code directly from your local terminal using `agy`</p>
                </div>
              </div>

              <div className="space-y-2 font-mono text-[10px] bg-bg-deep/80 p-3 rounded-lg border border-border-subtle text-text-secondary">
                <div><span className="text-text-muted"># Install CLI tool globally</span></div>
                <div>npm install -g @vallexis/cli</div>
                <div className="pt-1.5"><span className="text-text-muted"># Authenticate CLI with account token</span></div>
                <div>agy login</div>
                <div className="pt-1.5"><span className="text-text-muted"># Deploy workspace files to this project container</span></div>
                <div>agy deploy --project-id {projectId}</div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl glass border border-error/20 p-4 bg-error/[0.01]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center border border-error/20">
                  <AlertTriangle className="h-4 w-4 text-error" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-semibold text-error">Danger Zone</h2>
                  <p className="text-[10px] text-text-secondary">Destructive project teardown operations</p>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary mb-3.5">
                Deleting this project is irreversible. This immediately halts container processes, removes DNS subdomain mapping, and drops database storage partitions.
              </p>
              
              <Button 
                variant="destructive" 
                onClick={() => setDeleteConfirm(true)}
                className="h-8 text-xs font-semibold px-4 rounded-lg bg-error hover:bg-error/90 text-white shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Project
              </Button>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-4 sm:p-5 rounded-xl border border-border-subtle bg-bg-surface glass shadow-2xl m-3">
            <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary mb-1.5">Delete Project</h3>
            <p className="text-text-secondary text-xs leading-relaxed mb-5">
              Are you sure you want to permanently delete this project? This will destroy all containers and files. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end text-xs">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)} className="h-8 text-xs px-3 rounded-lg">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="h-8 text-xs px-4 bg-error hover:bg-error/90 text-white rounded-lg"
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
