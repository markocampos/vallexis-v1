import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HardDrive, Upload, Trash2, File, Folder, Search } from 'lucide-react';

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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/storage/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-files'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      setUploadDialog(false);
      setSelectedFile(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => api.delete(`storage/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-files'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
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
    if (type.startsWith('image/')) return <File className="h-4 w-4 text-blue-primary" />;
    if (type.startsWith('video/')) return <File className="h-4 w-4 text-purple-primary" />;
    if (type.includes('pdf')) return <File className="h-4 w-4 text-red-primary" />;
    return <File className="h-4 w-4 text-text-muted" />;
  };

  const filteredFiles = files?.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (filesLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted">Loading storage...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-2">
            Storage
          </h1>
          <p className="text-text-secondary">
            Manage your files and storage usage
          </p>
        </div>
        <Button onClick={() => setUploadDialog(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      {/* Storage Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
            <CardDescription>
              Your current storage consumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Used</span>
                <span className="font-medium">{formatFileSize(stats.used)} / {formatFileSize(stats.limit)}</span>
              </div>
              <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-primary transition-all"
                  style={{ width: `${Math.min((stats.used / stats.limit) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">{stats.file_count} files</span>
                <span className="text-text-muted">
                  {Math.round((stats.used / stats.limit) * 100)}% used
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Files</CardTitle>
              <CardDescription>
                {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFiles.length > 0 ? (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border border-border-subtle rounded-lg hover:bg-bg-card transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-text-secondary">
                        {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <File className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(file.id)}
                      className="text-error hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">
                {searchQuery ? 'No files found' : 'No files uploaded yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      {uploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Select a file to upload to your storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border-subtle rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 text-text-muted mx-auto mb-4" />
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-sm text-text-secondary hover:text-text-primary"
                  >
                    {selectedFile ? selectedFile.name : 'Click to select a file'}
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadDialog(false);
                      setSelectedFile(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="flex-1"
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}