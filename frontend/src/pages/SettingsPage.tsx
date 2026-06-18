import { Bell, Braces, Check, Gauge, LockKeyhole, Monitor, Save, Server } from "lucide-react";
import { useState } from "react";
import { externalUrls } from "../lib/api";
import { getSettings, saveSettings, type Settings } from "../lib/settings";
import { Button, Card, PageHeader, useToast } from "../components/ui";

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(getSettings());
  const notify = useToast();
  const commit = () => {
    saveSettings(settings);
    notify("Preferences saved");
  };
  return (
    <>
      <PageHeader eyebrow="Workspace" title="Settings" description="Local interface preferences and deployment-aware endpoint information.">
        <Button onClick={commit}><Save size={15} /> Save preferences</Button>
      </PageHeader>
      <section className="settings-grid">
        <Card className="settings-card">
          <div className="card-heading"><div><span className="eyebrow">Appearance</span><h2>Interface</h2></div><Monitor size={20} /></div>
          <div className="setting-row"><div><strong>Theme</strong><span>HelixAI’s operational dark theme</span></div><span className="fixed-setting"><Check size={14} /> Dark</span></div>
          <label className="setting-row"><div><strong>Compact tables</strong><span>Reduce vertical spacing in data-dense views</span></div><input type="checkbox" checked={settings.compactMode} onChange={(event) => setSettings({ ...settings, compactMode: event.target.checked })} /></label>
        </Card>
        <Card className="settings-card">
          <div className="card-heading"><div><span className="eyebrow">Live data</span><h2>Refresh behavior</h2></div><Gauge size={20} /></div>
          <label className="setting-row"><div><strong>Background refresh</strong><span>Overview and operational status cadence</span></div><select value={settings.refreshInterval} onChange={(event) => setSettings({ ...settings, refreshInterval: Number(event.target.value) })}><option value={5000}>5 seconds</option><option value={15000}>15 seconds</option><option value={30000}>30 seconds</option><option value={60000}>1 minute</option></select></label>
          <label className="setting-row"><div><strong>Notifications</strong><span>Show mutation success and failure toasts</span></div><input type="checkbox" checked={settings.notifications} onChange={(event) => setSettings({ ...settings, notifications: event.target.checked })} /></label>
        </Card>
      </section>
      <Card className="endpoint-settings">
        <div className="card-heading"><div><span className="eyebrow">Environment</span><h2>Configured endpoints</h2></div><Server size={20} /></div>
        <div className="endpoint-setting-list">
          <div><span><Braces size={16} /> API base URL</span><code>{import.meta.env.VITE_API_BASE_URL || "/api (same origin)"}</code></div>
          <div><span><Gauge size={16} /> Grafana</span><code>{externalUrls.grafana}</code></div>
          <div><span><Gauge size={16} /> Prometheus</span><code>{externalUrls.prometheus}</code></div>
          <div><span><Bell size={16} /> Jenkins public URL</span><code>{externalUrls.jenkins}</code></div>
          <div><span><LockKeyhole size={16} /> Vault</span><code>{externalUrls.vault}</code></div>
          <div><span><Server size={16} /> Environment</span><code>{import.meta.env.VITE_ENVIRONMENT || "development"}</code></div>
        </div>
      </Card>
      <div className="data-note"><Bell size={17} /><div><strong>Account settings and logout are not shown</strong><span>The existing FastAPI application has no authentication or user-account endpoints. The interface does not invent a session model.</span></div></div>
    </>
  );
}
