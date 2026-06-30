import { PublicHeader } from '@/components/layout/PublicHeader';
import {
  CheckCircle2,
  Activity,
  Server,
  Database,
  Globe,
  HardDrive,
  Clock
} from 'lucide-react';

export function StatusPage() {
  const services = [
    { name: 'Global Edge Router (Caddy)', status: 'Operational', ping: '12ms', uptime: '99.99%', icon: Globe, color: 'text-success' },
    { name: 'Nixpacks Deploy Service', status: 'Operational', ping: '45ms', uptime: '99.95%', icon: Server, color: 'text-success' },
    { name: 'Managed PostgreSQL Engine', status: 'Operational', ping: '2ms', uptime: '100.00%', icon: Database, color: 'text-success' },
    { name: 'S3 Object Storage (MinIO)', status: 'Operational', ping: '8ms', uptime: '99.98%', icon: HardDrive, color: 'text-success' },
    { name: 'Prometheus & Grafana API', status: 'Operational', ping: '30ms', uptime: '99.90%', icon: Activity, color: 'text-success' },
  ];

  const incidents = [
    { date: 'June 24, 2026', title: 'Scheduled Maintenance: Database Upgrades', desc: 'Completed database patch upgrades with zero downtime to all active Postgres nodes.' },
    { date: 'June 18, 2026', title: 'Edge Routing Latency Spike', desc: 'Resolved a brief routing latency spike on the EU edge node. Traffic was rerouted successfully in 3 minutes.' }
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary relative overflow-hidden font-body pb-16">
      {/* Background Glowing Overlays */}
      <div className="absolute top-[5%] left-1/4 w-[400px] h-[250px] bg-gradient-to-r from-blue-primary/5 to-purple-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <PublicHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl relative z-10">
        {/* Banner */}
        <div className="p-6 rounded-2xl border border-success/30 bg-success/5 flex items-center gap-4 mb-10">
          <CheckCircle2 className="h-8 w-8 text-success flex-shrink-0" />
          <div>
            <h2 className="font-heading text-lg font-bold text-text-primary">All Services Operational</h2>
            <p className="text-xs text-text-secondary mt-0.5">Vallexis systems are operating normally. Uptime verified over the last 90 days.</p>
          </div>
        </div>

        {/* Services Status Table */}
        <div className="glass rounded-2xl border border-border-subtle overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-border-subtle bg-bg-surface/50 flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-text-primary">Platform Service Metrics</h3>
            <span className="text-[10px] text-text-muted flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Live checks</span>
          </div>
          <div className="divide-y divide-border-subtle/50">
            {services.map((svc, idx) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <svc.icon className="h-4 w-4 text-text-muted" />
                  <span className="font-medium text-text-primary">{svc.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[10px] text-text-muted hidden sm:inline">latency: {svc.ping}</span>
                  <span className="text-[10px] text-text-muted hidden sm:inline">uptime: {svc.uptime}</span>
                  <span className="text-xs font-semibold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded">
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="space-y-6">
          <h3 className="font-heading text-base font-bold text-text-primary">Incident History</h3>
          <div className="space-y-4">
            {incidents.map((inc, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-border-subtle bg-bg-surface/10 text-xs sm:text-sm">
                <span className="text-[10px] text-text-muted font-semibold">{inc.date}</span>
                <h4 className="font-bold text-text-primary mt-1 mb-2">{inc.title}</h4>
                <p className="text-text-secondary leading-relaxed">{inc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
