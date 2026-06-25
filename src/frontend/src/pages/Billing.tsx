import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Database } from 'lucide-react';

interface Subscription {
  id: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
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

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'monthly',
    features: [
      '3 Projects',
      '1 GB Storage',
      '10 GB Bandwidth',
      'Community Support',
      'Basic Deployments',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'monthly',
    popular: true,
    features: [
      'Unlimited Projects',
      '50 GB Storage',
      '500 GB Bandwidth',
      'Priority Support',
      'Custom Domains',
      'SSL Certificates',
      'Advanced Analytics',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    interval: 'monthly',
    features: [
      'Unlimited Everything',
      '1 TB Storage',
      'Unlimited Bandwidth',
      '24/7 Dedicated Support',
      'Custom Integrations',
      'SLA Guarantee',
      'Advanced Security',
      'Team Management',
    ],
  },
];

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

  const upgradeMutation = useMutation({
    mutationFn: (planId: string) => api.post('billing/subscribe', { plan_id: planId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setSelectedPlan(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post('billing/cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-error';
    if (percentage >= 70) return 'text-warning';
    return 'text-success';
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
        <div className="text-text-muted">Loading billing information...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary mb-2">
          Billing & Subscription
        </h1>
        <p className="text-text-secondary">
          Manage your subscription and view usage
        </p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>
              Your current subscription and billing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold capitalize">{subscription.plan}</h3>
                  <Badge variant={subscription.status === 'active' ? 'success' : 'destructive'}>
                    {subscription.status}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary">
                  {subscription.cancel_at_period_end
                    ? `Canceling on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  }
                </p>
              </div>
              {subscription.plan !== 'free' && !subscription.cancel_at_period_end && (
                <Button variant="outline" onClick={handleCancel}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Overview */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Usage Overview
            </CardTitle>
            <CardDescription>
              Your current resource usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Projects</span>
                  <span className={`text-sm ${getUsageColor(getUsagePercentage(usage.projects, usage.projects_limit))}`}>
                    {usage.projects} / {usage.projects_limit === 0 ? '∞' : usage.projects_limit}
                  </span>
                </div>
                <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-primary transition-all"
                    style={{ width: `${getUsagePercentage(usage.projects, usage.projects_limit)}%` }}
                  />
                </div>
              </div>

              {/* Storage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Storage</span>
                  <span className={`text-sm ${getUsageColor(getUsagePercentage(usage.storage, usage.storage_limit))}`}>
                    {(usage.storage / 1024).toFixed(2)} GB / {usage.storage_limit === 0 ? '∞' : `${(usage.storage_limit / 1024).toFixed(0)} GB`}
                  </span>
                </div>
                <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-primary transition-all"
                    style={{ width: `${getUsagePercentage(usage.storage, usage.storage_limit)}%` }}
                  />
                </div>
              </div>

              {/* Bandwidth */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Bandwidth</span>
                  <span className={`text-sm ${getUsageColor(getUsagePercentage(usage.bandwidth, usage.bandwidth_limit))}`}>
                    {(usage.bandwidth / 1024).toFixed(2)} GB / {usage.bandwidth_limit === 0 ? '∞' : `${(usage.bandwidth_limit / 1024).toFixed(0)} GB`}
                  </span>
                </div>
                <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-primary transition-all"
                    style={{ width: `${getUsagePercentage(usage.bandwidth, usage.bandwidth_limit)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="font-heading text-xl font-bold">Available Plans</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly <span className="ml-1 text-xs text-success">-20%</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const price = billingCycle === 'yearly' ? Math.round(plan.price * 0.8) : plan.price;
            const isSelected = subscription?.plan === plan.id;
            const isLoading = upgradeMutation.isPending && selectedPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? 'border-blue-primary' : ''} ${isSelected ? 'ring-2 ring-blue-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-primary">Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="capitalize">{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${price}</span>
                      <span className="text-text-muted">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isSelected ? 'outline' : 'default'}
                    disabled={isSelected || isLoading}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isLoading ? 'Processing...' : isSelected ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            Your past invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-text-muted">
            No billing history yet
          </div>
        </CardContent>
      </Card>
    </div>
  );
}