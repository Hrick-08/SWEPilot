import { useEffect, useState } from 'react';
import { Github, Bot, Bell, Palette, Key } from 'lucide-react';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[13px] font-medium text-[#F8FAFC]">{label}</p>
        {description && (
          <p className="text-[12px] text-[#64748B] mt-0.5">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 min-w-10 h-[22px] overflow-hidden rounded-full transition-colors duration-200 flex-shrink-0 ${
          checked ? 'bg-[#3B82F6]' : 'bg-[#1E293B]'
        }`}
      >
        <span
          className={`absolute left-[3px] top-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : ''
          }`}
        />
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
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-semibold text-[#F8FAFC]">Settings</h1>
        <p className="text-[14px] text-[#94A3B8] mt-1">
          Configure your SWEPilot workspace.
        </p>
      </div>

      {/* Repository */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Github className="w-5 h-5 text-[#F8FAFC]" />
          <h2 className="text-[16px] font-semibold text-[#F8FAFC]">Repository</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-[13px] text-[#94A3B8]">Repository</span>
            <span className="text-[13px] font-mono text-[#F8FAFC]">{username}/SWEPilot</span>
          </div>
          <div className="border-t border-[#1E293B]" />
          <div className="flex items-center justify-between py-2">
            <span className="text-[13px] text-[#94A3B8]">Default branch</span>
            <span className="text-[13px] font-mono text-[#F8FAFC]">main</span>
          </div>
          <div className="border-t border-[#1E293B]" />
          <div className="flex items-center justify-between py-2">
            <span className="text-[13px] text-[#94A3B8]">Status</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span className="text-[13px] text-[#22C55E]">Connected</span>
            </span>
          </div>
        </div>
      </Card>

      {/* GitHub Account */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Github className="w-5 h-5 text-[#F8FAFC]" />
          <h2 className="text-[16px] font-semibold text-[#F8FAFC]">GitHub Account</h2>
        </div>

        <div className="flex items-center gap-3 py-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] text-[14px] font-semibold">
            {username?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#F8FAFC]">{username}</p>
            <p className="text-[12px] text-[#64748B]">GitHub: @{username}</p>
          </div>
        </div>

        <form onSubmit={saveAccount} className="mt-4 border-t border-[#1E293B] pt-4 space-y-4">
          <div>
            <label htmlFor="account-username" className="block text-[14px] font-medium text-[#F8FAFC] mb-2">
              Username
            </label>
            <input
              id="account-username"
              type="text"
              value={accountUsername}
              onChange={(event) => setAccountUsername(event.target.value)}
              required
              autoComplete="username"
              className="w-full bg-[#080B12] border border-[#1E293B] text-[#F8FAFC] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-[#94A3B8]" />
              <h3 className="text-[14px] font-medium text-[#F8FAFC]">GitHub Token</h3>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="github-token"
                type="password"
                value={githubToken}
                onChange={(event) => setGithubToken(event.target.value)}
                autoComplete="off"
                placeholder="Enter a new token"
                className="flex-1 bg-[#080B12] border border-[#1E293B] text-[#F8FAFC] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              />
              <button
                type="submit"
                disabled={savingAccount}
                className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingAccount ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
          {accountMessage && <p className="text-[12px] text-[#22C55E]">{accountMessage}</p>}
          {accountError && <p className="text-[12px] text-[#EF4444]">{accountError}</p>}
        </form>
      </Card>

      {/* Agent Configuration */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bot className="w-5 h-5 text-[#8B5CF6]" />
          <h2 className="text-[16px] font-semibold text-[#F8FAFC]">Agent Configuration</h2>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-[13px] font-medium text-[#F8FAFC]">Model</p>
              <p className="text-[12px] text-[#64748B]">AI model used for code generation</p>
            </div>
            <span className="px-3 py-1.5 bg-[#0D121C] border border-[#1E293B] rounded-lg text-[13px] font-mono text-[#94A3B8]">
              GPT-5 mini
            </span>
          </div>

          <div className="border-t border-[#1E293B]" />

          <Toggle
            label="Auto-create PR"
            description="Automatically create pull requests after successful runs"
            checked={settings.autoCreatePR}
            onChange={(v) => updateSetting('autoCreatePR', v)}
          />

          <div className="border-t border-[#1E293B]" />

          <Toggle
            label="Auto-run tests"
            description="Automatically run tests before creating commits"
            checked={settings.autoRunTests}
            onChange={(v) => updateSetting('autoRunTests', v)}
          />
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-[#F59E0B]" />
          <h2 className="text-[16px] font-semibold text-[#F8FAFC]">Notifications</h2>
        </div>

        <div className="space-y-1">
          <Toggle
            label="Run completed"
            description="Notify when an agent run completes successfully"
            checked={settings.notifyRunCompleted}
            onChange={(v) => updateSetting('notifyRunCompleted', v)}
          />
          <div className="border-t border-[#1E293B]" />
          <Toggle
            label="Run failed"
            description="Notify when an agent run fails"
            checked={settings.notifyRunFailed}
            onChange={(v) => updateSetting('notifyRunFailed', v)}
          />
          <div className="border-t border-[#1E293B]" />
          <Toggle
            label="PR created"
            description="Notify when a pull request is created"
            checked={settings.notifyPRCreated}
            onChange={(v) => updateSetting('notifyPRCreated', v)}
          />
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-[#3B82F6]" />
          <h2 className="text-[16px] font-semibold text-[#F8FAFC]">Appearance</h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-[13px] font-medium text-[#F8FAFC]">Theme</p>
            <p className="text-[12px] text-[#64748B]">Choose your preferred theme</p>
          </div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-[12px] font-medium bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30 rounded-lg">
              Dark
            </button>
            <button className="px-3 py-1.5 text-[12px] font-medium text-[#64748B] border border-[#1E293B] rounded-lg hover:bg-[#161D2A] transition-colors">
              Light
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
