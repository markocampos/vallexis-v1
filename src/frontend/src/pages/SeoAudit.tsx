import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SeoAuditResult {
  id: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  score: number;
  created_at: string;
  results?: {
    title?: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      value?: string;
    };
    description?: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      value?: string;
    };
    headings?: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      value?: string;
    };
    images?: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      value?: string;
    };
    links?: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      value?: string;
    };
    performance?: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      value?: string;
    };
    mobile?: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      value?: string;
    };
    ssl?: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      value?: string;
    };
  };
}

export function SeoAudit() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);

  const { data: audits, isLoading } = useQuery({
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
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-error" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-text-muted" />;
    }
  };

  const getCheckIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-error" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge variant="success">Excellent</Badge>;
    if (score >= 60) return <Badge variant="warning">Good</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted">Loading SEO audits...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary mb-2">
          SEO Audit
        </h1>
        <p className="text-text-secondary">
          Analyze and improve your website's SEO performance
        </p>
      </div>

      {/* New Audit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Run New Audit
          </CardTitle>
          <CardDescription>
            Enter a URL to analyze its SEO performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAudit} className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isAuditing}
            />
            <Button type="submit" disabled={isAuditing || !url}>
              {isAuditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Audit Results */}
      {audits && audits.length > 0 ? (
        <div className="space-y-4">
          {audits.map((audit) => (
            <Card key={audit.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(audit.status)}
                    <div>
                      <CardTitle className="text-lg">{audit.url}</CardTitle>
                      <CardDescription>
                        {new Date(audit.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  {audit.status === 'completed' && (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(audit.score)}`}>
                          {audit.score}
                        </div>
                        {getScoreBadge(audit.score)}
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              {audit.status === 'completed' && audit.results && (
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Title */}
                    {audit.results.title && (
                      <div className="flex items-start gap-3 p-4 border border-border-subtle rounded-lg">
                        {getCheckIcon(audit.results.title.status)}
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">Title Tag</h4>
                          <p className="text-sm text-text-secondary">{audit.results.title.message}</p>
                          {audit.results.title.value && (
                            <p className="text-xs text-text-muted mt-1">{audit.results.title.value}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {audit.results.description && (
                      <div className="flex items-start gap-3 p-4 border border-border-subtle rounded-lg">
                        {getCheckIcon(audit.results.description.status)}
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">Meta Description</h4>
                          <p className="text-sm text-text-secondary">{audit.results.description.message}</p>
                          {audit.results.description.value && (
                            <p className="text-xs text-text-muted mt-1">{audit.results.description.value}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Headings */}
                    {audit.results.headings && (
                      <div className="flex items-start gap-3 p-4 border border-border-subtle rounded-lg">
                        {getCheckIcon(audit.results.headings.status)}
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">Headings Structure</h4>
                          <p className="text-sm text-text-secondary">{audit.results.headings.message}</p>
                          {audit.results.headings.value && (
                            <p className="text-xs text-text-muted mt-1">{audit.results.headings.value}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Images */}
                    {audit.results.images && (
                      <div className="flex items-start gap-3 p-4 border border-border-subtle rounded-lg">
                        {getCheckIcon(audit.results.images.status)}
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">Image Optimization</h4>
                          <p className="text-sm text-text-secondary">{audit.results.images.message}</p>
                          {audit.results.images.value && (
                            <p className="text-xs text-text-muted mt-1">{audit.results.images.value}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    {audit.results.links && (
                      <div className="flex items-start gap-3 p-4 border border-border-subtle rounded-lg">
                        {getCheckIcon(audit.results.links.status)}
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">Link Structure</h4>
                          <p className="text-sm text-text-secondary">{audit.results.links.message}</p>
                          {audit.results.links.value && (
                            <p className="text-xs text-text-muted mt-1">{audit.results.links.value}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Performance */}
                    {audit.results.performance && (
                      <div className="flex items-start gap-3 p-4 border border-border-subtle rounded-lg">
                        {getCheckIcon(audit.results.performance.status)}
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">Performance</h4>
                          <p className="text-sm text-text-secondary">{audit.results.performance.message}</p>
                          {audit.results.performance.value && (
                            <p className="text-xs text-text-muted mt-1">{audit.results.performance.value}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mobile */}
                    {audit.results.mobile && (
                      <div className="flex items-start gap-3 p-4 border border-border-subtle rounded-lg">
                        {getCheckIcon(audit.results.mobile.status)}
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">Mobile Friendly</h4>
                          <p className="text-sm text-text-secondary">{audit.results.mobile.message}</p>
                          {audit.results.mobile.value && (
                            <p className="text-xs text-text-muted mt-1">{audit.results.mobile.value}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SSL */}
                    {audit.results.ssl && (
                      <div className="flex items-start gap-3 p-4 border border-border-subtle rounded-lg">
                        {getCheckIcon(audit.results.ssl.status)}
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">SSL Certificate</h4>
                          <p className="text-sm text-text-secondary">{audit.results.ssl.message}</p>
                          {audit.results.ssl.value && (
                            <p className="text-xs text-text-muted mt-1">{audit.results.ssl.value}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-text-muted mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">No SEO audits yet</h3>
            <p className="text-text-secondary text-center max-w-md">
              Run your first SEO audit to analyze your website's performance and get recommendations for improvement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}