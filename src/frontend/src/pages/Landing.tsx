import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animated';
import { BackgroundPattern } from '@/components/ui/background-pattern';
import { PublicHeader } from '@/components/layout/PublicHeader';
import {
  Rocket,
  Database,
  HardDrive,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Check,
  Terminal,
  Cpu,
  Lock,
  ChevronDown,
  ChevronUp,
  Activity,
  Play,
  RefreshCw,
  GitBranch
} from 'lucide-react';

const features = [
  { icon: Rocket, title: 'Instant Deploys', desc: 'Connect Git and deploy in seconds with automatic builds.' },
  { icon: Database, title: 'Managed Postgres', desc: 'Databases with automatic backups and scaling out of the box.' },
  { icon: HardDrive, title: 'Object Storage', desc: 'MinIO S3-compatible storage with auto WebP image conversion.' },
  { icon: Shield, title: 'Caddy Auto-SSL', desc: 'Automatic wildcard TLS certificates and custom security headers.' },
  { icon: Zap, title: 'Live Metrics', desc: 'CPU, RAM, and disk utilization charts via Prometheus & Grafana.' },
  { icon: Globe, title: 'SEO Toolkit', desc: 'Weekly Lighthouse audits, sitemap generation, and SEO scoring.' },
];

const steps = [
  { num: '01', title: 'Link Repository', desc: 'Connect your GitHub or GitLab repository with one click.' },
  { num: '02', title: 'Push Code', desc: 'We build and deploy automatically on every git commit.' },
  { num: '03', title: 'Monitor & Grow', desc: 'Track performance, domains, and metrics via your dashboard.' },
];

export function Landing() {
  const [demoTab, setDemoTab] = useState<'logs' | 'metrics' | 'config'>('logs');
  const [archTab, setArchTab] = useState<'edge' | 'storage' | 'database'>('edge');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const faqs = [
    {
      q: "How does Vallexis compare to Vercel or Heroku?",
      a: "Vallexis bridges the gap. It offers the git-push simplicity of Vercel for frontends, but integrates the persistent database power of Heroku and local S3 object storage (MinIO) in a single platform, running on high-performance edge nodes at a fraction of the cost."
    },
    {
      q: "What is included in the Free tier?",
      a: "The free tier is fully loaded for personal use. It features 1 active project, 2 GB of secure object storage, 1 GB of bandwidth, automatic Let's Encrypt SSL/TLS, and a fully managed PostgreSQL database instance. No credit card is required to sign up."
    },
    {
      q: "Is the Object Storage API compatible with AWS S3?",
      a: "Yes. Under the hood we run MinIO, providing a 100% compatible AWS S3 API. You can continue using your standard AWS SDKs, clients, and tools. As a bonus, our storage layer automatically converts images to WebP to save bandwidth."
    },
    {
      q: "How does the managed Postgres backup system work?",
      a: "Vallexis provisions private, isolated PostgreSQL database clusters. We perform daily automated snapshots which are encrypted and stored in offsite regional storage, allowing you to restore data with a single click."
    },
    {
      q: "Can I connect my own custom domains and SSL?",
      a: "Absolutely. Connect custom domains via standard DNS records. Our routing layer, powered by Caddy, dynamically issues, verifies, and renews wildcard Let's Encrypt SSL/TLS certificates with zero manual intervention."
    }
  ];

  return (
    <div className="min-h-screen bg-bg-deep selection:bg-blue-primary/30 selection:text-white relative overflow-hidden">
      <PublicHeader />

      {/* Glowing background overlays */}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-8 sm:pt-20 sm:pb-12 lg:pt-24 lg:pb-16 z-10">
        <BackgroundPattern />


        <div className="relative container mx-auto px-4 text-center max-w-4xl">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4 sm:mb-6 text-xs text-text-secondary border border-border-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Now in public beta
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 text-text-primary leading-tight">
              Ship faster with
              <br />
              <span className="gradient-text bg-gradient-to-r from-blue-primary via-blue-glow to-purple-primary bg-clip-text text-transparent">zero infrastructure</span>
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-sm sm:text-base lg:text-lg text-text-secondary mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed font-body">
              Deploy, scale, and manage your applications without the DevOps headache.
              Focus on building your product — we handle the rest.
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button size="lg" asChild className="w-full sm:w-auto bg-blue-primary text-white hover:bg-blue-vivid shadow-lg shadow-blue-primary/25 rounded-xl transition-all duration-200">
                <a href="/register" className="flex items-center gap-2">
                  Start Building Free
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto border-border-interactive hover:bg-bg-card rounded-xl text-text-secondary hover:text-text-primary transition-all duration-200">
                <a href="/login" className="flex items-center gap-2">
                  <Play className="h-3.5 w-3.5 mr-1 text-blue-glow" />
                  View Dashboard
                </a>
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={400}>
            <p className="mt-4 text-xs text-text-muted">
              No credit card required · Free tier includes 1 project
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Interactive UI Demo Section */}
      <section id="demo" className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl z-10 relative">
        <FadeIn>
          <div className="p-1.5 rounded-2xl border border-border-subtle bg-bg-surface relative">
            {/* Browser top-bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-surface/50 rounded-t-xl">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-error opacity-70" />
                <span className="w-3 h-3 rounded-full bg-warning opacity-70" />
                <span className="w-3 h-3 rounded-full bg-success opacity-70" />
              </div>
              <div className="px-6 py-0.5 rounded-md bg-bg-deep text-[10px] text-text-muted font-mono border border-border-subtle w-48 sm:w-64 truncate text-center">
                console.vallexis.dev/projects/iguana-analytics
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] text-success font-mono">Live</span>
              </div>
            </div>

            {/* Dashboard Workspace */}
            <div className="grid md:grid-cols-[180px_1fr] min-h-[300px]">
              {/* Fake Sidebar */}
              <div className="p-3 border-r border-border-subtle bg-bg-surface/10 space-y-1.5 text-xs">
                <div className="text-[10px] text-text-muted font-semibold tracking-wider uppercase px-2 mb-2">Projects</div>
                <button className="w-full text-left px-2 py-1.5 rounded bg-bg-card text-text-primary font-medium flex items-center gap-2 border border-border-subtle">
                  <Terminal className="h-3.5 w-3.5 text-blue-glow" />
                  iguana-analytics
                </button>
                <div className="text-[10px] text-text-muted font-semibold tracking-wider uppercase px-2 pt-4 mb-2">Services</div>
                <div className="space-y-1">
                  <button
                    onClick={() => setDemoTab('logs')}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${demoTab === 'logs' ? 'text-text-primary bg-blue-primary/10 border border-blue-primary/30' : 'text-text-secondary hover:bg-bg-card/50'}`}
                  >
                    <GitBranch className="h-3.5 w-3.5 text-purple-glow" />
                    Deploy Logs
                  </button>
                  <button
                    onClick={() => setDemoTab('metrics')}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${demoTab === 'metrics' ? 'text-text-primary bg-blue-primary/10 border border-blue-primary/30' : 'text-text-secondary hover:bg-bg-card/50'}`}
                  >
                    <Activity className="h-3.5 w-3.5 text-blue-glow animate-pulse" />
                    Live Metrics
                  </button>
                  <button
                    onClick={() => setDemoTab('config')}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${demoTab === 'config' ? 'text-text-primary bg-blue-primary/10 border border-blue-primary/30' : 'text-text-secondary hover:bg-bg-card/50'}`}
                  >
                    <Lock className="h-3.5 w-3.5 text-purple-glow" />
                    vallexis.json
                  </button>
                </div>
              </div>

              {/* Fake Content Window */}
              <div className="p-4 bg-bg-deep/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle">
                    <div>
                      <h4 className="font-heading text-sm font-semibold text-text-primary">iguana-analytics</h4>
                      <p className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                        <span>branch: <span className="font-mono text-text-secondary">main</span></span>
                        <span>·</span>
                        <span>commit: <span className="font-mono text-text-secondary">a8f2c3b</span></span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-success/10 text-success border border-success/30 px-2 py-0.5 rounded font-mono">active</span>
                    </div>
                  </div>

                  {/* Active content tab */}
                  {demoTab === 'logs' && (
                    <div className="font-mono text-[11px] text-text-secondary space-y-1 p-3 bg-bg-deep/80 rounded-lg border border-border-subtle min-h-[180px] overflow-y-auto">
                      <div className="text-text-muted"># Monitoring deployment push...</div>
                      <div className="flex items-start gap-1"><span className="text-purple-glow flex-shrink-0">[10:04:12]</span> <span>Fetching branch updates from <span className="text-blue-glow">github.com/vallexis/iguana-analytics</span></span></div>
                      <div className="flex items-start gap-1"><span className="text-purple-glow flex-shrink-0">[10:04:13]</span> <span>Detecting build system: <span className="text-success">Node.js / Next.js</span> environment</span></div>
                      <div className="flex items-start gap-1"><span className="text-purple-glow flex-shrink-0">[10:04:15]</span> <span>Compiling container environment using Nixpacks...</span></div>
                      <div className="flex items-start gap-1"><span className="text-purple-glow flex-shrink-0">[10:04:32]</span> <span className="text-success">✔ Build compiled successfully in 17s</span></div>
                      <div className="flex items-start gap-1"><span className="text-purple-glow flex-shrink-0">[10:04:33]</span> <span>Spinning up container sandbox and checking health...</span></div>
                      <div className="flex items-start gap-1"><span className="text-purple-glow flex-shrink-0">[10:04:35]</span> <span className="text-success">✔ Container responsive (status code 200)</span></div>
                      <div className="flex items-start gap-1"><span className="text-purple-glow flex-shrink-0">[10:04:36]</span> <span>Configuring Caddy edge route SSL certificates...</span></div>
                      <div className="flex items-start gap-1"><span className="text-purple-glow flex-shrink-0">[10:04:37]</span> <span className="text-success font-semibold">✔ Route active: https://iguana-analytics.vallexis.app</span></div>
                      <div className="flex items-start gap-1 mt-2 text-success font-semibold"><span className="animate-pulse">●</span> <span>Deployment complete. Application is online!</span></div>
                    </div>
                  )}

                  {demoTab === 'metrics' && (
                    <div className="grid sm:grid-cols-2 gap-3 p-1 min-h-[180px]">
                      <div className="p-3 bg-bg-deep/80 border border-border-subtle rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                            <span className="flex items-center gap-1.5"><Cpu className="h-3 w-3 text-blue-glow" /> CPU</span>
                            <span className="text-success font-semibold">12.4%</span>
                          </div>
                          <div className="w-full bg-bg-card h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-primary to-blue-glow h-full rounded-full" style={{ width: '12.4%' }} />
                          </div>
                        </div>
                        <div className="text-[9px] text-text-muted mt-2">Allocated: 1 Core Shared</div>
                      </div>

                      <div className="p-3 bg-bg-deep/80 border border-border-subtle rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                            <span className="flex items-center gap-1.5"><Activity className="h-3 w-3 text-purple-glow" /> RAM Usage</span>
                            <span className="text-success font-semibold">256MB / 512MB</span>
                          </div>
                          <div className="w-full bg-bg-card h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-primary to-purple-primary h-full rounded-full" style={{ width: '50%' }} />
                          </div>
                        </div>
                        <div className="text-[9px] text-text-muted mt-2">Active sandbox workload</div>
                      </div>

                      <div className="p-3 bg-bg-deep/80 border border-border-subtle rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                            <span className="flex items-center gap-1.5"><HardDrive className="h-3 w-3 text-purple-glow" /> MinIO Storage</span>
                            <span className="text-success font-semibold">1.2 GB / 5.0 GB</span>
                          </div>
                          <div className="w-full bg-bg-card h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-primary to-purple-glow h-full rounded-full" style={{ width: '24%' }} />
                          </div>
                        </div>
                        <div className="text-[9px] text-text-muted mt-2">S3-Compatible CDN Cache</div>
                      </div>

                      <div className="p-3 bg-bg-deep/80 border border-border-subtle rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                            <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-blue-glow" /> Bandwidth</span>
                            <span className="text-blue-glow font-semibold">8.2 GB / 10 GB</span>
                          </div>
                          <div className="w-full bg-bg-card h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-primary to-purple-primary h-full rounded-full" style={{ width: '82%' }} />
                          </div>
                        </div>
                        <div className="text-[9px] text-text-muted mt-2">Resets in 4 days</div>
                      </div>
                    </div>
                  )}

                  {demoTab === 'config' && (
                    <div className="font-mono text-[11px] text-text-secondary p-3 bg-bg-deep/80 rounded-lg border border-border-subtle min-h-[180px] overflow-y-auto leading-relaxed">
                      <div className="text-text-muted">// vallexis.json configuration</div>
                      <div>{"{"}</div>
                      <div className="pl-4"><span className="text-purple-glow">"name"</span>: <span className="text-blue-glow">"iguana-analytics"</span>,</div>
                      <div className="pl-4"><span className="text-purple-glow">"build"</span>: {"{"}</div>
                      <div className="pl-8"><span className="text-purple-glow">"command"</span>: <span className="text-blue-glow">"npm run build"</span>,</div>
                      <div className="pl-8"><span className="text-purple-glow">"output"</span>: <span className="text-blue-glow">".next"</span></div>
                      <div className="pl-4">{"}"},</div>
                      <div className="pl-4"><span className="text-purple-glow">"services"</span>: [<span className="text-blue-glow">"postgres"</span>, <span className="text-blue-glow">"minio"</span>],</div>
                      <div className="pl-4"><span className="text-purple-glow">"routing"</span>: {"{"}</div>
                      <div className="pl-8"><span className="text-purple-glow">"ssl"</span>: <span className="text-success">"auto"</span>,</div>
                      <div className="pl-8"><span className="text-purple-glow">"compressImages"</span>: <span className="text-success">true</span></div>
                      <div className="pl-4">{"}"}</div>
                      <div>{"}"}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-4 text-[10px] text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 text-text-muted animate-spin-slow" />
                    <span>Synchronized with repository main</span>
                  </div>
                  <a href="/register" className="text-blue-primary hover:text-blue-glow font-medium transition-colors flex items-center gap-1">
                    Launch project dashboard
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 max-w-5xl relative z-10">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3 text-text-primary">
              Deploy in <span className="gradient-text bg-gradient-to-r from-blue-primary to-purple-primary bg-clip-text text-transparent">three steps</span>
            </h2>
            <p className="text-text-secondary text-sm sm:text-base max-w-md mx-auto">
              Go from local Git code to a production URL in less than 60 seconds.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 100}>
              <div className="relative p-6 sm:p-8 rounded-xl glass card-hover text-center border border-border-subtle group h-full flex flex-col justify-between">
                <div>
                  <div className="text-4xl sm:text-5xl font-heading font-extrabold gradient-text bg-gradient-to-br from-blue-glow to-purple-primary bg-clip-text text-transparent mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    {step.num}
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2 text-text-primary">{step.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 max-w-5xl relative z-10">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3 text-text-primary">
              Everything you need to <span className="gradient-text bg-gradient-to-r from-blue-primary to-purple-primary bg-clip-text text-transparent font-extrabold">scale</span>
            </h2>
            <p className="text-text-secondary text-sm sm:text-base max-w-md mx-auto">
              A comprehensive, zero-config platform equipped with institutional-grade developer operations.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feat, i) => (
            <FadeIn key={feat.title} delay={i * 80}>
              <div className="group p-6 rounded-xl glass card-hover h-full border border-border-subtle flex flex-col items-start text-left">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-primary/10 to-purple-primary/10 flex items-center justify-center mb-4 group-hover:from-blue-primary/20 group-hover:to-purple-primary/20 transition-all border border-blue-primary/20">
                  <feat.icon className="h-5 w-5 text-blue-glow" />
                </div>
                <h3 className="font-heading text-base font-semibold mb-2 text-text-primary">{feat.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{feat.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Platform Architecture Tabs (New Section) */}
      <section id="architecture" className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 max-w-5xl relative z-10">
        <FadeIn>
          <div className="text-center mb-8">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3 text-text-primary">
              Inspired by the rare. Built for <span className="gradient-text bg-gradient-to-r from-blue-primary to-purple-primary bg-clip-text text-transparent font-extrabold">resilience</span>.
            </h2>
            <p className="text-text-secondary text-sm sm:text-base max-w-md mx-auto">
              Vallexis is designed from the ground up for container-level security, high performance edge routing, and automated management.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-[200px_1fr] gap-6 items-start mt-10">
          {/* Architecture Buttons */}
          <div className="flex md:flex-col gap-2 overflow-x-auto pb-3 md:pb-0 scrollbar-none">
            <button
              onClick={() => setArchTab('edge')}
              className={`flex-1 md:flex-none text-left px-4 py-3 rounded-xl border transition-all text-xs font-semibold whitespace-nowrap ${archTab === 'edge' ? 'bg-blue-primary/10 border-blue-glow text-text-primary shadow-sm' : 'border-border-subtle bg-bg-surface/20 text-text-secondary hover:text-text-primary hover:bg-bg-surface/40'}`}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-glow" />
                Caddy Edge Routing
              </div>
            </button>
            <button
              onClick={() => setArchTab('storage')}
              className={`flex-1 md:flex-none text-left px-4 py-3 rounded-xl border transition-all text-xs font-semibold whitespace-nowrap ${archTab === 'storage' ? 'bg-blue-primary/10 border-blue-glow text-text-primary shadow-sm' : 'border-border-subtle bg-bg-surface/20 text-text-secondary hover:text-text-primary hover:bg-bg-surface/40'}`}
            >
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-glow" />
                S3 Storage (MinIO)
              </div>
            </button>
            <button
              onClick={() => setArchTab('database')}
              className={`flex-1 md:flex-none text-left px-4 py-3 rounded-xl border transition-all text-xs font-semibold whitespace-nowrap ${archTab === 'database' ? 'bg-blue-primary/10 border-blue-glow text-text-primary shadow-sm' : 'border-border-subtle bg-bg-surface/20 text-text-secondary hover:text-text-primary hover:bg-bg-surface/40'}`}
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-glow" />
                Managed PostgreSQL
              </div>
            </button>
          </div>

          {/* Architecture Content Pane */}
          <div className="glass p-6 rounded-2xl border border-border-subtle min-h-[220px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-primary/5 to-purple-primary/5 rounded-full blur-[60px] pointer-events-none" />
            <div>
              {archTab === 'edge' && (
                <div>
                  <h3 className="font-heading text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-glow" />
                    Global Edge Network & Caddy Router
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4 font-body">
                    Every incoming HTTP request is intercepted by our custom Caddy routing agent. It handles lightning-fast TLS termination, routes requests directly to sandbox micro-VM instances via private networks, and configures custom domains on the fly.
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-2 text-xs font-mono text-text-muted">
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Auto Let's Encrypt Wildcard SSL</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> HTTP/3 (QUIC) Protocol Support</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Custom domain DNS verification</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Global Edge DDoS Scrim Layer</li>
                  </ul>
                </div>
              )}

              {archTab === 'storage' && (
                <div>
                  <h3 className="font-heading text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-purple-glow" />
                    Isolated S3 Compatible Object Storage (MinIO)
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4 font-body">
                    Upload objects, media, and assets to a personal MinIO node attached to your sandbox. Features complete AWS S3 protocol compliance, allowing you to use existing AWS SDKs. Plus, we automatically run a lossless image compression service that converts uploaded media into WebP.
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-2 text-xs font-mono text-text-muted">
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> 100% S3 Client / SDK Compatible</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Automatic PNG/JPG to WebP conversion</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> High-concurrency throughput</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Encrypted volume at rest</li>
                  </ul>
                </div>
              )}

              {archTab === 'database' && (
                <div>
                  <h3 className="font-heading text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-glow" />
                    Fully Managed PostgreSQL Clusters
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4 font-body">
                    Spin up dedicated PostgreSQL instances connected inside your private container network. Backed by solid-state storage volumes, we manage automated connection optimization, vacuum scheduling, and take daily encrypted database snapshots.
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-2 text-xs font-mono text-text-muted">
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Private VPC connection isolates db</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Daily encrypted offsite backups</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Connection pool tuning out of the box</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> One-click point-in-time recoveries</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border-subtle mt-6 flex items-center gap-3">
              <span className="text-xs text-text-muted flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-blue-glow" />
                All architecture complies with WCAG accessibility guidelines and TLS 1.3 standards.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 max-w-5xl relative z-10">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3 text-text-primary">
              Simple, <span className="gradient-text bg-gradient-to-r from-blue-primary to-purple-primary bg-clip-text text-transparent font-extrabold">transparent pricing</span>
            </h2>
            <p className="text-text-secondary text-sm sm:text-base max-w-md mx-auto">
              Free forever for small projects, scales automatically with clear pricing.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {/* Free Plan */}
          <FadeIn delay={0}>
            <div className="p-6 sm:p-8 rounded-2xl glass card-hover h-full flex flex-col border border-border-subtle justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold mb-1 text-text-primary">Free</h3>
                <p className="text-xs text-text-secondary mb-4">For hobbyists and early experiments</p>
                <div className="text-3xl sm:text-4xl font-extrabold mb-6 text-text-primary">₱0<span className="text-xs sm:text-sm text-text-muted font-normal">/mo</span></div>
                <ul className="space-y-3 mb-8 text-xs text-text-secondary">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> 1 active container project
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> 2 GB S3 object storage
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> 1 GB fast bandwidth
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> Git push deployments
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> Dynamic Let's Encrypt SSL
                  </li>
                </ul>
              </div>
              <Button variant="outline" size="lg" className="w-full border-border-interactive hover:bg-bg-card rounded-xl text-text-primary" asChild>
                <a href="/register">Start Building</a>
              </Button>
            </div>
          </FadeIn>

          {/* Starter Plan */}
          <FadeIn delay={100}>
            <div className="p-6 sm:p-8 rounded-2xl glass card-hover h-full flex flex-col border border-border-subtle justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold mb-1 text-text-primary">Starter</h3>
                <p className="text-xs text-text-secondary mb-4">Perfect for growing side projects</p>
                <div className="text-3xl sm:text-4xl font-extrabold mb-6 text-text-primary">₱99<span className="text-xs sm:text-sm text-text-muted font-normal">/mo</span></div>
                <ul className="space-y-3 mb-8 text-xs text-text-secondary">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> 1 active container project
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> 5 GB storage & 10 GB bandwidth
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> Custom domain attachment
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> Live terminal deployment logs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> Email support responses within 24h
                  </li>
                </ul>
              </div>
              <Button variant="outline" size="lg" className="w-full border-border-interactive hover:bg-bg-card rounded-xl text-text-primary" asChild>
                <a href="/register">Unlock Starter</a>
              </Button>
            </div>
          </FadeIn>

          {/* Pro Plan */}
          <FadeIn delay={200}>
            <div className="relative p-6 sm:p-8 rounded-2xl glass card-hover h-full flex flex-col border border-blue-primary/50 animate-pulse-glow justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-primary to-purple-primary text-white text-[10px] font-bold tracking-wider uppercase border border-blue-glow">
                Most Popular
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold mb-1 text-text-primary">Pro</h3>
                <p className="text-xs text-text-secondary mb-4">Complete backend infrastructure suite</p>
                <div className="text-3xl sm:text-4xl font-extrabold mb-6 text-text-primary">₱499<span className="text-xs sm:text-sm text-text-muted font-normal">/mo</span></div>
                <ul className="space-y-3 mb-8 text-xs text-text-secondary">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> 2 concurrent active projects
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> 10 GB total object storage
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> 50 GB fast CDN bandwidth
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> Ephemeral PR deployment previews
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> Automatic weekly SEO audits
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" /> Priority 24/7 Slack & email support
                  </li>
                </ul>
              </div>
              <Button size="lg" className="w-full bg-blue-primary text-white hover:bg-blue-vivid rounded-xl shadow-md transition-colors" asChild>
                <a href="/register">Go Professional</a>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Accordion FAQ Section (New Section) */}
      <section id="faq" className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 max-w-3xl relative z-10">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3 text-text-primary">
              Frequently asked <span className="gradient-text bg-gradient-to-r from-blue-primary to-purple-primary bg-clip-text text-transparent font-extrabold">questions</span>
            </h2>
            <p className="text-text-secondary text-sm sm:text-base">
              Got questions? We've got answers. Explore how Vallexis works behind the scenes.
            </p>
          </div>
        </FadeIn>

        <div className="space-y-3 mt-10">
          {faqs.map((faq, index) => {
            const isOpen = faqOpen === index;
            return (
              <FadeIn key={index} delay={index * 50}>
                <div className="rounded-xl border border-border-subtle glass overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left font-heading text-sm sm:text-base font-semibold text-text-primary hover:text-blue-glow transition-colors focus:outline-none focus:text-blue-glow focus:ring-1 focus:ring-blue-glow/30"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span className="ml-4 flex-shrink-0 p-1 rounded-full bg-bg-surface border border-border-subtle text-text-secondary">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-[250px] border-t border-border-subtle bg-bg-surface/10' : 'max-h-0'
                    }`}
                  >
                    <p className="p-5 text-xs sm:text-sm text-text-secondary leading-relaxed font-body">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl relative z-10">
        <FadeIn>
          <div className="relative p-8 sm:p-12 lg:p-16 rounded-3xl overflow-hidden border border-border-subtle bg-bg-surface/20 glass glow">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-primary/10 to-purple-primary/10 opacity-30 pointer-events-none" />
            <div className="relative text-center max-w-lg mx-auto">
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4 text-text-primary">
                Ready to ship your next idea?
              </h2>
              <p className="text-text-secondary text-sm sm:text-base mb-8 leading-relaxed font-body">
                Deploy, scale, and secure your database-driven apps on Vallexis. Get started for free today.
              </p>
              <Button size="lg" asChild className="bg-blue-primary text-white hover:bg-blue-vivid shadow-lg shadow-blue-primary/25 rounded-xl transition-all duration-200">
                <a href="/register" className="flex items-center gap-2">
                  Start Building Free
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 sm:py-12 bg-bg-surface/30 relative z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="font-heading text-xl font-bold gradient-text mb-3">Vallexis</div>
              <p className="text-xs text-text-muted max-w-xs leading-relaxed">
                Zero infrastructure deployment platform designed for tech-forward products and developer operations. Inspired by the rare, built for the resilient.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="/product" className="text-text-muted hover:text-text-primary transition-colors">Product Overview</a></li>
                <li><a href="/features" className="text-text-muted hover:text-text-primary transition-colors">Features</a></li>
                <li><a href="/pricing" className="text-text-muted hover:text-text-primary transition-colors">Pricing</a></li>
                <li><a href="/architecture" className="text-text-muted hover:text-text-primary transition-colors">Architecture</a></li>
                <li><a href="/docs" className="text-text-muted hover:text-text-primary transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Support</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="/faq" className="text-text-muted hover:text-text-primary transition-colors">FAQ</a></li>
                <li><a href="/security" className="text-text-muted hover:text-text-primary transition-colors">Security</a></li>
                <li><a href="/status" className="text-text-muted hover:text-text-primary transition-colors">Status</a></li>
                <li><a href="/login" className="text-text-muted hover:text-text-primary transition-colors">Console</a></li>
                <li><a href="/register" className="text-text-muted hover:text-text-primary transition-colors">Signup</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border-subtle">
            <p className="text-xs text-text-muted">
              © 2026 Vallexis. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                All services operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

