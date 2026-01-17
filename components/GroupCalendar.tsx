
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/dbService';
import { Activity, Message } from '../types';
import { Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle2, MapPin } from 'lucide-react';

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?q=80&w=800&auto=format&fit=crop";

const GroupCalendar: React.FC = () => {
  const [confirmedMessages, setConfirmedMessages] = useState<Message[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const user = db.getUser();

  useEffect(() => {
    // We subscribe to all messages with polls to find user's YES votes
    const unsubscribe = db.subscribeToAllPolls((msgs) => {
      if (!user) return;
      
      // Filter for messages that:
      // 1. Have an activity linked
      // 2. Have a poll
      // 3. Current user voted in the "YES" (index 0) option
      const userConfirmed = msgs.filter(msg => {
        if (!msg.activityId || !msg.poll) return false;
        const yesOption = msg.poll.options[0]; // Assuming index 0 is always "YES" as per Explore/Feed share logic
        return yesOption && yesOption.votes.includes(user.id);
      });
      
      setConfirmedMessages(userConfirmed);
    });

    db.getActivities().then(setActivities);
    
    return () => unsubscribe();
  }, [user?.id]);

  // Derived confirmed activities list
  const confirmedActivities = useMemo(() => {
    return confirmedMessages.map(msg => {
      const activity = activities.find(a => a.id === msg.activityId);
      if (!activity) return null;
      return {
        ...activity,
        voteId: msg.id,
        timestamp: msg.timestamp
      };
    }).filter(Boolean) as (Activity & { voteId: string, timestamp: Date })[];
  }, [confirmedMessages, activities]);

  return (
    <div className="p-6 pb-24 space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col gap-1">
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Confirmed Trips</p>
        <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">My Events</h2>
      </header>

      {confirmedActivities.length === 0 ? (
        <div className="py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-6 space-y-4">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300">
            <CalendarIcon size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">No confirmed events</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">Go to Squad chats and vote <span className="text-indigo-600 font-bold">YES</span> on activities to see them here!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {confirmedActivities.map(activity => (
            <div key={activity.voteId} className="group bg-white rounded-[2.5rem] p-4 border border-slate-100 flex flex-col md:flex-row gap-6 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <CheckCircle2 size={120} className="text-indigo-600" />
              </div>
              
              <div className="w-full md:w-64 h-48 rounded-[2rem] overflow-hidden shrink-0">
                <img 
                  src={activity.imageUrl || FALLBACK_IMAGE} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  alt={activity.name} 
                />
              </div>
              
              <div className="flex-1 py-4 flex flex-col justify-between z-10">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-lg shadow-indigo-100">
                      <CheckCircle2 size={10} /> Attending
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activity.category}</span>
                  </div>
                  <h4 className="text-2xl font-black italic tracking-tighter text-slate-900 mb-1">{activity.name.toUpperCase()}</h4>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <MapPin size={12} className="text-indigo-400" /> Munich, Germany
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 font-medium max-w-xl">
                    {activity.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-6">
                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-500">
                      <Clock size={14} className="text-indigo-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Added {activity.timestamp.toLocaleDateString()}</span>
                   </div>
                   <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <ChevronRight size={24} />
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

export default GroupCalendar;
