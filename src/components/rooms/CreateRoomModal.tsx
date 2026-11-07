'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRooms } from '@/context/RoomContext';
import { useAuth } from '@/context/AuthContext';
import { 
  SUPPORTED_LANGUAGES, 
  PROFICIENCY_LEVELS, 
  SUGGESTED_TOPICS, 
  ProficiencyLevel, 
  LanguageCode 
} from '@/types';
import { 
  X, 
  Sparkles, 
  PlusCircle, 
  Users, 
  Volume2, 
  Globe2, 
  Radio 
} from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { createRoom } = useRooms();

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<string>(profile?.learning_language || 'English');
  const [proficiencyLevel, setProficiencyLevel] = useState<string>(profile?.proficiency_level || 'Any Level');
  const [topic, setTopic] = useState<string>('General Conversation');
  const [customTopic, setCustomTopic] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number>(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an inviting room title.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const finalTopic = customTopic.trim() || topic;

      const created = await createRoom({
        title: title.trim(),
        language,
        proficiency_level: proficiencyLevel,
        topic: finalTopic,
        max_participants: maxParticipants,
      });

      onClose();
      // Host automatically enters the newly created room
      router.push(`/rooms/${created.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const topicPresets = [
    'General Conversation',
    'Daily Life & Culture',
    'Travel & Adventure',
    'Technology & AI',
    'Education & Career',
    'Business & Startups',
    'Free Discussion'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create a Speaking Room</h2>
              <p className="text-xs text-slate-400">Launch a live audio room for learners worldwide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 overflow-y-auto pr-1">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Room Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Room Title <span className="text-orange-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Let's practice English conversation over coffee ☕"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Language to Speak <span className="text-orange-400">*</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.name} value={lang.name}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Proficiency Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Proficiency Level <span className="text-orange-400">*</span>
              </label>
              <select
                value={proficiencyLevel}
                onChange={(e) => setProficiencyLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {PROFICIENCY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Topic of Conversation
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {topicPresets.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => {
                    setTopic(t);
                    setCustomTopic('');
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    topic === t && !customTopic
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Or enter custom topic (e.g., Favorite Japanese Anime)..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Max Participants Slider */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span>Maximum Participants</span>
              <span className="rounded-md bg-orange-500/20 text-orange-400 px-2 py-0.5 border border-orange-500/30">
                {maxParticipants} People
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              step="1"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>2 (Intimate 1-on-1)</span>
              <span>6 (Recommended)</span>
              <span>12 (Group Discussion)</span>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-rose-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Launching Stage...</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>Create & Enter Stage</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
