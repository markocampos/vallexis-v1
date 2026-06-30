import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/animated';
import { ArrowLeft, GitBranch, Globe, Rocket } from 'lucide-react';
import { InlineLoader } from '@/components/ui/loading-spinner';
import { APP_DOMAIN } from '@/lib/config';

const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9-]+$/, 'Only alphanumeric characters and hyphens are allowed'),
  gitRepo: z
    .string()
    .url('Must be a valid URL')
    .startsWith('https://', 'Repository URL must start with https://'),
  gitBranch: z.string().min(1, 'Branch name is required'),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export function CreateProject() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      gitBranch: 'main',
    },
  });

  const nameValue = watch('name', '');
  const subdomainPreview = nameValue
    ? `${nameValue.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.${APP_DOMAIN}`
    : `your-app.${APP_DOMAIN}`;

  const createMutation = useMutation({
    mutationFn: (data: { name: string; git_repo: string; git_branch: string }) =>
      api.post('projects', data),
    onSuccess: () => {
      toastSuccess('Project created!', 'Your project is being set up.');
      navigate('/dashboard/projects');
    },
    onError: () => {
      toastError('Failed to create project', 'Please check your inputs and try again.');
    },
  });

  const onSubmit = (data: CreateProjectFormValues) => {
    createMutation.mutate({
      name: data.name,
      git_repo: data.gitRepo,
      git_branch: data.gitBranch,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 space-y-6">
      {/* Standard Header */}
      <FadeIn>
        <div className="flex flex-col border-b border-border-subtle pb-3 mb-4">
          <button
            onClick={() => navigate('/dashboard/projects')}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Projects
          </button>
          <div>
            <h1 className="font-heading text-lg font-bold text-text-primary">Create New Project</h1>
            <p className="text-xs text-text-secondary">Connect your Git repository to deploy your application</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <Card variant="elevated" className="p-6 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Project Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs uppercase font-medium text-text-secondary flex items-center gap-2">
                <Rocket className="h-3.5 w-3.5 text-blue-primary" />
                Project Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="my-awesome-app"
                aria-invalid={!!errors.name}
                className="h-10 text-sm"
                {...register('name')}
              />
              {errors.name ? (
                <p role="alert" className="text-[11px] text-error mt-1">{errors.name.message}</p>
              ) : (
                <p className="text-[11px] text-text-muted mt-1">
                  Subdomain:{' '}
                  <span className="text-blue-primary font-mono font-medium">{subdomainPreview}</span>
                </p>
              )}
            </div>

            {/* Git Repo */}
            <div className="space-y-1.5">
              <label htmlFor="gitRepo" className="text-xs uppercase font-medium text-text-secondary flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-purple-primary" />
                Git Repository URL
              </label>
              <Input
                id="gitRepo"
                type="url"
                placeholder="https://github.com/username/repo"
                aria-invalid={!!errors.gitRepo}
                className="h-10 text-sm"
                {...register('gitRepo')}
              />
              {errors.gitRepo ? (
                <p role="alert" className="text-[11px] text-error mt-1">{errors.gitRepo.message}</p>
              ) : (
                <p className="text-[11px] text-text-muted mt-1">
                  Public or private repository from GitHub, GitLab, or Bitbucket
                </p>
              )}
            </div>

            {/* Git Branch */}
            <div className="space-y-1.5">
              <label htmlFor="gitBranch" className="text-xs uppercase font-medium text-text-secondary flex items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 text-success" />
                Git Branch
              </label>
              <Input
                id="gitBranch"
                type="text"
                placeholder="main"
                aria-invalid={!!errors.gitBranch}
                className="h-10 text-sm"
                {...register('gitBranch')}
              />
              {errors.gitBranch ? (
                <p role="alert" className="text-[11px] text-error mt-1">{errors.gitBranch.message}</p>
              ) : (
                <p className="text-[11px] text-text-muted mt-1">The branch to deploy (default: main)</p>
              )}
            </div>

            {/* Preview */}
            <div className="p-3.5 rounded-lg bg-bg-deep/40 border border-border-subtle space-y-1">
              <p className="text-[10px] uppercase font-semibold text-text-muted">Preview Subdomain</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs font-mono text-text-secondary">{subdomainPreview}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/projects')}
                className="flex-1 h-10"
              >
                Cancel
              </Button>
              <Button
                id="create-project-submit-btn"
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 h-10 bg-blue-primary hover:bg-blue-vivid text-white font-medium"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <InlineLoader />
                    Creating...
                  </span>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </FadeIn>
    </div>
  );
}
