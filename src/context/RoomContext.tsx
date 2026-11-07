'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Room, RoomParticipant, ProficiencyLevel, LanguageCode } from '@/types';
import { useAuth } from './AuthContext';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { realtimeBus } from '@/lib/sync/realtime-bus';

interface CreateRoomInput {
  title: string;
  language: string;
  proficiency_level: string;
  topic?: string;
  max_participants?: number;
}

interface RoomContextType {
  rooms: Room[];
  activeRoom: Room | null;
  participants: RoomParticipant[];
  isLoading: boolean;
  filterLanguage: string;
  filterLevel: string;
  searchQuery: string;
  setFilterLanguage: (lang: string) => void;
  setFilterLevel: (level: string) => void;
  setSearchQuery: (query: string) => void;
  createRoom: (input: CreateRoomInput) => Promise<Room>;
  joinRoom: (roomId: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: (roomId: string) => Promise<void>;
  kickParticipant: (roomId: string, targetUserId: string) => Promise<void>;
  closeRoom: (roomId: string) => Promise<void>;
  getRoomById: (roomId: string) => Room | undefined;
  refreshRooms: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

const LOCAL_STORAGE_ROOMS_KEY = 'msr_active_rooms';
const LOCAL_STORAGE_PARTICIPANTS_KEY = 'msr_room_participants';

const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-tokyo-cafe',
    title: 'Casual Weekend Coffee & Life in Tokyo',
    language: 'Japanese',
    proficiency_level: 'A2 - Elementary',
    topic: 'Daily Life & Culture',
    host_id: 'usr_kenji',
    host_name: 'Kenji Sato',
    max_participants: 6,
    participant_count: 3,
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    participants: [
      {
        id: 'p-1',
        room_id: 'room-tokyo-cafe',
        user_id: 'usr_kenji',
        is_host: true,
        joined_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        last_seen_at: new Date().toISOString(),
        is_active: true,
        profile: {
          id: 'usr_kenji',
          display_name: 'Kenji Sato',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          native_language: 'Japanese',
          learning_language: 'English',
          proficiency_level: 'A2 - Elementary',
        }
      },
      {
        id: 'p-2',
        room_id: 'room-tokyo-cafe',
        user_id: 'usr_sarah',
        is_host: false,
        joined_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        last_seen_at: new Date().toISOString(),
        is_active: true,
        profile: {
          id: 'usr_sarah',
          display_name: 'Sarah Jenkins',
          avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          native_language: 'English',
          learning_language: 'Japanese',
          proficiency_level: 'A2 - Elementary',
        }
      },
      {
        id: 'p-3',
        room_id: 'room-tokyo-cafe',
        user_id: 'usr_claire',
        is_host: false,
        joined_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        last_seen_at: new Date().toISOString(),
        is_active: true,
        profile: {
          id: 'usr_claire',
          display_name: 'Claire Dupont',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          native_language: 'French',
          learning_language: 'Japanese',
          proficiency_level: 'A1 - Beginner',
        }
      }
    ]
  },
  {
    id: 'room-spanish-chat',
    title: 'Hablemos de Viajes por Sudamérica ✈️',
    language: 'Spanish',
    proficiency_level: 'B1 - Intermediate',
    topic: 'Travel & Adventure',
    host_id: 'usr_mateo',
    host_name: 'Mateo Garcia',
    max_participants: 6,
    participant_count: 4,
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    participants: [
      {
        id: 'p-4',
        room_id: 'room-spanish-chat',
        user_id: 'usr_mateo',
        is_host: true,
        joined_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        last_seen_at: new Date().toISOString(),
        is_active: true,
        profile: {
          id: 'usr_mateo',
          display_name: 'Mateo Garcia',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          native_language: 'Spanish',
          learning_language: 'English',
          proficiency_level: 'B1 - Intermediate',
        }
      }
    ]
  },
  {
    id: 'room-english-tech',
    title: 'Tech Talk: Building AI Agents & Remote Work',
    language: 'English',
    proficiency_level: 'B2 - Upper Intermediate',
    topic: 'Technology & AI',
    host_id: 'usr_amira',
    host_name: 'Amira Benali',
    max_participants: 6,
    participant_count: 5,
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    participants: [
      {
        id: 'p-5',
        room_id: 'room-english-tech',
        user_id: 'usr_amira',
        is_host: true,
        joined_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        last_seen_at: new Date().toISOString(),
        is_active: true,
        profile: {
          id: 'usr_amira',
          display_name: 'Amira Benali',
          avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
          native_language: 'Arabic',
          learning_language: 'English',
          proficiency_level: 'C1 - Advanced',
        }
      }
    ]
  }
];

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterLanguage, setFilterLanguage] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const isConfigured = isSupabaseConfigured();
  const graceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load and sync rooms
  const loadRooms = useCallback(async () => {
    if (isConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('rooms')
          .select('*, profiles:host_id(display_name)')
          .neq('status', 'closed')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          const formatted: Room[] = data.map((r: any) => ({
            ...r,
            host_name: r.profiles?.display_name || 'Host'
          }));
          setRooms(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch rooms from Supabase', err);
      }
    } else {
      // Local fallback
      const stored = localStorage.getItem(LOCAL_STORAGE_ROOMS_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRooms(parsed);
        } catch {
          setRooms(INITIAL_ROOMS);
          localStorage.setItem(LOCAL_STORAGE_ROOMS_KEY, JSON.stringify(INITIAL_ROOMS));
        }
      } else {
        setRooms(INITIAL_ROOMS);
        localStorage.setItem(LOCAL_STORAGE_ROOMS_KEY, JSON.stringify(INITIAL_ROOMS));
      }
    }
    setIsLoading(false);
  }, [isConfigured]);

  // Initial load
  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Real-time synchronization
  useEffect(() => {
    if (isConfigured) {
      const supabase = createClient();
      const channel = supabase
        .channel('public:rooms')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
          loadRooms();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants' }, () => {
          loadRooms();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Cross-tab broadcast listener
      const unsub = realtimeBus?.on('rooms_updated', (updatedRooms: Room[]) => {
        setRooms(updatedRooms);
      });

      const unsubAction = realtimeBus?.on('room_action', (action: { type: string; payload: any }) => {
        if (action.type === 'kicked' && action.payload.userId === user?.id) {
          if (activeRoom?.id === action.payload.roomId) {
            setActiveRoom(null);
            alert('You have been removed from the room by the host.');
            window.location.href = '/dashboard';
          }
        }
        if (action.type === 'closed' && activeRoom?.id === action.payload.roomId) {
          setActiveRoom(null);
          alert('This room was closed by the host.');
          window.location.href = '/dashboard';
        }
        loadRooms();
      });

      return () => {
        unsub?.();
        unsubAction?.();
      };
    }
  }, [isConfigured, loadRooms, user?.id, activeRoom?.id]);

  // Handle automatic room deletion grace period
  useEffect(() => {
    // Check rooms currently in closing state
    const now = Date.now();
    rooms.forEach((r) => {
      if (r.status === 'closing' && r.closing_at) {
        const expiry = new Date(r.closing_at).getTime();
        const diff = expiry - now;

        if (diff <= 0) {
          // Immediately purge
          deleteRoomPermanently(r.id);
        } else if (!graceTimersRef.current.has(r.id)) {
          const timeout = setTimeout(() => {
            deleteRoomPermanently(r.id);
            graceTimersRef.current.delete(r.id);
          }, diff);
          graceTimersRef.current.set(r.id, timeout);
        }
      }
    });

    return () => {
      // Keep running timers for active grace periods
    };
  }, [rooms]);

  const deleteRoomPermanently = async (roomId: string) => {
    if (isConfigured) {
      try {
        const supabase = createClient();
        await supabase.from('rooms').delete().eq('id', roomId);
      } catch (err) {
        console.error('Failed to purge room', err);
      }
    } else {
      const updated = rooms.filter((r) => r.id !== roomId);
      setRooms(updated);
      localStorage.setItem(LOCAL_STORAGE_ROOMS_KEY, JSON.stringify(updated));
      realtimeBus?.emit('rooms_updated', updated);
    }
  };

  const createRoom = async (input: CreateRoomInput): Promise<Room> => {
    if (!user || !profile) {
      throw new Error('You must be signed in to create a speaking room.');
    }

    const newRoomId = 'room_' + Math.random().toString(36).substring(2, 9);
    const newRoom: Room = {
      id: newRoomId,
      title: input.title.trim(),
      language: input.language,
      proficiency_level: input.proficiency_level,
      topic: input.topic?.trim() || 'General Conversation',
      host_id: user.id,
      host_name: profile.display_name,
      max_participants: input.max_participants || 6,
      participant_count: 1,
      status: 'active',
      created_at: new Date().toISOString(),
      participants: [
        {
          id: 'p_' + Math.random().toString(36).substring(2, 9),
          room_id: newRoomId,
          user_id: user.id,
          is_host: true,
          joined_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          is_active: true,
          profile
        }
      ]
    };

    if (isConfigured) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          id: newRoomId,
          title: newRoom.title,
          language: newRoom.language,
          proficiency_level: newRoom.proficiency_level,
          topic: newRoom.topic,
          host_id: user.id,
          max_participants: newRoom.max_participants,
          participant_count: 1,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      await supabase.from('room_participants').insert({
        room_id: newRoomId,
        user_id: user.id,
        is_host: true,
        is_active: true
      });
    } else {
      const updated = [newRoom, ...rooms];
      setRooms(updated);
      localStorage.setItem(LOCAL_STORAGE_ROOMS_KEY, JSON.stringify(updated));
      realtimeBus?.emit('rooms_updated', updated);
    }

    setActiveRoom(newRoom);
    return newRoom;
  };

  const joinRoom = async (roomId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !profile) {
      return { success: false, error: 'Please log in to join this room.' };
    }

    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      return { success: false, error: 'This room does not exist or has closed.' };
    }

    if (room.status === 'closed') {
      return { success: false, error: 'This room is closed.' };
    }

    const currentParticipants = room.participants || [];
    const isAlreadyMember = currentParticipants.some((p) => p.user_id === user.id && p.is_active);

    if (!isAlreadyMember && room.participant_count >= room.max_participants) {
      return { success: false, error: 'This room is already at full capacity.' };
    }

    const isHost = room.host_id === user.id;

    if (isConfigured) {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('join_room', {
        p_room_id: roomId,
        p_user_id: user.id
      });
      if (error || !data?.success) {
        return { success: false, error: data?.error || error?.message || 'Failed to join room' };
      }
    } else {
      // Local update
      const existingParticipant = currentParticipants.find((p) => p.user_id === user.id);
      let newParticipants: RoomParticipant[];

      if (existingParticipant) {
        newParticipants = currentParticipants.map((p) =>
          p.user_id === user.id ? { ...p, is_active: true, left_at: null, last_seen_at: new Date().toISOString() } : p
        );
      } else {
        newParticipants = [
          ...currentParticipants,
          {
            id: 'p_' + Math.random().toString(36).substring(2, 9),
            room_id: roomId,
            user_id: user.id,
            is_host: isHost,
            joined_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            is_active: true,
            profile
          }
        ];
      }

      const activeCount = newParticipants.filter((p) => p.is_active).length;

      const updatedRoom: Room = {
        ...room,
        participant_count: activeCount,
        status: 'active',
        closing_at: null,
        participants: newParticipants
      };

      const updatedRooms = rooms.map((r) => (r.id === roomId ? updatedRoom : r));
      setRooms(updatedRooms);
      setActiveRoom(updatedRoom);
      setParticipants(newParticipants.filter((p) => p.is_active));
      localStorage.setItem(LOCAL_STORAGE_ROOMS_KEY, JSON.stringify(updatedRooms));
      realtimeBus?.emit('rooms_updated', updatedRooms);
    }

    return { success: true };
  };

  const leaveRoom = async (roomId: string) => {
    if (!user) return;

    if (isConfigured) {
      const supabase = createClient();
      await supabase.rpc('leave_room', {
        p_room_id: roomId,
        p_user_id: user.id
      });
    } else {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;

      const remainingParticipants = (room.participants || []).map((p) =>
        p.user_id === user.id ? { ...p, is_active: false, left_at: new Date().toISOString() } : p
      );
      const activeCount = remainingParticipants.filter((p) => p.is_active).length;

      let updatedStatus: 'active' | 'closing' = 'active';
      let closingAt: string | null = null;

      if (activeCount === 0) {
        updatedStatus = 'closing';
        closingAt = new Date(Date.now() + 60 * 1000).toISOString(); // 60-second grace period
      }

      const updatedRoom: Room = {
        ...room,
        participant_count: activeCount,
        status: updatedStatus,
        closing_at: closingAt,
        participants: remainingParticipants
      };

      const updatedRooms = rooms.map((r) => (r.id === roomId ? updatedRoom : r));
      setRooms(updatedRooms);
      localStorage.setItem(LOCAL_STORAGE_ROOMS_KEY, JSON.stringify(updatedRooms));
      realtimeBus?.emit('rooms_updated', updatedRooms);
    }

    if (activeRoom?.id === roomId) {
      setActiveRoom(null);
      setParticipants([]);
    }
  };

  const kickParticipant = async (roomId: string, targetUserId: string) => {
    if (!user) return;

    if (isConfigured) {
      const supabase = createClient();
      await supabase.rpc('kick_participant', {
        p_room_id: roomId,
        p_host_id: user.id,
        p_target_user_id: targetUserId
      });
    } else {
      const room = rooms.find((r) => r.id === roomId);
      if (!room || room.host_id !== user.id) return;

      const updatedParticipants = (room.participants || []).map((p) =>
        p.user_id === targetUserId ? { ...p, is_active: false, left_at: new Date().toISOString() } : p
      );
      const activeCount = updatedParticipants.filter((p) => p.is_active).length;

      const updatedRoom: Room = {
        ...room,
        participant_count: activeCount,
        participants: updatedParticipants
      };

      const updatedRooms = rooms.map((r) => (r.id === roomId ? updatedRoom : r));
      setRooms(updatedRooms);
      if (activeRoom?.id === roomId) {
        setActiveRoom(updatedRoom);
        setParticipants(updatedParticipants.filter((p) => p.is_active));
      }
      localStorage.setItem(LOCAL_STORAGE_ROOMS_KEY, JSON.stringify(updatedRooms));
      realtimeBus?.emit('rooms_updated', updatedRooms);
      realtimeBus?.emit('room_action', {
        type: 'kicked',
        payload: { roomId, userId: targetUserId }
      });
    }
  };

  const closeRoom = async (roomId: string) => {
    if (!user) return;

    if (isConfigured) {
      const supabase = createClient();
      await supabase.rpc('close_room', {
        p_room_id: roomId,
        p_host_id: user.id
      });
    } else {
      const room = rooms.find((r) => r.id === roomId);
      if (!room || room.host_id !== user.id) return;

      const updatedRooms = rooms.filter((r) => r.id !== roomId);
      setRooms(updatedRooms);
      if (activeRoom?.id === roomId) {
        setActiveRoom(null);
        setParticipants([]);
      }
      localStorage.setItem(LOCAL_STORAGE_ROOMS_KEY, JSON.stringify(updatedRooms));
      realtimeBus?.emit('rooms_updated', updatedRooms);
      realtimeBus?.emit('room_action', {
        type: 'closed',
        payload: { roomId }
      });
    }
  };

  const getRoomById = (roomId: string) => {
    return rooms.find((r) => r.id === roomId);
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        activeRoom,
        participants,
        isLoading,
        filterLanguage,
        filterLevel,
        searchQuery,
        setFilterLanguage,
        setFilterLevel,
        setSearchQuery,
        createRoom,
        joinRoom,
        leaveRoom,
        kickParticipant,
        closeRoom,
        getRoomById,
        refreshRooms: loadRooms
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRooms() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRooms must be used within a RoomProvider');
  }
  return context;
}
