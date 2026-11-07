export type ProficiencyLevel = 
  | 'A1 - Beginner' 
  | 'A2 - Elementary' 
  | 'B1 - Intermediate' 
  | 'B2 - Upper Intermediate' 
  | 'C1 - Advanced' 
  | 'C2 - Mastery' 
  | 'Native / Fluent' 
  | 'Any Level';

export type LanguageCode = 
  | 'English'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Japanese'
  | 'Mandarin'
  | 'Portuguese'
  | 'Italian'
  | 'Korean'
  | 'Arabic'
  | 'Russian'
  | 'Hindi'
  | 'Other';

export interface LanguageInfo {
  name: LanguageCode;
  code: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { name: 'English', code: 'en', flag: '🇬🇧' },
  { name: 'Spanish', code: 'es', flag: '🇪🇸' },
  { name: 'French', code: 'fr', flag: '🇫🇷' },
  { name: 'German', code: 'de', flag: '🇩🇪' },
  { name: 'Japanese', code: 'ja', flag: '🇯🇵' },
  { name: 'Mandarin', code: 'zh', flag: '🇨🇳' },
  { name: 'Portuguese', code: 'pt', flag: '🇧🇷' },
  { name: 'Italian', code: 'it', flag: '🇮🇹' },
  { name: 'Korean', code: 'ko', flag: '🇰🇷' },
  { name: 'Arabic', code: 'ar', flag: '🇸🇦' },
  { name: 'Russian', code: 'ru', flag: '🇷🇺' },
  { name: 'Hindi', code: 'hi', flag: '🇮🇳' },
];

export const PROFICIENCY_LEVELS: ProficiencyLevel[] = [
  'Any Level',
  'A1 - Beginner',
  'A2 - Elementary',
  'B1 - Intermediate',
  'B2 - Upper Intermediate',
  'C1 - Advanced',
  'C2 - Mastery',
  'Native / Fluent'
];

export const SUGGESTED_TOPICS = [
  'General Conversation',
  'Daily Life & Culture',
  'Travel & Adventure',
  'Education & Career',
  'Technology & AI',
  'Movies, Music & Books',
  'Business & Startups',
  'Free Discussion',
  'Pronunciation & Accents'
] as const;

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  native_language: string;
  learning_language: string;
  proficiency_level: ProficiencyLevel;
  created_at?: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  is_host: boolean;
  is_muted?: boolean;
  is_speaking?: boolean;
  joined_at: string;
  last_seen_at: string;
  left_at?: string | null;
  is_active: boolean;
  profile?: Profile;
}

export interface Room {
  id: string;
  title: string;
  language: LanguageCode | string;
  proficiency_level: ProficiencyLevel | string;
  topic: string;
  host_id: string;
  host_name?: string;
  max_participants: number;
  participant_count: number;
  status: 'active' | 'closing' | 'closed';
  closing_at?: string | null;
  created_at: string;
  updated_at?: string;
  participants?: RoomParticipant[];
}

export interface LiveKitTokenResponse {
  token: string;
  serverUrl: string;
  isSimulated?: boolean;
}
