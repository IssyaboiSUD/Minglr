import React from 'react';
import { X, Heart, MessageSquare, Users, Calendar, Sparkles } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

interface NotificationsModalProps {
  onClose: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-rose-500" fill="currentColor" />;
      case 'comment':
        return <MessageSquare size={20} className="text-indigo-500" />;
      case 'message':
        return <MessageSquare size={20} className="text-violet-500" />;
      case 'friend_request':
        return <Users size={20} className="text-cyan-500" />;
      case 'event':
        return <Calendar size={20} className="text-amber-500" />;
      default:
        return <Sparkles size={20} className="text-slate-400" />;
    }
  };

  const getNotificationText = (notification: any) => {
    switch (notification.type) {
      case 'like':
        return `${notification.userName} liked your post`;
      case 'comment':
        return `${notification.userName} commented: "${notification.text?.substring(0, 50)}${notification.text && notification.text.length > 50 ? '...' : ''}"`;
      case 'message':
        return `${notification.userName}: ${notification.text?.substring(0, 50)}${notification.text && notification.text.length > 50 ? '...' : ''}`;
      case 'friend_request':
        return `${notification.userName} sent you a friend request`;
      case 'event':
        return `New event: ${notification.text || 'Check it out!'}`;
      default:
        return 'New notification';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="bg-indigo-600 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Notifications</p>
              <h4 className="text-2xl font-black italic tracking-tighter uppercase">
                {unreadCount > 0 ? `${unreadCount} New` : 'All Caught Up'}
              </h4>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-bold uppercase tracking-wider hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No notifications</h3>
              <p className="text-slate-400 text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                    !notification.read ? 'bg-violet-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 mb-1">
                        {getNotificationText(notification)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0 w-2 h-2 bg-violet-500 rounded-full mt-2"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
