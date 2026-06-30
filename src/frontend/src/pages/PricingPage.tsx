import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/layout/PublicHeader';
import {
  Check,
  Minus,
  Calculator,
  AlertCircle
} from 'lucide-react';

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Calculator states
  const [calcRam, setCalcRam] = useState<number>(1); // GB
  const [calcStorage, setCalcStorage] = useState<number>(5); // GB
  const [calcBandwidth, setCalcBandwidth] = useState<number>(10); // GB
  const [calcProjects, setCalcProjects] = useState<number>(1);

  // Calculate estimated price based on tiered safety rules to prevent resource abuse
  let estimatedPrice = 0;
  if (calcRam <= 0.5 && calcStorage <= 2 && calcBandwidth <= 1 && calcProjects <= 1) {
    estimatedPrice = 0;
  } else if (calcRam <= 1.0 && calcStorage <= 5 && calcBandwidth <= 10 && calcProjects <= 1) {
    estimatedPrice = 99;
  } else if (calcRam <= 2.0 && calcStorage <= 10 && calcBandwidth <= 50 && calcProjects <= 2) {
    estimatedPrice = 499;
  } else {
    const ramOverflow = Math.max(0, calcRam - 2) * 150; // ₱150/GB RAM beyond Pro
    const storageOverflow = Math.max(0, calcStorage - 10) * 15; // ₱15/GB storage beyond Pro
    const bandwidthOverflow = Math.max(0, calcBandwidth - 50) * 4; // ₱4/GB bandwidth beyond Pro
    const projectOverflow = Math.max(0, calcProjects - 2) * 100; // ₱100/project beyond Pro
    estimatedPrice = Math.round(499 + ramOverflow + storageOverflow + bandwidthOverflow + projectOverflow);
  }

  if (billingCycle === 'yearly') {
    estimatedPrice = Math.round(estimatedPrice * 0.8); // 20% discount
  }

  // Recommended plan based on calculator
  let recommendedPlan = 'Free Forever';
  if (calcRam > 1 || calcStorage > 5 || calcBandwidth > 10 || calcProjects > 1) {
    recommendedPlan = 'Pro Plan';
  } else if (calcRam > 0.5 || calcStorage > 2 || calcBandwidth > 1 || calcProjects > 1) {
    recommendedPlan = 'Starter Plan';
  }

  const plans = [
    {
      name: 'Free Forever',
      price: 0,
      description: 'Perfect for small side projects, sandbox testing, and early development stages.',
      features: [
        '1 active container project',
        '2 GB S3 object storage',
        '1 GB fast CDN bandwidth',
        'Auto Nixpacks compilation builds',
        'Let\'s Encrypt automatic TLS/SSL',
        'Shared metrics console'
      ],
      cta: 'Start Building Free',
      url: '/register',
      popular: false
    },
    {
      name: 'Starter Plan',
      price: billingCycle === 'monthly' ? 99 : 79,
      description: 'Ideal for independent developers, blog sites, and growing software products.',
      features: [
        '1 active container project',
        '5 GB S3 object storage',
        '10 GB fast CDN bandwidth',
        'Let\'s Encrypt automatic TLS/SSL',
        'Custom domain DNS mapping',
        'Grafana/Prometheus dashboard views',
        'Daily database snapshots',
        'Email support within 24 hours'
      ],
      cta: 'Choose Starter Plan',
      url: '/register',
      popular: false
    },
    {
      name: 'Pro Plan',
      price: billingCycle === 'monthly' ? 499 : 399,
      description: 'Complete container hosting suite for production products and small teams.',
      features: [
        '2 concurrent active projects',
        '10 GB S3 object storage per project (20 GB total)',
        '50 GB fast CDN bandwidth',
        'Let\'s Encrypt automatic TLS/SSL',
        'Custom domain DNS mapping',
        'Full Grafana dashboard metrics',
        'Lossless WebP image compressor',
        'Weekly automated SEO Lighthouse audits',
        '24/7 Slack and priority email support'
      ],
      cta: 'Go Professional',
      url: '/register',
      popular: true
    }
  ];

  const comparisons = [
    { name: 'Active Container Projects', free: '1', starter: '1', pro: '2' },
    { name: 'S3 compatible Storage', free: '2 GB', starter: '5 GB', pro: '10 GB / project (20 GB total)' },
    { name: 'Monthly CDN Bandwidth', free: '1 GB', starter: '10 GB', pro: '50 GB' },
    { name: 'Managed Postgres Instance', free: 'Shared instance', starter: 'Dedicated instance', pro: '2 Dedicated instances' },
    { name: 'Daily Snapshots Backup', free: false, starter: true, pro: true },
    { name: 'ACME Wildcard SSL/TLS', free: true, starter: true, pro: true },
    { name: 'Custom Domain DNS Mapping', free: false, starter: true, pro: true },
    { name: 'Grafana & Prometheus Metrics', free: 'Shared dashboard', starter: 'Full container metrics', pro: 'Advanced core dashboards' },
    { name: 'Lossless WebP Converter', free: false, starter: false, pro: true },
    { name: 'Automated SEO Lighthouse Audit', free: false, starter: false, pro: 'Weekly' },
    { name: 'Dedicated Slack Support', free: false, starter: false, pro: '24/7 priority channel' },
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary relative overflow-hidden font-body pb-16">
      {/* Background Glowing Overlays */}
      <div className="absolute top-[5%] left-1/4 w-[400px] h-[250px] bg-gradient-to-r from-blue-primary/5 to-purple-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <PublicHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl relative z-10">
        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mb-4">
            Simple, transparent <span className="gradient-text bg-gradient-to-r from-blue-primary via-blue-glow to-purple-primary bg-clip-text text-transparent">pricing plans</span>
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed mb-8">
            No credit cards required for our free tier. Upgrade or downgrade at any time with transparent resource quotas.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-bg-surface border border-border-subtle gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-primary text-white shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-blue-primary text-white shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Yearly
              <span className="px-1.5 py-0.5 rounded bg-success/20 text-success text-[9px] font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch mt-12">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-8 rounded-2xl glass border flex flex-col justify-between relative transition-all duration-300 ${
                plan.popular
                  ? 'border-blue-primary shadow-lg bg-blue-primary/[0.02] scale-105 md:scale-105 z-10'
                  : 'border-border-subtle hover:border-blue-primary/20 bg-bg-surface/30'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-primary to-purple-primary text-white text-[10px] font-bold uppercase tracking-widest border border-blue-glow">
                  Most Popular
                </span>
              )}
              <div>
                <h3 className="font-heading text-lg font-bold text-text-primary mb-1">{plan.name}</h3>
                <p className="text-xs text-text-muted mb-4">{plan.description}</p>
                <div className="text-3xl sm:text-4xl font-heading font-extrabold text-text-primary mb-6 flex items-baseline">
                  ₱{plan.price}
                  <span className="text-xs sm:text-sm text-text-muted font-normal ml-1">/month</span>
                </div>
                <ul className="space-y-3 mb-8 text-xs text-text-secondary">
                  {plan.features.slice(0, 6).map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                asChild
                className={`w-full py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  plan.popular
                    ? 'bg-blue-primary text-white hover:bg-blue-vivid shadow-lg'
                    : 'bg-transparent border border-border-interactive hover:bg-bg-card text-text-primary'
                }`}
              >
                <a href={plan.url}>{plan.cta}</a>
              </Button>
            </div>
          ))}
        </div>

        {/* Dynamic Cost Calculator Section */}
        <section className="mt-24 p-6 sm:p-8 rounded-2xl glass border border-border-subtle bg-bg-surface/10">
          <div className="text-center mb-8">
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary flex items-center justify-center gap-2">
              <Calculator className="h-5.5 w-5.5 text-blue-glow animate-pulse" />
              Dynamic Hosting Cost Calculator
            </h2>
            <p className="text-xs text-text-secondary max-w-md mx-auto mt-1">
              Estimate your monthly SaaS hosting bill based on requested project allocation limits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Inputs */}
            <div className="space-y-6">
              {/* RAM slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-text-primary">Container Memory (RAM)</span>
                  <span className="text-blue-glow font-mono">{calcRam} GB</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="16"
                  step="0.5"
                  value={calcRam}
                  onChange={(e) => setCalcRam(parseFloat(e.target.value))}
                  className="w-full h-1 bg-bg-deep rounded-lg appearance-none cursor-pointer accent-blue-primary"
                />
                <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                  Memory determines how many simultaneous operations or processes your web application can run.
                </p>
                <div className="flex justify-between text-[9px] text-text-muted mt-1 font-mono">
                  <span>0.5 GB (Free limit)</span>
                  <span>8 GB</span>
                  <span>16 GB</span>
                </div>
              </div>

              {/* S3 Storage slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-text-primary">MinIO S3 Storage</span>
                  <span className="text-blue-glow font-mono">{calcStorage} GB</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="200"
                  step="1"
                  value={calcStorage}
                  onChange={(e) => setCalcStorage(parseInt(e.target.value))}
                  className="w-full h-1 bg-bg-deep rounded-lg appearance-none cursor-pointer accent-blue-primary"
                />
                <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                  Disk space used to store customer files, product images, PDF assets, and database snapshots.
                </p>
                <div className="flex justify-between text-[9px] text-text-muted mt-1 font-mono">
                  <span>2 GB (Free limit)</span>
                  <span>100 GB</span>
                  <span>200 GB</span>
                </div>
              </div>

              {/* Bandwidth slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-text-primary">Monthly CDN Bandwidth</span>
                  <span className="text-blue-glow font-mono">{calcBandwidth} GB</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  step="5"
                  value={calcBandwidth}
                  onChange={(e) => setCalcBandwidth(parseInt(e.target.value))}
                  className="w-full h-1 bg-bg-deep rounded-lg appearance-none cursor-pointer accent-blue-primary"
                />
                <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                  The volume of network data transferred when users load pages and media on your site.
                </p>
                <div className="flex justify-between text-[9px] text-text-muted mt-1 font-mono">
                  <span>1 GB (Free limit)</span>
                  <span>500 GB</span>
                  <span>1000 GB</span>
                </div>
              </div>

              {/* Projects count */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-text-primary">Concurrent Projects</span>
                  <span className="text-blue-glow font-mono">{calcProjects}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCalcProjects(Math.max(1, calcProjects - 1))}
                    className="w-8 h-8 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="text-sm text-text-primary font-bold font-mono">{calcProjects}</span>
                  <button 
                    onClick={() => setCalcProjects(Math.min(20, calcProjects + 1))}
                    className="w-8 h-8 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary font-bold text-sm"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                  The number of independent active websites or APIs hosted on your Vallexis account.
                </p>
              </div>
            </div>

            {/* Right: Calculation results */}
            <div className="p-6 rounded-2xl bg-bg-deep/50 border border-border-subtle text-center flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Estimated Monthly Cost</span>
                <div className="text-4xl sm:text-5xl font-heading font-extrabold text-text-primary mt-2 flex items-baseline justify-center">
                  ₱{estimatedPrice}
                  <span className="text-xs sm:text-sm text-text-muted font-normal ml-1">/month</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-glow/30 bg-blue-glow/10 text-blue-glow text-xs font-bold">
                  Recommended: {recommendedPlan}
                </div>
              </div>

              <div className="mt-6 flex items-start gap-2 text-[10px] text-text-muted text-left border-t border-border-subtle/50 pt-4">
                <AlertCircle className="h-4.5 w-4.5 text-warning flex-shrink-0" />
                <span>
                  Calculations are based on Starter (₱99) and Pro (₱499) baselines. Custom scaling resource rates apply beyond Pro (₱150/GB RAM, ₱15/GB storage, ₱4/GB bandwidth, ₱100/project) to prevent server resource abuse.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Comparison Matrix */}
        <div className="mt-20">
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-6 text-center">Compare Plan Features</h2>
          <div className="glass rounded-2xl border border-border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-surface/50">
                    <th className="p-4 font-heading font-bold text-text-primary w-2/5">Feature</th>
                    <th className="p-4 font-heading font-bold text-text-primary text-center">Free</th>
                    <th className="p-4 font-heading font-bold text-text-primary text-center">Starter</th>
                    <th className="p-4 font-heading font-bold text-text-primary text-center">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50 text-text-secondary">
                  {comparisons.map((row, idx) => (
                    <tr key={idx} className="hover:bg-bg-card/20 transition-all">
                      <td className="p-4 font-medium">{row.name}</td>
                      <td className="p-4 text-center">
                        {typeof row.free === 'boolean' ? (
                          row.free ? <Check className="h-4 w-4 text-success mx-auto" /> : <Minus className="h-4 w-4 text-text-muted mx-auto" />
                        ) : (
                          row.free
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? <Check className="h-4 w-4 text-success mx-auto" /> : <Minus className="h-4 w-4 text-text-muted mx-auto" />
                        ) : (
                          row.starter
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <Check className="h-4 w-4 text-success mx-auto" /> : <Minus className="h-4 w-4 text-text-muted mx-auto" />
                        ) : (
                          row.pro
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
