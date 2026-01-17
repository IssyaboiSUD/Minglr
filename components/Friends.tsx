
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { UserProfile } from '../types';
// Fixed missing 'Users' import from lucide-react
import { Search, UserPlus, UserMinus, User, MessageCircle, MoreHorizontal, Sparkles, Users } from 'lucide-react';

interface FriendsProps {
  onUpdate: () => void;
}

const Friends: React.FC<FriendsProps> = ({ onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [myFriends, setMyFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

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

  const toggleFriend = async (friendId: string, isFriend: boolean) => {
    if (isFriend) {
      await db.removeFriend(friendId);
    } else {
      await db.addFriend(friendId);
    }
    await loadFriends();
    onUpdate();
  };

  return (
    <div className="p-6 pb-24 space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Build Your Squad</p>
        <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">FRIENDS</h2>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-6 flex items-center text-slate-400">
          <Search size={20} />
        </div>
        <input 
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search people in Munich..." 
          className="w-full bg-white border border-slate-100 rounded-[2rem] px-16 py-6 font-bold text-slate-900 shadow-xl shadow-slate-200/40 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        {loading && (
          <div className="absolute right-6 inset-y-0 flex items-center">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Results / Friends List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Find Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Sparkles size={16} className="text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Find People</h3>
          </div>
          <div className="space-y-4">
            {searchTerm.length >= 2 ? (
              searchResults.length > 0 ? (
                searchResults.map(user => (
                  <FriendItem 
                    key={user.id} 
                    user={user} 
                    isFriend={myFriends.some(f => f.id === user.id)}
                    onAction={() => toggleFriend(user.id, myFriends.some(f => f.id === user.id))}
                  />
                ))
              ) : (
                <p className="text-center py-10 text-slate-400 text-sm font-medium italic">No matches found.</p>
              )
            ) : (
              <div className="p-10 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm font-medium">Type to search for friends</p>
              </div>
            )}
          </div>
        </section>

        {/* My Squad Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">My Squad</h3>
            </div>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{myFriends.length}</span>
          </div>
          <div className="space-y-4">
            {myFriends.length > 0 ? (
              myFriends.map(user => (
                <FriendItem 
                  key={user.id} 
                  user={user} 
                  isFriend={true}
                  onAction={() => toggleFriend(user.id, true)}
                />
              ))
            ) : (
              <div className="p-10 text-center bg-indigo-50/50 rounded-[2.5rem] border border-dashed border-indigo-100">
                <p className="text-indigo-400 text-sm font-medium">Your squad is empty. Start finding people!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const FriendItem: React.FC<{ user: UserProfile, isFriend: boolean, onAction: () => void }> = ({ user, isFriend, onAction }) => (
  <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-lg transition-all group">
    <div className="flex items-center gap-4">
      <img 
        src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`} 
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = `https://i.pravatar.cc/150?u=${user.id}`;
        }}
        className="w-14 h-14 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform bg-slate-100" 
        alt={user.name} 
      />
      <div>
        <h4 className="font-black text-slate-900 italic tracking-tight">{user.name}</h4>
        <div className="flex gap-1 mt-1">
          {user.preferences.slice(0, 2).map(p => (
            <span key={p} className="text-[8px] font-black uppercase tracking-widest text-indigo-400">{p}</span>
          ))}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button 
        onClick={onAction}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
          isFriend ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
        }`}
      >
        {isFriend ? <UserMinus size={18} /> : <UserPlus size={18} />}
      </button>
      {isFriend && (
        <button className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-white transition-all">
          <MessageCircle size={18} />
        </button>
      )}
    </div>
  </div>
);

export default Friends;
