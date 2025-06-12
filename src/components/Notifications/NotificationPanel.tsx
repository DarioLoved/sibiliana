import React from 'react';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Notification } from '../../hooks/useNotifications';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export function NotificationPanel({ isOpen, onClose, notifications, onMarkAsRead }: NotificationPanelProps) {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return X;
      default: return Info;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'text-energy-600';
      case 'warning': return 'text-accent-600';
      case 'error': return 'text-red-600';
      default: return 'text-primary-600';
    }
  };

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'bg-energy-50';
      case 'warning': return 'bg-accent-50';
      case 'error': return 'bg-red-50';
      default: return 'bg-primary-50';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notifiche"
      size="md"
    >
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna notifica</h3>
            <p className="text-gray-600">Tutte le notifiche appariranno qui</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${notification.read ? 'bg-gray-50 border-gray-200' : getBgColor(notification.type) + ' border-transparent'}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${getBgColor(notification.type)}`}>
                    <Icon className={`h-4 w-4 ${getIconColor(notification.type)}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.date).toLocaleString('it-IT')}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      Segna come letta
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}