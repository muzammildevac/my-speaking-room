'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_LANGUAGES, PROFICIENCY_LEVELS, ProficiencyLevel } from '@/types';
import { 
  Radio, 
  PlusCircle, 
  Compass, 
  User, 
  LogOut, 
  Sparkles, 
  Users, 
  ChevronDown,
  Volume2
} from 'lucide-react';

interface NavbarProps {
  onCreateRoomClick?: () => void;
}

function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800">
      <Link
        href="/dashboard"
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
          pathname === '/dashboard'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <Compass className="h-4 w-4" />
        Discover Rooms
      </Link>
      <Link
        href="/profile"
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
          pathname === '/profile'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <User className="h-4 w-4" />
        My Profile
      </Link>
    </nav>
  );
}

export default function Navbar({ onCreateRoomClick }: NavbarProps) {
  const { user, profile, logout, loginQuickUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);

  const nativeInfo = SUPPORTED_LANGUAGES.find((l) => l.name === profile?.native_language);
  const learningInfo = SUPPORTED_LANGUAGES.find((l) => l.name === profile?.learning_language);

  const demoPresets = [
    { name: 'Elena Rostova', native: 'Russian', learning: 'English', level: 'B2 - Upper Intermediate' as ProficiencyLevel, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { name: 'Mateo Garcia', native: 'Spanish', learning: 'English', level: 'B1 - Intermediate' as ProficiencyLevel, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { name: 'Kenji Sato', native: 'Japanese', learning: 'French', level: 'A2 - Elementary' as ProficiencyLevel, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { name: 'Amira Benali', native: 'Arabic', learning: 'English', level: 'C1 - Advanced' as ProficiencyLevel, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
    { name: 'Lucas Silva', native: 'Portuguese', learning: 'German', level: 'B1 - Intermediate' as ProficiencyLevel, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
            <Volume2 className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              My Speaking Room
            </span>
            <span className="hidden sm:block text-xs font-medium text-orange-400/90 tracking-wide uppercase">
              Global Voice Exchange
            </span>
          </div>
        </Link>

        {/* Center Nav Links with Suspense */}
        <Suspense fallback={<div className="w-48 h-8" />}>
          <NavLinks />
        </Suspense>

        {/* Right Action buttons */}
        <div className="flex items-center gap-3">
          {/* Create Room Button */}
          {onCreateRoomClick ? (
            <button
              onClick={onCreateRoomClick}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-rose-700 transition-all active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Create Room</span>
            </button>
          ) : (
            <Link
              href="/dashboard?create=true"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:from-orange-600 hover:to-rose-700 transition-all active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Create Room</span>
            </Link>
          )}

          {/* User Account / Profile Menu */}
          {user && profile ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 p-1.5 pr-3 hover:border-slate-700 transition-colors"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="h-8 w-8 rounded-lg object-cover ring-2 ring-orange-500/30"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 font-bold text-sm">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {profile.display_name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>{nativeInfo?.flag || '🌐'}</span>
                    <span>➔</span>
                    <span>{learningInfo?.flag || '🗣️'} {profile.learning_language}</span>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="text-xs font-semibold text-white">{profile.display_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400 border border-orange-500/20">
                        {profile.proficiency_level}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Compass className="h-4 w-4 text-orange-400" />
                    Discover Rooms
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <User className="h-4 w-4 text-orange-400" />
                    Edit Profile Details
                  </Link>

                  {/* Multi-browser test switcher */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsSwitchUserOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    <Users className="h-4 w-4 text-amber-400" />
                    Switch User (Multi-tab test)
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Switch User Modal for Multi-Session Voice Testing */}
      {isSwitchUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Switch Active Test Persona</h3>
              </div>
              <button
                onClick={() => setIsSwitchUserOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Select an identity to test multi-user conversations across different browser tabs or windows in real time.
            </p>

            <div className="mt-4 space-y-2">
              {demoPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    loginQuickUser(preset);
                    setIsSwitchUserOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 hover:border-orange-500/50 hover:bg-slate-800/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={preset.avatar}
                      alt={preset.name}
                      className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">
                        {preset.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Native: <span className="text-slate-200">{preset.native}</span> • Learning: <span className="text-orange-300">{preset.learning}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-slate-800 px-2 py-1 rounded text-slate-300">
                    {preset.level.split(' - ')[0]}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsSwitchUserOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
