import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
    queryFn: () => api.get<{ data: SeoAuditResult[] }>('seo/audits').then(r => r.data),
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
      case 'pass': return <CheckCircle className="h-4 w-4 text-success font-semibold" />;
      case 'fail': return <XCircle className="h-4 w-4 text-error font-semibold" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-warning font-semibold" />;
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
      <div className="space-y-6 font-body">
        {/* Loading header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <div className="h-6 w-32 bg-bg-card rounded animate-pulse" />
            <div className="h-4 w-64 bg-bg-card rounded animate-pulse mt-1.5" />
          </div>
        </div>
        <Card className="p-4 h-36 animate-pulse" />
        <Card className="p-4 h-64 animate-pulse" />
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
            <h3 className="font-heading text-base font-bold text-text-primary">Failed to load SEO Audits</h3>
            <p className="text-xs text-text-secondary">There was an error loading your SEO audits history.</p>
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
      {/* Standard Header */}
      <FadeIn>
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <h1 className="font-heading text-lg font-bold text-text-primary">SEO Audit</h1>
            <p className="text-xs text-text-secondary">Analyze and improve your website's SEO performance</p>
          </div>
        </div>
      </FadeIn>

      {/* New Audit Form */}
      <FadeIn delay={100}>
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 flex items-center justify-center border border-border-subtle">
              <Globe className="h-5 w-5 text-blue-glow" />
            </div>
            <div>
              <h2 className="font-heading text-sm font-semibold text-text-primary">Run New Audit</h2>
              <p className="text-[10px] text-text-secondary">Enter a URL to analyze</p>
            </div>
          </div>

          <form onSubmit={handleAudit} className="flex flex-col sm:flex-row gap-2.5 border-t border-border-subtle/40 pt-4">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isAuditing}
              className="flex-1 h-10 text-sm"
            />
            <Button
              type="submit"
              disabled={isAuditing || !url}
              className="h-10 bg-blue-primary hover:bg-blue-vivid text-white px-5"
            >
              {isAuditing ? (
                <span className="flex items-center gap-1.5 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 justify-center">
                  <Search className="h-4 w-4" />
                  Analyze
                </span>
              )}
            </Button>
          </form>
        </Card>
      </FadeIn>

      {/* Audit Results */}
      {audits && audits.length > 0 ? (
        <div className="space-y-4">
          {audits.map((audit, i) => (
            <FadeIn key={audit.id} delay={200 + i * 50}>
              <Card className="p-4 space-y-4">
                <div className="flex items-start justify-between border-b border-border-subtle/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    {getStatusIcon(audit.status)}
                    <div>
                      <h3 className="font-heading text-sm font-bold text-text-primary break-all">{audit.url}</h3>
                      <p className="text-[10px] text-text-muted mt-0.5">{new Date(audit.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {audit.status === 'completed' && (
                    <div className="text-right flex items-center gap-2">
                      <Badge variant={audit.score >= 80 ? 'success' : audit.score >= 60 ? 'warning' : 'destructive'} className="text-[10px] px-1.5 py-0.5">
                        {audit.score >= 80 ? 'Excellent' : audit.score >= 60 ? 'Good' : 'Needs Work'}
                      </Badge>
                      <div className={`text-xl sm:text-2xl font-extrabold font-mono ${getScoreColor(audit.score)}`}>{audit.score}</div>
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
                            <p className="text-[9px] text-text-muted mt-1 truncate font-mono bg-bg-deep/40 px-1.5 py-0.5 rounded border border-border-subtle/40 w-fit">{result.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </FadeIn>
          ))}
        </div>
      ) : (
        <FadeIn delay={200}>
          <Card className="p-8 text-center max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center mx-auto">
              <Search className="h-6 w-6 text-text-muted" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-base font-bold text-text-primary">No SEO audits yet</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Run your first audit to analyze your website's performance and get recommendations.
              </p>
            </div>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}
