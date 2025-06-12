import React from 'react';
import { Home, Activity, Receipt, BarChart3, History } from 'lucide-react';

export type NavigationTab = 'dashboard' | 'readings' | 'bills' | 'calculations' | 'history';

interface NavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'readings' as const, label: 'Letture', icon: Activity },
    { id: 'bills' as const, label: 'Bollette', icon: Receipt },
    { id: 'calculations' as const, label: 'Calcoli', icon: BarChart3 },
    { id: 'history' as const, label: 'Storico', icon: History },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}