import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PLANS } from '@/lib/config';
import { Check, CreditCard, Database, ArrowRight } from 'lucide-react';

interface Subscription {
  id: string;
  plan: 'free' | 'starter' | 'pro';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string;
  cancel_at_period_end: boolean;
}

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
    mutationFn: (planId: string) => api.post('billing/checkout', { plan: planId, interval: billingCycle }),
    onSuccess: () => {
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
    if (confirm('Are you sure you want to cancel your subscription?')) {
      cancelMutation.mutate();
    }
  };

  if (subscriptionLoading || usageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" text="Loading billing information..." />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 font-body">
      <FadeIn>
        <div className="border-b border-border-subtle pb-3">
          <h1 className="font-heading text-lg sm:text-xl font-bold mb-1">
            Billing & Subscription
          </h1>
          <p className="text-xs text-text-secondary">
            Manage your subscription and view usage
          </p>
        </div>
      </FadeIn>

      {/* Current Plan */}
      {subscription && (
        <FadeIn delay={100}>
          <div className="rounded-xl glass p-3.5 sm:p-4 border border-border-subtle">
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 flex items-center justify-center border border-border-subtle">
                <CreditCard className="h-4 w-4 text-blue-glow" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-text-primary">Current Plan</h2>
                <p className="text-[10px] text-text-secondary">Your subscription status</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-extrabold gradient-text capitalize leading-none">{subscription.plan}</span>
                <Badge variant={subscription.status === 'active' ? 'success' : 'destructive'} className="text-[9px] px-1.5 py-0">
                  {subscription.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3.5 text-xs">
                <p className="text-text-muted text-[11px]">
                  {subscription.cancel_at_period_end
                    ? `Cancels ${new Date(subscription.current_period_end).toLocaleDateString()}`
                    : `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  }
                </p>
                {subscription.plan !== 'free' && !subscription.cancel_at_period_end && (
                  <Button variant="outline" size="sm" onClick={handleCancel} className="h-7 text-xs px-2.5 rounded-lg border-border-subtle">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Usage Overview */}
      {usage && (
        <FadeIn delay={200}>
          <div className="rounded-xl glass p-3.5 sm:p-4 border border-border-subtle">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-border-subtle">
                <Database className="h-4 w-4 text-success" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-text-primary">Usage</h2>
                <p className="text-[10px] text-text-secondary">Your current resource consumption</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {[
                { label: 'Projects', used: usage.projects, limit: usage.projects_limit, unit: '' },
                { label: 'Storage', used: usage.storage / (1024 * 1024 * 1024), limit: usage.storage_limit / (1024 * 1024 * 1024), unit: 'GB' },
                { label: 'Bandwidth', used: usage.bandwidth / (1024 * 1024 * 1024), limit: usage.bandwidth_limit / (1024 * 1024 * 1024), unit: 'GB' },
              ].map((item) => {
                const pct = getUsagePercentage(item.used, item.limit);
                return (
                  <div key={item.label} className="space-y-1.5">
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
          </div>
        </FadeIn>
      )}

      {/* Billing Cycle Toggle */}
      <FadeIn delay={300}>
        <div className="flex items-center justify-between border-t border-border-subtle/30 pt-3">
          <h2 className="font-heading text-sm sm:text-base font-bold text-text-primary">Available Plans</h2>
          <div className="flex items-center gap-1 p-0.5 rounded-lg glass">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-bg-card text-text-primary border border-border-interactive/20'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-bg-card text-text-primary border border-border-interactive/20'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Yearly <span className="text-[10px] text-success ml-0.5 font-bold">-20%</span>
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Plans Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan, i) => {
          const price = billingCycle === 'yearly' ? Math.round(plan.price * 0.8) : plan.price;
          const isSelected = subscription?.plan === plan.id;
          const isLoading = upgradeMutation.isPending && selectedPlan === plan.id;

          return (
            <FadeIn key={plan.id} delay={300 + i * 100}>
              <div
                className={`relative p-3.5 sm:p-4 rounded-xl glass h-full flex flex-col justify-between border border-border-subtle ${
                  plan.popular ? 'border-blue-primary/40 animate-pulse-glow' : 'card-hover'
                } ${isSelected ? 'ring-1 ring-blue-primary bg-blue-primary/[0.01]' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-primary text-white text-[9px] font-bold tracking-wide uppercase">
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

                  <div className="space-y-3.5 mb-5">
                    {plan.sections.map((section) => (
                      <div key={section.title}>
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">{section.title}</p>
                        <ul className="space-y-1">
                          {section.items.map((item) => (
                            <li key={item} className="flex items-start gap-1.5 text-xs text-text-secondary">
                              <Check className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className={`w-full h-8 text-xs rounded-lg ${
                    plan.popular && !isSelected
                      ? 'bg-blue-primary hover:bg-blue-vivid text-white'
                      : ''
                  }`}
                  variant={isSelected ? 'outline' : plan.popular ? 'default' : 'outline'}
                  disabled={isSelected || isLoading}
                  onClick={() => handleUpgrade(plan.id)}
                  size="sm"
                >
                  {isLoading ? (
                    'Processing...'
                  ) : isSelected ? (
                    'Current Plan'
                  ) : (
                    <span className="flex items-center gap-1">
                      Get Started <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </Button>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
