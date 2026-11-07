'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import VoiceStage from '@/components/voice/VoiceStage';
import { useAuth } from '@/context/AuthContext';
import { useRooms } from '@/context/RoomContext';
import { Room } from '@/types';
import { Volume2, AlertCircle, ArrowLeft, LogIn } from 'lucide-react';
import Link from 'next/link';

function RoomDetailContent() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;

  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { rooms, getRoomById, joinRoom, isLoading: isRoomsLoading } = useRooms();

  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    const foundRoom = getRoomById(roomId) || rooms.find((r) => r.id === roomId);
    if (foundRoom) {
      if (foundRoom.status === 'closed') {
        setError('This speaking room has been closed by the host.');
      } else {
        setRoom(foundRoom);
      }
      setIsInitializing(false);
    } else if (!isRoomsLoading) {
      setError('This speaking room does not exist or has been removed.');
      setIsInitializing(false);
    }
  }, [roomId, rooms, getRoomById, isRoomsLoading]);

  // Auth requirement check (Section 3.1)
  if (!isAuthLoading && !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 mb-4">
            <LogIn className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Login Required</h2>
          <p className="text-xs text-slate-400 mt-2">
            You must log in to participate in live speaking rooms and communicate with other members.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/login?redirect=/rooms/${roomId}`}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-3 text-xs font-bold text-white transition-all shadow-md shadow-orange-500/20"
            >
              Sign In to Join Room
            </Link>
            <Link
              href="/dashboard"
              className="w-full text-xs text-slate-400 hover:text-white py-2"
            >
              Return to Discover Rooms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Room not found or closed error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Room Unavailable</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {error}
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Discover</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isInitializing || !room) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-400">Entering Speaking Room...</p>
        </div>
      </div>
    );
  }

  return <VoiceStage room={room} />;
}

export default function RoomDetailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      }>
        <RoomDetailContent />
      </Suspense>
    </div>
  );
}

