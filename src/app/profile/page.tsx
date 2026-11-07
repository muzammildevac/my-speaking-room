'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { 
  SUPPORTED_LANGUAGES, 
  PROFICIENCY_LEVELS, 
  ProficiencyLevel, 
  LanguageCode 
} from '@/types';
import { 
  User, 
  Save, 
  Globe, 
  Sparkles, 
  Camera, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, profile, updateProfile, isLoading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState<string>('English');
  const [learningLanguage, setLearningLanguage] = useState<string>('Spanish');
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>('B1 - Intermediate');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || '');
      setNativeLanguage(profile.native_language || 'English');
      setLearningLanguage(profile.learning_language || 'Spanish');
      setProficiencyLevel(profile.proficiency_level || 'B1 - Intermediate');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateProfile({
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim(),
        native_language: nativeLanguage,
        learning_language: learningLanguage,
        proficiency_level: proficiencyLevel,
      });
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header navigation */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-8">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Discover
            </Link>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              My Profile Settings
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Your speaking profile helps conversation partners match with your target language and level.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Active Member</span>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Profile details saved successfully!</span>
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Section */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-3">
                Profile Picture
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative h-20 w-20 rounded-2xl overflow-hidden ring-2 ring-orange-500/40 bg-slate-800 flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-slate-300">
                      {(displayName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full">
                  <p className="text-[11px] text-slate-400 mb-2">
                    Pick a quick avatar preset or paste an image URL:
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    {sampleAvatars.map((url, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setAvatarUrl(url)}
                        className={`h-9 w-9 rounded-xl overflow-hidden ring-1 transition-all ${
                          avatarUrl === url ? 'ring-2 ring-orange-500 scale-105' : 'ring-slate-700 hover:ring-slate-500'
                        }`}
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Display Name <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Language Pair */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Native Language <span className="text-orange-400">*</span>
                </label>
                <select
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.name} value={lang.name}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Language Wanting to Practise <span className="text-orange-400">*</span>
                </label>
                <select
                  value={learningLanguage}
                  onChange={(e) => setLearningLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.name} value={lang.name}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Proficiency Level */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Current Proficiency Level <span className="text-orange-400">*</span>
              </label>
              <select
                value={proficiencyLevel}
                onChange={(e) => setProficiencyLevel(e.target.value as ProficiencyLevel)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {PROFICIENCY_LEVELS.filter((l) => l !== 'Any Level').map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Choose the level that best reflects your conversational ease (CEFR scale A1 to C2).
              </p>
            </div>

            {/* Submit button */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-rose-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </main>
    </div>
  );
}
