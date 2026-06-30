import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useKeyboardDialog } from '@/hooks/useKeyboardDialog';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FadeIn } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const holdRafRef = useRef<number | null>(null);

  const deleteConfirmModalRef = useKeyboardDialog(deleteConfirmOpen, () => { setDeleteConfirmOpen(false); endHold(); });

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

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
      toast({ title: 'Settings saved', description: 'Profile updated successfully.', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Update failed', description: 'Failed to update profile.', variant: 'error' });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      api.put('users/password', data),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated', description: 'Password updated successfully.', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Update failed', description: 'Failed to update password.', variant: 'error' });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: { notifications: typeof notifications }) =>
      api.put('users/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Settings saved', description: 'Notification preferences updated.', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Update failed', description: 'Failed to update notifications.', variant: 'error' });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (password: string) => api.delete<{ message: string }>('users/account', { password }),
    onSuccess: () => { logout(); },
    onError: () => {
      toast({ title: 'Delete failed', description: 'Failed to delete account.', variant: 'error' });
    },
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate({ name, email, timezone, language });
  };

  const handlePasswordSave = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Validation error', description: 'Passwords do not match.', variant: 'error' });
      return;
    }
    if (newPassword.length < 12) {
      toast({ title: 'Validation error', description: 'Password must be at least 12 characters.', variant: 'error' });
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast({ title: 'Validation error', description: 'Password must contain at least one uppercase letter.', variant: 'error' });
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      toast({ title: 'Validation error', description: 'Password must contain at least one lowercase letter.', variant: 'error' });
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast({ title: 'Validation error', description: 'Password must contain at least one digit.', variant: 'error' });
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      toast({ title: 'Validation error', description: 'Password must contain at least one special character.', variant: 'error' });
      return;
    }
    updatePasswordMutation.mutate({ current_password: currentPassword, new_password: newPassword });
  };

  const handleNotificationsSave = () => {
    updateNotificationsMutation.mutate({ notifications });
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmOpen(true);
  };

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    holdStartRef.current = Date.now();

    const loop = () => {
      if (holdStartRef.current === null) return;
      const elapsed = Date.now() - holdStartRef.current;
      const pct = Math.min((elapsed / 20000) * 100, 100);
      setHoldProgress(pct);

      if (pct >= 100) {
        deleteAccountMutation.mutate(deletePassword);
        setDeleteConfirmOpen(false);
        setDeletePassword('');
        endHold();
      } else {
        holdRafRef.current = requestAnimationFrame(loop);
      }
    };

    holdRafRef.current = requestAnimationFrame(loop);
  };

  const endHold = () => {
    if (holdRafRef.current !== null) {
      cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    holdStartRef.current = null;
    setHoldProgress(0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 font-body">
        {/* Loading header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <div className="h-6 w-32 bg-bg-card rounded animate-pulse" />
            <div className="h-4 w-64 bg-bg-card rounded animate-pulse mt-1.5" />
          </div>
        </div>
        <div className="h-10 w-64 bg-bg-card rounded animate-pulse" />
        <Card className="p-4 h-64 animate-pulse" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6 font-body">
      {/* Standard Page Header */}
      <FadeIn>
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <h1 className="font-heading text-lg font-bold text-text-primary">Settings</h1>
            <p className="text-xs text-text-secondary">Manage your account settings and preferences</p>
          </div>
        </div>
      </FadeIn>

      {/* Tabs */}
      <FadeIn delay={50}>
        <div className="flex gap-1.5 p-1 rounded-xl glass w-fit overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-bg-card text-text-primary border border-border-subtle'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <FadeIn delay={100}>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-primary/20 to-purple-primary/20 flex items-center justify-center border border-border-subtle">
                <User className="h-5 w-5 text-blue-glow" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-text-primary">Profile Information</h2>
                <p className="text-[10px] text-text-secondary">Update your personal details</p>
              </div>
            </div>

            <div className="space-y-4 max-w-lg border-t border-border-subtle/40 pt-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs uppercase font-medium text-text-secondary">Name</label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-10 text-sm" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs uppercase font-medium text-text-secondary">Email</label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 text-sm" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="timezone" className="text-xs uppercase font-medium text-text-secondary">Timezone</label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-border-subtle bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-primary/30 cursor-pointer"
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
                  <label htmlFor="language" className="text-xs uppercase font-medium text-text-secondary">Language</label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-border-subtle bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-primary/30 cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
              </div>

              <Button onClick={handleProfileSave} disabled={updateProfileMutation.isPending} className="h-10 px-4 mt-2 bg-blue-primary text-white font-medium">
                <Save className="mr-1.5 h-4 w-4" />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </FadeIn>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <FadeIn delay={100}>
          <div className="space-y-6">
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-border-subtle">
                  <Lock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-semibold text-text-primary">Change Password</h2>
                  <p className="text-[10px] text-text-secondary">Update your password regularly</p>
                </div>
              </div>

              <div className="space-y-4 max-w-lg border-t border-border-subtle/40 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-medium text-text-secondary">Current Password</label>
                  <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-medium text-text-secondary">New Password</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-medium text-text-secondary">Confirm New Password</label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-10 text-sm" />
                </div>
                <Button onClick={handlePasswordSave} disabled={updatePasswordMutation.isPending} className="h-10 px-4 mt-2 bg-blue-primary text-white font-medium">
                  <Save className="mr-1.5 h-4 w-4" />
                  {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card variant="outlined" className="border-error/20 p-4 bg-error/[0.01] space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center border border-error/20">
                  <AlertTriangle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-error">Danger Zone</h3>
                  <p className="text-[10px] text-text-secondary">Irreversible account teardown</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteAccountMutation.isPending} className="h-10 px-4 flex items-center gap-1.5 font-medium cursor-pointer">
                <Trash2 className="h-4 w-4" />
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </Button>
            </Card>
          </div>
        </FadeIn>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <FadeIn delay={100}>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center border border-border-subtle">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold text-text-primary">Notification Preferences</h2>
                <p className="text-[10px] text-text-secondary">Choose what notifications you receive</p>
              </div>
            </div>

            <div className="space-y-3 max-w-lg border-t border-border-subtle/40 pt-4">
              {[
                { key: 'email' as const, title: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'deploy' as const, title: 'Deployment Notifications', desc: 'Get notified about deployment status' },
                { key: 'billing' as const, title: 'Billing Notifications', desc: 'Receive billing and payment reminders' },
                { key: 'security' as const, title: 'Security Notifications', desc: 'Get alerts about security events' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-bg-surface/30 hover:border-border-interactive/50 transition-colors">
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

              <Button onClick={handleNotificationsSave} disabled={updateNotificationsMutation.isPending} className="h-10 px-4 mt-2 bg-blue-primary text-white font-medium">
                <Save className="mr-1.5 h-4 w-4" />
                {updateNotificationsMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </Card>
        </FadeIn>
      )}
      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div ref={deleteConfirmModalRef} role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md p-4 sm:p-5 rounded-xl border border-border-subtle bg-bg-surface glass shadow-2xl m-3 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-error" />
              <h3 className="font-heading text-lg font-bold text-text-primary">Delete Account</h3>
            </div>
            <p className="text-text-secondary text-xs leading-relaxed">
              This action is permanent and cannot be undone. All your projects, files, and data will be permanently deleted. Enter your password and hold the button for 20 seconds to confirm.
            </p>
            <Input
              type="password"
              placeholder="Enter your password to confirm"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="h-10 text-sm"
            />
            <div className="flex gap-3 justify-end text-xs">
              <Button
                variant="outline"
                className="h-10 px-4 rounded-lg"
                onClick={() => { setDeleteConfirmOpen(false); setDeletePassword(''); endHold(); }}
              >
                Cancel
              </Button>
              <button
                disabled={deleteAccountMutation.isPending || !deletePassword}
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={startHold}
                onTouchEnd={endHold}
                className="relative overflow-hidden h-10 px-4 rounded-lg bg-error/10 border border-error/30 text-error text-xs font-semibold select-none cursor-pointer active:scale-95 transition-transform flex items-center justify-center min-w-[180px]"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-error/25 transition-all ease-linear"
                  style={{
                    width: `${holdProgress}%`,
                    transitionDuration: holdProgress === 0 ? '150ms' : '0ms'
                  }}
                />
                <span className="relative z-10">
                  {deleteAccountMutation.isPending ? 'Deleting...' : holdProgress > 0 ? `Holding (${Math.round(holdProgress)}%)` : 'Hold 20s to Delete'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
