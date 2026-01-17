
import React, { useState, useRef, useEffect } from 'react';
import { User, Tag, Sparkles, Check, Heart, Users, MapPin, LogOut, Camera, Upload, X } from 'lucide-react';
import { db } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import { uploadProfilePicture, validateImageFile } from '../services/storageService';

interface ProfileProps {
  user: UserProfile;
  onUpdate: () => void;
}

const CATEGORIES = ['Sports', 'Food', 'Nature', 'Culture', 'Nightlife'];

const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const { signOut } = useAuth();
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [preferences, setPreferences] = useState<string[]>(user.preferences);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when user prop changes
  useEffect(() => {
    setName(user.name);
    setAvatar(user.avatar);
    setAvatarUrl(user.avatar);
    setPreferences(user.preferences);
  }, [user]);

  const handleTogglePref = (pref: string) => {
    setPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      setUploading(true);
      
      const downloadURL = await uploadProfilePicture(file, user.id);
      setAvatar(downloadURL);
      setAvatarUrl(downloadURL);
      setShowAvatarModal(false);
      
      await db.updateUserProfile({ avatar: downloadURL });
      onUpdate();
      
      alert("Profile picture updated successfully!");
    } catch (error: any) {
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarUrlChange = (url: string) => {
    setAvatarUrl(url);
  };

  const handleSaveAvatarUrl = async () => {
    if (!avatarUrl.trim()) {
      alert('Please enter a valid image URL');
      return;
    }
    
    try {
      setUploading(true);
      await db.updateUserProfile({ avatar: avatarUrl });
      setAvatar(avatarUrl);
      setShowAvatarModal(false);
      onUpdate();
      alert("Profile picture updated successfully!");
    } catch (error: any) {
      alert(error.message || 'Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.updateUserProfile({ name, avatar, preferences });
      onUpdate();
      alert("Profile saved successfully!");
    } catch (error: any) {
      alert(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 pb-24 space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Your Identity</p>
        <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">My Profile</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center text-center">
            <div className="relative mb-6 group">
              <img 
                src={avatar || `https://i.pravatar.cc/150?u=${user.id}`} 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://i.pravatar.cc/150?u=${user.id}`;
                }}
                className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-xl bg-slate-100" 
                alt={user.name} 
              />
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute inset-0 bg-black/50 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera size={24} className="text-white" />
              </button>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                 <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <h3 className="text-2xl font-black italic tracking-tighter text-slate-900">{name}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Munich Explorer since 2024</p>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-50 p-4 rounded-3xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saved</p>
                <p className="text-xl font-black text-slate-900">{user.wishlist.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Squad</p>
                <p className="text-xl font-black text-slate-900">{user.friends.length}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={async () => {
              try {
                await signOut();
              } catch (error) {
                console.error('Error signing out:', error);
              }
            }}
            className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <User size={20} className="text-indigo-600" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Basic Info</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Display Name</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Your Name"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Tag size={20} className="text-indigo-600" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Munich Interests</h4>
            </div>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map(cat => {
                const isSelected = preferences.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => handleTogglePref(cat)}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {cat} {isSelected && <Check size={12} className="inline ml-1" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 italic">This helps our AI tailor the Explore feed to your vibe.</p>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving || uploading}
            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Syncing with Server...' : <><Sparkles size={20} /> Update My Profile</>}
          </button>
        </div>
      </div>

      {/* Avatar Change Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 p-8 text-white relative">
              <button 
                onClick={() => setShowAvatarModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"
              >
                <X size={24} />
              </button>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Change Profile Picture</p>
              <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Update Avatar</h4>
            </div>
            <div className="p-8 space-y-6">
              {/* Upload File Option */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Upload size={12} /> Upload Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : <><Upload size={18} /> Choose File</>}
                </button>
                <p className="text-xs text-slate-400 text-center">Max 5MB • JPEG, PNG, GIF, WebP</p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs text-slate-400 font-bold uppercase">OR</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {/* URL Input Option */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Image URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => handleAvatarUrlChange(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={handleSaveAvatarUrl}
                  disabled={uploading || !avatarUrl.trim()}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Updating...' : 'Use This URL'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
