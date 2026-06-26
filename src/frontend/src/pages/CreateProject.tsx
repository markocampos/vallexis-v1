import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <FadeIn>
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/projects')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </button>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2">
            Create New Project
          </h1>
          <p className="text-text-secondary">
            Connect your Git repository to deploy your application
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <div className="rounded-2xl glass p-5 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6" noValidate>
            {/* Project Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <Rocket className="h-4 w-4 text-blue-primary" />
                Project Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="my-awesome-app"
                aria-invalid={!!errors.name}
                className="h-11"
                {...register('name')}
              />
              {errors.name ? (
                <p role="alert" className="text-xs text-error">{errors.name.message}</p>
              ) : (
                <p className="text-xs text-text-muted">
                  Subdomain:{' '}
                  <span className="text-blue-primary font-mono">{subdomainPreview}</span>
                </p>
              )}
            </div>

            {/* Git Repo */}
            <div className="space-y-2">
              <label htmlFor="gitRepo" className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-primary" />
                Git Repository URL
              </label>
              <Input
                id="gitRepo"
                type="url"
                placeholder="https://github.com/username/repo"
                aria-invalid={!!errors.gitRepo}
                className="h-11"
                {...register('gitRepo')}
              />
              {errors.gitRepo ? (
                <p role="alert" className="text-xs text-error">{errors.gitRepo.message}</p>
              ) : (
                <p className="text-xs text-text-muted">
                  Public or private repository from GitHub, GitLab, or Bitbucket
                </p>
              )}
            </div>

            {/* Git Branch */}
            <div className="space-y-2">
              <label htmlFor="gitBranch" className="text-sm font-medium flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-success" />
                Git Branch
              </label>
              <div className="relative">
                <Input
                  id="gitBranch"
                  type="text"
                  placeholder="main"
                  aria-invalid={!!errors.gitBranch}
                  className="h-11"
                  {...register('gitBranch')}
                />
              </div>
              {errors.gitBranch ? (
                <p role="alert" className="text-xs text-error">{errors.gitBranch.message}</p>
              ) : (
                <p className="text-xs text-text-muted">The branch to deploy (default: main)</p>
              )}
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-bg-card/50 border border-border-subtle">
              <p className="text-xs text-text-muted mb-2">Preview</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm font-mono text-text-secondary">{subdomainPreview}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/projects')}
                className="flex-1 px-6 py-2.5 border border-border-subtle text-text-secondary rounded-xl hover:bg-bg-card hover:text-text-primary transition-all"
              >
                Cancel
              </button>
              <Button
                id="create-project-submit-btn"
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 h-11 bg-blue-primary hover:bg-blue-vivid"
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
        </div>
      </FadeIn>
    </div>
  );
}
