import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toaster';
import { HardDrive, Upload, Trash2, File, Folder, Search, X } from 'lucide-react';

interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
}

interface StorageStats {
  used: number;
  limit: number;
  file_count: number;
}

export function Storage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ['storage-files'],
    queryFn: () => api.get<StorageFile[]>('storage/files'),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['storage-stats'],
    queryFn: () => api.get<StorageStats>('storage/stats'),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.upload('storage/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-files'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      setUploadDialog(false);
      setSelectedFile(null);
    },
    onError: () => {
      toast({ title: 'Upload failed', description: 'File could not be uploaded.', variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => api.delete(`storage/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-files'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
    onError: () => {
      toast({ title: 'Delete failed', description: 'File could not be deleted.', variant: 'error' });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(fileId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <File className="h-4.5 w-4.5 text-blue-primary" />;
    if (type.startsWith('video/')) return <File className="h-4.5 w-4.5 text-purple-primary" />;
    if (type.includes('pdf')) return <File className="h-4.5 w-4.5 text-error" />;
    return <File className="h-4.5 w-4.5 text-text-muted" />;
  };

  const filteredFiles = files?.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (filesLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" text="Loading storage..." />
      </div>
    );
  }

  const usagePct = stats ? Math.min((stats.used / stats.limit) * 100, 100) : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-bold mb-1">Storage</h1>
            <p className="text-xs text-text-secondary">Manage your files and storage usage</p>
          </div>
          <Button onClick={() => setUploadDialog(true)} size="sm" className="bg-blue-primary hover:bg-blue-vivid text-xs h-8 px-3 rounded-lg">
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </FadeIn>

      {/* Storage Stats */}
      {stats && (
        <FadeIn delay={100}>
          <div className="rounded-xl glass p-3.5 sm:p-4">
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 flex items-center justify-center border border-border-subtle">
                <HardDrive className="h-4 w-4 text-blue-glow" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-text-primary">Storage Usage</h2>
                <p className="text-[10px] text-text-secondary">{stats.file_count} files</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Used</span>
                <span className="text-xs font-semibold">{formatFileSize(stats.used)} / {formatFileSize(stats.limit)}</span>
              </div>
              <div className="h-2 bg-bg-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-primary to-purple-primary transition-all rounded-full"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <div className="text-right text-[10px] text-text-muted">{Math.round(usagePct)}% used</div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Files List */}
      <FadeIn delay={200}>
        <div className="rounded-xl glass p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="font-heading text-sm font-semibold">Files</h2>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full sm:w-48 h-8 text-xs rounded-lg border-border-subtle"
              />
            </div>
          </div>

          {filteredFiles.length > 0 ? (
            <div className="space-y-1.5">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg border border-border-subtle hover:bg-bg-card hover:border-border-interactive transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-bg-card flex items-center justify-center flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs truncate text-text-primary">{file.name}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {formatFileSize(file.size)} · {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => window.open(file.url, '_blank')} className="h-7 w-7" aria-label="Open file">
                      <File className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(file.id)} className="h-7 w-7 text-error hover:text-error hover:bg-error/10" aria-label="Delete file">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-bg-card flex items-center justify-center mx-auto mb-3">
                <Folder className="h-6 w-6 text-text-muted" />
              </div>
              <p className="text-text-secondary text-sm">
                {searchQuery ? 'No files found' : 'No files uploaded yet'}
              </p>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Upload Dialog */}
      {uploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-5 sm:p-6 rounded-2xl glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-semibold">Upload File</h3>
              <button onClick={() => { setUploadDialog(false); setSelectedFile(null); }} className="text-text-muted hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-border-subtle rounded-xl p-6 sm:p-8 text-center hover:border-border-interactive transition-colors">
                <Upload className="h-8 w-8 text-text-muted mx-auto mb-3" />
                <input type="file" onChange={handleFileSelect} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                  {selectedFile ? selectedFile.name : 'Click to select a file'}
                </label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setUploadDialog(false); setSelectedFile(null); }} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending} className="flex-1 bg-blue-primary hover:bg-blue-vivid">
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
