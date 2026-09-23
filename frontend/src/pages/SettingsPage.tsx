import { useEffect, useState } from 'react';
import { Github, Bot, Bell, Key, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">
      <div>
        <p className="text-[13px] font-medium text-text-secondary">{label}</p>
        {description && <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-[22px] w-10 shrink-0 rounded-full border transition-colors duration-200 ${checked ? 'border-primary bg-primary' : 'border-border bg-bg-hover'}`}
      >
        <span className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[18px]' : ''}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { username, updateAccount } = useAuth();
  const [accountUsername, setAccountUsername] = useState(username ?? '');
  const [githubToken, setGithubToken] = useState('');
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [settings, setSettings] = useState({
    autoCreatePR: true,
    autoRunTests: true,
    notifyRunCompleted: true,
    notifyRunFailed: true,
    notifyPRCreated: true,
  });

  useEffect(() => {
    setAccountUsername(username ?? '');
  }, [username]);

  const saveAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setAccountMessage(null);
    setAccountError(null);
    setSavingAccount(true);

    try {
      await updateAccount(accountUsername, githubToken || undefined);
      setGithubToken('');
      setAccountMessage('Account details updated.');
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Could not update account details.');
    } finally {
      setSavingAccount(false);
    }
  };

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">A workspace that works your way.</p>
        </div>
      </div>

      <div className="space-y-8">
        <section className="grid items-start gap-5 xl:grid-cols-[210px_1fr] xl:gap-8" aria-labelledby="account-heading">
          <div className="pt-1">
            <h2 id="account-heading" className="flex items-center gap-2.5 text-sm font-medium text-text-primary"><Github className="size-4 text-text-muted" strokeWidth={1.7} />GitHub account</h2>
            <p className="mt-2 text-xs leading-6 text-text-muted">Manage your account details and repository access.</p>
          </div>
          <Card>
            <div className="flex min-w-0 items-center gap-3 border-b border-border pb-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-accent-blue/20 bg-accent-blue/8 text-sm font-medium text-accent-blue">{username?.charAt(0).toUpperCase() ?? 'U'}</div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-text-primary">{username}</p>
                <p className="mt-0.5 truncate text-xs text-text-muted">GitHub: @{username}</p>
              </div>
            </div>
            <form onSubmit={saveAccount} className="mt-5 space-y-5">
              <div>
                <label htmlFor="account-username" className="field-label">Username</label>
                <Input id="account-username" type="text" value={accountUsername} onChange={(event) => setAccountUsername(event.target.value)} required autoComplete="username" />
              </div>
              <div>
                <label htmlFor="github-token" className="field-label flex items-center gap-2"><Key className="size-3.5 text-text-muted" />GitHub token</label>
                <Input id="github-token" type="password" value={githubToken} onChange={(event) => setGithubToken(event.target.value)} autoComplete="off" aria-describedby="token-help" placeholder="Enter a new token" />
                <p id="token-help" className="mt-2 text-[11px] leading-relaxed text-text-muted">Leave blank to keep your current token.</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <div aria-live="polite" className="min-w-0">
                  {accountMessage && <p className="text-xs text-success">{accountMessage}</p>}
                  {accountError && <p role="alert" className="text-xs text-error">{accountError}</p>}
                </div>
                <Button type="submit" disabled={savingAccount} className="ml-auto">
                  {savingAccount && <Loader2 className="size-3.5 animate-spin" />}
                  {savingAccount ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </form>
          </Card>
        </section>

        {/* <section className="grid items-start gap-5 border-t border-border/70 pt-8 xl:grid-cols-[210px_1fr] xl:gap-8" aria-labelledby="agent-heading">
          <div className="pt-1">
            <h2 id="agent-heading" className="flex items-center gap-2.5 text-sm font-medium text-text-primary"><Bot className="size-4 text-text-muted" strokeWidth={1.7} />Agent configuration</h2>
            <p className="mt-2 text-xs leading-6 text-text-muted">Preferences for how your agent approaches the work.</p>
          </div>
          <Card className="!py-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-5">
              <div>
                <p className="text-[13px] font-medium text-text-secondary">Model</p>
                <p className="mt-1 text-xs text-text-muted">AI model used for code generation</p>
              </div>
              <span className="rounded-md border border-border bg-bg-secondary px-2.5 py-1.5 font-mono text-[11px] text-text-secondary">GPT-5 mini</span>
            </div>
            <div className="divide-y divide-border">
              <Toggle label="Auto-create PR" description="Automatically create pull requests after successful runs" checked={settings.autoCreatePR} onChange={(v) => updateSetting('autoCreatePR', v)} />
              <Toggle label="Auto-run tests" description="Automatically run tests before creating commits" checked={settings.autoRunTests} onChange={(v) => updateSetting('autoRunTests', v)} />
            </div>
          </Card>
        </section>

        <section className="grid items-start gap-5 border-t border-border/70 pt-8 xl:grid-cols-[210px_1fr] xl:gap-8" aria-labelledby="notifications-heading">
          <div className="pt-1">
            <h2 id="notifications-heading" className="flex items-center gap-2.5 text-sm font-medium text-text-primary"><Bell className="size-4 text-text-muted" strokeWidth={1.7} />Notifications</h2>
            <p className="mt-2 text-xs leading-6 text-text-muted">Choose the updates you want to stay on top of.</p>
          </div>
          <Card className="!py-0">
            <div className="divide-y divide-border">
              <Toggle label="Run completed" description="Notify when an agent run completes successfully" checked={settings.notifyRunCompleted} onChange={(v) => updateSetting('notifyRunCompleted', v)} />
              <Toggle label="Run failed" description="Notify when an agent run fails" checked={settings.notifyRunFailed} onChange={(v) => updateSetting('notifyRunFailed', v)} />
              <Toggle label="PR created" description="Notify when a pull request is created" checked={settings.notifyPRCreated} onChange={(v) => updateSetting('notifyPRCreated', v)} />
            </div>
          </Card>
        </section> */}
      </div>
    </div>
  );
}
