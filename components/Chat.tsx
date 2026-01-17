
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/dbService';
import { Message, Activity, UserProfile, ChatGroup } from '../types';
import { Send, Plus, BarChart2, Calendar, MapPin, Smile, MoreHorizontal, X, Users, Check, Sparkles, Hash, ChevronRight, MessageCircle, Star, Navigation, Heart } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { parseLocation } from '../services/locationService';

// Reusing the detail modal logic from Explore for consistency
const sanitizeDescription = (text: string) => {
  if (!text) return "";
  return text
    .replace(/\\n/g, ' ') 
    .replace(/\\"/g, '"') 
    .replace(/\*/g, '')   
    .replace(/#/g, '')    
    .replace(/\s+/g, ' ') 
    .trim();
};

const getCategoryIcon = (category: string, size: number = 16) => {
  return <Sparkles size={size} className="text-white" />;
};

const ActivityDetailModal: React.FC<{ 
  activity: Activity | null; 
  onClose: () => void; 
}> = ({ activity, onClose }) => {
  const { userLocation } = useLocation();
  if (!activity) return null;

  const currentUser = db.getUser();
  const isWishlisted = currentUser ? currentUser.wishlist.includes(activity.id) : false;
  const coords = parseLocation(activity.location);
  const mapsUrl = coords ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}` : '#';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
        <div className="w-full aspect-[16/10] relative bg-slate-100 overflow-hidden shrink-0">
          <img src={activity.imageUrl} className="w-full h-full object-cover" alt={activity.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full transition-all border border-white/20">
            <X size={20} />
          </button>
          <div className="absolute bottom-6 left-8 right-8 text-white">
            <h3 className="text-3xl font-black italic tracking-tighter leading-none">{activity.name.toUpperCase()}</h3>
          </div>
        </div>
        <div className="flex-1 p-8 md:p-10 overflow-y-auto bg-white">
          <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">The Vibe</h4>
              <p className="text-slate-600 leading-relaxed font-medium text-base">
                {sanitizeDescription(activity.description)}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-700 transition-all">
                <Navigation size={18} /> Get Directions
              </a>
              <button onClick={onClose} className="flex items-center justify-center gap-3 py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] bg-slate-100 text-slate-400">
                Close View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [inputText, setInputText] = useState('');
  const [showPollModal, setShowPollModal] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedActivityForModal, setSelectedActivityForModal] = useState<Activity | null>(null);
  
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.getActivities().then(setActivities);
    db.getFriendsList().then(setFriends);
    const unsubGroups = db.subscribeToGroups(setGroups);
    return () => unsubGroups();
  }, []);

  useEffect(() => {
    const targetId = selectedGroup?.id || 'global';
    const unsubMsgs = db.subscribeToMessages((msgs) => setMessages(msgs), targetId);
    return () => unsubMsgs();
  }, [selectedGroup]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (textOverride?: string, activityId?: string, pollData?: any) => {
    const text = textOverride || inputText;
    if (!text.trim() && !activityId && !pollData) return;
    await db.addMessage({ 
      text, 
      activityId, 
      groupId: selectedGroup?.id || 'global',
      poll: pollData
    });
    setInputText('');
  };

  const handleCreatePoll = async () => {
    if (!pollQuestion.trim()) return;
    const validOptions = pollOptions.filter(o => o.trim() !== '');
    if (validOptions.length < 2) return;
    const pollData = {
      question: pollQuestion,
      options: validOptions.map(opt => ({ text: opt, votes: [] }))
    };
    await handleSendMessage(`📊 Poll: ${pollQuestion}`, undefined, pollData);
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollModal(false);
  };

  const handleVote = async (messageId: string, optionIndex: number) => {
    await db.voteOnPoll(messageId, optionIndex);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriends.length === 0) return;
    await db.createGroup(groupName, selectedFriends);
    setShowCreateGroup(false);
    setGroupName('');
    setSelectedFriends([]);
  };

  return (
    <div className="flex h-full bg-[#F8FAFC]">
      {/* Sidebar */}
      <div className="w-20 md:w-72 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h3 className="hidden md:block font-black italic tracking-tighter text-slate-900 text-xl uppercase">MY SQUADS</h3>
          <div className="md:hidden flex justify-center"><Users className="text-slate-400" /></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <button onClick={() => setSelectedGroup(null)} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${selectedGroup === null ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedGroup === null ? 'bg-white/20' : 'bg-slate-100'}`}><Hash size={20} /></div>
            <div className="hidden md:block text-left"><p className="font-bold text-sm">Munich Global</p></div>
          </button>
          {groups.map(group => (
            <button key={group.id} onClick={() => setSelectedGroup(group)} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${selectedGroup?.id === group.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedGroup?.id === group.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>{group.name[0].toUpperCase()}</div>
              <div className="hidden md:block text-left truncate"><p className="font-bold text-sm truncate">{group.name}</p></div>
            </button>
          ))}
        </div>
        <div className="p-4"><button onClick={() => setShowCreateGroup(true)} className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl"><Plus size={20} /><span className="hidden md:block text-[10px] font-black uppercase tracking-widest">New Squad</span></button></div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">{selectedGroup ? <Users size={20} /> : <Hash size={20} />}</div>
            <div><h3 className="font-bold text-slate-900">{selectedGroup ? selectedGroup.name : 'Munich Social Squad'}</h3></div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40"><div className="p-6 bg-slate-100 rounded-full mb-4"><MessageCircle size={40} className="text-slate-400" /></div><p className="font-bold text-slate-500">No messages yet.</p></div>
          ) : (
            messages.map((msg) => {
              const currentUser = db.getUser();
              const isMe = currentUser ? msg.userId === currentUser.id : false;
              const activity = msg.activityId ? activities.find(a => a.id === msg.activityId) : null;
              const totalVotes = msg.poll?.options.reduce((acc, opt) => acc + opt.votes.length, 0) || 0;

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[85%] ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                    {!isMe && <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{msg.userName}</span>}
                    
                    {/* Activity Card - Always First if exists */}
                    {activity && (
                      <div 
                        onClick={() => setSelectedActivityForModal(activity)}
                        className="mb-2 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl hover:shadow-indigo-500/10 cursor-pointer transition-all active:scale-[0.98] max-w-[280px]"
                      >
                        <div className="relative h-32">
                          <img src={activity.imageUrl} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <h4 className="font-black text-white text-sm italic tracking-tight uppercase leading-tight">{activity.name}</h4>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text Message */}
                    {msg.text && (
                      <div className={`relative px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                    )}
                    
                    {/* Poll - Always underneath activity/text */}
                    {msg.poll && (
                      <div className="mt-2 bg-white rounded-3xl border border-slate-100 p-4 shadow-lg min-w-[240px] space-y-3">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <BarChart2 size={14} className="text-indigo-600" /> {msg.poll.question}
                        </h4>
                        <div className="space-y-2">
                          {msg.poll.options.map((opt, idx) => {
                            const hasVoted = currentUser ? opt.votes.includes(currentUser.id) : false;
                            const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                            return (
                              <button key={idx} onClick={() => handleVote(msg.id, idx)} className={`w-full relative h-10 rounded-xl overflow-hidden border transition-all ${hasVoted ? 'border-indigo-600 ring-2 ring-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}>
                                <div className="absolute inset-y-0 left-0 bg-indigo-50 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                <div className="absolute inset-0 px-3 flex items-center justify-between">
                                  <span className={`text-[10px] font-bold ${hasVoted ? 'text-indigo-600' : 'text-slate-600'}`}>{opt.text}</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase">{percentage}%</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <span className="text-[9px] text-slate-300 block">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-white border-t">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <button onClick={() => setShowPollModal(true)} className="w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors"><BarChart2 size={20} /></button>
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Message squad..." className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
            <button onClick={() => handleSendMessage()} className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all"><Send size={20} /></button>
          </div>
        </div>
      </div>

      {/* Modal for Shared Activities */}
      {selectedActivityForModal && (
        <ActivityDetailModal activity={selectedActivityForModal} onClose={() => setSelectedActivityForModal(null)} />
      )}

      {/* Poll Creation Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 p-8 text-white relative">
              <button onClick={() => setShowPollModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              <h4 className="text-2xl font-black italic tracking-tighter uppercase">CREATE POLL</h4>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">The Question</label>
                <input 
                  value={pollQuestion} 
                  onChange={e => setPollQuestion(e.target.value)} 
                  placeholder="Ask your squad something..." 
                  className="w-full bg-slate-50 rounded-xl px-5 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-100 border border-slate-100" 
                />
              </div>
              <div className="space-y-3">
                {pollOptions.map((opt, i) => (
                  <input key={i} value={opt} onChange={e => {
                    const newOpts = [...pollOptions];
                    newOpts[i] = e.target.value;
                    setPollOptions(newOpts);
                  }} placeholder={`Option ${i+1}`} className="w-full bg-slate-50 rounded-xl px-4 py-3 outline-none text-slate-900 font-medium border border-slate-100 focus:ring-2 focus:ring-indigo-100" />
                ))}
                <button onClick={() => setPollOptions([...pollOptions, ''])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-black uppercase tracking-widest hover:border-indigo-400 transition-all">Add Option</button>
              </div>
              <button onClick={handleCreatePoll} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Post Poll</button>
            </div>
          </div>
        </div>
      )}

      {/* Group Creation Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 p-8 text-white relative">
              <button onClick={() => setShowCreateGroup(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              <h4 className="text-2xl font-black italic tracking-tighter uppercase">NEW SQUAD</h4>
            </div>
            <div className="p-8 space-y-6">
              <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Squad Name..." className="w-full bg-slate-50 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-100 font-bold border border-slate-100" />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add Friends</label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {friends.map(friend => (
                    <button key={friend.id} onClick={() => setSelectedFriends(prev => prev.includes(friend.id) ? prev.filter(f => f !== friend.id) : [...prev, friend.id])} className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${selectedFriends.includes(friend.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent'} border`}>
                      <div className="flex items-center gap-3"><img src={friend.avatar} className="w-8 h-8 rounded-full" alt="" /><span className="text-sm font-bold">{friend.name}</span></div>
                      {selectedFriends.includes(friend.id) && <Check size={16} className="text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleCreateGroup} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl">Assemble Squad</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
