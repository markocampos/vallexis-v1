import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { User, Lock, Bell, Save, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

interface UserSettings {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    deploy: boolean;
    billing: boolean;
    security: boolean;
  };
}

export function Settings() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState({
    email: true,
    deploy: true,
    billing: true,
    security: true,
  });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<UserSettings>('users/settings'),
  });

  useEffect(() => {
    if (settingsData) {
      setName(settingsData.name);
      setEmail(settingsData.email);
      setTimezone(settingsData.timezone);
      setLanguage(settingsData.language);
      setNotifications(settingsData.notifications);
    }
  }, [settingsData]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; email: string; timezone: string; language: string }) =>
      api.put('users/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setSaveMessage({ type: 'success', message: 'Profile updated successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: () => {
      setSaveMessage({ type: 'error', message: 'Failed to update profile' });
      setTimeout(() => setSaveMessage(null), 3000);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      api.put('users/password', data),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaveMessage({ type: 'success', message: 'Password updated successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: () => {
      setSaveMessage({ type: 'error', message: 'Failed to update password' });
      setTimeout(() => setSaveMessage(null), 3000);
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: { notifications: typeof notifications }) =>
      api.put('users/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveMessage({ type: 'success', message: 'Notification preferences updated' });
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: () => {
      setSaveMessage({ type: 'error', message: 'Failed to update notifications' });
      setTimeout(() => setSaveMessage(null), 3000);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.delete('users/account'),
    onSuccess: () => {
      logout();
    },
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate({ name, email, timezone, language });
  };

  const handlePasswordSave = () => {
    if (newPassword !== confirmPassword) {
      setSaveMessage({ type: 'error', message: 'Passwords do not match' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }
    if (newPassword.length < 8) {
      setSaveMessage({ type: 'error', message: 'Password must be at least 8 characters' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }
    updatePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const handleNotificationsSave = () => {
    updateNotificationsMutation.mutate({ notifications });
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      deleteAccountMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary mb-2">
          Settings
        </h1>
        <p className="text-text-secondary">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-2">
        <Button
          variant={activeTab === 'profile' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('profile')}
          size="sm"
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </Button>
        <Button
          variant={activeTab === 'security' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('security')}
          size="sm"
        >
          <Lock className="mr-2 h-4 w-4" />
          Security
        </Button>
        <Button
          variant={activeTab === 'notifications' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('notifications')}
          size="sm"
        >
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </Button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg ${saveMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
          {saveMessage.message}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="timezone" className="text-sm font-medium">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-bg-surface text-text-primary"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium">
                    Language
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-bg-surface text-text-primary"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleProfileSave}
                disabled={updateProfileMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Update your password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium">
                  Current Password
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button
                onClick={handlePasswordSave}
                disabled={updatePasswordMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>

              <div className="border-t border-border-subtle pt-6">
                <h3 className="font-medium mb-2 text-error">Danger Zone</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-text-secondary">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium">Deployment Notifications</p>
                  <p className="text-sm text-text-secondary">Get notified about deployment status</p>
                </div>
                <Switch
                  checked={notifications.deploy}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, deploy: checked })}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium">Billing Notifications</p>
                  <p className="text-sm text-text-secondary">Receive billing and payment reminders</p>
                </div>
                <Switch
                  checked={notifications.billing}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, billing: checked })}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium">Security Notifications</p>
                  <p className="text-sm text-text-secondary">Get alerts about security events</p>
                </div>
                <Switch
                  checked={notifications.security}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, security: checked })}
                />
              </div>

              <Button
                onClick={handleNotificationsSave}
                disabled={updateNotificationsMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateNotificationsMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}