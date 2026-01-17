
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/dbService';
import { Post, Activity, UserProfile, ChatGroup, Comment } from '../types';
import { Heart, MessageSquare, Bookmark, MoreHorizontal, Sparkles, Send, PlusCircle, LayoutGrid, MapPin, X, Check, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { uploadPostImage } from '../services/storageService';

interface FeedProps {
  onWishlistUpdate: () => void;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?q=80&w=800&auto=format&fit=crop";

const Feed: React.FC<FeedProps> = ({ onWishlistUpdate }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribePosts = db.subscribeToPosts((fetchedPosts) => {
      setPosts(fetchedPosts);
      db.getActivities().then(fetchedActivities => {
        setActivities(fetchedActivities);
        setLoading(false);
      });
    });
    const unsubscribeGroups = db.subscribeToGroups(setGroups);
    
    return () => {
      unsubscribePosts();
      unsubscribeGroups();
    };
  }, []);

  const handleWishlist = async (activityId: string) => {
    await db.addToWishlist(activityId);
    onWishlistUpdate();
    alert('Pinned to Wishlist!');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Feed...</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter">COMMUNITY</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Live Firebase Feed</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
        >
          <PlusCircle size={16} /> New Post
        </button>
      </div>

      <div className="max-w-xl mx-auto space-y-10">
        {posts.map(post => {
          const activity = activities.find(a => a.id === post.activityId);
          if (!activity) return null;
          return (
            <CanvaPostCard 
              key={post.id}
              post={post} 
              activity={activity}
              groups={groups}
              onSave={() => handleWishlist(post.activityId)}
            />
          );
        })}
        {posts.length === 0 && (
          <div className="text-center py-24">
            <p className="text-slate-400 text-lg">No posts yet. Be the first to share!</p>
          </div>
        )}
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
      reader.onloadend = () => {
        setCustomImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if ((!selectedActivityId && !customImage) || !caption || !user) return;
    setIsPosting(true);
    
    try {
      let imageUrl = FALLBACK_IMAGE;
      
      if (customImage) {
        imageUrl = await uploadPostImage(customImage, user.id);
      } else if (selectedActivityId) {
        const activity = activities.find(a => a.id === selectedActivityId);
        imageUrl = activity?.imageUrl || FALLBACK_IMAGE;
      }
      
      await db.addPost({
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        activityId: selectedActivityId || '',
        imageUrl,
        caption,
        likes: 0,
        likedBy: [],
        comments: [],
        timestamp: new Date()
      });
      
      setIsPosting(false);
      setCustomImage(null);
      setCustomImagePreview(null);
      setSelectedActivityId('');
      setCaption('');
      onPostCreated();
    } catch (error) {
      console.error('Error posting:', error);
      alert('Failed to post. Please try again.');
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Share Your Story</p>
          <h4 className="text-3xl font-black italic tracking-tighter uppercase">NEW COMMUNITY POST</h4>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">1. Add your photo or select a spot</label>
            
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 transition-colors flex flex-col items-center gap-2"
              >
                <ImageIcon size={32} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Upload Your Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {customImagePreview && (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={customImagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => {
                      setCustomImage(null);
                      setCustomImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-2 hover:bg-rose-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-400 font-medium py-2">OR</div>

            <div className="grid grid-cols-2 gap-3">
              {wishlistItems.length > 0 ? wishlistItems.map(activity => (
                <button 
                  key={activity.id}
                  onClick={() => {
                    setSelectedActivityId(activity.id);
                    setCustomImage(null);
                    setCustomImagePreview(null);
                  }}
                  className={`relative rounded-3xl overflow-hidden aspect-video transition-all border-4 ${
                    selectedActivityId === activity.id ? 'border-indigo-600 scale-[0.98]' : 'border-transparent opacity-60 grayscale'
                  }`}
                >
                  <img src={activity.imageUrl} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2 text-center">
                    <p className="text-white text-[10px] font-black uppercase italic leading-tight">{activity.name}</p>
                  </div>
                  {selectedActivityId === activity.id && <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1"><Check size={12} /></div>}
                </button>
              )) : (
                <div className="col-span-2 py-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed">
                  <p className="text-slate-400 text-sm italic">Add items to your wishlist first to share them!</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">2. Tell the community about it</label>
            <textarea 
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="The vibe was immaculate! Definitely recommend for a Saturday afternoon..."
              className="w-full bg-slate-50 rounded-[2rem] p-6 text-slate-800 font-medium outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-none"
              rows={4}
            />
          </div>

          <button 
            onClick={handlePost}
            disabled={(!selectedActivityId && !customImage) || !caption || isPosting}
            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPosting ? 'Publishing...' : <><Sparkles size={20} /> Post to Community</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const CanvaPostCard: React.FC<{ 
  post: Post; 
  activity: Activity; 
  groups: ChatGroup[];
  onSave: () => void;
}> = ({ post, activity, groups, onSave }) => {
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
    const activityName = activity?.name || 'this activity';
    const isGlobal = !groupId;

    const pollData = isGlobal ? null : {
      question: `Who's down for ${activityName}?`,
      options: [
        { text: "YES", votes: [] },
        { text: "NO", votes: [] }
      ]
    };

    await db.addMessage({
      text: isGlobal 
        ? `Found this on the feed, looks amazing: ${activityName}` 
        : `Check this out on the feed! Shall we go to ${activityName}?`,
      activityId: activity.id,
      groupId: groupId || undefined,
      poll: pollData
    });
    
    setShowGroupDropdown(false);
    alert(`Shared with ${groupId ? groups.find(g => g.id === groupId)?.name || 'group' : 'all squads'}!`);
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 group relative overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={userAvatar || `https://i.pravatar.cc/100?u=${post.userId}`} 
            onError={() => setUserAvatar(`https://i.pravatar.cc/100?u=${post.userId}`)}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
            alt="" 
          />
          <div>
            <p className="font-black text-slate-900 text-sm">{post.userName}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest"><Sparkles size={8} className="inline mr-1" /> Munich</p>
          </div>
        </div>
        <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal size={20} /></button>
      </div>

      <div className="relative mx-4 rounded-[2rem] overflow-hidden aspect-square bg-slate-100 shadow-inner">
        <img 
          src={postImg} 
          onError={() => setPostImg(FALLBACK_IMAGE)}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          alt="" 
        />
        {activity && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-2xl flex items-center gap-2.5">
               <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><MapPin size={14} /></div>
               <div><p className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter">Spot</p><p className="text-[11px] font-bold truncate leading-tight">{activity.name}</p></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={`${isLiked ? 'text-rose-500 scale-110' : 'text-slate-900 hover:text-rose-500'} transition-all disabled:opacity-50`}
            >
              <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} className="transition-all" />
            </button>
            <span className="text-xs font-black text-slate-600 -ml-2">{likeCount}</span>
            <button 
              onClick={() => setShowComments(!showComments)}
              className="text-slate-900 hover:text-indigo-600 transition-colors"
            >
              <MessageSquare size={24} />
            </button>
            <span className="text-xs font-black text-slate-600 -ml-2">{comments.length}</span>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className="text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-0.5"
              >
                <Send size={24} />
                <ChevronDown size={14} className={showGroupDropdown ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              {showGroupDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[100] min-w-[200px] animate-in slide-in-from-top-2">
                  <button
                    onClick={() => handleShareToGroup(null)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                  >
                    All Squads
                  </button>
                  {groups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => handleShareToGroup(group.id)}
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
          <button onClick={onSave} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all">
            <Bookmark size={20} />
          </button>
        </div>
        
        <p className="text-xs italic text-slate-600 leading-relaxed mb-4 line-clamp-3">"{post.caption}"</p>

        {showComments && (
          <div className="border-t border-slate-100 pt-4 space-y-4 animate-in fade-in slide-in-from-top-1">
            <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2.5">
                  <img 
                    src={comment.userAvatar || `https://i.pravatar.cc/100?u=${comment.userId}`}
                    className="w-7 h-7 rounded-full object-cover shadow-sm"
                    alt=""
                  />
                  <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2">
                    <p className="text-[10px] font-black text-slate-900">{comment.userName}</p>
                    <p className="text-xs text-slate-600">{comment.text}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-black tracking-widest">No comments yet</p>
              )}
            </div>
            {user && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={isCommenting}
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || isCommenting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-100"
                >
                  {isCommenting ? '...' : 'Post'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
