import { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastCheck, setLastCheck] = useState<string>(() => {
    return localStorage.getItem('lastNotificationCheck') || new Date().toISOString();
  });

  useEffect(() => {
    checkForNotifications();
    const interval = setInterval(checkForNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkForNotifications = () => {
    const today = new Date();
    const isFirstOfMonth = today.getDate() === 1;
    const lastCheckDate = new Date(lastCheck);
    const daysDiff = Math.floor((today.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24));

    if (isFirstOfMonth && daysDiff >= 30) {
      addNotification({
        type: 'warning',
        title: 'Promemoria Letture',
        message: 'È il primo del mese! Ricordati di inserire le letture dei contascatti.',
      });
    }

    setLastCheck(today.toISOString());
    localStorage.setItem('lastNotificationCheck', today.toISOString());
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
  };
}