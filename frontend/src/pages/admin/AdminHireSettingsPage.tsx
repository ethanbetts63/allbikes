import { useState, useEffect } from 'react';
import { adminGetHireSettings, adminUpdateHireSettings } from '@/api';
import type { HireSettings } from '@/types/HireBooking';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

const AdminHireSettingsPage = () => {
  const [settings, setSettings] = useState<HireSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    adminGetHireSettings()
      .then(setSettings)
      .catch(() => setNotification({ message: 'Failed to load hire settings.', type: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setNotification(null);
    try {
      const updated = await adminUpdateHireSettings(settings);
      setSettings(updated);
      setNotification({ message: 'Settings saved.', type: 'success' });
    } catch {
      setNotification({ message: 'Failed to save settings.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!settings) {
    return <p className="p-4 text-destructive">Could not load hire settings.</p>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-dark-primary)]">Hire Settings</h1>

      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="flex items-center gap-3">
            <Switch
              id="enable_hire"
              checked={settings.enable_hire}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_hire: checked })}
            />
            <Label htmlFor="enable_hire">Enable hire system on public site</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bond_amount">Bond Amount (AUD)</Label>
              <Input
                id="bond_amount"
                type="number"
                step="0.01"
                value={settings.bond_amount}
                onChange={(e) => setSettings({ ...settings, bond_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advance_min_days">Min Advance Days</Label>
              <Input
                id="advance_min_days"
                type="number"
                value={settings.advance_min_days}
                onChange={(e) => setSettings({ ...settings, advance_min_days: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advance_max_days">Max Advance Days</Label>
              <Input
                id="advance_max_days"
                type="number"
                value={settings.advance_max_days}
                onChange={(e) => setSettings({ ...settings, advance_max_days: parseInt(e.target.value) })}
              />
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminHireSettingsPage;
