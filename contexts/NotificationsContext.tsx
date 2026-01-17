
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Notification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  hasNotifications: (type: 'like' | 'comment' | 'message' | 'friend_request' | 'event') => boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile) {
      setNotifications([]);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = db.subscribeToNotifications((fetchedNotifications) => {
        setNotifications(fetchedNotifications);
      }, userProfile.id);
    } catch (error) {
      console.error('Error setting up notifications subscription:', error);
      setNotifications([]);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userProfile]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await db.markNotificationAsRead(id);
  };

  const markAllAsRead = async () => {
    if (userProfile) {
      await db.markAllNotificationsAsRead(userProfile.id);
    }
  };

  const hasNotifications = (type: 'like' | 'comment' | 'message' | 'friend_request' | 'event') => {
    return notifications.some(n => !n.read && n.type === type);
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      hasNotifications
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};
