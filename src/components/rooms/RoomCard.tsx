'use client';

import React, { useState, useEffect } from 'react';
import { Room, SUPPORTED_LANGUAGES } from '@/types';
import { 
  Users, 
  Crown, 
  Volume2, 
  ArrowRight, 
  Clock, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string) => void;
  isJoining?: boolean;
}

export default function RoomCard({ room, onJoin, isJoining }: RoomCardProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.name === room.language);
  const isFull = room.participant_count >= room.max_participants;
  const isClosing = room.status === 'closing';

  // Real-time grace countdown
  useEffect(() => {
    if (isClosing && room.closing_at) {
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.ceil((new Date(room.closing_at!).getTime() - Date.now()) / 1000));
        setSecondsRemaining(remaining);
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    } else {
      setSecondsRemaining(null);
    }
  }, [isClosing, room.closing_at]);

  const levelColor = (level: string) => {
    if (level.includes('A1') || level.includes('A2')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (level.includes('B1') || level.includes('B2')) return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    if (level.includes('C1') || level.includes('C2')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (level.includes('Native')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  return (
    <div className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-300 p-5 backdrop-blur-sm ${
      isClosing 
        ? 'border-amber-500/40 bg-amber-950/10 shadow-lg shadow-amber-950/20'
        : 'border-slate-800/80 bg-slate-900/60 hover:border-orange-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5'
    }`}>
      
      {/* Top Meta Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Language Flag & Name Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/90 px-3 py-1 text-xs font-semibold text-white border border-slate-700/80">
            <span className="text-sm">{langInfo?.flag || '🗣️'}</span>
            <span>{room.language}</span>
          </div>

          {/* Live Indicator or Grace Period */}
          {isClosing ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 animate-pulse">
              <Clock className="h-3 w-3" />
              <span>Empty: {secondsRemaining ?? 60}s</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE</span>
            </div>
          )}
        </div>

        {/* Room Title */}
        <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
          {room.title}
        </h3>

        {/* Topic & Level Badges */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${levelColor(room.proficiency_level)}`}>
            {room.proficiency_level}
          </span>
          <span className="inline-flex items-center rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/60">
            {room.topic || 'General Conversation'}
          </span>
        </div>
      </div>

      {/* Middle/Bottom: Host & Participants Info */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        
        {/* Host Info */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-1.5 truncate">
            <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Hosted by <strong className="text-slate-200">{room.host_name || 'Host'}</strong></span>
          </div>

          {/* Participant count */}
          <div className="flex items-center gap-1 text-slate-300 font-medium">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>
              <strong className={isFull ? 'text-amber-400' : 'text-emerald-400'}>
                {room.participant_count}
              </strong>
              /{room.max_participants}
            </span>
          </div>
        </div>

        {/* Overlapping Participant Avatars Preview */}
        {room.participants && room.participants.length > 0 && (
          <div className="flex items-center -space-x-2 mb-4 overflow-hidden py-0.5">
            {room.participants.slice(0, 5).map((p, idx) => (
              <div 
                key={p.id || idx}
                className="relative h-7 w-7 rounded-full ring-2 ring-slate-900 overflow-hidden bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300"
                title={p.profile?.display_name || 'Participant'}
              >
                {p.profile?.avatar_url ? (
                  <img src={p.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{(p.profile?.display_name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
            ))}
            {room.participant_count > 5 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-900 text-[10px] font-medium text-slate-300">
                +{room.participant_count - 5}
              </div>
            )}
          </div>
        )}

        {/* Capacity Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 mb-4 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              isFull ? 'bg-amber-400' : 'bg-gradient-to-r from-orange-500 to-rose-500'
            }`}
            style={{ width: `${Math.min(100, (room.participant_count / room.max_participants) * 100)}%` }}
          />
        </div>

        {/* Join Button */}
        <button
          onClick={() => onJoin(room.id)}
          disabled={isFull || isJoining}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all ${
            isFull
              ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-700/40'
              : 'bg-gradient-to-r from-orange-500 via-orange-600 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-md shadow-orange-500/15 active:scale-[0.98]'
          }`}
        >
          {isJoining ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Connecting Voice...</span>
            </>
          ) : isFull ? (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Room Full ({room.max_participants}/{room.max_participants})</span>
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4" />
              <span>Join Voice Room</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>

    </div>
  );
}
