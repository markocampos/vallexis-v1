export const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN || 'vallexis.app';

export const PLAN_LIMITS = {
  free: { name: 'Free Forever', projects: 1, storage: 2 },
  starter: { name: 'Starter Plan', projects: 1, storage: 5 },
  pro: { name: 'Pro Plan', projects: 2, storage: 20 },
} as const;

export interface Plan {
  id: string;
  name: string;
  price: number;
  popular?: boolean;
  sections: { title: string; items: string[] }[];
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    sections: [
      { title: 'Resources', items: ['1 active container project', '2 GB S3 object storage', '1 GB fast CDN bandwidth'] },
      { title: 'Deployment', items: ['Auto Nixpacks compilation builds', 'Let\'s Encrypt automatic TLS/SSL', 'Shared metrics console', 'Git Integration', 'One-Click Deploy', 'Health Checks'] },
      { title: 'Support', items: ['Community Support'] },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    sections: [
      { title: 'Resources', items: ['1 active container project', '5 GB S3 object storage', '10 GB fast CDN bandwidth', '250 API requests/min'] },
      { title: 'Deployment', items: ['One-Click Deploy', 'Let\'s Encrypt automatic TLS/SSL', 'Custom domain DNS mapping', 'Live Deploy Logs'] },
      { title: 'Monitoring & Backups', items: ['Grafana/Prometheus dashboard views', 'Daily database snapshots'] },
      { title: 'Support', items: ['Email support within 24 hours'] },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    popular: true,
    sections: [
      { title: 'Resources', items: ['2 concurrent active projects', '10 GB S3 object storage per project (20 GB total)', '50 GB fast CDN bandwidth', '500 API requests/min'] },
      { title: 'Deployment', items: ['One-Click Deploy', 'Let\'s Encrypt automatic TLS/SSL', 'Custom domain DNS mapping', 'Deploy Previews (per-PR)', 'Live Deploy Logs', '30-Day Backups + Restore', 'Environment Variables UI'] },
      { title: 'Tools & Integrations', items: ['Weekly automated SEO Lighthouse audits', 'Lossless WebP image compressor', 'Audit Logging', 'Webhook Notifications', 'Team Collaboration (3 members)', 'OAuth (GitHub + Google)', 'Resource Monitoring Dashboard'] },
      { title: 'Support', items: ['24/7 Slack and priority email support'] },
    ],
  },
];

export const SEO_RESULT_LABELS: Record<string, string> = {
  title: 'Title Tag',
  description: 'Meta Description',
  headings: 'Headings Structure',
  images: 'Image Optimization',
  links: 'Link Structure',
  performance: 'Performance',
  mobile: 'Mobile Friendly',
  ssl: 'SSL Certificate',
};
