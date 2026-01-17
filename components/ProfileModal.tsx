
import React, { useState } from 'react';
import { X, User, Tag, Sparkles, Check } from 'lucide-react';
import { db } from '../services/dbService';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdate: () => void;
}

const CATEGORIES = ['Sports', 'Food', 'Nature', 'Culture', 'Nightlife'];

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [preferences, setPreferences] = useState<string[]>(user.preferences);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleTogglePref = (pref: string) => {
    setPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await db.updateUserProfile({ name, preferences });
    onUpdate();
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">My Munich Account</p>
          <h4 className="text-3xl font-black italic tracking-tighter">EDIT PROFILE</h4>
        </div>

        <div className="p-8 space-y-8">
          {/* Avatar and Name */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <User size={32} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Display Name</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full text-xl font-bold border-b-2 border-slate-100 focus:border-indigo-600 outline-none pb-2 transition-colors" 
                  placeholder="Your Name"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-indigo-600" />
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Social Preferences</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const isSelected = preferences.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => handleTogglePref(cat)}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {cat} {isSelected && <Check size={12} className="inline ml-1" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 italic">Our AI uses these to rank the best spots in Munich for you.</p>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {saving ? 'Syncing...' : <><Sparkles size={18} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
