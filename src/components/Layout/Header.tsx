import React from 'react';
import { Zap, Bell, Settings, ArrowLeft, Menu } from 'lucide-react';
import { Button } from '../Common/Button';
import { useNotifications } from '../../hooks/useNotifications';
import { Property } from '../../types';

interface HeaderProps {
  property?: Property;
  onNotificationsClick: () => void;
  onSettingsClick?: () => void;
  onBackToProperties?: () => void;
  onMenuClick?: () => void;
}

export function Header({ property, onNotificationsClick, onSettingsClick, onBackToProperties, onMenuClick }: HeaderProps) {
  const { unreadCount } = useNotifications();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {property && onBackToProperties && (
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowLeft}
                onClick={onBackToProperties}
                className="hidden sm:flex"
              >
                Proprietà
              </Button>
            )}
            {property && onBackToProperties && (
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowLeft}
                onClick={onBackToProperties}
                className="sm:hidden p-2"
              />
            )}
            <div className="p-2 bg-primary-600 rounded-lg flex-shrink-0">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {property ? property.name : 'Casa Mare'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Gestione Spese Energia</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Mobile menu button */}
            {onMenuClick && (
              <Button
                variant="ghost"
                size="sm"
                icon={Menu}
                onClick={onMenuClick}
                className="sm:hidden"
              />
            )}
            
            {property && onSettingsClick && (
              <Button
                variant="ghost"
                size="sm"
                icon={Settings}
                onClick={onSettingsClick}
                className="hidden sm:flex"
              >
                Impostazioni
              </Button>
            )}
            {property && onSettingsClick && (
              <Button
                variant="ghost"
                size="sm"
                icon={Settings}
                onClick={onSettingsClick}
                className="sm:hidden p-2"
              />
            )}
            <button
              onClick={onNotificationsClick}
              className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}