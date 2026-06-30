import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useKeyboardDialog } from '@/hooks/useKeyboardDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Project, Deploy } from '@/types';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { APP_DOMAIN } from '@/lib/config';
import { 
  Play, 
  RefreshCw, 
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

export function Deploys() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get('tab') === 'settings' ? 'settings' : 'deployments';
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const holdRafRef = useRef<number | null>(null);

  const deleteConfirmModalRef = useKeyboardDialog(deleteConfirm, () => { setDeleteConfirm(false); endHold(); });
  const eventSourceRef = useRef<EventSource | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [logSearch, setLogSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  const { data: deploys, isLoading } = useQuery({
    queryKey: ['deploys', projectId],
    queryFn: () => api.get<{ data: Deploy[] }>(`projects/${projectId}/deploys`).then(r => r.data),
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
    queryFn: () => api.get<{ data: Project[] }>('projects').then(r => r.data),
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

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    holdStartRef.current = Date.now();

    const loop = () => {
      if (holdStartRef.current === null) return;
      const elapsed = Date.now() - holdStartRef.current;
      const pct = Math.min((elapsed / 5000) * 100, 100);
      setHoldProgress(pct);

      if (pct >= 100) {
        deleteMutation.mutate();
      } else {
        holdRafRef.current = requestAnimationFrame(loop);
      }
    };

    holdRafRef.current = requestAnimationFrame(loop);
  };

  const endHold = () => {
    if (holdRafRef.current !== null) {
      cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    holdStartRef.current = null;
    setHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const startLogStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const url = `${apiUrl}/projects/${projectId}/deploys/stream`;

    const abortController = new AbortController();
    const fetchStream = async () => {
      try {
        const response = await fetch(url, {
          credentials: 'include',
          signal: abortController.signal,
        });

        if (!response.ok) {
          setIsStreaming(false);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        setIsStreaming(true);
        setLogs([]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n').filter(line => line.startsWith('data: '));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsStreaming(false);
              return;
            }
            setLogs(prev => {
              const next = [...prev, data];
              return next.length > 1000 ? next.slice(-999) : next;
            });
          }
        }
        setIsStreaming(false);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setIsStreaming(false);
        }
      }
    };

    fetchStream();
    eventSourceRef.current = { close: () => abortController.abort() } as EventSource;
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
      queryClient.invalidateQueries({ queryKey: ['deploys', projectId] });
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
      <div className="space-y-6 font-body">
        {/* Loading header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <div className="h-6 w-32 bg-bg-card rounded animate-pulse" />
            <div className="h-4 w-64 bg-bg-card rounded animate-pulse mt-1.5" />
          </div>
          <div className="h-10 w-28 bg-bg-card rounded animate-pulse" />
        </div>
        <div className="h-10 w-48 bg-bg-card rounded animate-pulse" />
        <Card className="p-4 h-64 animate-pulse" />
        <Card className="p-4 h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      {/* Top Header */}
      <FadeIn>
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight text-text-primary">
              {project ? project.name : 'Project Deployments'}
            </h1>
            <p className="text-xs text-text-secondary">
              Manage commits, terminal log streams, and environment details.
            </p>
          </div>
          
          {activeTab === 'deployments' && (
            <Button
              variant="primary"
              onClick={triggerDeploy}
              disabled={isStreaming}
              className="h-10 px-4"
            >
              <Play className="h-4 w-4 mr-1.5" />
              Deploy Now
            </Button>
          )}
        </div>
      </FadeIn>

      {/* Tabs Menu */}
      <FadeIn delay={50}>
        <div className="flex gap-1.5 p-1 rounded-xl glass w-fit">
          <button
            onClick={() => setSearchParams({ tab: 'deployments' })}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'deployments'
                ? 'bg-bg-card text-text-primary border border-border-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Terminal className="h-4 w-4" />
            Deployments
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'settings' })}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'settings'
                ? 'bg-bg-card text-text-primary border border-border-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <SettingsIcon className="h-4 w-4" />
            Project Settings
          </button>
        </div>
      </FadeIn>

      {/* Deployments Tab Content */}
      {activeTab === 'deployments' && (
        <div className="space-y-6">
          {/* Current Deployment Logs */}
          {currentDeploy ? (
            <FadeIn delay={100}>
              <Card className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle/50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 flex items-center justify-center">
                      <Terminal className="h-5 w-5 text-blue-glow" />
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

                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
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
                <div className="border border-border-subtle rounded-xl overflow-hidden shadow-lg bg-bg-deep/30">
                  {/* Terminal Header */}
                  <div className="bg-bg-deep/90 px-3 py-2 border-b border-border-subtle flex items-center justify-between flex-wrap gap-2 select-none">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-error/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
                      </div>
                      <span className="text-[10px] text-text-secondary font-mono ml-1.5 flex items-center gap-1">
                        <Terminal className="h-3 w-3" />
                        vallexis-builder@console:~
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Search logs input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Filter logs..."
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          className="bg-bg-surface border border-border-subtle rounded px-2.5 py-1 text-[11px] pl-6 text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-primary/40 w-36 md:w-48 transition-all font-mono"
                        />
                        <svg className="h-3 w-3 text-text-muted absolute left-2 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>

                      {/* Auto scroll toggle */}
                      <label className="flex items-center gap-1.5 text-xs text-text-secondary font-medium cursor-pointer mr-1">
                        <input
                          type="checkbox"
                          checked={autoScroll}
                          onChange={(e) => setAutoScroll(e.target.checked)}
                          className="rounded border-border-subtle bg-bg-surface text-blue-primary focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                        />
                        Auto-scroll
                      </label>

                      {/* Clear Logs */}
                      {logs.length > 0 && (
                        <button
                          onClick={() => setLogs([])}
                          className="text-xs px-2 py-1 rounded border border-border-subtle hover:bg-bg-card hover:text-text-primary text-text-secondary transition-colors cursor-pointer font-mono"
                        >
                          Clear
                        </button>
                      )}

                      {/* Stream Toggle */}
                      {isStreaming ? (
                        <button
                          onClick={stopLogStreaming}
                          className="text-xs px-2.5 py-1 rounded bg-error/10 hover:bg-error/25 border border-error/30 text-error transition-all cursor-pointer font-mono flex items-center gap-0.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping mr-0.5" />
                          Stop
                        </button>
                      ) : (
                        <button
                          onClick={startLogStreaming}
                          className="text-xs px-2.5 py-1 rounded bg-blue-primary/20 hover:bg-blue-primary/30 border border-blue-primary/40 text-blue-glow transition-all cursor-pointer font-mono flex items-center gap-0.5"
                        >
                          <RefreshCw className="h-3 w-3 animate-spin-slow mr-0.5" />
                          Stream
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Terminal Log Container */}
                  <div
                    ref={logContainerRef}
                    className="bg-bg-deep/90 p-4 h-60 sm:h-72 overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-thin text-text-secondary"
                  >
                    {logs.length > 0 ? (
                      (() => {
                        const filtered = logs.map((log, index) => ({ log, originalIndex: index }))
                          .filter(item => item.log.toLowerCase().includes(logSearch.toLowerCase()));

                        if (filtered.length === 0) {
                          return (
                            <div className="text-text-muted flex items-center justify-center h-full text-xs italic">
                              No log lines match "{logSearch}"
                            </div>
                          );
                        }

                        return filtered.map((item) => (
                          <div key={item.originalIndex} className="py-0.5 break-all hover:bg-bg-card/25 flex items-start">
                            <span className="text-text-muted select-none mr-3 w-8 text-right flex-shrink-0">{item.originalIndex + 1}</span>
                            <span className="text-text-primary whitespace-pre-wrap">{item.log}</span>
                          </div>
                        ));
                      })()
                    ) : (
                      <div className="text-text-muted flex flex-col items-center justify-center h-full text-xs space-y-2 py-8">
                        <Terminal className="h-8 w-8 text-text-muted/40" />
                        <span>
                          {isStreaming ? 'Connecting to container log stream...' : 'Terminal ready. Click "Stream" to view active build output'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </FadeIn>
          ) : (
            <FadeIn delay={100}>
              <Card className="p-8 text-center max-w-xl mx-auto space-y-4">
                <div className="w-12 h-12 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center mx-auto">
                  <Terminal className="h-6 w-6 text-blue-glow" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-base font-bold text-text-primary">No deployment sessions</h3>
                  <p className="text-xs text-text-secondary">
                    No active deployment session found. Trigger a deploy to monitor console logs.
                  </p>
                </div>
              </Card>
            </FadeIn>
          )}

          {/* Deployment History */}
          <FadeIn delay={150}>
            <Card className="p-4 space-y-4">
              <h2 className="font-heading text-sm font-semibold text-text-primary border-b border-border-subtle/50 pb-2">Deployment History</h2>

              {deploys && deploys.length > 0 ? (
                <div className="space-y-2.5">
                  {deploys.map((deploy) => (
                    <div
                      key={deploy.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-border-subtle bg-bg-surface/30 hover:border-border-interactive transition-all animate-fade-in"
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
                <div className="text-center py-8 text-text-muted text-xs">
                  No deployment history yet
                </div>
              )}
            </Card>
          </FadeIn>
        </div>
      )}

      {/* Project Settings Tab Content */}
      {activeTab === 'settings' && (
        <FadeIn delay={100}>
          <div className="space-y-6">
            {/* General Info Card */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle/50 pb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-primary/10 flex items-center justify-center border border-blue-primary/20">
                  <SettingsIcon className="h-5 w-5 text-blue-glow" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-semibold text-text-primary">Project Configuration</h2>
                  <p className="text-[10px] text-text-secondary">Core metadata for this container project</p>
                </div>
              </div>

              {project ? (
                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-border-subtle/50 pb-2.5">
                    <span className="text-text-secondary font-medium">Project Name:</span>
                    <span className="text-text-primary font-bold">{project.name}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-border-subtle/50 pb-2.5">
                    <span className="text-text-secondary font-medium">Project ID:</span>
                    <span className="font-mono text-[10.5px] text-text-primary bg-bg-deep px-2 py-0.5 rounded border border-border-subtle select-all w-fit">{project.id}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-border-subtle/50 pb-2.5">
                    <span className="text-text-secondary font-medium">Repository:</span>
                    <div className="flex items-center gap-1 text-blue-primary truncate">
                      <GitBranch className="h-4 w-4 flex-shrink-0" />
                      <a href={project.git_repo} target="_blank" rel="noopener noreferrer" className="hover:underline truncate font-mono">{project.git_repo}</a>
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-border-subtle/50 pb-2.5">
                    <span className="text-text-secondary font-medium">Branch:</span>
                    <span className="font-mono text-text-primary font-semibold">{project.git_branch}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="text-text-secondary font-medium">URL Subdomain:</span>
                    <div className="flex items-center gap-1.5 text-blue-glow truncate">
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      <a href={`https://${project.subdomain}.${APP_DOMAIN}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate font-mono">{project.subdomain}.{APP_DOMAIN}</a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-text-muted">Loading configuration...</div>
              )}
            </Card>

            {/* CLI Guide Card */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle/50 pb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-primary/10 flex items-center justify-center border border-purple-primary/20">
                  <Code className="h-5 w-5 text-purple-glow" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-semibold text-text-primary">Deploy via Vallexis CLI</h2>
                  <p className="text-[10px] text-text-secondary">Deploy code directly from your local terminal using `agy`</p>
                </div>
              </div>

              <div className="space-y-2 font-mono text-[11px] bg-bg-deep/80 p-3 rounded-lg border border-border-subtle text-text-secondary">
                <div><span className="text-text-muted"># Install CLI tool globally</span></div>
                <div className="text-text-primary">npm install -g @vallexis/cli</div>
                <div className="pt-2"><span className="text-text-muted"># Authenticate CLI with account token</span></div>
                <div className="text-text-primary">agy login</div>
                <div className="pt-2"><span className="text-text-muted"># Deploy workspace files to this project container</span></div>
                <div className="text-text-primary">agy deploy --project-id {projectId}</div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card variant="outlined" className="border-error/20 p-4 bg-error/[0.01] space-y-4">
              <div className="flex items-center gap-3 border-b border-error/10 pb-3">
                <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center border border-error/20">
                  <AlertTriangle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-semibold text-error">Danger Zone</h2>
                  <p className="text-[10px] text-text-secondary">Destructive project teardown operations</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Deleting this project is irreversible. This immediately halts container processes, removes DNS subdomain mapping, and drops database storage partitions.
              </p>
              
              <Button 
                variant="destructive" 
                onClick={() => setDeleteConfirm(true)}
                className="h-10 font-medium px-4 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </Button>
            </Card>
          </div>
        </FadeIn>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div ref={deleteConfirmModalRef} role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-4 sm:p-5 rounded-xl border border-border-subtle bg-bg-surface glass shadow-2xl m-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-error" />
              <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary">Delete Project</h3>
            </div>
            <p className="text-text-secondary text-xs leading-relaxed mb-5">
              Hold the action button down for 5 seconds to confirm you really want to delete this project. This will destroy all containers and files.
            </p>
            <div className="flex gap-2 justify-end text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setDeleteConfirm(false); endHold(); }}
                className="h-9 text-xs px-3 rounded-lg border-border-subtle"
              >
                Cancel
              </Button>
              <button
                disabled={deleteMutation.isPending}
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={startHold}
                onTouchEnd={endHold}
                className="relative overflow-hidden h-9 px-4 rounded-lg bg-error/10 border border-error/30 text-error text-xs font-semibold select-none cursor-pointer active:scale-95 transition-transform flex items-center justify-center min-w-[140px]"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-error/25 transition-all ease-linear"
                  style={{
                    width: `${holdProgress}%`,
                    transitionDuration: holdProgress === 0 ? '150ms' : '0ms'
                  }}
                />
                <span className="relative z-10">
                  {deleteMutation.isPending ? 'Deleting...' : holdProgress > 0 ? `Holding (${Math.round(holdProgress)}%)` : 'Hold to Delete'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
