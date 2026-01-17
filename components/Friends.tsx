
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { UserProfile } from '../types';
import { 
  Search, 
  UserPlus, 
  UserMinus, 
  MessageSquare, 
  Sparkles, 
  Users, 
  Clock, 
  Check, 
  X, 
  UserCheck, 
  Ghost
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAuth } from '../contexts/AuthContext';

interface FriendsProps {
  onUpdate: () => void;
}

const Friends: React.FC<FriendsProps> = ({ onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [myFriends, setMyFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { notifications } = useNotifications();
  const { userProfile } = useAuth();
  
  // Real-time identification of incoming friend requests
  const incomingRequests = notifications.filter(n => n.type === 'friend_request' && !n.read);

  useEffect(() => {
    loadFriends();
  }, [userProfile?.friends]);

  const loadFriends = async () => {
    const list = await db.getFriendsList();
    setMyFriends(list);
  };

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    const results = await db.searchUsers(val);
    setSearchResults(results);
    setLoading(false);
  };

  const handleSendRequest = async (targetId: string) => {
    await db.sendFriendRequest(targetId);
    // Profile sync handled by AuthContext listener
  };

  const handleAcceptRequest = async (notificationId: string, requesterId: string) => {
    await db.acceptFriendRequest(notificationId, requesterId);
    onUpdate(); // Trigger refresh if needed
  };

  const handleIgnoreRequest = async (notificationId: string) => {
    await db.ignoreFriendRequest(notificationId);
  };

  const handleUnfriend = async (friendId: string) => {
    if (confirm('Remove from your squad?')) {
      await db.removeFriend(friendId);
      onUpdate();
    }
  };

  return (
    <div className="p-6 pb-24 space-y-10 animate-in fade-in duration-500">
      <header>
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Build Your Network</p>
        <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Squad Hub</h2>
      </header>

      {/* 1. INCOMING REQUESTS - Only shows if there are any */}
      {incomingRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <UserCheck size={18} className="text-violet-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Incoming Requests</h3>
            <span className="bg-violet-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">NEW</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingRequests.map(req => (
              <div key={req.id} className="bg-white p-5 rounded-[2.5rem] border-2 border-violet-100 shadow-xl shadow-violet-500/5 flex items-center justify-between group animate-in slide-in-from-top-2">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 font-black italic text-xl shadow-inner">
                    {req.userName[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base italic tracking-tight">{req.userName}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Wants to join your squad</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleAcceptRequest(req.id, req.relatedId!)}
                    className="h-12 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleIgnoreRequest(req.id)}
                    className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. DISCOVERY & SEARCH */}
      <div className="relative">
        <div className="absolute inset-y-0 left-6 flex items-center text-slate-400">
          <Search size={24} />
        </div>
        <input 
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Find Munich residents..." 
          className="w-full bg-white border border-slate-100 rounded-[2.5rem] px-16 py-7 font-bold text-slate-900 shadow-2xl shadow-slate-200/40 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-lg"
        />
        {loading && (
          <div className="absolute right-8 inset-y-0 flex items-center">
            <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {searchTerm.length >= 2 && (
        <section className="space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 px-2">
            <Sparkles size={16} className="text-indigo-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Results</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map(user => {
              const isFriend = userProfile?.friends.includes(user.id);
              const isPending = userProfile?.sentRequests.includes(user.id);
              return (
                <div key={user.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover bg-slate-100 shadow-sm" alt="" />
                    <div>
                      <h4 className="font-black text-slate-900 text-sm italic">{user.name}</h4>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Munich Resident</p>
                    </div>
                  </div>
                  {isFriend ? (
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl"><Check size={20} /></div>
                  ) : isPending ? (
                    <div className="bg-indigo-50 text-indigo-500 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} /> Pending
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSendRequest(user.id)}
                      className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-90"
                    >
                      <UserPlus size={20} />
                    </button>
                  )}
                </div>
              );
            })}
            {searchResults.length === 0 && !loading && (
              <p className="col-span-full text-center py-10 text-slate-400 italic text-sm">No one found with that name.</p>
            )}
          </div>
        </section>
      )}

      {/* 3. MY SQUAD (CURRENT FRIENDS) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">My Squad</h3>
          </div>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
            {myFriends.length} Members
          </span>
        </div>

        {myFriends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myFriends.map(friend => (
              <div key={friend.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <img src={friend.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover bg-slate-100 border-2 border-white shadow-md" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg italic tracking-tight">{friend.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {friend.preferences.slice(0, 2).map(p => (
                        <span key={p} className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded-md">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-3.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <MessageSquare size={14} /> Chat
                  </button>
                  <button 
                    onClick={() => handleUnfriend(friend.id)}
                    className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                  >
                    <UserMinus size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
              <Ghost size={40} />
            </div>
            <div className="max-w-xs mx-auto">
              <h3 className="text-xl font-black text-slate-900">Your squad is empty</h3>
              <p className="text-slate-400 text-sm mt-2">Munich is full of adventure. Search for people to start your group journeys!</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Friends;
