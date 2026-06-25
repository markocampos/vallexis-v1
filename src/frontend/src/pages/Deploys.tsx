import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, RefreshCw, X, Terminal, Clock, CheckCircle, XCircle } from 'lucide-react';

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
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
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

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const eventSource = new EventSource(`${apiUrl}/projects/${projectId}/deploys/stream`);
    
    eventSourceRef.current = eventSource;
    setIsStreaming(true);
    setLogs([]);

    eventSource.onmessage = (event) => {
      setLogs(prev => [...prev, event.data]);
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
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
      console.error('Failed to trigger deploy:', error);
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
        <div className="text-text-muted">Loading deploys...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-2">
            Deployments
          </h1>
          <p className="text-text-secondary">
            Manage and monitor your project deployments
          </p>
        </div>
        <Button onClick={triggerDeploy} disabled={isStreaming}>
          <Play className="mr-2 h-4 w-4" />
          Deploy Now
        </Button>
      </div>

      {/* Current Deployment */}
      {currentDeploy && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Current Deployment
                </CardTitle>
                <CardDescription>
                  {currentDeploy.commit_message || 'No commit message'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(currentDeploy.status)}
                {getStatusBadge(currentDeploy.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                <span>Commit: {currentDeploy.commit_hash?.slice(0, 7) || 'N/A'}</span>
                <span>•</span>
                <span>Started: {new Date(currentDeploy.created_at).toLocaleString()}</span>
                {currentDeploy.completed_at && (
                  <>
                    <span>•</span>
                    <span>Completed: {new Date(currentDeploy.completed_at).toLocaleString()}</span>
                  </>
                )}
              </div>

              {/* Log Terminal */}
              <div className="relative">
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  {isStreaming ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={stopLogStreaming}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startLogStreaming}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Stream Logs
                    </Button>
                  )}
                </div>
                <div
                  ref={logContainerRef}
                  className="bg-bg-deep border border-border-subtle rounded-lg p-4 h-64 sm:h-96 overflow-y-auto font-mono text-xs sm:text-sm"
                >
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} className="py-1 break-all">
                        <span className="text-text-muted">{index + 1}:</span> {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-text-muted flex items-center justify-center h-full">
                      {isStreaming ? 'Waiting for logs...' : 'Click "Stream Logs" to view deployment logs'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment History */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
          <CardDescription>
            Past deployments and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deploys && deploys.length > 0 ? (
            <div className="space-y-3">
              {deploys.map((deploy) => (
                <div
                  key={deploy.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-border-subtle rounded-lg hover:bg-bg-card transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(deploy.status)}
                    <div>
                      <p className="font-medium">{deploy.commit_message || 'No commit message'}</p>
                      <p className="text-sm text-text-secondary">
                        {deploy.commit_hash?.slice(0, 7) || 'N/A'} • {new Date(deploy.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(deploy.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted">
              No deployment history yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}