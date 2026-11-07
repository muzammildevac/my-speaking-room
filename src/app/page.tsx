'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import CreateRoomModal from '@/components/rooms/CreateRoomModal';
import { useAuth } from '@/context/AuthContext';
import { useRooms } from '@/context/RoomContext';
import { 
  Volume2, 
  Globe, 
  Users, 
  Mic, 
  Sparkles, 
  ArrowRight, 
  Radio, 
  CheckCircle2, 
  Compass, 
  Headphones,
  ShieldCheck
} from 'lucide-react';

export default function HomePage() {
  const { user, profile } = useAuth();
  const { rooms } = useRooms();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const activeCount = rooms.reduce((acc, r) => acc + (r.participant_count || 1), 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar onCreateRoomClick={() => setIsCreateModalOpen(true)} />

      {/* Hero Section */}
      <main className="flex-1">
        
        {/* Live Global Ticker */}
        <div className="border-b border-slate-800/80 bg-slate-900/40 py-2.5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold text-slate-300">
                Live Now: <strong className="text-white">{rooms.length} active speaking rooms</strong> across 12 languages
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-slate-400">
              <span>🎧 100% Voice-First</span>
              <span>🚫 Zero Video Fatigue</span>
              <span>🌍 No Waiting Queue</span>
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
          
          {/* Subtle warm ambient glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-orange-500/10 via-amber-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-400 mb-6 shadow-sm">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>Real-Time Voice Practice for Language Learners</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
              Speak with the world. <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
                One real voice at a time.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Skip stressful grammar apps and awkward video calls. Jump straight into live voice conversation rooms with native speakers and passionate language learners across the globe.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-rose-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-500/25 hover:from-orange-600 hover:to-rose-700 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Compass className="h-5 w-5" />
                <span>Explore Live Rooms</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl border border-slate-700 bg-slate-900/90 px-8 py-4 text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-all active:scale-95"
              >
                <Mic className="h-5 w-5 text-orange-400" />
                <span>Start a Speaking Room</span>
              </button>
            </div>

            {/* Live Interactive Voice Stage Preview */}
            <div className="mt-16 max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Demo Stage Preview
                  </span>
                </div>
                <div className="text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
                  🇯🇵 Japanese Practice • A2 Level
                </div>
              </div>

              {/* Sample Speaker Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: 'Kenji (Host)', lang: 'Native Japanese', active: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
                  { name: 'Elena', lang: 'Learning Japanese', active: false, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
                  { name: 'Mateo', lang: 'Learning Japanese', active: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
                  { name: 'You (Listener)', lang: 'Ready to speak', active: false, isUser: true }
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      s.active 
                        ? 'border-orange-500/70 bg-orange-500/10 shadow-lg shadow-orange-500/10' 
                        : 'border-slate-800 bg-slate-950/60'
                    }`}
                  >
                    <div className="relative mb-2">
                      {s.active && (
                        <span className="absolute -inset-1.5 rounded-full border border-orange-500 animate-ping opacity-75" />
                      )}
                      <div className={`h-14 w-14 rounded-full overflow-hidden ring-2 ${s.active ? 'ring-orange-500' : 'ring-slate-700'}`}>
                        {s.avatar ? (
                          <img src={s.avatar} alt={s.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-orange-400 font-bold">
                            YOU
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-white">{s.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.lang}</div>
                    {s.active && (
                      <div className="mt-2 flex gap-0.5 h-2 items-center">
                        <span className="w-0.5 bg-orange-400 h-2 animate-bounce" />
                        <span className="w-0.5 bg-orange-400 h-3 animate-bounce" style={{ animationDelay: '100ms' }} />
                        <span className="w-0.5 bg-orange-400 h-1.5 animate-bounce" style={{ animationDelay: '200ms' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Headphones className="h-4 w-4 text-emerald-400" /> Crystal-clear WebRTC audio
                </span>
                <Link
                  href="/dashboard"
                  className="font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  Join Live Conversations ➔
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 border-t border-slate-900 bg-slate-950/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Engineered for Conversational Fluency
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Everything you need to practice, connect, and gain confidence with genuine conversations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 mb-4">
                  <Radio className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Zero-Refresh Live Discovery</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time synchronization powers our room feed. New rooms appear instantaneously and participant counts stay accurate to the second without ever refreshing your browser.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-4">
                  <Volume2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">100% Voice-First Privacy</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No cameras, no screen shares, and no video fatigue. Practice freely in your pyjamas or on your commute with pure audio communication and active speaker highlights.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Host Controls & Clean Lifecycle</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Room creators retain full moderation controls: mute, remove disruptive participants, or end sessions. Empty rooms are automatically recycled with a 60-second grace period.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-orange-400" />
            <span className="font-bold text-slate-300">My Speaking Room</span>
            <span>• Global Voice Exchange</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/dashboard" className="hover:text-white">Discover</Link>
            <Link href="/profile" className="hover:text-white">Profile</Link>
            <Link href="/login" className="hover:text-white">Sign In</Link>
          </div>
        </div>
      </footer>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
