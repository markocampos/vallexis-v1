import { PublicHeader } from '@/components/layout/PublicHeader';
import {
  Shield,
  Lock,
  Server,
  Database,
  Check,
  ShieldCheck
} from 'lucide-react';

export function SecurityPage() {
  const securityPillars = [
    {
      icon: Lock,
      title: 'Data Encryption',
      desc: 'All databases and object storage namespaces are encrypted at rest using industry-standard AES-256 keys. Traffic transit is protected by strict TLS 1.3 encryption, ensuring no snooping on database queries.'
    },
    {
      icon: Server,
      title: 'Container Sandbox Isolation',
      desc: 'Workloads execute inside isolated micro-containers. Network namespaces isolate all internal processes, preventing unauthorized resource sharing or cross-project scans.'
    },
    {
      icon: Database,
      title: 'Automated Snapshot Backups',
      desc: 'Vallexis takes encrypted daily snapshots of your database states. Backups are stored in separate secure regional data centers to prevent loss under disaster scenarios.'
    },
    {
      icon: ShieldCheck,
      title: 'Edge Ingress Guardrails',
      desc: 'Caddy proxy agents validate domains, sanitize headers, and prevent basic request forgery (CSRF) and injection attempts directly at port entryways.'
    }
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary relative overflow-hidden font-body pb-16">
      {/* Background Glowing Overlays */}
      <div className="absolute top-[5%] left-1/4 w-[400px] h-[250px] bg-gradient-to-r from-blue-primary/5 to-purple-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <PublicHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mb-4">
            Institutional-grade <span className="gradient-text bg-gradient-to-r from-blue-primary via-blue-glow to-purple-primary bg-clip-text text-transparent">security posture</span>
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            We handle infrastructure security so that your business database and files remain completely private and resilient.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {securityPillars.map((pillar, idx) => (
            <div key={idx} className="p-6 rounded-2xl glass border border-border-subtle bg-bg-surface/20 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-primary/10 flex items-center justify-center flex-shrink-0 border border-blue-primary/20">
                <pillar.icon className="h-5 w-5 text-blue-glow" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-text-primary mb-2">{pillar.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Audit details box */}
        <div className="p-8 rounded-2xl border border-border-subtle bg-bg-surface/10 glass">
          <h2 className="font-heading text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-glow" /> Security & Compliance Parameters
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-xs text-text-secondary">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              <span><strong>TLS 1.3 & HSTS:</strong> Mandatory secure transport with Strict Transport Security headers on all subdomains.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              <span><strong>Isolated network namespaces:</strong> Bridge interfaces segment application traffic internally.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              <span><strong>Automated let's encrypt:</strong> ACME protocol handles secure wildcards out of the box.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              <span><strong>Key rotation protocols:</strong> Automated rotation of database access keys and JWT tokens.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
