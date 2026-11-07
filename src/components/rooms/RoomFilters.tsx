'use client';

import React from 'react';
import { SUPPORTED_LANGUAGES, PROFICIENCY_LEVELS } from '@/types';
import { Search, Filter, Globe, Sparkles } from 'lucide-react';

interface RoomFiltersProps {
  selectedLanguage: string;
  selectedLevel: string;
  searchQuery: string;
  onLanguageChange: (lang: string) => void;
  onLevelChange: (level: string) => void;
  onSearchChange: (query: string) => void;
}

export default function RoomFilters({
  selectedLanguage,
  selectedLevel,
  searchQuery,
  onLanguageChange,
  onLevelChange,
  onSearchChange,
}: RoomFiltersProps) {
  const languageOptions = ['All', ...SUPPORTED_LANGUAGES.map((l) => l.name)];

  return (
    <div className="space-y-4">
      {/* Top Search & Level Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by topic, room title, or host..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Level Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-orange-400" /> Level:
          </span>
          <select
            value={selectedLevel}
            onChange={(e) => onLevelChange(e.target.value)}
            className="rounded-2xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-xs font-medium text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="All">All Proficiency Levels</option>
            {PROFICIENCY_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Language Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
        <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 pl-1">
          <Globe className="h-3.5 w-3.5 text-orange-400" /> Language:
        </span>

        {languageOptions.map((lang) => {
          const isSelected = selectedLanguage === lang;
          const info = SUPPORTED_LANGUAGES.find((l) => l.name === lang);

          return (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {info?.flag && <span>{info.flag}</span>}
              <span>{lang}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
