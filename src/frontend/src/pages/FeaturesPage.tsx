import { useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import {
  Rocket,
  Database,
  HardDrive,
  Shield,
  Zap,
  Globe,
  Check,
  Lock,
  Cpu,
  Code
} from 'lucide-react';

export function FeaturesPage() {
  const [activeInspectorTab, setActiveInspectorTab] = useState<number>(0);

  const featuresList = [
    {
      icon: Rocket,
      title: 'Autopilot Application Delivery',
      desc: 'You build the code, we handle the logistics. Link your Git repository once, and Vallexis automatically detects updates, creates a secure deployment package, and puts it live without downtime.',
      details: ['Zero server configuration needed', 'Continuous automated updates on push', 'Supports React, Next.js, Node.js, Go, and Python'],
      techSpec: 'Powered by Nixpacks OCI image builder. Nixpacks auto-detects dependencies and generates minimal Alpine-based container filesystems without requiring a custom Dockerfile.',
      codeExample: `# Example nixpacks.toml for customization
[providers]
node = { version = "22" }

[phases.build]
cmds = ["npm run build"]`,
      inspectData: {
        runtime: 'NodeJS 22 / Go 1.22 / Python 3.11',
        buildEngine: 'Nixpacks v1.26.0',
        isolation: 'gVisor sandbox container layers',
        envVars: 'AUTO_DETECT_BUILD=true\nNIXPACKS_CACHE_DIR=/cache'
      }
    },
    {
      icon: Database,
      title: 'Private Data Vaults',
      desc: 'Protect customer database records. Vallexis provisions dedicated PostgreSQL database clusters inside isolated networks, making them completely secure from outside internet scans or intruders.',
      details: ['Encrypted daily offsite backups', 'Custom connection limits and buffers', 'One-click restore to previous states'],
      techSpec: 'PostgreSQL 16-alpine runtime isolated within a dedicated docker network namespace. Ingress is restricted via local iptables firewalls; connections are allowed only from designated gateway containers.',
      codeExample: `// Go Database Connection via Private VPC URL
db, err := sqlx.Connect("postgres", "postgres://vallexis:pass@vallexis-postgres:5432/db")
if err != nil {
    log.Fatalf("VPC DB connection failed: %v", err)
}`,
      inspectData: {
        runtime: 'PostgreSQL 16-alpine',
        buildEngine: 'Internal DB Provisioner',
        isolation: 'Bridge Network (No Public Port)',
        envVars: 'POSTGRES_DB=vallexis_main\nPGDATA=/var/lib/postgresql/data/pgdata'
      }
    },
    {
      icon: HardDrive,
      title: 'Asset Warehouse with Storage Optimizer',
      desc: 'Store customer media files and product documents securely. Vallexis includes a smart image optimizer that automatically compresses uploads to WebP formats to cut your bandwidth bills.',
      details: ['Lossless WebP optimizer cuts image file sizes by 60%', 'AWS S3 compatible connection keys', 'High-speed delivery for files and documents'],
      techSpec: 'MinIO server instance running with S3 compliance. Integrated proxy interceptor scans uploads for JPEG/PNG images and executes dynamic lossless WebP conversion on-the-fly to save 60%+ bandwidth.',
      codeExample: `// Upload using standard AWS S3 SDK
s3Client.PutObject(&s3.PutObjectInput{
    Bucket: aws.String("user-uploads"),
    Key:    aws.String("avatar.png"),
    Body:   fileReader,
})`,
      inspectData: {
        runtime: 'MinIO RELEASE.2024-05-10',
        buildEngine: 'S3 Compatibility layer',
        isolation: 'Private S3 Access Policy',
        envVars: 'MINIO_ROOT_USER=vallexis_s3\nWEBP_CONVERT_QUALITY=85'
      }
    },
    {
      icon: Shield,
      title: 'Automatic Security Shield & Address Router',
      desc: 'Route customer requests safely. Vallexis automatically registers, verifies, and renews secure lock certificates (SSL) for your custom business domains, keeping connections encrypted.',
      details: ['Automatic lock certificates (SSL)', 'HTTP/3 protocol for fast address loads', 'Built-in security rules sanitize request headers'],
      techSpec: 'Custom-configured Caddy Server managing ACME client negotiations. Automatically handles HTTP-01 and DNS-01 certificate validation challenges for zero-maintenance HTTPS.',
      codeExample: `# Dynamic Caddyfile Proxy Routing
yourdomain.com {
    reverse_proxy vallexis-react-frontend-1:80 {
        header_up Host {upstream_host}
    }
}`,
      inspectData: {
        runtime: 'Caddy Server v2.8.4',
        buildEngine: 'Edge Ingress Proxy Router',
        isolation: 'Edge TLS Termination Layer',
        envVars: 'CADDY_AGREEMENT=letsencrypt\nTLS_PROTOCOL_MIN=tls1.3'
      }
    },
    {
      icon: Zap,
      title: 'System Performance Visuals',
      desc: 'Trace CPU, memory, and database load in real time. We display clear, non-technical graphs directly in your console dashboard, so you always know how your site is performing.',
      details: ['No server-monitoring agents to install', 'Clear, integrated dashboard charts', 'Automatic alert triggers for server loads'],
      techSpec: 'Telemetry gathered via Prometheus scraping Docker Engine cAdvisor metrics. Integrates dashboard charts on frontend pages using Grafana\'s secure iframe query tokens.',
      codeExample: `# Prometheus scrape target config
scrape_configs:
  - job_name: 'docker-containers'
    scrape_interval: 5s
    static_configs:
      - targets: ['cadvisor:8080']`,
      inspectData: {
        runtime: 'Prometheus 2.52.0 & Grafana 10.4',
        buildEngine: 'cAdvisor Daemon telemetry',
        isolation: 'Isolated Metrics Port',
        envVars: 'PROMETHEUS_RETENTION_TIME=15d\nSCRAPE_INTERVAL=5s'
      }
    },
    {
      icon: Globe,
      title: 'Automatic Search Engine Audits',
      desc: 'Keep your site fast and optimized. Vallexis runs weekly automated diagnostics, analyzing search keywords, loading speed, and accessibility to make sure you rank high on search engines.',
      details: ['Automated Lighthouse performance reports', 'Actionable speed improvement lists', 'Track score improvements over time'],
      techSpec: 'Runs headless Google Chrome containers to perform automated audits. Compiles scoring summaries and accessibility reports, outputting actionable improvement suggestions.',
      codeExample: `// Lighthouse JSON Audit structure
{
  "performance": 98,
  "accessibility": 100,
  "bestPractices": 95,
  "seo": 92
}`,
      inspectData: {
        runtime: 'Headless Chrome / Lighthouse CLI',
        buildEngine: 'Scheduled cron evaluator',
        isolation: 'Cronjob worker container',
        envVars: 'LIGHTHOUSE_AUDIT_CRON="0 0 * * 0"\nAUDIT_SCORE_MIN=90'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary relative overflow-hidden font-body pb-16">
      {/* Background Glowing Overlays */}
      <div className="absolute top-[5%] left-1/4 w-[400px] h-[250px] bg-gradient-to-r from-blue-primary/5 to-purple-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <PublicHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mb-4">
            Platform features built for <span className="gradient-text bg-gradient-to-r from-blue-primary via-blue-glow to-purple-primary bg-clip-text text-transparent">business operations</span>
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Vallexis handles the complex parts of server packaging and domain validation, keeping your software fast, secure, and search-optimized.
          </p>
        </div>

        {/* Dynamic Spec Inspector (framed for IT/Dev deep dives) */}
        <section className="mb-20">
          <div className="text-center mb-8">
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary">
              Technical Specifications & Variables
            </h2>
            <p className="text-xs text-text-secondary max-w-md mx-auto mt-1">
              Select any capability below to review the technical details, container isolation models, and sample variables (For Developer teams).
            </p>
          </div>

          <div className="glass border border-border-subtle rounded-2xl overflow-hidden grid md:grid-cols-[240px_1fr] bg-bg-surface/10">
            {/* Left selector */}
            <div className="border-r border-border-subtle bg-bg-surface/30 p-4 space-y-1">
              {featuresList.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveInspectorTab(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center gap-2 border transition-all ${
                      activeInspectorTab === idx
                        ? 'bg-blue-primary/10 border-blue-primary/30 text-text-primary font-medium'
                        : 'border-transparent text-text-secondary hover:bg-bg-surface/50 hover:text-text-primary'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-blue-glow flex-shrink-0" />
                    <span>{feat.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Display Spec Panel */}
            <div className="p-6 sm:p-8 flex flex-col justify-between min-h-[300px]">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-glow px-2 py-0.5 rounded border border-blue-primary/20 bg-blue-primary/5">
                  Internal Server Parameters
                </span>
                <h3 className="font-heading text-lg font-bold text-text-primary mt-2 mb-4">
                  {featuresList[activeInspectorTab].title}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-bg-deep/50 border border-border-subtle">
                    <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Runtime Version</span>
                    <span className="text-text-primary font-mono font-medium">{featuresList[activeInspectorTab].inspectData.runtime}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-bg-deep/50 border border-border-subtle">
                    <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Compilation / Build Engine</span>
                    <span className="text-text-primary font-mono font-medium">{featuresList[activeInspectorTab].inspectData.buildEngine}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-bg-deep/50 border border-border-subtle">
                    <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Isolation Sandbox Standard</span>
                    <span className="text-text-primary font-mono font-medium">{featuresList[activeInspectorTab].inspectData.isolation}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-bg-deep/50 border border-border-subtle">
                    <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Daemon Environment Envs</span>
                    <pre className="text-blue-glow font-mono text-[10px] leading-relaxed whitespace-pre mt-1 bg-bg-deep p-2 rounded-lg">
                      {featuresList[activeInspectorTab].inspectData.envVars}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border-subtle/50 text-[11px] text-text-secondary leading-relaxed">
                <strong>Mechanism:</strong> {featuresList[activeInspectorTab].techSpec}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Deep Dive Grid */}
        <div className="space-y-12">
          {featuresList.map((feat, idx) => (
            <div key={idx} className="p-6 sm:p-8 rounded-2xl glass border border-border-subtle bg-bg-surface/30 hover:border-blue-primary/20 transition-all grid md:grid-cols-[1fr_320px] gap-8">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-primary/10 flex items-center justify-center border border-blue-primary/20">
                      <feat.icon className="h-5 w-5 text-blue-glow" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-text-primary">{feat.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-text-secondary mb-4 leading-relaxed">{feat.desc}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Capabilities Included</h4>
                  <ul className="grid sm:grid-cols-2 gap-2 text-xs text-text-secondary">
                    {feat.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Code Example Box */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border-subtle bg-bg-surface/60 rounded-t-xl text-[10px] text-text-muted font-mono font-bold">
                  <Code className="h-3.5 w-3.5" /> Code / Integration Example
                </div>
                <pre className="p-4 bg-bg-deep text-[10px] text-blue-glow font-mono rounded-b-xl border-x border-b border-border-subtle overflow-x-auto select-all leading-normal whitespace-pre">
                  {feat.codeExample}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Feature specs section */}
        <div className="mt-20 p-8 rounded-2xl border border-border-subtle bg-bg-surface/10 glass text-center">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary mb-3">
            WCAG Compliant & Infrastructure Secure
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-lg mx-auto leading-relaxed mb-6">
            All user facing applications and dashboards strictly comply with WCAG accessibility guidelines and modern security parameters.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-text-muted">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-blue-glow" /> TLS 1.3 Encryption</span>
            <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-purple-glow" /> Private VPC Subnets</span>
            <span className="flex items-center gap-1.5"><Cpu className="h-4 w-4 text-blue-glow" /> Multi-core Sandboxing</span>
          </div>
        </div>
      </main>
    </div>
  );
}
