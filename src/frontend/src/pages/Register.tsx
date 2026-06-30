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
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { InlineLoader } from '@/components/ui/loading-spinner';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must include an uppercase letter')
      .regex(/[a-z]/, 'Password must include a lowercase letter')
      .regex(/[0-9]/, 'Password must include a number')
      .regex(/[^A-Za-z0-9]/, 'Password must include a special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password', '');

  const requirements = [
    { label: 'At least 12 characters', met: passwordValue.length >= 12 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(passwordValue) },
    { label: 'One lowercase letter', met: /[a-z]/.test(passwordValue) },
    { label: 'One number', met: /[0-9]/.test(passwordValue) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(passwordValue) },
  ];

  const strengthScore = passwordValue ? requirements.filter((req) => req.met).length : 0;

  const getStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-error';
    if (score <= 4) return 'bg-warning';
    return 'bg-success';
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Medium';
    return 'Strong';
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await authRegister(data.email, data.password, data.name);
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
      toastError('Registration failed', message);
    }
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `/api/v1/auth/oauth/${provider}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <BackgroundPattern />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-primary/5 via-blue-primary/5 to-transparent pointer-events-none" />

      {/* Centered Card Layout */}
      <FadeIn className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <div className="font-heading text-3xl font-bold gradient-text mb-1">Vallexis</div>
          <p className="text-xs text-text-muted">Enterprise Cloud Deployment Platform</p>
        </div>

        <div className="card-elevated p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="font-heading text-lg font-bold mb-1">Create your account</h2>
            <p className="text-xs text-text-secondary">
              Get started with Vallexis in seconds
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleOAuth('github')}
              className="h-10 w-full"
              type="button"
            >
              <FaGithub className="mr-2 h-3.5 w-3.5" />
              GitHub
            </Button>
            <Button
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
              <label htmlFor="name" className="text-xs uppercase font-medium text-text-secondary">Name</label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                aria-invalid={!!errors.name}
                className="h-10 text-sm"
                {...register('name')}
              />
              {errors.name && <p role="alert" className="text-[11px] text-error mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs uppercase font-medium text-text-secondary">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                className="h-10 text-sm"
                {...register('email')}
              />
              {errors.email && <p role="alert" className="text-[11px] text-error mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs uppercase font-medium text-text-secondary">Password</label>
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
              
              {/* Password strength indicator */}
              {passwordValue && (
                <div className="space-y-2 mt-2 bg-bg-deep/40 p-2.5 rounded-lg border border-border-subtle">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-text-secondary">Password Strength:</span>
                    <span className={strengthScore === 5 ? 'text-success font-semibold' : strengthScore >= 3 ? 'text-warning font-semibold' : 'text-error font-semibold'}>
                      {getStrengthText(strengthScore)}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map((index) => (
                      <div
                        key={index}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          index <= strengthScore ? getStrengthColor(strengthScore) : 'bg-bg-deep'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-text-muted mt-1">
                    {requirements.map((req) => (
                      <div key={req.label} className="flex items-center gap-1">
                        <Check className={`h-2.5 w-2.5 shrink-0 ${req.met ? 'text-success' : 'text-text-muted opacity-50'}`} />
                        <span className={req.met ? 'text-text-secondary font-medium' : ''}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.password && <p role="alert" className="text-[11px] text-error mt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs uppercase font-medium text-text-secondary">Confirm Password</label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  aria-invalid={!!errors.confirmPassword}
                  className="h-10 text-sm pr-10"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {errors.confirmPassword && <p role="alert" className="text-[11px] text-error mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              id="register-submit-btn"
              type="submit"
              className="w-full h-10 bg-blue-primary hover:bg-blue-vivid text-sm font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-1.5">
                  <InlineLoader />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  Create account
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-text-secondary">
            Already have an account?{` `}
            <Link to="/login" className="font-medium text-blue-primary hover:underline ml-1">
              Sign in
            </Link>
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
