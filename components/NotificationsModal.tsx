
import React from 'react';
import { X, Heart, MessageSquare, Users, Calendar, Sparkles, Check, Trash2, ArrowRight } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';
import { db } from '../services/dbService';

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
  onUpdate?: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose, onUpdate }) => {
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
        return `${notification.userName} commented on your story`;
      case 'message':
        return `New message from ${notification.userName}`;
      case 'friend_request':
        return `${notification.userName} wants to join your squad`;
      case 'event':
        return `New event: ${notification.text || 'Check it out!'}`;
      default:
        return 'New activity detected';
    }
  };

  const handleAcceptRequest = async (e: React.MouseEvent, notification: any) => {
    e.stopPropagation();
    if (!notification.relatedId) return;
    try {
      await db.acceptFriendRequest(notification.id, notification.relatedId);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleIgnoreRequest = async (e: React.MouseEvent, notification: any) => {
    e.stopPropagation();
    await db.ignoreFriendRequest(notification.id);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="bg-indigo-600 p-8 text-white relative shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Alerts & Updates</p>
              <h4 className="text-3xl font-black italic tracking-tighter uppercase">
                {unreadCount > 0 ? `${unreadCount} New` : 'Notifications'}
              </h4>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-black uppercase tracking-widest hover:bg-white/10 px-4 py-2 rounded-full transition-colors border border-white/20"
                >
                  Clear All
                </button>
              )}
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-32 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No notifications yet</h3>
              <p className="text-slate-400 text-sm max-w-[200px] mx-auto">We'll let you know when things happen in Munich!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={`w-full p-6 text-left hover:bg-slate-50 transition-colors cursor-pointer relative group ${
                    !notification.read ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 mb-1 leading-tight">
                        {getNotificationText(notification)}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                      
                      {notification.type === 'friend_request' && !notification.read && (
                        <div className="flex gap-2 mt-4">
                          <button 
                            onClick={(e) => handleAcceptRequest(e, notification)}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                          >
                            <Check size={12} /> Accept
                          </button>
                          <button 
                            onClick={(e) => handleIgnoreRequest(e, notification)}
                            className="px-5 py-3 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                          >
                            Ignore
                          </button>
                        </div>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="shrink-0 w-2.5 h-2.5 bg-indigo-500 rounded-full mt-2 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
