import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useKeyboardDialog } from '@/hooks/useKeyboardDialog';
import api from '@/lib/api';
import { StorageFile, StorageStats } from '@/types';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { HardDrive, Upload, Trash2, File, Folder, Search, X, ExternalLink } from 'lucide-react';

export function Storage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const uploadModalRef = useKeyboardDialog(uploadDialog, () => {
    setUploadDialog(false);
    setSelectedFile(null);
  });
  const deleteConfirmModalRef = useKeyboardDialog(deleteConfirmId !== null, () => setDeleteConfirmId(null));

  const handleCopyUrl = (url: string, id: string) => {
    try {
      navigator.clipboard.writeText(url);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ['storage-files'],
    queryFn: () => api.get<{ data: StorageFile[] }>('storage/files').then(r => r.data),
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
    setDeleteConfirmId(fileId);
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
      <div className="space-y-6 font-body">
        {/* Loading header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <div className="h-6 w-32 bg-bg-card rounded animate-pulse" />
            <div className="h-4 w-64 bg-bg-card rounded animate-pulse mt-1.5" />
          </div>
          <div className="h-10 w-28 bg-bg-card rounded animate-pulse" />
        </div>
        <Card className="p-4 h-36 animate-pulse" />
        <Card className="p-4 h-64 animate-pulse" />
      </div>
    );
  }

  const usagePct = stats && stats.limit > 0 ? Math.min((stats.used / stats.limit) * 100, 100) : 0;

  return (
    <div className="space-y-6 font-body">
      {/* Standard Page Header */}
      <FadeIn>
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <h1 className="font-heading text-lg font-bold text-text-primary">Storage</h1>
            <p className="text-xs text-text-secondary">Manage your files and storage usage</p>
          </div>
          <Button onClick={() => setUploadDialog(true)} variant="primary" className="h-10 px-4 cursor-pointer">
            <Upload className="mr-1.5 h-4 w-4" />
            Upload File
          </Button>
        </div>
      </FadeIn>

      {/* Storage Stats */}
      {stats && (
        <FadeIn delay={100}>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 flex items-center justify-center border border-border-subtle">
                <HardDrive className="h-5 w-5 text-blue-glow" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-text-primary">Storage Usage</h2>
                <p className="text-[10px] text-text-secondary">{stats.file_count} files stored</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-border-subtle/40 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium">Used</span>
                <span className="text-text-primary font-bold">{formatFileSize(stats.used)} / {formatFileSize(stats.limit)}</span>
              </div>
              <div className="h-2.5 bg-bg-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-primary to-purple-primary transition-all rounded-full"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <div className="text-right text-[10px] text-text-muted">{Math.round(usagePct)}% quota used</div>
            </div>
          </Card>
        </FadeIn>
      )}

      {/* Files List */}
      <FadeIn delay={200}>
        <Card className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle/50 pb-3">
            <h2 className="font-heading text-base font-bold text-text-primary">Files</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full h-10 text-sm"
              />
            </div>
          </div>

          {filteredFiles.length > 0 ? (
            <div className="space-y-2.5">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-bg-surface/30 hover:bg-bg-card hover:border-border-interactive transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-bg-card flex items-center justify-center flex-shrink-0 border border-border-subtle">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs truncate text-text-primary">{file.name}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {formatFileSize(file.size)} · {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyUrl(file.url, file.id)}
                      className="p-2 text-text-muted hover:text-text-primary rounded hover:bg-bg-card transition-colors cursor-pointer"
                      title="Copy file URL"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                    {copiedId === file.id && (
                      <span className="text-[10px] text-success animate-fade-in font-medium mr-1.5">Copied!</span>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => window.open(file.url, '_blank')} className="h-10 w-10 cursor-pointer" aria-label="Open file">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(file.id)} className="h-10 w-10 text-error hover:text-error hover:bg-error/10 cursor-pointer" aria-label="Delete file">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card variant="outlined" className="p-8 text-center max-w-xl mx-auto space-y-4 border-dashed">
              <div className="w-12 h-12 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center mx-auto">
                <Folder className="h-6 w-6 text-text-muted" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-base font-bold text-text-primary">
                  {searchQuery ? 'No files found' : 'No files uploaded yet'}
                </h3>
                <p className="text-xs text-text-secondary">
                  {searchQuery ? `No files match your query "${searchQuery}"` : 'Upload your first file to get started.'}
                </p>
              </div>
            </Card>
          )}
        </Card>
      </FadeIn>

      {/* Upload Dialog */}
      {uploadDialog && (
        <div ref={uploadModalRef} role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-4 sm:p-5 rounded-xl border border-border-subtle bg-bg-surface glass shadow-2xl m-3 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="font-heading text-base font-bold text-text-primary">Upload File</h3>
              <button onClick={() => { setUploadDialog(false); setSelectedFile(null); }} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-border-subtle rounded-xl p-6 sm:p-8 text-center hover:border-border-interactive transition-colors">
                <Upload className="h-8 w-8 text-text-muted mx-auto mb-3" />
                <input type="file" onChange={handleFileSelect} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer text-sm text-text-secondary hover:text-text-primary block">
                  {selectedFile ? selectedFile.name : 'Click to select a file'}
                </label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setUploadDialog(false); setSelectedFile(null); }} className="flex-1 h-10">
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending} className="flex-1 h-10 bg-blue-primary hover:bg-blue-vivid text-white font-medium">
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div ref={deleteConfirmModalRef} role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md p-4 sm:p-5 rounded-xl border border-border-subtle bg-bg-surface glass shadow-2xl m-3 space-y-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-text-primary">Delete File</h3>
              <p className="text-text-secondary text-xs mt-1">
                Are you sure you want to delete this file? This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-end text-xs">
              <Button variant="outline" className="h-10 px-4 rounded-lg" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="h-10 px-4 rounded-lg"
                onClick={() => {
                  deleteMutation.mutate(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
