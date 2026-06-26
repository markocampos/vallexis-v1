import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { User, Lock, Bell, Save, Trash2, AlertTriangle } from 'lucide-react';

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

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    onSuccess: () => { logout(); },
    onError: () => {
      setSaveMessage({ type: 'error', message: 'Failed to delete account' });
      setTimeout(() => setSaveMessage(null), 3000);
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
    if (newPassword.length < 12) {
      setSaveMessage({ type: 'error', message: 'Password must be at least 12 characters' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }
    updatePasswordMutation.mutate({ current_password: currentPassword, new_password: newPassword });
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
        <LoadingSpinner size="md" text="Loading settings..." />
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <FadeIn>
        <div>
          <h1 className="font-heading text-lg sm:text-xl font-bold mb-1">Settings</h1>
          <p className="text-xs text-text-secondary">Manage your account settings and preferences</p>
        </div>
      </FadeIn>

      {/* Tabs */}
      <FadeIn delay={100}>
        <div className="flex gap-1 p-1 rounded-xl glass w-fit overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-bg-card text-text-primary border border-border-interactive/30'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Save Message */}
      {saveMessage && (
        <FadeIn>
          <div className={`p-3 rounded-lg glass border text-xs ${
            saveMessage.type === 'success' ? 'border-success/30 text-success' : 'border-error/30 text-error'
          }`}>
            {saveMessage.message}
          </div>
        </FadeIn>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <FadeIn delay={200}>
          <div className="rounded-xl glass p-3.5 sm:p-4 border border-border-subtle">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 flex items-center justify-center border border-border-subtle">
                <User className="h-4 w-4 text-blue-glow" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-text-primary">Profile Information</h2>
                <p className="text-[10px] text-text-secondary">Update your personal details</p>
              </div>
            </div>

            <div className="space-y-3.5 max-w-lg">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-semibold text-text-secondary">Name</label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-xs rounded-lg border-border-subtle" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-text-secondary">Email</label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 text-xs rounded-lg border-border-subtle" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="timezone" className="text-xs font-semibold text-text-secondary">Timezone</label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-9 px-2 text-xs rounded-lg border border-border-subtle bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-primary/30"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="language" className="text-xs font-semibold text-text-secondary">Language</label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-9 px-2 text-xs rounded-lg border border-border-subtle bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-primary/30"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
              </div>

              <Button onClick={handleProfileSave} disabled={updateProfileMutation.isPending} size="sm" className="bg-blue-primary hover:bg-blue-vivid text-xs h-8 px-3.5 rounded-lg mt-1">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <FadeIn delay={200}>
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-xl glass p-3.5 sm:p-4 border border-border-subtle">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-border-subtle">
                  <Lock className="h-4 w-4 text-success" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-semibold text-text-primary">Change Password</h2>
                  <p className="text-[10px] text-text-secondary">Update your password regularly</p>
                </div>
              </div>

              <div className="space-y-3 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Current Password</label>
                  <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-9 text-xs rounded-lg border-border-subtle" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary">New Password</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-9 text-xs rounded-lg border-border-subtle" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Confirm New Password</label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-9 text-xs rounded-lg border-border-subtle" />
                </div>
                <Button onClick={handlePasswordSave} disabled={updatePasswordMutation.isPending} size="sm" className="bg-blue-primary hover:bg-blue-vivid text-xs h-8 px-3.5 rounded-lg mt-1">
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl glass p-3.5 sm:p-4 border border-error/20 bg-error/[0.01]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center border border-error/20">
                  <AlertTriangle className="h-4 w-4 text-error" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-error">Danger Zone</h3>
                  <p className="text-[10px] text-text-secondary">Irreversible account teardown</p>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary mb-3.5 leading-relaxed">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteAccountMutation.isPending} size="sm" className="h-8 text-xs px-4 bg-error hover:bg-error/90 text-white rounded-lg flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <FadeIn delay={200}>
          <div className="rounded-xl glass p-3.5 sm:p-4 border border-border-subtle">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center border border-border-subtle">
                <Bell className="h-4 w-4 text-warning" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-text-primary">Notification Preferences</h2>
                <p className="text-[10px] text-text-secondary">Choose what notifications you receive</p>
              </div>
            </div>

            <div className="space-y-2.5 max-w-lg">
              {[
                { key: 'email' as const, title: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'deploy' as const, title: 'Deployment Notifications', desc: 'Get notified about deployment status' },
                { key: 'billing' as const, title: 'Billing Notifications', desc: 'Receive billing and payment reminders' },
                { key: 'security' as const, title: 'Security Notifications', desc: 'Get alerts about security events' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle hover:bg-bg-card/30 transition-colors">
                  <div>
                    <p className="font-semibold text-xs text-text-primary">{item.title}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                  />
                </div>
              ))}

              <Button onClick={handleNotificationsSave} disabled={updateNotificationsMutation.isPending} size="sm" className="bg-blue-primary hover:bg-blue-vivid text-xs h-8 px-3.5 rounded-lg mt-1.5">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {updateNotificationsMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
