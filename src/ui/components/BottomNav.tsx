import React from 'react';
import { Activity, Disc3, Layers, Sliders, Settings } from 'lucide-react';

export type TabType = 'monitor' | 'sessions' | 'research' | 'devices' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'monitor', label: 'Monitor', icon: <Activity className="h-5 w-5" /> },
    { id: 'sessions', label: 'Sessions', icon: <Disc3 className="h-5 w-5" /> },
    { id: 'research', label: 'Research', icon: <Layers className="h-5 w-5" /> },
    { id: 'devices', label: 'Devices', icon: <Sliders className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/80 bg-zinc-950/95 px-2 py-1.5 backdrop-blur-md pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/10 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-0.5 tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
