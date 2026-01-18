
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
  Check, 
  Ghost,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FriendsProps {
  onUpdate: () => void;
}

const Friends: React.FC<FriendsProps> = ({ onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
  const [loading, setLoading] = useState(false);
  const { userProfile } = useAuth();

  useEffect(() => {
    loadConnections();
  }, [userProfile?.following, userProfile?.followers]);

  const loadConnections = async () => {
    const followList = await db.getFollowingList();
    const followerList = await db.getFollowersList();
    setFollowing(followList);
    setFollowers(followerList);
  };

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const results = await db.searchUsers(val);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetId: string) => {
    await db.followUser(targetId);
    onUpdate();
  };

  const handleUnfollow = async (targetId: string) => {
    if (confirm('Stop following this person?')) {
      await db.unfollowUser(targetId);
      onUpdate();
    }
  };

  const currentList = activeTab === 'following' ? following : followers;

  return (
    <div className="p-6 pb-24 space-y-10 animate-in fade-in duration-500">
      <header>
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Build Your Network</p>
        <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Connections</h2>
      </header>

      {/* SEARCH BAR */}
      <div className="relative">
        <div className="absolute inset-y-0 left-6 flex items-center text-slate-400">
          <Search size={24} />
        </div>
        <input 
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Find people in Munich..." 
          className="w-full bg-white border border-slate-100 rounded-[2.5rem] px-16 py-7 font-bold text-slate-900 shadow-2xl shadow-slate-200/40 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-lg"
        />
        {loading && (
          <div className="absolute right-8 inset-y-0 flex items-center">
            <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* SEARCH RESULTS */}
      {searchTerm.length >= 2 && (
        <section className="space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 px-2">
            <Sparkles size={16} className="text-indigo-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Results</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map(user => {
              const isFollowing = userProfile?.following?.includes(user.id) || false;
              return (
                <div key={user.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`} 
                      className="w-12 h-12 rounded-2xl object-cover bg-slate-100 shadow-sm" 
                      alt="" 
                    />
                    <div>
                      <h4 className="font-black text-slate-900 text-sm italic">{user.name}</h4>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Resident</p>
                    </div>
                  </div>
                  {isFollowing ? (
                    <button 
                      onClick={() => handleUnfollow(user.id)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all"
                    >
                      Unfollow
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleFollow(user.id)}
                      className="h-12 px-6 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-90"
                    >
                      Follow
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

      {/* CONNECTIONS HUB */}
      <section className="space-y-6">
        <div className="flex bg-slate-100 p-1.5 rounded-[1.8rem] w-full max-w-sm mx-auto">
          <button 
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'following' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'}`}
          >
            Following ({following.length})
          </button>
          <button 
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'followers' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'}`}
          >
            Followers ({followers.length})
          </button>
        </div>

        {currentList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentList.map(person => {
              const followsMeBack = userProfile?.following?.includes(person.id) && (person.following?.includes(userProfile.id) || false);
              
              return (
                <div key={person.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <img 
                        src={person.avatar || `https://i.pravatar.cc/150?u=${person.id}`} 
                        className="w-16 h-16 rounded-[1.5rem] object-cover bg-slate-100 border-2 border-white shadow-md" 
                        alt="" 
                      />
                      {followsMeBack && (
                        <div className="absolute -top-1 -right-1 bg-indigo-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
                          <Check size={8} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg italic tracking-tight">{person.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {person.preferences?.slice(0, 2).map(p => (
                          <span key={p} className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded-md">{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {activeTab === 'following' ? (
                      <>
                        <button className="flex-1 py-3.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                          <MessageSquare size={14} /> Message
                        </button>
                        <button 
                          onClick={() => handleUnfollow(person.id)}
                          className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                        >
                          <UserMinus size={18} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => userProfile?.following?.includes(person.id) ? handleUnfollow(person.id) : handleFollow(person.id)}
                        className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          userProfile?.following?.includes(person.id) 
                            ? 'bg-slate-50 text-slate-400 hover:text-rose-500' 
                            : 'bg-indigo-600 text-white shadow-lg'
                        }`}
                      >
                        {userProfile?.following?.includes(person.id) ? 'Following' : 'Follow Back'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
              <Ghost size={40} />
            </div>
            <div className="max-w-xs mx-auto">
              <h3 className="text-xl font-black text-slate-900">No {activeTab} yet</h3>
              <p className="text-slate-400 text-sm mt-2">Munich is full of adventure. Search for people to follow and join squads!</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Friends;
