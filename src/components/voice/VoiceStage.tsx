'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Room as RoomType, RoomParticipant, SUPPORTED_LANGUAGES } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRooms } from '@/context/RoomContext';
import { 
  Room as LiveKitRoom, 
  RoomEvent, 
  Track, 
  RemoteParticipant,
  LocalParticipant,
  createLocalAudioTrack
} from 'livekit-client';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Crown, 
  UserX, 
  Users, 
  Volume2, 
  VolumeX,
  Radio, 
  ShieldAlert, 
  AlertTriangle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

interface VoiceStageProps {
  room: RoomType;
}

export default function VoiceStage({ room }: VoiceStageProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { leaveRoom, kickParticipant, closeRoom, activeRoom } = useRooms();

  // Voice state
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const [isSimulated, setIsSimulated] = useState(false);

  // Grace countdown state
  const [graceSeconds, setGraceSeconds] = useState<number | null>(null);

  // Host confirmation modals
  const [participantToKick, setParticipantToKick] = useState<RoomParticipant | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isHostActionLoading, setIsHostActionLoading] = useState(false);

  // Refs for audio & LiveKit
  const lkRoomRef = useRef<LiveKitRoom | null>(null);
  const localAudioTrackRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isHost = user?.id === room.host_id;
  const currentParticipants = room.participants?.filter((p) => p.is_active) || [];

  // 1. Initialize Voice Connection (LiveKit / WebRTC)
  useEffect(() => {
    let isCancelled = false;

    async function initVoice() {
      try {
        setIsConnecting(true);
        setConnectionError(null);

        // Fetch server token
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: room.id,
            participantName: profile?.display_name || 'Speaker',
            identity: user?.id || 'guest_' + Math.random().toString(36).substring(2, 7),
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to get voice authentication token');
        }

        const data = await res.json();
        if (isCancelled) return;

        if (data.isSimulated) {
          // Development / Demo simulated mode
          setIsSimulated(true);
          setupSimulatedAudio();
        } else {
          // Connect to real LiveKit SFU
          await connectLiveKit(data.serverUrl, data.token);
        }

        setIsConnected(true);
      } catch (err: any) {
        console.error('Voice initialization error:', err);
        setConnectionError(err?.message || 'Could not connect to voice stage.');
      } finally {
        if (!isCancelled) setIsConnecting(false);
      }
    }

    initVoice();

    return () => {
      isCancelled = true;
      teardownAudio();
    };
  }, [room.id, user?.id, profile?.display_name]);

  // Connect to actual LiveKit Server
  const connectLiveKit = async (serverUrl: string, token: string) => {
    const lkRoom = new LiveKitRoom({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    lkRoomRef.current = lkRoom;

    // Listen to speaker changes
    lkRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const speakerIds = new Set(speakers.map((s) => s.identity));
      setActiveSpeakers(speakerIds);
    });

    lkRoom.on(RoomEvent.Disconnected, () => {
      setIsConnected(false);
    });

    await lkRoom.connect(serverUrl, token);

    // Create & publish local microphone track
    try {
      const audioTrack = await createLocalAudioTrack();
      localAudioTrackRef.current = audioTrack;
      await lkRoom.localParticipant.publishTrack(audioTrack);
      startAudioAnalyser(audioTrack.mediaStreamTrack);
    } catch (micErr: any) {
      console.warn('Microphone permission denied or unavailable:', micErr);
      setConnectionError('Microphone access was denied. Please allow mic permissions to speak.');
    }
  };

  // Local simulated audio for zero-config testing
  const setupSimulatedAudio = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        if (stream) {
          const track = stream.getAudioTracks()[0];
          localAudioTrackRef.current = { mediaStreamTrack: track };
          startAudioAnalyser(track);
        }
      }
    } catch (e) {
      console.log('Local mic not available, using synthetic voice simulation');
    }

    // Periodic simulation of other participants speaking for lifelike preview
    const interval = setInterval(() => {
      if (currentParticipants.length > 1) {
        const otherParticipants = currentParticipants.filter((p) => p.user_id !== user?.id);
        if (otherParticipants.length > 0 && Math.random() > 0.4) {
          const randomSpeaker = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
          setActiveSpeakers(new Set([randomSpeaker.user_id]));
          setTimeout(() => setActiveSpeakers(new Set()), 2500);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  };

  // Real-time audio analyser for mic level & active speaking pulse
  const startAudioAnalyser = (mediaTrack: MediaStreamTrack) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const stream = new MediaStream([mediaTrack]);
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setMicAudioLevel(normalized);

        // If local mic is loud enough and not muted, highlight current user
        if (normalized > 18 && !isMuted && user) {
          setActiveSpeakers((prev) => new Set([...prev, user.id]));
        } else if (user) {
          setActiveSpeakers((prev) => {
            const next = new Set(prev);
            next.delete(user.id);
            return next;
          });
        }

        animFrameRef.current = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (e) {
      console.warn('Audio analyser failed', e);
    }
  };

  // Cleanup audio tracks and audio context
  const teardownAudio = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (localAudioTrackRef.current) {
      if (localAudioTrackRef.current.stop) localAudioTrackRef.current.stop();
      if (localAudioTrackRef.current.mediaStreamTrack) {
        localAudioTrackRef.current.mediaStreamTrack.stop();
      }
    }
    if (lkRoomRef.current) {
      lkRoomRef.current.disconnect();
    }
  };

  // Toggle Mute / Unmute
  const toggleMute = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (lkRoomRef.current?.localParticipant) {
      await lkRoomRef.current.localParticipant.setMicrophoneEnabled(!nextMuted);
    }

    if (localAudioTrackRef.current?.mediaStreamTrack) {
      localAudioTrackRef.current.mediaStreamTrack.enabled = !nextMuted;
    }
  };

  // Keyboard shortcut listener: 'M' or Space to toggle mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMuted]);

  // Grace Period countdown tracking
  useEffect(() => {
    if (room.status === 'closing' && room.closing_at) {
      const updateGrace = () => {
        const remaining = Math.max(0, Math.ceil((new Date(room.closing_at!).getTime() - Date.now()) / 1000));
        setGraceSeconds(remaining);
        if (remaining <= 0) {
          router.push('/dashboard');
        }
      };

      updateGrace();
      const interval = setInterval(updateGrace, 1000);
      return () => clearInterval(interval);
    } else {
      setGraceSeconds(null);
    }
  }, [room.status, room.closing_at, router]);

  // Handle Leave Room
  const handleLeave = async () => {
    teardownAudio();
    await leaveRoom(room.id);
    router.push('/dashboard');
  };

  // Handle Kick Participant (Host only)
  const handleKickConfirm = async () => {
    if (!participantToKick) return;
    try {
      setIsHostActionLoading(true);
      await kickParticipant(room.id, participantToKick.user_id);
      setParticipantToKick(null);
    } finally {
      setIsHostActionLoading(false);
    }
  };

  // Handle Close Room (Host only)
  const handleCloseRoomConfirm = async () => {
    try {
      setIsHostActionLoading(true);
      await closeRoom(room.id);
      teardownAudio();
      setShowCloseModal(false);
      router.push('/dashboard');
    } finally {
      setIsHostActionLoading(false);
    }
  };

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.name === room.language);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      
      {/* 1. Room Stage Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/25 px-2.5 py-0.5 text-xs font-semibold text-orange-400">
              {langInfo?.flag || '🗣️'} {room.language}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">
              {room.proficiency_level}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-800/60 px-2.5 py-0.5 text-xs text-slate-400 border border-slate-700/50">
              {room.topic}
            </span>

            {isSimulated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">
                <Sparkles className="h-3 w-3" /> Live Voice Simulation Active
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {room.title}
          </h1>
        </div>

        {/* Live Status & Participant Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2">
            <Users className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-bold text-white">
              {currentParticipants.length}
            </span>
            <span className="text-xs text-slate-400">/ {room.max_participants} active</span>
          </div>

          {/* Connection status indicator */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs">
            <span className={`h-2.5 w-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
            }`} />
            <span className="text-slate-300 font-medium">
              {isConnected ? 'Voice Stage Live' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grace Period Warning Banner (Section 3.10) */}
      {graceSeconds !== null && (
        <div className="mt-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 p-3.5 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2.5 text-amber-300 text-xs font-semibold">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>
              All participants have left. 60-second grace period active: Room closes automatically in <strong>{graceSeconds}s</strong> unless someone rejoins.
            </span>
          </div>
          <div className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg">
            {graceSeconds}s
          </div>
        </div>
      )}

      {/* Connection / Mic Error Notification */}
      {connectionError && (
        <div className="mt-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{connectionError}</span>
          </div>
          <button
            onClick={() => setConnectionError(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. The Live Voice Stage (Speaker Grid) */}
      <div className="flex-1 my-4 overflow-y-auto rounded-3xl border border-slate-800/80 bg-slate-950/60 p-4 sm:p-6 backdrop-blur-md flex flex-col justify-center">
        
        {currentParticipants.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-3">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-white">Stage is quiet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You are the first participant on stage. Share your room with language learners around the world!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
            {currentParticipants.map((participant) => {
              const isCurrentUser = participant.user_id === user?.id;
              const isSpeaking = activeSpeakers.has(participant.user_id) || (isCurrentUser && micAudioLevel > 18 && !isMuted);
              const participantIsHost = participant.is_host || participant.user_id === room.host_id;

              return (
                <div
                  key={participant.id || participant.user_id}
                  className={`group relative flex flex-col items-center justify-center rounded-3xl p-5 border transition-all duration-200 ${
                    isSpeaking
                      ? 'border-orange-500/80 bg-orange-500/10 shadow-xl shadow-orange-500/15 scale-[1.02]'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  
                  {/* Host Kick Button Overlay (Section 3.9) */}
                  {isHost && !isCurrentUser && (
                    <button
                      onClick={() => setParticipantToKick(participant)}
                      title="Remove participant"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 p-1.5 border border-rose-500/30"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Speaker Avatar & Animated Soundwave Ring */}
                  <div className="relative mb-3">
                    {/* Pulsing ring when speaking */}
                    {isSpeaking && (
                      <span className="absolute -inset-2 rounded-full border-2 border-orange-500/60 animate-ping opacity-75" />
                    )}

                    <div className={`relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden ring-4 transition-all duration-200 ${
                      isSpeaking ? 'ring-orange-500 shadow-lg shadow-orange-500/30' : 'ring-slate-800'
                    }`}>
                      {participant.profile?.avatar_url ? (
                        <img
                          src={participant.profile.avatar_url}
                          alt={participant.profile.display_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-200 font-extrabold text-2xl">
                          {(participant.profile?.display_name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Microphone status badge */}
                    <div className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 ${
                      isCurrentUser && isMuted
                        ? 'bg-rose-500 text-white'
                        : isSpeaking
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isCurrentUser && isMuted ? (
                        <MicOff className="h-3.5 w-3.5" />
                      ) : (
                        <Mic className="h-3.5 w-3.5" />
                      )}
                    </div>

                    {/* Host Crown Badge */}
                    {participantIsHost && (
                      <div className="absolute -top-2 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-md">
                        <Crown className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Participant Name & Status */}
                  <div className="text-center w-full">
                    <h4 className="text-sm font-bold text-white truncate px-2">
                      {participant.profile?.display_name || 'Participant'}
                      {isCurrentUser && <span className="text-orange-400 ml-1">(You)</span>}
                    </h4>

                    {/* Languages Tag */}
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Native: {participant.profile?.native_language || 'English'}
                    </p>

                    {/* CEFR Level Pill */}
                    <div className="mt-2 inline-flex items-center rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60">
                      {participant.profile?.proficiency_level?.split(' - ')[0] || 'B1'}
                    </div>

                    {/* Animated Soundwave Indicator when speaking */}
                    {isSpeaking && (
                      <div className="mt-2 flex items-center justify-center gap-1 h-3">
                        <span className="w-1 bg-orange-400 rounded-full animate-bounce h-3" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 bg-orange-400 rounded-full animate-bounce h-2" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 bg-orange-400 rounded-full animate-bounce h-3.5" style={{ animationDelay: '300ms' }} />
                        <span className="w-1 bg-orange-400 rounded-full animate-bounce h-2" style={{ animationDelay: '75ms' }} />
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 4. Bottom Control Bar (Section 3.8 & 3.9) */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/95 p-3 sm:p-4 backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Audio Feedback & Hotkey guide */}
        <div className="flex items-center gap-3">
          {/* Live Mic Meter Bar */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2">
            <Volume2 className={`h-4 w-4 ${isMuted ? 'text-slate-600' : 'text-emerald-400'}`} />
            <div className="w-16 sm:w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  isMuted ? 'bg-slate-700 w-0' : micAudioLevel > 60 ? 'bg-orange-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${isMuted ? 0 : micAudioLevel}%` }}
              />
            </div>
          </div>

          <span className="hidden md:inline text-[11px] text-slate-400 font-mono">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">M</kbd> to mute
          </span>
        </div>

        {/* Center: Core Microphone Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className={`flex items-center gap-2.5 rounded-2xl px-6 py-3 font-bold text-sm shadow-xl transition-all duration-200 active:scale-95 ${
              isMuted
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 shadow-rose-500/10'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700'
            }`}
          >
            {isMuted ? (
              <>
                <MicOff className="h-5 w-5" />
                <span>Microphone Muted</span>
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 animate-pulse" />
                <span>Microphone Live</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Host Actions & Leave Room */}
        <div className="flex items-center gap-2">
          {/* Host Close Room Button (Host only) */}
          {isHost && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-900/50 bg-rose-950/30 px-3.5 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-900/40 transition-colors"
            >
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">Close Room (Host)</span>
            </button>
          )}

          {/* Leave Room Button */}
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-all active:scale-95"
          >
            <PhoneOff className="h-4 w-4" />
            <span>Leave Stage</span>
          </button>
        </div>

      </div>

      {/* Host Kick Participant Confirmation Modal (Section 3.9) */}
      {participantToKick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <UserX className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">Remove Participant</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove <strong>{participantToKick.profile?.display_name}</strong> from this speaking room? Their voice connection will be terminated immediately.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setParticipantToKick(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleKickConfirm}
                disabled={isHostActionLoading}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isHostActionLoading ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Host Close Room Modal (Section 3.9) */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">End Room For Everyone</h3>
            </div>
            <p className="text-xs text-slate-300">
              As host, closing the room will terminate voice connections for all active speakers and remove this room from the Discover page.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseRoomConfirm}
                disabled={isHostActionLoading}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isHostActionLoading ? 'Closing...' : 'Close Room'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
