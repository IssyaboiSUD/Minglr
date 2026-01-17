
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../services/dbService';
import { getPersonalizedRanking } from '../services/geminiService';
import { Activity, ChatGroup } from '../types';
import { 
  Star, 
  MapPin, 
  Heart, 
  Sparkles, 
  Send, 
  Filter, 
  Palette, 
  Trees, 
  Utensils, 
  Music, 
  Dumbbell,
  Beer,
  Martini,
  X,
  Map as MapIcon,
  LayoutGrid,
  Navigation,
  ArrowRight,
  Info
} from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { parseLocation, calculateDistance, formatDistance } from '../services/locationService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface ExploreProps {
  onWishlistUpdate: () => void;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?q=80&w=800&auto=format&fit=crop";
const CATEGORIES = ['Food', 'Sports', 'Nightlife', 'Culture', 'Nature', 'Drinking'];

// Sanitizer for description text
const sanitizeDescription = (text: string) => {
  if (!text) return "";
  return text
    .replace(/\\n/g, ' ') // Remove literal \n
    .replace(/\\"/g, '"') // Unescape quotes
    .replace(/\*/g, '')   // Remove markdown asterisks
    .replace(/#/g, '')    // Remove hashes
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

const getCategoryIcon = (category: string, size: number = 16, active: boolean = true) => {
  const lowerCat = category.toLowerCase();
  const opacity = active ? 1 : 0.6;
  
  if (lowerCat.includes('food') || lowerCat.includes('dining')) {
    return <Utensils size={size} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" style={{ opacity }} />;
  }
  if (lowerCat.includes('sport')) {
    return <Dumbbell size={size} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" style={{ opacity }} />;
  }
  if (lowerCat.includes('nightlife')) {
    return <Music size={size} className="text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]" style={{ opacity }} />;
  }
  if (lowerCat.includes('drinking') || lowerCat === 'drinking') {
    return <Beer size={size} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" style={{ opacity }} />;
  }
  if (lowerCat.includes('cocktail')) {
    return <Martini size={size} className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]" style={{ opacity }} />;
  }
  if (lowerCat.includes('culture') || lowerCat.includes('art')) {
    return <Palette size={size} className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" style={{ opacity }} />;
  }
  if (lowerCat.includes('nature') || lowerCat.includes('outdoor')) {
    return <Trees size={size} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" style={{ opacity }} />;
  }
  return <Sparkles size={size} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" style={{ opacity }} />;
};

// Create a custom neon teardrop marker icon for Leaflet
const createNeonIcon = (category: string) => {
  const lowerCat = category.toLowerCase();
  let color = '#6366f1'; // Default indigo
  let iconPath = '<circle cx="12" cy="12" r="3"></circle>'; // Default icon

  if (lowerCat.includes('food')) {
    color = '#fbbf24';
    iconPath = '<path d="M3 2v7c0 1.1.9 2 2 2h4V2M7 2v4M5 2v4M15 2v20M15 7c0-2.5 4-2.5 4 0v15"/>';
  } else if (lowerCat.includes('sport')) {
    color = '#22d3ee';
    iconPath = '<path d="M6 18h12M12 2v4M6 8l12 0M12 18v4M6 16l12 0"/>';
  } else if (lowerCat.includes('nightlife')) {
    color = '#a78bfa';
    iconPath = '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>';
  } else if (lowerCat.includes('drinking')) {
    color = '#f59e0b';
    iconPath = '<path d="M17 11h1a3 3 0 0 1 0 6h-1M6 3h11v18H6zM6 8h11"/>';
  } else if (lowerCat.includes('nature')) {
    color = '#34d399';
    iconPath = '<path d="M12 2l4 10H8l4-10zm0 6l4 10H8l4-10zm0 6l4 10H8l4-10zM12 22v-2"/>';
  } else if (lowerCat.includes('culture')) {
    color = '#818cf8';
    iconPath = '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.6 1.5-1.5 0-.4-.1-.8-.4-1.1-.3-.3-.5-.8-.5-1.3 0-1 1-1.5 2.5-1.5H19c1.7 0 3-1.3 3-3 0-5.3-4.5-9.7-10-9.7z"/>';
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        position: relative;
        width: 42px;
        height: 42px;
        filter: drop-shadow(0 0 12px ${color}99);
      ">
        <div style="
          width: 100%;
          height: 100%;
          background: ${color};
          border: 2.5px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
        "></div>
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          padding-bottom: 2px;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${iconPath}
          </svg>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
  });
};

const ActivityDetailModal: React.FC<{ 
  activity: Activity | null; 
  onClose: () => void; 
  onWishlist: (id: string) => void;
}> = ({ activity, onClose, onWishlist }) => {
  const { userLocation } = useLocation();
  if (!activity) return null;

  const currentUser = db.getUser();
  const isWishlisted = currentUser ? currentUser.wishlist.includes(activity.id) : false;
  const coords = parseLocation(activity.location);
  const mapsUrl = coords ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}` : '#';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
        {/* Image Section - Top Stacked */}
        <div className="w-full aspect-[16/10] relative bg-slate-100 overflow-hidden shrink-0">
          <img 
            src={activity.imageUrl || FALLBACK_IMAGE} 
            className="w-full h-full object-cover" 
            alt={activity.name} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          
          <div className="absolute top-6 left-6">
            <div className="bg-slate-900/40 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl">
              {getCategoryIcon(activity.category, 24)}
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full transition-all border border-white/20"
          >
            <X size={20} />
          </button>

          <div className="absolute bottom-6 left-8 right-8 text-white">
            <div className="flex items-center gap-1.5 mb-1 opacity-90">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < Math.floor(activity.rating) ? "currentColor" : "none"} stroke="currentColor" />)}
              </div>
              <span className="text-[9px] font-black tracking-widest uppercase">{activity.rating} Spot Score</span>
            </div>
            <h3 className="text-3xl font-black italic tracking-tighter leading-none">{activity.name.toUpperCase()}</h3>
          </div>
        </div>

        {/* Content Section - Bottom Scrollable */}
        <div className="flex-1 p-8 md:p-10 overflow-y-auto bg-white custom-scrollbar">
          <div className="space-y-8">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-50 pb-6">
              <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-black uppercase tracking-widest">
                <MapPin size={14} /> Munich, Germany
              </div>
              <div className="px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {activity.category}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">The Vibe</h4>
              <p className="text-slate-600 leading-relaxed font-medium text-base">
                {sanitizeDescription(activity.description)}
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <a 
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all group"
              >
                <Navigation size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Get Directions
              </a>
              <button 
                onClick={() => onWishlist(activity.id)}
                className={`flex items-center justify-center gap-3 py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] transition-all border-2 ${
                  isWishlisted 
                    ? 'bg-rose-50 border-rose-100 text-rose-500' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-500'
                }`}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} /> {isWishlisted ? 'Saved' : 'Wishlist'}
              </button>
            </div>
          </div>
          
          {/* Footer stats */}
          <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
             <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/100?u=a${i+5}`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="" />
                ))}
                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">+12</div>
             </div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">15 people checking this out</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MapView: React.FC<{ 
  activities: Activity[]; 
  onWishlist: (id: string) => void;
  onSelect: (activity: Activity) => void;
}> = ({ activities, onWishlist, onSelect }) => {
  const { userLocation } = useLocation();
  const munichCenter: [number, number] = [48.1351, 11.5820];

  const activitiesWithCoords = useMemo(() => {
    return activities.map(a => ({
      ...a,
      coords: parseLocation(a.location)
    })).filter(a => a.coords) as (Activity & { coords: { lat: number; lng: number } })[];
  }, [activities]);

  return (
    <div className="h-[65vh] w-full relative rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl">
      <MapContainer center={munichCenter} zoom={13} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {activitiesWithCoords.map(activity => (
          <Marker 
            key={activity.id} 
            position={[activity.coords.lat, activity.coords.lng]}
            icon={createNeonIcon(activity.category)}
          >
            <Popup className="custom-popup">
              <div className="w-48 p-1">
                <img src={activity.imageUrl || FALLBACK_IMAGE} className="w-full h-24 object-cover rounded-xl mb-2" alt={activity.name} />
                <h4 className="font-black text-xs uppercase tracking-tighter mb-1">{activity.name}</h4>
                <div className="flex items-center gap-1 mb-2">
                  <Star size={10} className="text-amber-400" fill="currentColor" />
                  <span className="text-[10px] font-bold text-slate-500">{activity.rating}</span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => onSelect(activity)}
                    className="flex-1 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                  >
                    Details
                  </button>
                  <button 
                    onClick={() => onWishlist(activity.id)}
                    className="p-2 bg-indigo-600 text-white rounded-lg active:scale-95 transition-transform"
                  >
                    <Heart size={10} fill="currentColor" />
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

const Explore: React.FC<ExploreProps> = ({ onWishlistUpdate }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const allActivities = await db.getActivities();
        const activitiesWithImages = allActivities.map(activity => ({
          ...activity,
          imageUrl: activity.imageUrl || FALLBACK_IMAGE
        }));
        setActivities(activitiesWithImages);
        
        const currentUser = db.getUser();
        if (currentUser) {
          const rankedIds = await getPersonalizedRanking(currentUser, activitiesWithImages);
          setRecommendedIds(rankedIds);
        } else {
          setRecommendedIds([]);
        }
      } catch (err) {
        console.error("Explore load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const unsubscribeGroups = db.subscribeToGroups(setGroups);
    return () => unsubscribeGroups();
  }, []);

  const handleWishlist = async (id: string) => {
    await db.addToWishlist(id);
    onWishlistUpdate();
  };

  const handleShareToGroup = async (activityId: string, groupId: string | null) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      const isGlobal = !groupId;
      
      const pollData = isGlobal ? null : {
        question: `Who's down for ${activity.name}?`,
        options: [
          { text: "YES", votes: [] },
          { text: "NO", votes: [] }
        ]
      };

      await db.addMessage({
        text: isGlobal 
          ? `Hey guys, I found this on Minglr! Thoughts?` 
          : `Suggesting a squad trip to ${activity.name}! Who's in?`,
        activityId: activity.id,
        groupId: groupId || undefined,
        poll: pollData
      });

      const groupName = groupId ? groups.find(g => g.id === groupId)?.name || 'group' : 'all squads';
      alert(`Shared with ${groupName}!`);
    }
  };

  const filteredActivities = selectedCategory 
    ? activities.filter(a => {
        const categoryValue = (a as any).type || a.category;
        if (!categoryValue) return false;
        const catLower = categoryValue.toLowerCase().trim();
        const selectedLower = selectedCategory.toLowerCase().trim();
        
        if (selectedLower === 'drinking') {
          return catLower.includes('drinking') || catLower.includes('beer') || catLower.includes('cocktail');
        }
        if (selectedLower === 'sports') {
          return catLower.includes('sport');
        }
        return catLower === selectedLower || catLower.includes(selectedLower);
      })
    : activities;

  const recommended = filteredActivities.filter(a => recommendedIds.includes(a.id));
  const others = filteredActivities.filter(a => !recommendedIds.includes(a.id));

  return (
    <div className="p-6 pb-24 space-y-6 animate-in fade-in duration-700">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Explore Munich</p>
          <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">WHAT'S NEXT?</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
            className={`p-3 rounded-2xl transition-all shadow-sm border ${
              viewMode === 'map' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900'
            }`}
          >
            {viewMode === 'grid' ? <MapIcon size={20} /> : <LayoutGrid size={20} />}
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-2xl transition-all shadow-sm border ${
              showFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900'
            }`}
          >
            {showFilters ? <X size={20} /> : <Filter size={20} />}
          </button>
        </div>
      </header>

      {showFilters && (
        <div className="flex gap-4 flex-wrap pb-4 pt-2 overflow-x-hidden animate-in slide-in-from-top-4 duration-300">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
              selectedCategory === null 
                ? 'bg-slate-900 text-white shadow-xl' 
                : 'bg-white text-slate-400 border border-slate-100'
            }`}
          >
            All Spots
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl transition-all border ${
                selectedCategory === cat 
                  ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-500/10' 
                  : 'bg-white border-slate-100'
              }`}
            >
              {getCategoryIcon(cat, 18, selectedCategory === cat)}
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                selectedCategory === cat ? 'text-indigo-600' : 'text-slate-400'
              }`}>
                {cat}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Ranking Best Spots...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredActivities.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Filter size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900">No matching spots</h3>
              <p className="text-slate-400 text-sm">Try a different category or view all spots.</p>
            </div>
          ) : viewMode === 'map' ? (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <MapView 
                activities={filteredActivities} 
                onWishlist={handleWishlist} 
                onSelect={setSelectedActivity} 
              />
            </div>
          ) : (
            <>
              {recommended.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                      <Sparkles size={16} fill="currentColor" />
                    </div>
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs italic">Personalized for you</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {recommended.map(activity => (
                      <ActivityCard 
                        key={activity.id} 
                        activity={activity} 
                        groups={groups}
                        onWishlist={() => handleWishlist(activity.id)}
                        onShare={(groupId) => handleShareToGroup(activity.id, groupId)}
                        onClick={() => setSelectedActivity(activity)}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-6">
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                  {selectedCategory ? `${selectedCategory} in Munich` : 'All Local Activities'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {others.map(activity => (
                    <ActivityCard 
                      key={activity.id} 
                      activity={activity} 
                      groups={groups}
                      onWishlist={() => handleWishlist(activity.id)}
                      onShare={(groupId) => handleShareToGroup(activity.id, groupId)}
                      onClick={() => setSelectedActivity(activity)}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {selectedActivity && (
        <ActivityDetailModal 
          activity={selectedActivity} 
          onClose={() => setSelectedActivity(null)} 
          onWishlist={handleWishlist}
        />
      )}
    </div>
  );
};

const ActivityCard: React.FC<{ 
  activity: Activity; 
  groups: ChatGroup[];
  onWishlist: () => void; 
  onShare: (groupId: string | null) => void;
  onClick: () => void;
}> = ({ activity, groups, onWishlist, onShare, onClick }) => {
  const { userLocation } = useLocation();
  const currentUser = db.getUser();
  const isWishlisted = currentUser ? currentUser.wishlist.includes(activity.id) : false;
  const initialImageUrl = activity?.imageUrl || FALLBACK_IMAGE;
  const [imgSrc, setImgSrc] = useState(initialImageUrl);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setImgSrc(activity?.imageUrl || FALLBACK_IMAGE);
  }, [activity]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowGroupDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderLocationText = (location: any) => {
    const activityCoords = parseLocation(location);
    if (userLocation && activityCoords) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        activityCoords.lat,
        activityCoords.lng
      );
      return `${formatDistance(distance)} away`;
    }
    if (typeof location === 'string') return location;
    return 'Munich, Germany';
  };

  const category = (activity as any).type || activity.category;

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col h-full cursor-pointer relative"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <img 
          src={imgSrc} 
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          alt={activity.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent opacity-80"></div>
        
        {category && (
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-slate-900/40 backdrop-blur-md p-2.5 rounded-xl border border-white/10 flex items-center justify-center shadow-lg">
              {getCategoryIcon(category, 20)}
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); onWishlist(); }}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all backdrop-blur-xl border border-white/20 ${
              isWishlisted ? 'bg-rose-50 text-white border-rose-400 shadow-lg' : 'bg-white/20 text-white hover:bg-white hover:text-slate-900'
            }`}
          >
            <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowGroupDropdown(!showGroupDropdown);
              }}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-xl border border-white/20 rounded-xl text-white hover:bg-white hover:text-slate-900 transition-all"
            >
              <Send size={16} />
            </button>
            {showGroupDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20 min-w-[200px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(null);
                    setShowGroupDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  All Squads
                </button>
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(group.id);
                      setShowGroupDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 border-t border-slate-100"
                  >
                    {group.name}
                  </button>
                ))}
                {groups.length === 0 && (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center border-t border-slate-100">
                    No groups yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-5 right-5 text-white">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} size={8} fill={i < Math.floor(activity.rating) ? "currentColor" : "none"} stroke="currentColor" />)}
            </div>
            <span className="text-[8px] font-black tracking-widest uppercase opacity-80">{activity.rating} Rating</span>
          </div>
          <h4 className="text-lg font-black italic tracking-tight drop-shadow-md leading-tight">{activity.name.toUpperCase()}</h4>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between">
        <p className="text-slate-500 text-[10px] leading-relaxed line-clamp-1 font-medium mb-3">
          {sanitizeDescription(activity.description)}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <MapPin size={12} className="text-indigo-400" />
            {renderLocationText(activity.location)}
          </div>
          <div className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1">
            <Info size={10} className="text-indigo-300" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">View Info</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
