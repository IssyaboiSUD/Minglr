
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Activity } from '../types';
import { Trash2, Heart, MapPin, ExternalLink, Send, ArrowRight } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { parseLocation, calculateDistance, formatDistance } from '../services/locationService';

interface WishlistProps {
  onWishlistUpdate: () => void;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?q=80&w=800&auto=format&fit=crop";

const Wishlist: React.FC<WishlistProps> = ({ onWishlistUpdate }) => {
  const { userLocation } = useLocation();
  const [wishlistActivities, setWishlistActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      setLoading(true);
      const all = await db.getActivities();
      const user = db.getUser();
      if (user) {
        setWishlistActivities(all.filter(a => user.wishlist.includes(a.id)));
      } else {
        setWishlistActivities([]);
      }
      setLoading(false);
    }
    loadWishlist();
  }, []);

  const handleRemove = async (id: string) => {
    await db.removeFromWishlist(id);
    setWishlistActivities(prev => prev.filter(a => a.id !== id));
    onWishlistUpdate();
  };

  const handleShare = async (activity: Activity) => {
    await db.addMessage({
      text: `Thinking of checking this out: ${activity.name}`,
      activityId: activity.id
    });
    alert('Shared with the squad chat!');
  };

  const renderLocationText = (location: any) => {
    const activityCoords = parseLocation(location);
    
    // If we have both user location and activity coordinates, show distance
    if (userLocation && activityCoords) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        activityCoords.lat,
        activityCoords.lng
      );
      return `${formatDistance(distance)} away`;
    }
    
    // Fallback to showing location name or coordinates
    if (typeof location === 'string') return location;
    if (location && typeof location === 'object') {
      if (location.lat !== undefined && location.lng !== undefined) {
        return userLocation ? 'Location available' : `${location.lat}, ${location.lng}`;
      }
      if (location.latitude !== undefined && location.longitude !== undefined) {
        return userLocation ? 'Location available' : `${location.latitude}, ${location.longitude}`;
      }
    }
    return 'Munich, Germany';
  };

  if (loading) return null;

  return (
    <div className="p-6 pb-24 space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col gap-1">
        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Your Saved Gems</p>
        <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">THE WISHLIST</h2>
      </header>

      {wishlistActivities.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-500">
            <Heart size={48} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Your wishlist is empty</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Explore Munich and tap the heart icon to save spots you don't want to miss!</p>
          </div>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl">
            Start Exploring <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {wishlistActivities.map(activity => (
            <div key={activity.id} className="group bg-white rounded-[2.5rem] p-4 border border-slate-100 flex flex-col md:flex-row gap-6 hover:shadow-2xl hover:shadow-rose-500/5 transition-all duration-500">
              <div className="w-full md:w-64 h-48 rounded-[2rem] overflow-hidden bg-slate-100">
                <img 
                  src={activity?.imageUrl || FALLBACK_IMAGE} 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.error('Wishlist image failed to load:', activity?.imageUrl, 'Activity:', activity?.name);
                    if (target.src !== FALLBACK_IMAGE) {
                      target.src = FALLBACK_IMAGE;
                    }
                  }}
                  onLoad={() => console.log('Wishlist image loaded:', activity?.name)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  alt={activity?.name || 'Activity'} 
                />
              </div>
              
              <div className="flex-1 py-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">{activity.category}</span>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-black">★ {activity.rating}</div>
                  </div>
                  <h4 className="text-2xl font-black italic tracking-tighter text-slate-900 mb-1">{activity.name.toUpperCase()}</h4>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <MapPin size={12} className="text-rose-500" /> {renderLocationText(activity.location)}
                  </div>
                  <p className="text-slate-500 text-[10px] leading-relaxed line-clamp-1 font-medium mb-4 max-w-xl">{activity.description}</p>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button 
                    onClick={() => handleShare(activity)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    <Send size={14} /> Share with Squad
                  </button>
                  <button 
                    onClick={() => handleRemove(activity.id)}
                    className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
