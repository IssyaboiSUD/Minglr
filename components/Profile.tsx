
import React, { useState, useRef, useEffect } from 'react';
import { User, Tag, Sparkles, Check, Heart, Users, MapPin, LogOut, Camera, Upload, X, Grid, LayoutGrid, Ghost, ChevronLeft } from 'lucide-react';
import { db } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, Post } from '../types';
import { uploadProfilePicture, validateImageFile } from '../services/storageService';

interface ProfileProps {
  userId: string;
  isOwnProfile: boolean;
  onUpdate: () => void;
}

const CATEGORIES = ['Sports', 'Food', 'Nature', 'Culture', 'Nightlife'];

const Profile: React.FC<ProfileProps> = ({ userId, isOwnProfile, onUpdate }) => {
  const { signOut, userProfile: myProfile } = useAuth();
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function loadProfile() {
      if (!userId) return;
      setLoading(true);
      
      try {
        const user = await db.getUserById(userId);
        if (isMounted && user) {
          setProfileUser(user);
          setName(user.name);
          setAvatar(user.avatar);
          setPreferences(user.preferences || []);
          
          try {
            const posts = await db.getUserPosts(userId);
            if (isMounted) setUserPosts(posts);
          } catch (postErr) {
            console.error("Failed to load user posts:", postErr);
          }
        } else if (isMounted) {
          console.warn("User not found or ID invalid:", userId);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();
    return () => { isMounted = false; };
  }, [userId]);

  const handleFollow = async () => {
    if (!profileUser) return;
    await db.followUser(profileUser.id);
    onUpdate();
    const updated = await db.getUserById(userId);
    setProfileUser(updated);
  };

  const handleUnfollow = async () => {
    if (!profileUser) return;
    await db.unfollowUser(profileUser.id);
    onUpdate();
    const updated = await db.getUserById(userId);
    setProfileUser(updated);
  };

  const handleTogglePref = (pref: string) => {
    setPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileUser) return;
    try {
      validateImageFile(file);
      setUploading(true);
      const downloadURL = await uploadProfilePicture(file, profileUser.id);
      setAvatar(downloadURL);
      setShowAvatarModal(false);
      await db.updateUserProfile({ avatar: downloadURL });
      onUpdate();
    } catch (error: any) {
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.updateUserProfile({ name, avatar, preferences });
      onUpdate();
      alert("Profile updated!");
    } catch (error: any) {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full py-32 space-y-4">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing Munich profile...</p>
    </div>
  );

  if (!profileUser) return (
    <div className="py-32 text-center space-y-4">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
        <Ghost size={32} />
      </div>
      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">User not found</p>
    </div>
  );

  const isFollowing = myProfile?.following?.includes(profileUser.id);

  return (
    <div className="pb-24 space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">{isOwnProfile ? 'Your Identity' : 'Munich Community'}</p>
        <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">{isOwnProfile ? 'My Profile' : `${profileUser.name.toUpperCase()}`}</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center text-center">
            <div className="relative mb-6 group">
              <img 
                src={avatar || `https://i.pravatar.cc/150?u=${profileUser.id}`} 
                className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-xl bg-slate-100" 
                alt={profileUser.name} 
              />
              {isOwnProfile && (
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute inset-0 bg-black/50 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera size={24} className="text-white" />
                </button>
              )}
            </div>
            <h3 className="text-2xl font-black italic tracking-tighter text-slate-900">{isOwnProfile ? name : profileUser.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Munich Explorer</p>
            
            <div className="grid grid-cols-3 gap-2 w-full">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Posts</p>
                <p className="text-lg font-black text-slate-900">{userPosts.length}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Following</p>
                <p className="text-lg font-black text-slate-900">{profileUser.following?.length || 0}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Followers</p>
                <p className="text-lg font-black text-slate-900">{profileUser.followers?.length || 0}</p>
              </div>
            </div>

            {!isOwnProfile && (
              <button 
                onClick={isFollowing ? handleUnfollow : handleFollow}
                className={`w-full mt-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95 ${
                  isFollowing ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow Explorer'}
              </button>
            )}
          </div>

          {isOwnProfile && (
            <button 
              onClick={signOut}
              className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          )}
        </div>

        <div className="lg:col-span-2 space-y-10">
          {isOwnProfile && (
            <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <User size={20} className="text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Basic Info</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Display Name</label>
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Tag size={20} className="text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Munich Interests</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleTogglePref(cat)}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                        preferences.includes(cat) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSave} disabled={saving} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Sync Profile'}
              </button>
            </div>
          )}

          <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <LayoutGrid size={20} className="text-indigo-600" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Munich Memories</h4>
              </div>
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-full">{userPosts.length} Posts</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {userPosts.map(post => (
                <div key={post.id} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-sm group relative cursor-pointer">
                  <img src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                     <p className="text-[10px] text-white font-bold italic line-clamp-2 text-center">"{post.caption}"</p>
                  </div>
                </div>
              ))}
              {userPosts.length === 0 && (
                <div className="col-span-full py-20 text-center flex flex-col items-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                  <Ghost size={40} className="text-slate-200 mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No stories shared yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAvatarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 p-8 text-white relative">
              <button onClick={() => setShowAvatarModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Avatar</h4>
            </div>
            <div className="p-8 space-y-6">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2">
                {uploading ? 'Uploading...' : <><Upload size={18} /> Choose File</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
