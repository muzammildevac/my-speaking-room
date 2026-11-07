'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import RoomCard from '@/components/rooms/RoomCard';
import RoomFilters from '@/components/rooms/RoomFilters';
import CreateRoomModal from '@/components/rooms/CreateRoomModal';
import { useAuth } from '@/context/AuthContext';
import { useRooms } from '@/context/RoomContext';
import { 
  PlusCircle, 
  Compass, 
  Radio, 
  Users, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  Globe2,
  Volume2
} from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const { 
    rooms, 
    isLoading, 
    filterLanguage, 
    filterLevel, 
    searchQuery, 
    setFilterLanguage, 
    setFilterLevel, 
    setSearchQuery,
    joinRoom,
    refreshRooms
  } = useRooms();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(searchParams?.get('create') === 'true');
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtered rooms logic
  const availableRooms = useMemo(() => {
    return rooms.filter((room) => {
      // 1. Language filter
      if (filterLanguage !== 'All' && room.language !== filterLanguage) {
        return false;
      }
      // 2. Proficiency level filter
      if (filterLevel !== 'All' && room.proficiency_level !== filterLevel) {
        return false;
      }
      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = room.title.toLowerCase().includes(q);
        const matchesTopic = room.topic.toLowerCase().includes(q);
        const matchesHost = room.host_name?.toLowerCase().includes(q);
        const matchesLang = room.language.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTopic && !matchesHost && !matchesLang) {
          return false;
        }
      }
      // 4. Must not be closed
      return room.status !== 'closed';
    });
  }, [rooms, filterLanguage, filterLevel, searchQuery]);

  const handleJoin = async (roomId: string) => {
    if (!user) {
      router.push(`/login?redirect=/rooms/${roomId}`);
      return;
    }

    try {
      setJoiningRoomId(roomId);
      setJoinError(null);
      const res = await joinRoom(roomId);
      if (res.success) {
        router.push(`/rooms/${roomId}`);
      } else {
        setJoinError(res.error || 'Could not join room');
      }
    } catch (err: any) {
      setJoinError(err?.message || 'Failed to join speaking room');
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshRooms();
    setIsRefreshing(false);
  };

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-orange-400 tracking-wider uppercase">
              Real-Time Discover Feed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Speaking Rooms
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Live voice conversations happening right now. Choose a room and jump on stage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Realtime Status Pill */}
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-slate-300">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Live Updates Synced</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Sync latest room data"
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
          </button>

          {/* Create Room Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-rose-700 transition-all active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* Join Error Toast */}
      {joinError && (
        <div className="mt-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{joinError}</span>
          </div>
          <button
            onClick={() => setJoinError(null)}
            className="text-slate-400 hover:text-white ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="mt-6">
        <RoomFilters
          selectedLanguage={filterLanguage}
          selectedLevel={filterLevel}
          searchQuery={searchQuery}
          onLanguageChange={setFilterLanguage}
          onLevelChange={setFilterLevel}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Speaking Rooms Grid */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl border border-slate-800/60 bg-slate-900/40 animate-pulse p-6"
              >
                <div className="h-4 w-24 bg-slate-800 rounded-md mb-4" />
                <div className="h-6 w-3/4 bg-slate-800 rounded-md mb-2" />
                <div className="h-4 w-1/2 bg-slate-800 rounded-md mb-6" />
                <div className="h-10 w-full bg-slate-800 rounded-xl mt-auto" />
              </div>
            ))}
          </div>
        ) : availableRooms.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 mb-4">
              <Volume2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-white">No active speaking rooms match your filter</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Be the first to open a conversation for this language or topic! Rooms are public and people will join you in seconds.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-orange-500/20"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create a Speaking Room Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={handleJoin}
                isJoining={joiningRoomId === room.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

