import { useState, useCallback } from 'react';
import { FadeIn } from '@/components/ui/animated';
import { PublicHeader } from '@/components/layout/PublicHeader';
import {
  BookOpen,
  Lightbulb,
  Globe,
  Server,
  Database,
  Activity,
  UserCheck,
  Search,
  Terminal,
  Code
} from 'lucide-react';

interface DocSection {
  title: string;
  content: React.ReactNode;
}

interface DocArticle {
  id: string;
  title: string;
  category: 'general' | 'technical';
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  sections: DocSection[];
}

const articles: DocArticle[] = [
  {
    id: 'getting-started',
    title: 'Getting Started (For Everyone)',
    category: 'general',
    icon: BookOpen,
    summary: 'Learn how to deploy your very first application on Vallexis without any DevOps or command line experience.',
    sections: [
      {
        title: 'Welcome to Vallexis',
        content: (
          <p>Vallexis is a modern deployment platform designed to make shipping apps easy.</p>
        )
      }
    ]
  },
  {
    id: 'pricing-limits',
    title: 'Pricing & Resource Limits',
    category: 'general',
    icon: UserCheck,
    summary: 'A clear breakdown of plans, storage quotas, and bandwidth limits.',
    sections: []
  },
  {
    id: 'domains-ssl',
    title: 'Custom Domains & SSL setup',
    category: 'general',
    icon: Globe,
    summary: 'Setting up custom domains with standard DNS records and automatic HTTPS.',
    sections: []
  },
  {
    id: 'nextjs-deploy',
    title: 'Deploying a Next.js SSR App',
    category: 'technical',
    icon: Code,
    summary: 'Optimizing and deploying Next.js SSR applications.',
    sections: []
  },
  {
    id: 'cli-commands',
    title: 'Vallexis CLI (agy) Reference',
    category: 'technical',
    icon: Terminal,
    summary: 'Full terminal command reference for deploying projects from the command line.',
    sections: []
  },
  {
    id: 'architecture',
    title: 'Platform Architecture (Technical)',
    category: 'technical',
    icon: Server,
    summary: 'A deep-dive review of Vallexis internal design.',
    sections: []
  },
  {
    id: 'database-storage',
    title: 'Managed Postgres & MinIO Storage',
    category: 'technical',
    icon: Database,
    summary: 'Technical specifications of PostgreSQL and MinIO S3 storage.',
    sections: []
  },
  {
    id: 'observability',
    title: 'Observability (Prometheus & Grafana)',
    category: 'technical',
    icon: Activity,
    summary: 'Resource utilization logs and Grafana dashboard integration.',
    sections: []
  }
];

export function Docs() {
  const [activeDocId, setActiveDocId] = useState<string>('getting-started');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [helpfulFeedback, setHelpfulFeedback] = useState<'yes' | 'no' | null>(null);

  const handleHelpful = useCallback((feedback: 'yes' | 'no') => {
    setHelpfulFeedback(feedback);
  }, []);

  const filteredArticles = articles.filter(art =>
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDoc = filteredArticles.find(a => a.id === activeDocId) || filteredArticles[0] || articles[0];

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary relative overflow-hidden font-body">
      {/* Background Glowing Overlays */}
      <div className="absolute top-[5%] left-1/4 w-[400px] h-[250px] bg-gradient-to-r from-blue-primary/5 to-purple-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <PublicHeader />

      {/* Docs Layout */}
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10 grid md:grid-cols-[260px_1fr] gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="space-y-6 md:sticky md:top-24">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-surface/50 border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-glow transition-all"
            />
          </div>

          <div>
            <h3 className="text-[10px] text-text-muted font-bold tracking-wider uppercase px-2.5 mb-2">Guides (For Everyone)</h3>
            <div className="space-y-1">
              {filteredArticles.filter(a => a.category === 'general').map(art => (
                <button
                  key={art.id}
                  onClick={() => setActiveDocId(art.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center gap-2 border transition-all ${
                    activeDocId === art.id
                      ? 'bg-blue-primary/10 border-blue-glow text-text-primary font-medium'
                      : 'border-transparent text-text-secondary hover:bg-bg-surface/50 hover:text-text-primary'
                  }`}
                >
                  <art.icon className="h-4 w-4 text-blue-glow flex-shrink-0" />
                  {art.title.replace(' (For Everyone)', '')}
                </button>
              ))}
              {filteredArticles.filter(a => a.category === 'general').length === 0 && (
                <span className="text-[10px] text-text-muted px-2.5 italic">No matching guides.</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] text-text-muted font-bold tracking-wider uppercase px-2.5 mb-2">Developer Docs (Technical)</h3>
            <div className="space-y-1">
              {filteredArticles.filter(a => a.category === 'technical').map(art => (
                <button
                  key={art.id}
                  onClick={() => setActiveDocId(art.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center gap-2 border transition-all ${
                    activeDocId === art.id
                      ? 'bg-purple-primary/10 border-purple-glow text-text-primary font-medium'
                      : 'border-transparent text-text-secondary hover:bg-bg-surface/50 hover:text-text-primary'
                  }`}
                >
                  <art.icon className="h-4 w-4 text-purple-glow flex-shrink-0" />
                  {art.title.replace(' (Technical)', '')}
                </button>
              ))}
              {filteredArticles.filter(a => a.category === 'technical').length === 0 && (
                <span className="text-[10px] text-text-muted px-2.5 italic">No matching specs.</span>
              )}
            </div>
          </div>

          {/* Suggestions box for non-techies */}
          <div className="p-4 rounded-xl border border-border-glow bg-bg-surface/30 glass relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-primary/5 to-purple-primary/5 rounded-full blur-[20px]" />
            <h4 className="font-heading text-xs font-bold text-text-primary flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-4 w-4 text-warning" />
              Non-Tech Suggestions
            </h4>
            <p className="text-[10.5px] text-text-secondary leading-relaxed">
              We want Vallexis to be friendly for everyone! Here are guides we suggest adding next:
            </p>
            <ul className="text-[10px] text-text-muted mt-3 space-y-1.5 pl-3 list-disc">
              <li><strong>Interactive Setup Wizard:</strong> Pick your app type and see visual tutorials.</li>
              <li><strong>Plain-English Glossary:</strong> Jargon-free explanations of "DNS", "SSL", "S3", etc.</li>
              <li><strong>Video Screencasts:</strong> 2-minute videos on starting a project.</li>
              <li><strong>Billing & Share:</strong> How to grant project dashboard access to billing managers.</li>
              <li><strong>Metaphorical Guides:</strong> Server networks explained as "digital post offices".</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-muted">
              <span>Have an idea?</span>
              <a href="mailto:support@vallexis.dev" className="text-blue-primary hover:text-blue-glow font-bold">
                Email support
              </a>
            </div>
          </div>
        </aside>

        {/* Doc Content Viewer */}
        <main className="glass border border-border-subtle rounded-2xl p-6 sm:p-8 min-h-[500px] flex flex-col justify-between">
          {activeDoc ? (
            <FadeIn key={activeDoc.id}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <activeDoc.icon className={`h-5 w-5 ${activeDoc.category === 'general' ? 'text-blue-glow' : 'text-purple-glow'}`} />
                  <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                    activeDoc.category === 'general'
                      ? 'bg-blue-primary/10 border-blue-primary/30 text-blue-glow'
                      : 'bg-purple-primary/10 border-purple-primary/30 text-purple-glow'
                  }`}>
                    {activeDoc.category === 'general' ? 'General Guide' : 'Developer Spec'}
                  </span>
                </div>

                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-primary mb-3">
                  {activeDoc.title}
                </h1>

                <p className="text-xs sm:text-sm text-text-secondary italic mb-8 border-b border-border-subtle pb-4 leading-relaxed">
                  {activeDoc.summary}
                </p>

                <div className="space-y-8 font-body text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {activeDoc.sections.map((section, idx) => (
                    <section key={idx} className="space-y-2">
                      <h2 className="font-heading text-base sm:text-lg font-bold text-text-primary mt-4">
                        {section.title}
                      </h2>
                      <div className="text-text-secondary">
                        {section.content}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </FadeIn>
          ) : (
            <div className="text-center py-20">
              <span className="text-sm text-text-muted">No document selected. Choose a guide from the sidebar.</span>
            </div>
          )}

          <div className="pt-6 border-t border-border-subtle mt-12 flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted gap-3">
            <span>Last updated: June 2026</span>
            <div className="flex items-center gap-2">
              <span>Was this page helpful?</span>
              {helpfulFeedback ? (
                <span className="text-[11px] text-success font-medium">Thanks for your feedback!</span>
              ) : (
                <>
                  <button onClick={() => handleHelpful('yes')} className="px-2.5 py-1 rounded bg-bg-surface hover:bg-bg-card border border-border-subtle text-[11px] text-text-secondary hover:text-text-primary transition-all cursor-pointer">Yes</button>
                  <button onClick={() => handleHelpful('no')} className="px-2.5 py-1 rounded bg-bg-surface hover:bg-bg-card border border-border-subtle text-[11px] text-text-secondary hover:text-text-primary transition-all cursor-pointer">No</button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
