import { useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';

export function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

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
    },
    {
      q: "Are the services accessible according to Web accessibility rules?",
      a: "Yes. Vallexis dashboards and deployment services are built using semantic HTML5 and clean CSS styling structures to fully comply with WCAG accessibility principles."
    }
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary relative overflow-hidden font-body pb-16">
      {/* Background Glowing Overlays */}
      <div className="absolute top-[5%] left-1/4 w-[400px] h-[250px] bg-gradient-to-r from-blue-primary/5 to-purple-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <PublicHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl relative z-10">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mb-4">
            Frequently asked <span className="gradient-text bg-gradient-to-r from-blue-primary via-blue-glow to-purple-primary bg-clip-text text-transparent">questions</span>
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Everything you need to know about the Vallexis hosting platform, domains, and secure containers.
          </p>
        </div>

        {/* FAQs list */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="rounded-2xl border border-border-subtle bg-bg-surface/35 glass overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-heading text-sm sm:text-base font-semibold text-text-primary hover:text-blue-glow transition-colors focus:outline-none"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-blue-glow flex-shrink-0" />
                    {faq.q}
                  </span>
                  <span className="ml-4 flex-shrink-0 p-1.5 rounded-full bg-bg-deep border border-border-subtle text-text-secondary">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${
                  isOpen ? 'max-h-[250px] border-t border-border-subtle bg-bg-surface/20' : 'max-h-0'
                }`}>
                  <p className="p-5 text-xs sm:text-sm text-text-secondary leading-relaxed font-body">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
