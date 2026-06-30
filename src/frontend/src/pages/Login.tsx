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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid email or password. Please try again.';
      toastError('Sign in failed', message);
    }
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `/api/v1/auth/oauth/${provider}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <BackgroundPattern />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-primary/5 via-purple-primary/5 to-transparent pointer-events-none" />

      {/* Centered Card Layout */}
      <FadeIn className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <div className="font-heading text-3xl font-bold gradient-text mb-1">Vallexis</div>
          <p className="text-xs text-text-muted">Enterprise Cloud Deployment Platform</p>
        </div>

        <div className="card-elevated p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="font-heading text-lg font-bold mb-1">Sign in to Vallexis</h2>
            <p className="text-xs text-text-secondary">
              Enter your credentials to continue
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              id="github-oauth-btn"
              variant="outline"
              onClick={() => handleOAuth('github')}
              className="h-10 w-full"
              type="button"
            >
              <FaGithub className="mr-2 h-3.5 w-3.5" />
              GitHub
            </Button>
            <Button
              id="google-oauth-btn"
              variant="outline"
              onClick={() => handleOAuth('google')}
              className="h-10 w-full"
              type="button"
            >
              <FaGoogle className="mr-2 h-3.5 w-3.5" />
              Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-bg-surface px-2.5 text-text-muted text-[10px]">Or continue with</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs uppercase font-medium text-text-secondary">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                className="h-10 text-sm"
                {...register('email')}
              />
              {errors.email && (
                <p role="alert" className="text-[11px] text-error mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs uppercase font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  className="h-10 text-sm pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="text-[11px] text-error mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              id="login-submit-btn"
              type="submit"
              className="w-full h-10 bg-blue-primary hover:bg-blue-vivid text-sm font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-1.5">
                  <InlineLoader />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  Sign in
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-text-secondary">
            Don't have an account?{` `}
            <Link to="/register" className="font-medium text-blue-primary hover:underline ml-1">
              Sign up for free
            </Link>
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
