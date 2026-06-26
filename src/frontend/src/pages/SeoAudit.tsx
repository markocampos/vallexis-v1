import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toaster';
import { SEO_RESULT_LABELS } from '@/lib/config';
import { Search, CheckCircle, XCircle, AlertCircle, Loader2, Globe } from 'lucide-react';

interface SeoAuditResult {
  id: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  score: number;
  created_at: string;
  results?: Record<string, { status: 'pass' | 'fail' | 'warning'; message: string; value?: string }>;
}

export function SeoAudit() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);

  const { toast } = useToast();

  const { data: audits, isLoading, isError, refetch } = useQuery({
    queryKey: ['seo-audits'],
    queryFn: () => api.get<SeoAuditResult[]>('seo/audits'),
  });

  const auditMutation = useMutation({
    mutationFn: (auditUrl: string) => api.post('seo/audit', { url: auditUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-audits'] });
      setUrl('');
      setIsAuditing(false);
    },
    onError: () => {
      setIsAuditing(false);
      toast({ title: 'Audit failed', description: 'Could not complete the SEO audit.', variant: 'error' });
    },
  });

  const handleAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsAuditing(true);
    auditMutation.mutate(url);
  };

  const getStatusIcon = (status: SeoAuditResult['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-error" />;
      case 'running': return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-text-muted" />;
    }
  };

  const getCheckIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'fail': return <XCircle className="h-4 w-4 text-error" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getResultLabel = (key: string) => {
    return SEO_RESULT_LABELS[key] || key;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" text="Loading SEO audits..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <FadeIn>
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-bold mb-1">SEO Audit</h1>
            <p className="text-xs text-text-secondary">Analyze and improve your website's SEO performance</p>
          </div>
        </FadeIn>
        <div className="rounded-xl glass p-3.5 sm:p-4 text-center">
          <p className="text-text-secondary text-sm mb-3">Failed to load SEO audits.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs px-3 rounded-lg">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <FadeIn>
        <div>
          <h1 className="font-heading text-lg sm:text-xl font-bold mb-1">SEO Audit</h1>
          <p className="text-xs text-text-secondary">Analyze and improve your website's SEO performance</p>
        </div>
      </FadeIn>

      {/* New Audit Form */}
      <FadeIn delay={100}>
        <div className="rounded-xl glass p-3.5 sm:p-4">
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 flex items-center justify-center border border-border-subtle">
              <Globe className="h-4 w-4 text-blue-glow" />
            </div>
            <div>
              <h2 className="font-heading text-sm font-semibold text-text-primary">Run New Audit</h2>
              <p className="text-[10px] text-text-secondary">Enter a URL to analyze</p>
            </div>
          </div>

          <form onSubmit={handleAudit} className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isAuditing}
              className="flex-1 h-9 text-xs rounded-lg border-border-subtle"
            />
            <Button
              type="submit"
              disabled={isAuditing || !url}
              size="sm"
              className="h-9 bg-blue-primary hover:bg-blue-vivid text-xs px-4 rounded-lg"
            >
              {isAuditing ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5" />
                  Analyze
                </span>
              )}
            </Button>
          </form>
        </div>
      </FadeIn>

      {/* Audit Results */}
      {audits && audits.length > 0 ? (
        <div className="space-y-3">
          {audits.map((audit, i) => (
            <FadeIn key={audit.id} delay={200 + i * 100}>
              <div className="rounded-xl glass p-3.5 sm:p-4 border border-border-subtle">
                <div className="flex items-start justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    {getStatusIcon(audit.status)}
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-text-primary">{audit.url}</h3>
                      <p className="text-[10px] text-text-muted">{new Date(audit.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {audit.status === 'completed' && (
                    <div className="text-right">
                      <div className={`text-xl sm:text-2xl font-extrabold ${getScoreColor(audit.score)}`}>{audit.score}</div>
                      <Badge variant={audit.score >= 80 ? 'success' : audit.score >= 60 ? 'warning' : 'destructive'} className="text-[9px] px-1.5 py-0">
                        {audit.score >= 80 ? 'Excellent' : audit.score >= 60 ? 'Good' : 'Needs Work'}
                      </Badge>
                    </div>
                  )}
                </div>

                {audit.status === 'completed' && audit.results && (
                  <div className="grid gap-2.5 md:grid-cols-2">
                    {Object.entries(audit.results).map(([key, result]) => (
                      <div key={key} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border-subtle bg-bg-surface/30 hover:bg-bg-card/30 transition-colors">
                        {getCheckIcon(result.status)}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold mb-0.5 text-text-primary">{getResultLabel(key)}</h4>
                          <p className="text-[10px] text-text-secondary leading-relaxed">{result.message}</p>
                          {result.value && (
                            <p className="text-[9px] text-text-muted mt-1 truncate font-mono">{result.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      ) : (
        <FadeIn delay={200}>
          <div className="rounded-2xl glass p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-bg-card flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6 text-text-muted" />
            </div>
            <h3 className="font-heading text-lg font-semibold mb-2">No SEO audits yet</h3>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              Run your first audit to analyze your website's performance and get recommendations.
            </p>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
