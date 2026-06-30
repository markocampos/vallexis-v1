import { useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import {
  Globe,
  Database,
  Layers,
  Check,
  HardDrive,
  ArrowRight
} from 'lucide-react';

export function ArchitecturePage() {
  const [activeTab, setActiveTab] = useState<'edge' | 'builder' | 'storage' | 'database'>('edge');

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary relative overflow-hidden font-body pb-16">
      {/* Background Glowing Overlays */}
      <div className="absolute top-[5%] left-1/4 w-[400px] h-[250px] bg-gradient-to-r from-blue-primary/5 to-purple-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <PublicHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mb-4">
            Built for security & <span className="gradient-text bg-gradient-to-r from-blue-primary via-blue-glow to-purple-primary bg-clip-text text-transparent">horizontal resilience</span>
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Vallexis isolates workloads dynamically, routes requests through a high-performance proxy edge layer, and utilizes native container orchestration.
          </p>
        </div>

        {/* Interactive Architecture Flow Diagram */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold text-blue-glow uppercase tracking-widest px-2 py-0.5 rounded border border-blue-primary/30 bg-blue-primary/5">
              Live Network Flow Map
            </span>
            <h2 className="font-heading text-xl font-bold text-text-primary mt-2">
              Visual Platform Map
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Select architectural tabs below to highlight dynamic network paths in the infrastructure flow map.
            </p>
          </div>

          <div className="glass p-6 sm:p-8 rounded-2xl border border-border-subtle bg-bg-surface/20 relative overflow-hidden flex flex-col items-center justify-center">
            {/* Visual Flow Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center w-full max-w-2xl relative z-10">
              {/* Node 1: Public Internet */}
              <div className="p-4 rounded-xl border border-border-subtle bg-bg-deep text-center">
                <span className="text-[10px] text-text-muted block uppercase font-bold">Traffic Source</span>
                <span className="text-xs text-text-primary font-bold block mt-1">Public Request / GitHub Webhook</span>
              </div>

              {/* Connector 1 */}
              <div className="flex flex-col items-center justify-center">
                <ArrowRight className={`h-5 w-5 hidden md:block transition-all duration-300 ${
                  activeTab === 'edge' || activeTab === 'builder' ? 'text-blue-glow scale-125' : 'text-text-muted'
                }`} />
                <span className="text-[9px] font-mono text-text-muted mt-1 hidden md:block">
                  {activeTab === 'edge' ? 'HTTPS Inbound' : activeTab === 'builder' ? 'Repo Push' : 'Bridged'}
                </span>
              </div>

              {/* Node 2: Gateway Router or Build Engine */}
              <div className={`p-4 rounded-xl border text-center transition-all duration-300 ${
                activeTab === 'edge' ? 'border-blue-glow bg-blue-primary/10 shadow-lg scale-105' :
                activeTab === 'builder' ? 'border-purple-glow bg-purple-primary/10 shadow-lg scale-105' :
                'border-border-subtle bg-bg-deep'
              }`}>
                <span className="text-[10px] text-text-muted block uppercase font-bold">
                  {activeTab === 'builder' ? 'Build System' : 'Edge Gate'}
                </span>
                <span className="text-xs text-text-primary font-bold block mt-1">
                  {activeTab === 'builder' ? 'Nixpacks Builder' : 'Caddy Edge Proxy'}
                </span>
              </div>

              {/* Connector 2 */}
              <div className="flex flex-col items-center justify-center">
                <ArrowRight className={`h-5 w-5 hidden md:block transition-all duration-300 ${
                  activeTab !== 'edge' ? 'text-purple-glow scale-125' : 'text-blue-glow scale-110'
                }`} />
                <span className="text-[9px] font-mono text-text-muted mt-1 hidden md:block">
                  {activeTab === 'database' ? 'SQL Bridge' : activeTab === 'storage' ? 'WebP S3' : 'Sandbox Bind'}
                </span>
              </div>

              {/* Node 3: Isolated Sandboxes */}
              <div className={`p-4 rounded-xl border text-center transition-all duration-300 ${
                activeTab === 'database' ? 'border-purple-glow bg-purple-primary/10 shadow-lg scale-105' :
                activeTab === 'storage' ? 'border-blue-glow bg-blue-primary/10 shadow-lg scale-105' :
                'border-border-subtle bg-bg-deep'
              }`}>
                <span className="text-[10px] text-text-muted block uppercase font-bold">VPC Sandbox</span>
                <span className="text-xs text-text-primary font-bold block mt-1">
                  {activeTab === 'database' ? 'PostgreSQL Cluster' : activeTab === 'storage' ? 'MinIO Storage' : 'App Container'}
                </span>
              </div>
            </div>

            {/* Path Explanations annotation */}
            <div className="mt-8 text-center text-xs text-text-secondary bg-bg-deep/40 p-4 rounded-xl border border-border-subtle max-w-lg w-full">
              {activeTab === 'edge' && (
                <span>
                  <strong>Active Flow:</strong> Visitors query your domain &rarr; Caddy Edge Proxy terminates SSL/TLS 1.3 &rarr; forwards securely to the designated app container.
                </span>
              )}
              {activeTab === 'builder' && (
                <span>
                  <strong>Active Flow:</strong> Git Commit push &rarr; Webhook triggers Nixpacks compilation build sandbox &rarr; builds image &rarr; launches container inside private namespace.
                </span>
              )}
              {activeTab === 'storage' && (
                <span>
                  <strong>Active Flow:</strong> Application uploads file &rarr; MinIO WebP Compressor Middleware intercepts &rarr; saves WebP file to private object storage bucket.
                </span>
              )}
              {activeTab === 'database' && (
                <span>
                  <strong>Active Flow:</strong> Application issues SQL query &rarr; routes securely through local network bridge to dedicated isolated PostgreSQL instance.
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Tab System */}
        <div className="grid sm:grid-cols-4 gap-2 mb-8 bg-bg-surface p-1.5 rounded-2xl border border-border-subtle">
          <button
            onClick={() => setActiveTab('edge')}
            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'edge'
                ? 'bg-blue-primary text-white shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Globe className="h-4 w-4" />
            Edge Caddy Proxy
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'builder'
                ? 'bg-blue-primary text-white shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Layers className="h-4 w-4" />
            Nixpacks Builder
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'storage'
                ? 'bg-blue-primary text-white shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            MinIO Object Store
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'database'
                ? 'bg-blue-primary text-white shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Database className="h-4 w-4" />
            PostgreSQL DB
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="glass p-8 rounded-2xl border border-border-subtle min-h-[300px]">
          {activeTab === 'edge' && (
            <div>
              <h3 className="font-heading text-xl font-bold text-text-primary mb-3 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-glow" />
                Caddy Edge Ingress & Routing (The Security Gate)
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4 font-body">
                Think of Caddy as your website's secure gatekeeper and receptionist. When a visitor types your domain address in their browser, Caddy greets them, validates their secure credentials (automatic Let's Encrypt SSL/TLS 1.3), and directs them to the correct isolated room (application sandbox) immediately.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs text-text-muted mt-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Auto renewal for SSL certificates</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> HTTP/3 (QUIC) protocol support</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Header sanitization & proxy forwarding</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Rate-limiting defenses at port ingress</li>
              </ul>
            </div>
          )}

          {activeTab === 'builder' && (
            <div>
              <h3 className="font-heading text-xl font-bold text-text-primary mb-3 flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-glow" />
                Nixpacks Auto-Packaging (The Professional Packager)
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4 font-body">
                Nixpacks operates as an automated packaging engineer. Instead of you configuring server settings and compiler versions, Nixpacks analyzes your files, figures out exactly what runtime environments (like Node.js, Python, or Go) your site requires, wraps them in a secure OCI container package, and launches it.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs text-text-muted mt-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Auto-detection of build dependencies</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Docker Layer caching optimization</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Nix-based reproducible packages</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Zero configuration builds</li>
              </ul>
            </div>
          )}

          {activeTab === 'storage' && (
            <div>
              <h3 className="font-heading text-xl font-bold text-text-primary mb-3 flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-glow" />
                MinIO Object Storage (The Media Warehouse)
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4 font-body">
                MinIO is a high-speed digital warehouse for your media assets (images, PDFs, documents). Every project gets an S3-compatible storage bucket. As a bonus, our middleware automatically intercepts PNG/JPEG uploads and compresses them to WebP format, saving up to 60% on storage and bandwidth fees.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs text-text-muted mt-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> 100% compliant AWS S3 protocols</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Integrated WebP conversion middleware</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Secure, private namespace buckets</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> High speed asset delivery CDNs</li>
              </ul>
            </div>
          )}

          {activeTab === 'database' && (
            <div>
              <h3 className="font-heading text-xl font-bold text-text-primary mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-glow" />
                PostgreSQL Database (The Locked Filing Cabinet)
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4 font-body">
                Your database is a secure digital bank vault. Instead of exposing database ports to the open internet where hackers can run scans, Vallexis places PostgreSQL inside private bridge networks. Only your active web application container can communicate with the database.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs text-text-muted mt-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Automatic daily encrypted backups</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Point-in-time snapshot recovery</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Shared buffers & resource limits</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Private subnets safe from public scans</li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
