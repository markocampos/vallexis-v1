import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket, Database, HardDrive, Shield, Zap, Globe } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 sm:py-20 text-center">
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary mb-6">
          All-in-one PaaS for
          <span className="text-blue-primary"> solo founders</span>
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
          Deploy, scale, and manage your applications with zero infrastructure headaches.
          Focus on building your product, we handle the rest.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <a href="/register">Get Started Free</a>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
            <a href="/login">Sign In</a>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary mb-8 sm:mb-12 text-center">
          Everything you need to scale
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <Rocket className="h-10 w-10 text-blue-primary mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">Instant Deploys</h3>
              <p className="text-text-secondary">
                Connect your Git repository and deploy in seconds with automatic builds and deployments.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Database className="h-10 w-10 text-blue-primary mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">Managed Databases</h3>
              <p className="text-text-secondary">
                Postgres databases with automatic backups, scaling, and SSL encryption out of the box.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <HardDrive className="h-10 w-10 text-blue-primary mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">Object Storage</h3>
              <p className="text-text-secondary">
                Store and serve static assets, user uploads, and backups with global CDN.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Shield className="h-10 w-10 text-blue-primary mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">SSL & Security</h3>
              <p className="text-text-secondary">
                Automatic SSL certificates, DDoS protection, and built-in security headers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Zap className="h-10 w-10 text-blue-primary mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">Auto Scaling</h3>
              <p className="text-text-secondary">
                Scale from zero to millions of requests automatically with no configuration needed.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Globe className="h-10 w-10 text-blue-primary mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">Custom Domains</h3>
              <p className="text-text-secondary">
                Connect your own domain with automatic DNS configuration and SSL provisioning.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 sm:py-20 text-center">
        <Card className="max-w-2xl mx-auto bg-blue-primary/10 border-blue-primary/20">
          <CardContent className="pt-6">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary mb-4">
              Ready to launch?
            </h2>
            <p className="text-text-secondary mb-6">
              Start with our free tier and scale as you grow. No credit card required.
            </p>
            <Button size="lg" asChild className="w-full sm:w-auto">
              <a href="/register">Start Building Free</a>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
