import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/toaster';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animated';
import { BackgroundPattern } from '@/components/ui/background-pattern';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { InlineLoader } from '@/components/ui/loading-spinner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      toastError('Sign in failed', err.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `/api/v1/auth/oauth/${provider}`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <BackgroundPattern />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-primary/20 via-purple-primary/10 to-transparent" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <FadeIn>
            <div className="font-heading text-3xl font-bold gradient-text mb-8">Vallexis</div>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="font-heading text-4xl font-bold mb-4">
              Welcome back
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-text-secondary text-lg leading-relaxed max-w-md">
              Sign in to access your dashboard and continue building amazing applications.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <FadeIn className="w-full max-w-md">
          <div className="lg:hidden font-heading text-xl sm:text-2xl font-bold gradient-text mb-6 sm:mb-8 text-center">Vallexis</div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold mb-2">Sign in to your account</h2>
              <p className="text-text-secondary">
                Enter your credentials to continue
              </p>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                id="github-oauth-btn"
                variant="outline"
                onClick={() => handleOAuth('github')}
                className="h-11 glass"
                type="button"
              >
                <FaGithub className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button
                id="google-oauth-btn"
                variant="outline"
                onClick={() => handleOAuth('google')}
                className="h-11 glass"
                type="button"
              >
                <FaGoogle className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg-deep px-3 text-text-muted">Or continue with</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  className="h-11"
                  {...register('email')}
                />
                {errors.email && (
                  <p role="alert" className="text-xs text-error">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    className="h-11 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p role="alert" className="text-xs text-error">{errors.password.message}</p>
                )}
              </div>

              <Button
                id="login-submit-btn"
                type="submit"
                className="w-full h-11 bg-blue-primary hover:bg-blue-vivid"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <InlineLoader />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-primary hover:underline font-medium">
                Sign up for free
              </Link>
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
