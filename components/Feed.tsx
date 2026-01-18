
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/dbService';
import { Post, Activity, UserProfile, ChatGroup, Comment } from '../types';
import { Heart, MessageSquare, Bookmark, MoreHorizontal, Sparkles, Send, PlusCircle, LayoutGrid, MapPin, X, Check, Image as ImageIcon, ChevronDown, UserPlus, Users, ArrowRight } from 'lucide-react';
import { uploadPostImage } from '../services/storageService';

interface FeedProps {
  onWishlistUpdate: () => void;
  onNavigateToProfile: (userId: string) => void;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?q=80&w=800&auto=format&fit=crop";

const Feed: React.FC<FeedProps> = ({ onWishlistUpdate, onNavigateToProfile }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const currentUser = db.getUser();

  useEffect(() => {
    setLoading(true);
    const unsubscribePosts = db.subscribeToPosts((fetchedPosts) => {
      setPosts(fetchedPosts);
      db.getActivities().then(fetchedActivities => {
        setActivities(fetchedActivities);
        db.getRecommendedUsers().then(setSuggestedUsers);
        setLoading(false);
      });
    });
    const unsubscribeGroups = db.subscribeToGroups(setGroups);
    
    return () => {
      unsubscribePosts();
      unsubscribeGroups();
    };
  }, []);

  const handleFollowSuggestion = async (userId: string) => {
    await db.followUser(userId);
    setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleWishlist = async (activityId: string) => {
    await db.addToWishlist(activityId);
    onWishlistUpdate();
    alert('Pinned to Wishlist!');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Feed...</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-8 items-start">
        
        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:flex flex-col gap-6 sticky top-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-indigo-500 to-rose-400 cursor-pointer" onClick={() => onNavigateToProfile(currentUser?.id || '')}></div>
            <div className="px-6 pb-8 -mt-10 flex flex-col items-center text-center">
              <img 
                src={currentUser?.avatar || `https://i.pravatar.cc/150?u=${currentUser?.id}`}
                className="w-20 h-20 rounded-[1.8rem] border-4 border-white shadow-lg bg-white object-cover mb-3 cursor-pointer"
                alt=""
                onClick={() => onNavigateToProfile(currentUser?.id || '')}
              />
              <h3 className="text-lg font-black italic tracking-tighter text-slate-900 uppercase leading-tight cursor-pointer hover:text-indigo-600" onClick={() => onNavigateToProfile(currentUser?.id || '')}>{currentUser?.name}</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-6">Munich Explorer</p>
              
              <div className="grid grid-cols-2 gap-2 w-full pt-4 border-t border-slate-50">
                <div className="text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Following</p>
                  <p className="text-base font-black text-indigo-600">{currentUser?.following.length || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Followers</p>
                  <p className="text-base font-black text-indigo-600">{currentUser?.followers.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-lg shadow-slate-200/10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
              <Users size={12} className="text-indigo-500" /> Active Squads
            </h4>
            <div className="space-y-3">
              {groups.slice(0, 3).map(g => (
                <div key={g.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs uppercase border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {g.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-tighter truncate">{g.name}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{g.members.length} Members</p>
                  </div>
                </div>
              ))}
              {groups.length === 0 && <p className="text-[10px] font-medium text-slate-400 italic px-2">No squads joined.</p>}
            </div>
          </div>
        </aside>

        {/* MAIN FEED */}
        <main className="space-y-8 min-w-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">The Pulse</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Community Hub</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all active:scale-95"
            >
              <PlusCircle size={16} /> Share
            </button>
          </div>

          <div className="space-y-8">
            {posts.map(post => {
              const activity = activities.find(a => a.id === post.activityId);
              return (
                <CanvaPostCard 
                  key={post.id}
                  post={post} 
                  activity={activity}
                  groups={groups}
                  onSave={() => activity ? handleWishlist(activity.id) : null}
                  onNavigateToProfile={onNavigateToProfile}
                />
              );
            })}
          </div>
          
          {posts.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LayoutGrid size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No activity yet</p>
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR: Discover Real People */}
        <aside className="hidden lg:flex flex-col gap-6 sticky top-6">
          <div className="bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-xl shadow-slate-200/20">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Discover People</h4>
              <Sparkles size={14} className="text-amber-400" />
            </div>
            
            <div className="space-y-6">
              {suggestedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateToProfile(user.id)}>
                    <img 
                      src={user.avatar || `https://i.pravatar.cc/100?u=${user.id}`}
                      className="w-10 h-10 rounded-xl object-cover shadow-sm bg-slate-100 border border-slate-50"
                      alt=""
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-tighter truncate group-hover:text-indigo-600 transition-colors">{user.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Local</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleFollowSuggestion(user.id)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              ))}
              {suggestedUsers.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">You're already following every explorer!</p>
                </div>
              )}
            </div>

            <button className="w-full mt-8 py-3.5 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              View Everyone <ArrowRight size={12} />
            </button>
          </div>

          <div className="p-7 rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-2">Weekend Flow</p>
              <h4 className="text-lg font-black italic tracking-tighter uppercase mb-4 leading-tight">AI Heatmap</h4>
              <p className="text-xs font-medium opacity-90 leading-relaxed mb-6">Trending: <span className="underline italic">Isar BBQ</span> seems to be the move today.</p>
              <button className="w-full py-3 bg-white text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Join In</button>
            </div>
            <Sparkles className="absolute -bottom-6 -right-6 text-white/10 w-32 h-32 rotate-12" />
          </div>
        </aside>
      </div>

      {showCreateModal && (
        <CreatePostModal 
          onClose={() => setShowCreateModal(false)} 
          activities={activities}
          onPostCreated={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

// Simplified sub-components with navigation support
const CanvaPostCard: React.FC<{ 
  post: Post; 
  activity?: Activity; 
  groups: ChatGroup[];
  onSave: () => void;
  onNavigateToProfile: (userId: string) => void;
}> = ({ post, activity, groups, onSave, onNavigateToProfile }) => {
  const user = db.getUser();
  const [postImg, setPostImg] = useState(post.imageUrl);
  const [userAvatar, setUserAvatar] = useState(post.userAvatar);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const likedBy = post.likedBy || [];
  const comments = post.comments || [];
  const isLiked = user ? likedBy.includes(user.id) : false;
  const likeCount = post.likes || likedBy.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowGroupDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    await db.toggleLikePost(post.id);
    setIsLiking(false);
  };

  const handleComment = async () => {
    if (!user || !commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    await db.addComment(post.id, commentText);
    setCommentText('');
    setIsCommenting(false);
    setShowComments(true);
  };

  const handleShareToGroup = async (groupId: string | null) => {
    await db.addMessage({
      text: !groupId ? `Found this on the feed!` : `Check this out!`,
      activityId: activity?.id,
      groupId: groupId || undefined,
    });
    setShowGroupDropdown(false);
    alert(`Shared!`);
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 group relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigateToProfile(post.userId)}>
          <img 
            src={userAvatar || `https://i.pravatar.cc/100?u=${post.userId}`} 
            onError={() => setUserAvatar(`https://i.pravatar.cc/100?u=${post.userId}`)}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm bg-slate-100" 
            alt="" 
          />
          <div>
            <p className="font-black text-slate-900 text-base italic tracking-tight uppercase leading-none mb-1 hover:text-indigo-600 transition-colors">{post.userName}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-1.5"><MapPin size={10} className="text-indigo-400" /> Munich, DE</p>
          </div>
        </div>
        <button className="text-slate-300 hover:text-slate-600 transition-colors"><MoreHorizontal size={20} /></button>
      </div>

      <div className="relative mx-4 rounded-[2.5rem] overflow-hidden aspect-square bg-slate-100 shadow-inner group/img">
        <img 
          src={postImg} 
          onError={() => setPostImg(FALLBACK_IMAGE)}
          className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110" 
          alt="" 
        />
        {activity && (
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white animate-in slide-in-from-left-4 duration-700">
               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100"><MapPin size={20} /></div>
               <div className="min-w-0 flex-1">
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter mb-0.5">Recommended Spot</p>
                 <p className="text-sm font-black truncate leading-tight uppercase italic tracking-tighter text-slate-900">{activity.name}</p>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <button onClick={handleLike} className={`${isLiked ? 'text-rose-500 scale-110' : 'text-slate-900 hover:text-rose-500'} transition-all active:scale-125`}>
              <Heart size={28} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => setShowComments(!showComments)} className="text-slate-900 hover:text-indigo-600 active:scale-110">
              <MessageSquare size={28} />
            </button>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowGroupDropdown(!showGroupDropdown)} className="text-slate-900 hover:text-indigo-600 active:scale-110">
                <Send size={28} />
              </button>
              {showGroupDropdown && (
                <div className="absolute top-full left-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] min-w-[220px]">
                  <button onClick={() => handleShareToGroup(null)} className="w-full px-5 py-3.5 text-left hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-700">Global Channel</button>
                  {groups.map(group => <button key={group.id} onClick={() => handleShareToGroup(group.id)} className="w-full px-5 py-3.5 text-left hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-700 border-t border-slate-50">Squad: {group.name}</button>)}
                </div>
              )}
            </div>
          </div>
          <button onClick={onSave} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-2xl shadow-sm active:scale-95">
            <Bookmark size={24} />
          </button>
        </div>
        <p className="text-base font-medium text-slate-700 leading-relaxed mb-6 italic">"{post.caption}"</p>
      </div>
    </div>
  );
};

const CreatePostModal: React.FC<{ onClose: () => void, activities: Activity[], onPostCreated: () => void }> = ({ onClose, activities, onPostCreated }) => {
  const user = db.getUser();
  const wishlistItems = activities.filter(a => user?.wishlist.includes(a.id));
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setCustomImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if ((!selectedActivityId && !customImage) || !caption || !user) return;
    setIsPosting(true);
    try {
      let imageUrl = customImage ? await uploadPostImage(customImage, user.id) : (activities.find(a => a.id === selectedActivityId)?.imageUrl || FALLBACK_IMAGE);
      await db.addPost({ userId: user.id, userName: user.name, userAvatar: user.avatar, activityId: selectedActivityId || '', imageUrl, caption, likes: 0, likedBy: [], comments: [], timestamp: new Date() });
      onPostCreated();
    } catch (e) { alert('Failed to post.'); } finally { setIsPosting(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="bg-indigo-600 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
          <h4 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Share Munich Vibe</h4>
        </div>
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
           <div className="space-y-4">
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-6 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-indigo-400 flex flex-col items-center gap-2 bg-slate-50/50">
              <ImageIcon size={32} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Upload Photo</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {customImagePreview && <img src={customImagePreview} className="w-full h-48 object-cover rounded-[2rem]" />}
          </div>
          <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Tell the community about this vibe..." className="w-full bg-slate-50 rounded-[2rem] p-6 text-slate-800 font-medium outline-none text-sm" rows={4} />
          <button onClick={handlePost} disabled={isPosting} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98]">
            {isPosting ? 'Publishing...' : 'Post to Pulse'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Feed;
