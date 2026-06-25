import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, GitBranch } from 'lucide-react';
import { InlineLoader } from '@/components/ui/loading-spinner';

// ─── Schema ───────────────────────────────────────────────────────────────────

const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .regex(
      /^[a-zA-Z0-9-]+$/,
      'Only alphanumeric characters and hyphens are allowed'
    ),
  gitRepo: z
    .string()
    .url('Must be a valid URL')
    .startsWith('https://', 'Repository URL must start with https://'),
  gitBranch: z.string().min(1, 'Branch name is required'),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

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

  // Live subdomain preview
  const subdomainPreview = nameValue
    ? `${nameValue.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.vallexis.app`
    : 'your-app.vallexis.app';

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
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/projects')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </button>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          Create New Project
        </h1>
        <p className="text-text-secondary">
          Connect your Git repository to deploy your application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Enter your project information to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Project Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium">
                Project Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="my-awesome-app"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name ? (
                <p role="alert" className="text-xs text-error mt-1">
                  {errors.name.message}
                </p>
              ) : (
                <p className="text-xs text-text-muted">
                  Subdomain preview:{' '}
                  <span className="text-blue-primary font-mono">{subdomainPreview}</span>
                </p>
              )}
            </div>

            {/* Git Repo */}
            <div className="space-y-1">
              <label htmlFor="gitRepo" className="text-sm font-medium">
                Git Repository URL
              </label>
              <Input
                id="gitRepo"
                type="url"
                placeholder="https://github.com/username/repo"
                aria-invalid={!!errors.gitRepo}
                {...register('gitRepo')}
              />
              {errors.gitRepo ? (
                <p role="alert" className="text-xs text-error mt-1">
                  {errors.gitRepo.message}
                </p>
              ) : (
                <p className="text-xs text-text-muted">
                  Public or private repository URL from GitHub, GitLab, or Bitbucket
                </p>
              )}
            </div>

            {/* Git Branch */}
            <div className="space-y-1">
              <label htmlFor="gitBranch" className="text-sm font-medium">
                Git Branch
              </label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="gitBranch"
                  type="text"
                  placeholder="main"
                  aria-invalid={!!errors.gitBranch}
                  className="pl-10"
                  {...register('gitBranch')}
                />
              </div>
              {errors.gitBranch ? (
                <p role="alert" className="text-xs text-error mt-1">
                  {errors.gitBranch.message}
                </p>
              ) : (
                <p className="text-xs text-text-muted">The branch to deploy (default: main)</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard/projects')}
                className="flex-1 px-6 py-2 border border-border-subtle text-text-primary rounded-lg hover:bg-bg-card transition-colors"
              >
                Cancel
              </button>
              <Button
                id="create-project-submit-btn"
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <InlineLoader />
                    Creating...
                  </span>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
