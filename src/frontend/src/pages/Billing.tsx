import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useKeyboardDialog } from '@/hooks/useKeyboardDialog';
import api from '@/lib/api';
import { Subscription } from '@/types';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { PLANS } from '@/lib/config';
import { Check, CreditCard, Database, ArrowRight } from 'lucide-react';

interface Usage {
  projects: number;
  projects_limit: number;
  storage: number;
  storage_limit: number;
  bandwidth: number;
  bandwidth_limit: number;
}

export function Billing() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const cancelConfirmModalRef = useKeyboardDialog(cancelConfirmOpen, () => setCancelConfirmOpen(false));

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get<Subscription>('billing/subscription'),
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: () => api.get<Usage>('billing/usage'),
  });

  const { toast } = useToast();

  const upgradeMutation = useMutation({
    mutationFn: (planId: string) => api.post<{ checkout_url?: string; message?: string }>('billing/subscribe', { plan_id: planId }),
    onSuccess: (data) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setSelectedPlan(null);
    },
    onError: () => {
      toast({ title: 'Upgrade failed', description: 'Please try again or contact support.', variant: 'error' });
      setSelectedPlan(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post('billing/cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: () => {
      toast({ title: 'Cancellation failed', description: 'Please try again.', variant: 'error' });
    },
  });

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit <= 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'from-error to-error';
    if (percentage >= 70) return 'from-warning to-warning';
    return 'from-blue-primary to-purple-primary';
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    upgradeMutation.mutate(planId);
  };

  const handleCancel = () => {
    setCancelConfirmOpen(true);
  };

  if (subscriptionLoading || usageLoading) {
    return (
      <div className="space-y-6 font-body">
        {/* Loading header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <div className="h-6 w-32 bg-bg-card rounded animate-pulse" />
            <div className="h-4 w-64 bg-bg-card rounded animate-pulse mt-1.5" />
          </div>
        </div>
        <Card className="p-4 h-32 animate-pulse" />
        <Card className="p-4 h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      {/* Standard Header */}
      <FadeIn>
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <h1 className="font-heading text-lg font-bold text-text-primary">Billing & Subscription</h1>
            <p className="text-xs text-text-secondary">Manage your subscription and view usage</p>
          </div>
        </div>
      </FadeIn>

      {/* Current Plan */}
      {subscription && (
        <FadeIn delay={100}>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 flex items-center justify-center border border-border-subtle">
                <CreditCard className="h-5 w-5 text-blue-glow" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-text-primary">Current Plan</h2>
                <p className="text-[10px] text-text-secondary">Your subscription status</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-border-subtle/40 pt-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-extrabold gradient-text capitalize leading-none">{subscription.plan}</span>
                <Badge variant={subscription.status === 'active' ? 'success' : 'destructive'} className="text-[10px] px-1.5 py-0.5">
                  {subscription.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <p className="text-text-muted">
                  {(() => {
                    const d = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
                    const valid = d && !isNaN(d.getTime());
                    if (subscription.cancel_at_period_end) {
                      return valid ? `Cancels ${d!.toLocaleDateString()}` : 'Cancels N/A';
                    }
                    return valid ? `Renews ${d!.toLocaleDateString()}` : 'Renews N/A';
                  })()}
                </p>
                {subscription.plan !== 'free' && !subscription.cancel_at_period_end && (
                  <Button variant="outline" onClick={handleCancel} className="h-10 text-xs px-4 rounded-lg">
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </FadeIn>
      )}

      {/* Usage Overview */}
      {usage && (
        <FadeIn delay={200}>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-border-subtle">
                <Database className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-text-primary">Resource Usage</h2>
                <p className="text-[10px] text-text-secondary">Your current resource consumption</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-border-subtle/40 pt-4">
              {[
                { label: 'Projects', used: usage.projects, limit: usage.projects_limit, unit: '' },
                { label: 'Storage', used: usage.storage / (1024 * 1024 * 1024), limit: usage.storage_limit / (1024 * 1024 * 1024), unit: 'GB' },
                { label: 'Bandwidth', used: usage.bandwidth / (1024 * 1024 * 1024), limit: usage.bandwidth_limit / (1024 * 1024 * 1024), unit: 'GB' },
              ].map((item) => {
                const pct = getUsagePercentage(item.used, item.limit);
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-primary">{item.label}</span>
                      <span className="text-text-secondary font-mono text-[11px]">
                        {item.unit ? `${item.used.toFixed(1)} ${item.unit}` : Math.round(item.used)}
                        {' / '}
                        {item.limit <= 0 ? '∞' : item.unit ? `${item.limit.toFixed(0)} ${item.unit}` : item.limit}
                      </span>
                    </div>
                    <div className="h-2 bg-bg-card rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getUsageColor(pct)} transition-all rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </FadeIn>
      )}

      {/* Billing Cycle Toggle */}
      <FadeIn delay={300}>
        <div className="flex items-center justify-between border-t border-border-subtle/30 pt-4">
          <h2 className="font-heading text-sm sm:text-base font-bold text-text-primary">Available Plans</h2>
          <div className="flex items-center gap-1.5 p-1 rounded-xl glass">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-bg-card text-text-primary border border-border-subtle'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-bg-card text-text-primary border border-border-subtle'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Yearly <span className="text-[10px] text-success ml-0.5 font-bold">-20%</span>
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Plans Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan, i) => {
          const price = billingCycle === 'yearly' ? Math.round(plan.price * 0.8) : plan.price;
          const isSelected = subscription?.plan === plan.id;
          const isLoading = upgradeMutation.isPending && selectedPlan === plan.id;

          return (
            <FadeIn key={plan.id} delay={300 + i * 50}>
              <Card
                className={`relative p-4 h-full flex flex-col justify-between hover:border-border-interactive transition-all ${
                  plan.popular ? 'border-blue-primary/40 animate-pulse-glow' : ''
                } ${isSelected ? 'ring-1 ring-blue-primary bg-blue-primary/[0.01]' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-primary text-white text-[9px] font-bold tracking-wide uppercase z-10">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="mb-4">
                    <h3 className="font-heading text-sm sm:text-base font-bold text-text-primary">{plan.name}</h3>
                    <div className="flex items-baseline gap-0.5 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-text-primary">₱{price}</span>
                      <span className="text-[10px] text-text-muted">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-5 border-t border-border-subtle/30 pt-3">
                    {plan.sections.map((section) => (
                      <div key={section.title}>
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1.5">{section.title}</p>
                        <ul className="space-y-1.5">
                          {section.items.map((item) => (
                            <li key={item} className="flex items-start gap-1.5 text-xs text-text-secondary">
                              <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full h-10"
                  variant={isSelected ? 'outline' : plan.popular ? 'primary' : 'outline'}
                  disabled={isSelected || isLoading}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isLoading ? (
                    'Processing...'
                  ) : isSelected ? (
                    'Current Plan'
                  ) : (
                    <span className="flex items-center gap-1">
                      Get Started <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </Button>
              </Card>
            </FadeIn>
          );
        })}
      </div>
      
      {/* Cancel Subscription Confirmation Dialog */}
      {cancelConfirmOpen && (
        <div ref={cancelConfirmModalRef} role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md p-4 sm:p-5 rounded-xl border border-border-subtle bg-bg-surface glass shadow-2xl m-3 space-y-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-text-primary">Cancel Subscription</h3>
              <p className="text-text-secondary text-xs mt-1">
                Are you sure you want to cancel your subscription? You will lose access to premium features at the end of the billing period.
              </p>
            </div>
            <div className="flex gap-3 justify-end text-xs">
              <Button variant="outline" className="h-10 px-4 rounded-lg" onClick={() => setCancelConfirmOpen(false)}>
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                className="h-10 px-4 rounded-lg"
                onClick={() => {
                  cancelMutation.mutate();
                  setCancelConfirmOpen(false);
                }}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Canceling...' : 'Cancel Subscription'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
