
import React, { useState, useEffect } from 'react';
import { Home, MessageSquare, Compass, Calendar, User, Heart, Share2, PlusCircle, LayoutGrid, Users, Bell, Send, X } from 'lucide-react';
import Explore from './components/Explore';
import Chat from './components/Chat';
import Feed from './components/Feed';
import GroupCalendar from './components/GroupCalendar';
import Wishlist from './components/Wishlist';
import Profile from './components/Profile';
import Friends from './components/Friends';
import Login from './components/Login';
import { useAuth } from './contexts/AuthContext';
import { NotificationsProvider, useNotifications } from './contexts/NotificationsContext';
import { db } from './services/dbService';
import { UserProfile } from './types';
import NotificationsModal from './components/NotificationsModal';

const AppContent: React.FC = () => {
  const { userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'explore' | 'chat' | 'feed' | 'calendar' | 'wishlist' | 'friends' | 'profile'>('explore');
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const { unreadCount, hasNotifications } = useNotifications();

  useEffect(() => {
    if (userProfile) {
      setUser(userProfile);
    }
  }, [userProfile]);

  const refreshUser = () => {
    const currentUser = db.getUser();
    if (currentUser) {
      setUser({ ...currentUser });
    }
  };

  const handleNavigateToProfile = (userId: string) => {
    setViewedUserId(userId);
    setActiveTab('profile');
  };

  const handleMyProfile = () => {
    setViewedUserId(null);
    setActiveTab('profile');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50">
        <div className="text-center">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100 mx-auto mb-6 animate-pulse flex items-center justify-center bg-white border border-slate-50">
            {!logoError ? (
              <img 
                src="./Minglr.png" 
                alt="Minglr" 
                className="w-full h-full object-contain p-4"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-black text-3xl italic">M</div>
            )}
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Loading Experience</p>
        </div>
      </div>
    );
  }

  if (!userProfile || !user) {
    return <Login />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden relative">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b bg-white/80 backdrop-blur-md z-40 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('explore')}>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl overflow-hidden shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform bg-slate-50 flex items-center justify-center border border-slate-100">
            <img 
              src="./Minglr.png" 
              alt="Minglr" 
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://ui-avatars.com/api/?name=Minglr&background=4F46E5&color=fff&bold=true";
              }}
            />
          </div>
          <div>
            <h1 className="font-black text-lg md:text-xl tracking-tighter leading-none">
              <span className="text-indigo-600">Ming</span>
              <span className="text-rose-500 italic">lr</span>
            </h1>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Munich Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2 rounded-xl hover:bg-slate-50 text-slate-500 transition-all active:scale-95"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
              activeTab === 'wishlist' 
                ? 'bg-rose-50 text-white shadow-lg shadow-rose-200' 
                : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
            }`}
          >
            <Heart size={14} fill={activeTab === 'wishlist' ? "currentColor" : "none"} />
            <span className="text-xs font-black tracking-tighter">{user.wishlist.length}</span>
          </button>
          <button 
            onClick={handleMyProfile}
            className={`relative group transition-transform active:scale-95 ml-1 ${activeTab === 'profile' && !viewedUserId ? 'ring-2 ring-indigo-500 rounded-full' : ''}`}
          >
            <img 
              src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`} 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://i.pravatar.cc/150?u=${user.id}`;
              }}
              className="w-8 h-8 rounded-full border border-white ring-1 ring-indigo-100 group-hover:ring-indigo-300 transition-all bg-slate-100 object-cover" 
              alt="profile" 
            />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto px-4 md:px-6 py-6 scroll-smooth">
          <div className={`${activeTab === 'feed' ? 'max-w-7xl' : 'max-w-5xl'} mx-auto pb-32 transition-all duration-500`}>
            {activeTab === 'explore' && <Explore onWishlistUpdate={refreshUser} />}
            {activeTab === 'chat' && <Chat />}
            {activeTab === 'feed' && <Feed onWishlistUpdate={refreshUser} onNavigateToProfile={handleNavigateToProfile} />}
            {activeTab === 'calendar' && <GroupCalendar />}
            {activeTab === 'wishlist' && <Wishlist onWishlistUpdate={refreshUser} />}
            {activeTab === 'friends' && <Friends onUpdate={refreshUser} />}
            {activeTab === 'profile' && <Profile userId={viewedUserId || user.id} isOwnProfile={!viewedUserId || viewedUserId === user.id} onUpdate={refreshUser} />}
          </div>
        </div>
      </main>

      {/* Persistent Horizontal Navigation Pill - Enhanced for Mobile */}
      <nav 
        onMouseEnter={() => setIsNavHovered(true)}
        onMouseLeave={() => setIsNavHovered(false)}
        className={`fixed left-6 bottom-8 z-[100] transition-all duration-700 ease-[cubic-bezier(0.2,0,0,1)] 
          bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-1.5 flex flex-row items-center gap-1.5 shadow-[0_20px_50px_rgba(79,70,229,0.15)] border border-indigo-100
          ${isNavHovered ? 'w-auto max-w-[calc(100vw-3rem)] px-2.5' : 'w-14 h-14'}`}
      >
        <div className="flex flex-row items-center relative w-full h-full overflow-hidden">
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 pointer-events-none
            ${isNavHovered ? 'opacity-0 scale-50 rotate-12' : 'opacity-100 scale-100 rotate-0'}`}>
            <Send size={22} className="text-rose-500 fill-rose-50" />
          </div>

          <div className={`flex flex-row gap-1.5 items-center transition-all duration-700
            ${isNavHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
            <NavButton 
              active={activeTab === 'explore'} 
              onClick={() => setActiveTab('explore')} 
              icon={<Compass size={20} />} 
              label="Explore"
              isNavHovered={isNavHovered}
            />
            <NavButton 
              active={activeTab === 'feed'} 
              onClick={() => setActiveTab('feed')} 
              icon={<LayoutGrid size={20} />} 
              label="Feed"
              isNavHovered={isNavHovered}
              hasNotification={hasNotifications('like') || hasNotifications('comment')}
            />
            <NavButton 
              active={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')} 
              icon={<MessageSquare size={20} />} 
              label="Chat"
              isNavHovered={isNavHovered}
              hasNotification={hasNotifications('message')}
            />
            <NavButton 
              active={activeTab === 'friends'} 
              onClick={() => setActiveTab('friends')} 
              icon={<Users size={20} />} 
              label="Squad"
              isNavHovered={isNavHovered}
              hasNotification={hasNotifications('follow')}
            />
            <NavButton 
              active={activeTab === 'calendar'} 
              onClick={() => setActiveTab('calendar')} 
              icon={<Calendar size={20} />} 
              label="Events"
              isNavHovered={isNavHovered}
              hasNotification={hasNotifications('event')}
            />
          </div>
        </div>
      </nav>

      {showNotifications && (
        <NotificationsModal onClose={() => setShowNotifications(false)} onUpdate={refreshUser} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <NotificationsProvider>
      <AppContent />
    </NotificationsProvider>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactElement;
  label: string;
  isNavHovered: boolean;
  hasNotification?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, isNavHovered, hasNotification = false }) => (
  <button 
    onClick={onClick}
    className={`relative flex items-center transition-all duration-500 min-w-max group/btn h-[44px] rounded-2xl
      ${active ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-200' : 'text-rose-500 hover:text-indigo-600 hover:bg-indigo-50'}
      ${isNavHovered ? 'px-3.5 gap-0 md:gap-3' : 'px-0 justify-center w-full'}
    `}
  >
    <div className={`shrink-0 transition-transform duration-500 ${isNavHovered ? 'group-hover/btn:scale-110' : ''}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap hidden md:inline-block
      ${isNavHovered ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-4 w-0'}`}>
      {label}
    </span>
    {hasNotification && (
      <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white animate-pulse"></span>
    )}
  </button>
);

export default App;
