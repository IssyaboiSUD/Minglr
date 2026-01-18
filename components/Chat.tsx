
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/dbService';
import { Message, Activity, UserProfile, ChatGroup } from '../types';
import { 
  Send, 
  Plus, 
  BarChart2, 
  X, 
  Users, 
  Check, 
  Hash, 
  ChevronLeft, 
  MessageCircle, 
  Navigation, 
  MoreVertical,
  LogOut
} from 'lucide-react';
import { parseLocation } from '../services/locationService';

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

const ActivityDetailModal: React.FC<{ 
  activity: Activity | null; 
  onClose: () => void; 
}> = ({ activity, onClose }) => {
  if (!activity) return null;

  const coords = parseLocation(activity.location);
  const mapsUrl = coords ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}` : '#';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="w-full aspect-[16/10] relative bg-slate-100 overflow-hidden shrink-0">
          <img src={activity.imageUrl} className="w-full h-full object-cover" alt={activity.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full transition-all border border-white/20">
            <X size={20} />
          </button>
          <div className="absolute bottom-6 left-8 right-8 text-white">
            <h3 className="text-2xl font-black italic tracking-tighter leading-none uppercase">{activity.name}</h3>
          </div>
        </div>
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white custom-scrollbar">
          <div className="space-y-6">
            <p className="text-slate-600 leading-relaxed font-medium">
              {sanitizeDescription(activity.description)}
            </p>
            <div className="grid grid-cols-1 gap-3">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-700 transition-all">
                <Navigation size={18} /> Get Directions
              </a>
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
  const [showMenu, setShowMenu] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [selectedFollowing, setSelectedFollowing] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedActivityForModal, setSelectedActivityForModal] = useState<Activity | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentUser = db.getUser();

  useEffect(() => {
    db.getActivities().then(setActivities);
    db.getFollowingList().then(setFollowing);
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
  }, [messages, mobileView]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectGroup = (group: ChatGroup | null) => {
    setSelectedGroup(group);
    setMobileView('chat');
    setShowMenu(false);
  };

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

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    if (confirm(`Are you sure you want to leave ${selectedGroup.name}?`)) {
      try {
        await db.leaveGroup(selectedGroup.id);
        setSelectedGroup(null);
        setMobileView('list');
      } catch (e) {
        alert("Could not leave group. Try again.");
      }
    }
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
    if (!groupName.trim() || selectedFollowing.length === 0) return;
    await db.createGroup(groupName, selectedFollowing);
    setShowCreateGroup(false);
    setGroupName('');
    setSelectedFollowing([]);
  };

  return (
    <div className="flex h-full bg-white md:bg-[#F8FAFC] overflow-hidden relative">
      {/* SIDEBAR */}
      <div className={`
        flex-col border-r bg-white w-full md:w-80 lg:w-96
        ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <h3 className="font-black italic tracking-tighter text-slate-900 text-2xl uppercase leading-none">Chats</h3>
          <button 
            onClick={() => setShowCreateGroup(true)}
            className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => selectGroup(null)} 
            className={`w-full flex items-center gap-4 p-5 transition-all border-b border-slate-50 hover:bg-slate-50 ${selectedGroup === null ? 'bg-indigo-50/50' : ''}`}
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Hash size={24} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex justify-between items-baseline mb-1">
                <p className="font-black text-slate-900 text-sm">Munich Global</p>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Public</span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">Connect with everyone in Munich</p>
            </div>
          </button>

          {groups.map(group => (
            <button 
              key={group.id} 
              onClick={() => selectGroup(group)} 
              className={`w-full flex items-center gap-4 p-5 transition-all border-b border-slate-50 hover:bg-slate-50 ${selectedGroup?.id === group.id ? 'bg-indigo-50/50' : ''}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-indigo-600 text-xl border border-slate-200">
                {group.name[0].toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{group.name}</p>
                  <span className="text-[10px] text-slate-400 font-bold">Squad</span>
                </div>
                <p className="text-xs text-slate-400 font-medium truncate italic">Group Chat</p>
              </div>
            </button>
          ))}
          
          {groups.length === 0 && (
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Users size={32} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                No custom squads yet.<br/>Start one with the people you follow!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className={`
        flex-1 flex flex-col h-full bg-slate-50 relative
        ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => setMobileView('list')}
              className="md:hidden p-2 -ml-2 text-indigo-600"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
              {selectedGroup ? <Users size={20} /> : <Hash size={20} />}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">
                {selectedGroup ? selectedGroup.name : 'Munich Global Squad'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                {selectedGroup ? `${selectedGroup.members.length} members` : 'Community channel'}
              </p>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
             <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
             >
              <MoreVertical size={20} />
             </button>
             {showMenu && (
               <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2">
                 {selectedGroup ? (
                   <button 
                    onClick={handleLeaveGroup}
                    className="w-full px-4 py-3 text-left hover:bg-rose-50 text-rose-500 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                   >
                    <LogOut size={14} /> Leave Squad
                   </button>
                 ) : (
                   <p className="px-4 py-3 text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">Global Channel</p>
                 )}
               </div>
             )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-40">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4">
                <MessageCircle size={32} className="text-indigo-200" />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">No messages yet.<br/>Break the ice!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = currentUser ? msg.userId === currentUser.id : false;
              const activity = msg.activityId ? activities.find(a => a.id === msg.activityId) : null;
              const totalVotes = msg.poll?.options.reduce((acc, opt) => acc + opt.votes.length, 0) || 0;

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && (
                      <span className="text-[10px] font-black text-slate-400 mb-1 ml-2 uppercase tracking-tighter">
                        {msg.userName}
                      </span>
                    )}
                    <div className={`
                      relative p-4 rounded-[1.8rem] shadow-sm text-sm font-medium
                      ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}
                    `}>
                      {activity && (
                        <div 
                          onClick={() => setSelectedActivityForModal(activity)}
                          className={`mb-3 rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform ${isMe ? 'bg-white/10' : 'bg-slate-50 border border-slate-100'}`}
                        >
                          <div className="relative h-28">
                            <img src={activity.imageUrl} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                            <div className="absolute bottom-3 left-3 right-3">
                              <h4 className="font-black text-white text-[10px] italic tracking-tighter uppercase leading-none">{activity.name}</h4>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="leading-relaxed">{msg.text}</div>
                      {msg.poll && (
                        <div className={`mt-4 space-y-2 border-t pt-4 ${isMe ? 'border-white/10' : 'border-slate-100'}`}>
                          <h4 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2 ${isMe ? 'text-white' : 'text-slate-900'}`}>
                            <BarChart2 size={12} /> {msg.poll.question}
                          </h4>
                          {msg.poll.options.map((opt, idx) => {
                            const hasVoted = currentUser ? opt.votes.includes(currentUser.id) : false;
                            const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                            return (
                              <button 
                                key={idx} 
                                onClick={() => handleVote(msg.id, idx)} 
                                className={`w-full relative h-10 rounded-xl overflow-hidden border transition-all ${
                                  hasVoted 
                                    ? (isMe ? 'bg-white/20 border-white/40' : 'bg-indigo-50 border-indigo-200') 
                                    : (isMe ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100')
                                }`}
                              >
                                <div className={`absolute inset-y-0 left-0 transition-all duration-700 ${isMe ? 'bg-white/20' : 'bg-indigo-200/40'}`} style={{ width: `${percentage}%` }}></div>
                                <div className="absolute inset-0 px-4 flex items-center justify-between">
                                  <span className={`text-[10px] font-black ${hasVoted ? (isMe ? 'text-white' : 'text-indigo-600') : (isMe ? 'text-white/60' : 'text-slate-500')}`}>{opt.text}</span>
                                  <span className={`text-[9px] font-black uppercase ${isMe ? 'text-white/40' : 'text-slate-400'}`}>{percentage}%</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex justify-end mt-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isMe ? 'text-white/40' : 'text-slate-300'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-white p-4 md:p-6 pb-28 md:pb-8 border-t shadow-[0_-10px_25px_rgba(0,0,0,0.02)] shrink-0">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button 
              onClick={() => setShowPollModal(true)} 
              className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all active:scale-90"
            >
              <BarChart2 size={24} />
            </button>
            <div className="flex-1 relative">
               <input 
                type="text" 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                placeholder="Message Squad..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all shadow-inner" 
              />
            </div>
            <button 
              onClick={() => handleSendMessage()} 
              disabled={!inputText.trim()}
              className={`
                w-12 h-12 flex items-center justify-center rounded-2xl shadow-xl transition-all active:scale-90 shrink-0
                ${inputText.trim() ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}
              `}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {selectedActivityForModal && (
        <ActivityDetailModal activity={selectedActivityForModal} onClose={() => setSelectedActivityForModal(null)} />
      )}

      {showPollModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 p-6 text-white relative">
              <button onClick={() => setShowPollModal(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              <h4 className="text-xl font-black italic tracking-tighter uppercase leading-none">New Squad Poll</h4>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Question</label>
                <input 
                  value={pollQuestion} 
                  onChange={e => setPollQuestion(e.target.value)} 
                  placeholder="e.g., Dinner at 8pm?" 
                  className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none border border-slate-100 focus:ring-4 focus:ring-indigo-50" 
                />
              </div>
              <div className="space-y-3">
                {pollOptions.map((opt, i) => (
                  <input key={i} value={opt} onChange={e => {
                    const newOpts = [...pollOptions];
                    newOpts[i] = e.target.value;
                    setPollOptions(newOpts);
                  }} placeholder={`Option ${i+1}`} className="w-full bg-slate-50 rounded-xl px-4 py-3 outline-none text-slate-900 font-medium border border-slate-100" />
                ))}
                <button onClick={() => setPollOptions([...pollOptions, ''])} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-black uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">Add Option</button>
              </div>
              <button onClick={handleCreatePoll} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Post to Squad</button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 p-8 text-white relative">
              <button onClick={() => setShowCreateGroup(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Start a Squad</h4>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Squad Name</label>
                <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g., Saturday Surfers" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold border border-slate-100 focus:ring-4 focus:ring-indigo-50" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Invite People You Follow</label>
                <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {following.map(person => (
                    <button 
                      key={person.id} 
                      onClick={() => setSelectedFollowing(prev => prev.includes(person.id) ? prev.filter(f => f !== person.id) : [...prev, person.id])} 
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selectedFollowing.includes(person.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent'} border group hover:bg-white hover:border-indigo-100 hover:shadow-md`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={person.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                        <span className="text-sm font-bold text-slate-700">{person.name}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${selectedFollowing.includes(person.id) ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        {selectedFollowing.includes(person.id) && <Check size={14} className="text-white" />}
                      </div>
                    </button>
                  ))}
                  {following.length === 0 && (
                    <div className="p-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Follow people to add them to squads!</p>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={handleCreateGroup} className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">Assemble Squad</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
