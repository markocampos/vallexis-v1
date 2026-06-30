import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/layout/PublicHeader';
import {
  Rocket,
  Database,
  HardDrive,
  Shield,
  Zap,
  Globe,
  Check,
  Terminal as TerminalIcon,
  Play,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';

interface LogLine {
  text: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'cmd';
}

export function ProductPage() {
  const [simState, setSimState] = useState<'idle' | 'building' | 'routing' | 'database' | 'complete'>('idle');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [progress, setProgress] = useState(0);

  const simulateDeploy = () => {
    setSimState('building');
    setLogs([]);
    setProgress(0);
  };

  useEffect(() => {
    if (simState === 'idle') {
      setLogs([
        { text: 'System ready. Awaiting connection...', type: 'info' },
        { text: 'Click "Simulate Git Push Deploy" below to start.', type: 'info' }
      ]);
      return;
    }

    if (simState === 'building') {
      const buildLogs: LogLine[] = [
        { text: '[Step 1/3] Detecting project code files...', type: 'cmd' },
        { text: '↳ Found website and application files.', type: 'info' },
        { text: '[Step 2/3] Bundling code into a secure package...', type: 'cmd' },
        { text: '↳ Automatically resolving dependencies without server logins.', type: 'info' },
        { text: '↳ Reusing build cache to accelerate deploy speed.', type: 'info' },
        { text: '✓ Secure workspace package created successfully!', type: 'success' }
      ];

      let currentLogIdx = 0;
      const logInterval = setInterval(() => {
        if (currentLogIdx < buildLogs.length) {
          const logItem = buildLogs[currentLogIdx];
          setLogs(prev => [...prev, logItem]);
          setProgress(Math.min(30 + currentLogIdx * 10, 80));
          currentLogIdx++;
        } else {
          clearInterval(logInterval);
          setSimState('routing');
        }
      }, 600);

      return () => clearInterval(logInterval);
    }

    if (simState === 'routing') {
      setLogs(prev => [
        ...prev,
        { text: '[Step 3/3] Setting up your public web address...', type: 'cmd' },
        { text: '↳ Mapping domain address: my-business-app.vallexis.app', type: 'info' },
        { text: '↳ Requesting automatic lock icon (SSL Security Shield)...', type: 'info' },
        { text: '✓ TLS 1.3 encryption active. Domain is fully secure.', type: 'success' }
      ]);
      setProgress(90);
      const timeout = setTimeout(() => {
        setSimState('database');
      }, 1200);
      return () => clearTimeout(timeout);
    }

    if (simState === 'database') {
      setLogs(prev => [
        ...prev,
        { text: '[Verification] Initializing private databases and storage folders...', type: 'cmd' },
        { text: '↳ Linking data vault: Connection established inside secure network bridge.', type: 'success' },
        { text: '↳ Activating asset warehouse: WebP compression middleware loaded.', type: 'success' }
      ]);
      setProgress(100);
      const timeout = setTimeout(() => {
        setSimState('complete');
      }, 1000);
      return () => clearTimeout(timeout);
    }

    if (simState === 'complete') {
      setLogs(prev => [
        ...prev,
        { text: '🎉 App deployed successfully! Live URL: https://my-business-app.vallexis.app', type: 'success' },
        { text: 'Platform metrics monitoring active. Everything is running smoothly.', type: 'info' }
      ]);
    }
  }, [simState]);

  const businessPillars = [
    {
      icon: Rocket,
      badge: 'Zero Server Hassle',
      title: 'Autopilot Code Delivery',
      desc: 'You focus on writing features; we handle the delivery. The moment you push updates, our platform packages your code, sets up the server, and places your site live with zero downtime.',
      benefits: ['Automatically resolves language tools', 'Never requires writing server script configurations', 'Keeps your site live during updates']
    },
    {
      icon: Database,
      badge: 'Private Digital Vault',
      title: 'Completely Isolated Databases',
      desc: 'Your business information belongs to you. Vallexis runs database environments in private subnets, keeping them completely locked away from outside web scans or hackers.',
      benefits: ['Encrypted daily automated backups', 'Private database networking by default', 'Restore your database to any previous state in one click']
    },
    {
      icon: HardDrive,
      badge: 'Bandwidth Saver',
      title: 'Smart Media Warehouse',
      desc: 'Media and assets load instantly. Vallexis features a smart storage manager that compresses large PNG and JPEG uploads to WebP format, saving up to 60% on storage and bandwidth costs.',
      benefits: ['Saves money on monthly data delivery fees', 'Faster page loading speeds for visitors', 'Compatible with standard software uploading libraries']
    },
    {
      icon: Shield,
      badge: 'Always Secure',
      title: 'Autopilot SSL Protection',
      desc: 'Keep your visitors safe. When you link a custom web address, our systems issue and renew secure lock certificates (SSL) automatically. No manual renewal emails required.',
      benefits: ['Automatic TLS 1.3 protocol standards', 'No charge for secure wildcard certificates', 'Guards against common web flood bots']
    },
    {
      icon: Zap,
      badge: 'Performance Monitor',
      title: 'Simple Health Dashboard',
      desc: 'See exactly how your website performs. We trace memory usage, processing capacity, and network traffic and display clean metrics charts directly inside your workspace.',
      benefits: ['Clear graphs with no technical jargon', 'Real-time resource utilization tracker', 'Automatic system health warnings']
    },
    {
      icon: Globe,
      badge: 'Grow Faster',
      title: 'Automatic SEO Checklists',
      desc: 'Ensure your website ranks high. Our platform runs scheduled performance audits on your live site, scoring speed, search parameters, and accessibility to help you grow your business.',
      benefits: ['Google Lighthouse automated weekly checks', 'Simple optimization checklists and scores', 'Tracks speed metrics over time']
    }
  ];

  const businessComparison = [
    { capability: 'Setup Complexity', vallexis: '1 Click (Connect Git)', aws: 'Days (Needs dedicated DevOps engineer)', vercel: 'Simple (Frontends only)', heroku: 'Medium (Requires terminal scripts)' },
    { capability: 'Pricing Structure', vallexis: 'Predictable flat-rate quotas', aws: 'Unpredictable pay-per-second utility bill', vercel: 'High bandwidth cliff penalties', heroku: 'Expensive dedicated database tiers' },
    { capability: 'Security & Vaults', vallexis: 'Built-in private network isolation', aws: 'VPCs must be manually configured', vercel: 'Shared server environments', heroku: 'Requires add-on configuration' },
    { capability: 'Media Optimization', vallexis: 'Autopilot WebP Image Compressor', aws: 'Requires setting up file triggers', vercel: 'Paid image processing addon', heroku: 'Not available natively' },
    { capability: 'Lock Certificates (SSL)', vallexis: 'Fully managed (Free & automatic)', aws: 'Requires ACM and domain setup', vercel: 'Automatic', heroku: 'Paid tier required for custom domains' }
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary relative overflow-hidden font-body pb-16">
      {/* Background Glowing Overlays */}
      <div className="absolute top-[5%] left-1/4 w-[400px] h-[250px] bg-gradient-to-r from-blue-primary/5 to-purple-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <PublicHeader />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-primary/30 bg-blue-primary/5 text-blue-glow text-xs font-bold mb-4">
            <Award className="h-3.5 w-3.5" />
            Designed for Modern Businesses & Founders
          </div>
          <h1 className="font-heading text-4xl sm:text-6xl font-extrabold text-text-primary tracking-tight leading-tight mb-4">
            Publish your websites with <span className="gradient-text bg-gradient-to-r from-blue-primary via-blue-glow to-purple-primary bg-clip-text text-transparent">complete confidence</span>
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            Vallexis eliminates the technical friction of server logistics. We offer automatic secure packaging, private database protection, smart media storage, and clear business analytics in a simple web interface.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild className="bg-blue-primary hover:bg-blue-vivid text-white shadow-lg rounded-xl text-sm">
              <a href="/register">Start Free Deployments</a>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-border-interactive hover:bg-bg-card rounded-xl text-sm text-text-primary">
              <a href="/pricing">View Plans & Pricing</a>
            </Button>
          </div>
        </div>

        {/* Live Interactive Build Simulator (Plain English version) */}
        <section className="mb-24">
          <div className="text-center mb-8">
            <h2 className="font-heading text-xl sm:text-3xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
              <TerminalIcon className="h-6 w-6 text-blue-glow" />
              Vallexis In-Action Simulator
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-lg mx-auto">
              Press the button below to see how our platform automatically processes, secures, and puts your business website live in three clear steps.
            </p>
          </div>

          <div className="glass border border-border-subtle rounded-2xl overflow-hidden shadow-2xl max-w-3xl mx-auto">
            {/* Simulator Top Bar */}
            <div className="bg-bg-deep px-4 py-3 flex items-center justify-between border-b border-border-subtle/80">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-error" />
                <span className="w-3 h-3 rounded-full bg-warning" />
                <span className="w-3 h-3 rounded-full bg-success" />
                <span className="text-[10px] text-text-muted font-mono font-bold ml-2">vallexis-autopilot-logs</span>
              </div>
              <div className="flex items-center gap-2">
                {simState !== 'idle' && simState !== 'complete' && (
                  <span className="flex items-center gap-1 text-[10px] text-blue-glow animate-pulse">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Auto-Configuring...
                  </span>
                )}
                {simState === 'complete' && (
                  <span className="text-[10px] text-success font-bold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Site Published Successfully
                  </span>
                )}
              </div>
            </div>

            {/* Simulator Body */}
            <div className="p-6 bg-bg-deep/90 font-mono text-xs sm:text-sm h-72 overflow-y-auto space-y-2.5 scrollbar-thin">
              {logs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`leading-relaxed ${
                    log.type === 'cmd' ? 'text-text-primary font-bold border-l-2 border-blue-primary pl-2' :
                    log.type === 'success' ? 'text-success font-semibold' :
                    log.type === 'warn' ? 'text-warning' :
                    log.type === 'error' ? 'text-error' : 'text-text-secondary'
                  }`}
                >
                  {log.text}
                </div>
              ))}
              {simState === 'idle' && (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border-subtle/60 rounded-xl m-2 bg-bg-surface/5">
                  <Play className="h-8 w-8 text-blue-glow mb-2 animate-bounce" />
                  <Button 
                    onClick={simulateDeploy}
                    className="bg-blue-primary hover:bg-blue-vivid text-white shadow-md text-xs font-semibold px-6 py-2 rounded-lg"
                  >
                    Simulate Git Push Deploy
                  </Button>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {simState !== 'idle' && (
              <div className="w-full bg-bg-deep h-1 border-t border-border-subtle">
                <div 
                  className="bg-gradient-to-r from-blue-primary via-blue-glow to-purple-primary h-full transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Reset Controller */}
            {simState === 'complete' && (
              <div className="bg-bg-deep/50 px-4 py-3 flex justify-between items-center border-t border-border-subtle">
                <span className="text-[10.5px] text-text-muted">Domain Active: my-business-app.vallexis.app</span>
                <button 
                  onClick={() => setSimState('idle')}
                  className="text-xs text-blue-primary hover:text-blue-glow font-bold transition-all flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> Start Again
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Business Pillars Grid */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary">
              The simplified hosting suite for business growth
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto mt-2 leading-relaxed">
              We replaced isolated servers, complicated credential configurations, and manual security patches with built-in autopilot services.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessPillars.map((pillar, idx) => (
              <div key={idx} className="p-6 rounded-2xl glass border border-border-subtle bg-bg-surface/20 flex flex-col justify-between hover:border-blue-primary/20 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 rounded-full border border-blue-primary/30 bg-blue-primary/10 text-blue-glow text-[9px] font-bold uppercase tracking-wider">
                      {pillar.badge}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center group-hover:border-blue-primary/45 transition-colors">
                      <pillar.icon className="h-4 w-4 text-blue-glow" />
                    </div>
                  </div>
                  <h3 className="font-heading text-base font-bold text-text-primary mb-2">{pillar.title}</h3>
                  <p className="text-xs text-text-secondary mb-4 leading-relaxed">{pillar.desc}</p>
                </div>
                <div className="pt-4 border-t border-border-subtle/50">
                  <ul className="space-y-1.5 text-[10.5px] text-text-muted">
                    {pillar.benefits.map((benefit, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-1.5">
                        <ChevronRight className="h-3 w-3 text-blue-glow mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Business Comparison Table */}
        <section className="mb-12">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary">
              Why founders prefer Vallexis
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto mt-2 leading-relaxed">
              A business review of Vallexis compared against legacy cloud infrastructure vendors.
            </p>
          </div>

          <div className="glass rounded-2xl border border-border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-surface/50 text-[11px] uppercase tracking-wider text-text-muted">
                    <th className="p-4 font-bold w-1/5">Capability</th>
                    <th className="p-4 font-bold text-blue-glow bg-blue-primary/5">Vallexis</th>
                    <th className="p-4 font-bold">Amazon Web Services (AWS)</th>
                    <th className="p-4 font-bold">Vercel</th>
                    <th className="p-4 font-bold">Heroku</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50 text-text-secondary">
                  {businessComparison.map((row, idx) => (
                    <tr key={idx} className="hover:bg-bg-card/10 transition-all">
                      <td className="p-4 font-bold text-text-primary bg-bg-surface/5">{row.capability}</td>
                      <td className="p-4 text-blue-glow font-medium bg-blue-primary/[0.02] border-x border-blue-primary/10">{row.vallexis}</td>
                      <td className="p-4">{row.aws}</td>
                      <td className="p-4">{row.vercel}</td>
                      <td className="p-4">{row.heroku}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Customer Trust Callout */}
        <div className="mt-20 p-8 rounded-2xl border border-border-subtle bg-bg-surface/10 glass flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-success/15 border border-success/30 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-text-primary">Reliable, Secure, and Built for Success</h3>
              <p className="text-xs text-text-secondary max-w-xl leading-relaxed mt-1">
                Vallexis guarantees institutional network isolation, automatic daily database backups, and scheduled performance checks to keep your customer platform fast and always available.
              </p>
            </div>
          </div>
          <Button size="sm" asChild className="bg-blue-primary hover:bg-blue-vivid text-white shadow-md rounded-lg text-xs font-semibold whitespace-nowrap">
            <a href="/register">Create Free Account</a>
          </Button>
        </div>
      </main>
    </div>
  );
}
