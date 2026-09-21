import { useState } from 'react';

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: (activeTab: string) => React.ReactNode;
}

export default function Tabs({ tabs, defaultTab, onChange, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div>
      <div className="flex gap-0 border-b border-[#1E293B] mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`relative flex-1 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ${
              activeTab === tab.id
                ? 'text-[#F8FAFC]'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    activeTab === tab.id
                      ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                      : 'bg-[#1E293B] text-[#64748B]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B82F6] rounded-full" />
            )}
          </button>
        ))}
      </div>
      {children(activeTab)}
    </div>
  );
}
