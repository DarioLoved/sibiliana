import React from 'react';
import { Zap, Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

interface HeaderProps {
  onNotificationsClick: () => void;
}

export function Header({ onNotificationsClick }: HeaderProps) {
  const { unreadCount } = useNotifications();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-600 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Casa Mare</h1>
              <p className="text-sm text-gray-500">Gestione Spese Energia</p>
            </div>
          </div>
          
          <button
            onClick={onNotificationsClick}
            className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}