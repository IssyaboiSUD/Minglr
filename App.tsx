
import React, { useState, useEffect } from 'react';
import { Home, MessageSquare, Compass, Calendar, User, Heart, Share2, PlusCircle, LayoutGrid, Users, Bell } from 'lucide-react';
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [logoError, setLogoError] = useState(false);
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

  // Show loading state
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

  // Show login if not authenticated
  if (!userProfile || !user) {
    return <Login />;
  }

  // Hide nav and header if in mobile chat view for full-screen feel
  const isChatTab = activeTab === 'chat';

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-white md:shadow-2xl relative overflow-hidden">
      {/* Header - Hidden on mobile chat to save space */}
      <header className={`px-6 py-4 items-center justify-between border-b bg-white/80 backdrop-blur-md z-40 shrink-0 ${isChatTab ? 'hidden md:flex' : 'flex'}`}>
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
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
            }`}
          >
            <Heart size={14} fill={activeTab === 'wishlist' ? "currentColor" : "none"} />
            <span className="text-xs font-black tracking-tighter">{user.wishlist.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`relative group transition-transform active:scale-95 ml-1 ${activeTab === 'profile' ? 'ring-2 ring-indigo-500 rounded-full' : ''}`}
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
      <main className="flex-1 overflow-hidden bg-slate-50/30 relative">
        <div className={`h-full ${isChatTab ? 'pb-0' : 'pb-28 md:pb-32'} overflow-y-auto`}>
          {activeTab === 'explore' && <Explore onWishlistUpdate={refreshUser} />}
          {activeTab === 'chat' && <Chat />}
          {activeTab === 'feed' && <Feed onWishlistUpdate={refreshUser} />}
          {activeTab === 'calendar' && <GroupCalendar />}
          {activeTab === 'wishlist' && <Wishlist onWishlistUpdate={refreshUser} />}
          {activeTab === 'friends' && <Friends onUpdate={refreshUser} />}
          {activeTab === 'profile' && <Profile user={user} onUpdate={refreshUser} />}
        </div>
      </main>

      {/* Bottom Navigation - Hidden on mobile chat to avoid overlapping input */}
      <nav className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] p-1.5 flex justify-around items-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] border border-white/10 transition-transform duration-300
        ${isChatTab ? 'hidden md:flex' : 'flex'}
      `}>
        <NavButton 
          active={activeTab === 'explore'} 
          onClick={() => setActiveTab('explore')} 
          icon={<Compass />} 
          label="Explore"
        />
        <NavButton 
          active={activeTab === 'feed'} 
          onClick={() => setActiveTab('feed')} 
          icon={<LayoutGrid />} 
          label="Feed"
          hasNotification={hasNotifications('like') || hasNotifications('comment')}
        />
        <NavButton 
          active={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')} 
          icon={<MessageSquare />} 
          label="Chat"
          hasNotification={hasNotifications('message')}
        />
        <NavButton 
          active={activeTab === 'friends'} 
          onClick={() => setActiveTab('friends')} 
          icon={<Users />} 
          label="Squad"
          hasNotification={hasNotifications('friend_request')}
        />
        <NavButton 
          active={activeTab === 'calendar'} 
          onClick={() => setActiveTab('calendar')} 
          icon={<Calendar />} 
          label="Events"
          hasNotification={hasNotifications('event')}
        />
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
  hasNotification?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, hasNotification = false }) => (
  <button 
    onClick={onClick}
    className={`relative flex flex-col items-center gap-1 transition-all duration-300 px-3.5 py-2.5 rounded-[1.8rem] ${
      active ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className="relative">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 20, strokeWidth: active ? 2.5 : 2 })}
      {hasNotification && !active && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-400 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse"></span>
      )}
    </div>
    <span className={`text-[7px] font-black uppercase tracking-[0.15em] ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;
