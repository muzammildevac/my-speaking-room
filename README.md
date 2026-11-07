# My Speaking Room 🎙️🌍

> **Global language-speaking platform for real-time voice conversations without video fatigue or complicated onboarding.**

"My Speaking Room" empowers language learners and native speakers around the world to practice conversational skills in live audio rooms with instant zero-refresh discovery, crystal-clear WebRTC voice communication, host controls, and automatic empty-room lifecycle management.

---

## 🌟 Core Features (MVP)

1. **Authentication & Quick Test Switcher**
   - Google Sign-In & Email registration/login.
   - Profile management: Native Language, Target Language, and CEFR Proficiency Level (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`, `Native`).
   - One-click Persona Switcher in the navigation bar to easily test 5+ simultaneous browser sessions.

2. **Real-Time Room Discovery (Zero Refresh)**
   - Live room cards showing Room Title, Language flag, CEFR Level, Topic, Host, Participant count, and live capacity meter.
   - Real-time updates: whenever any user creates a room, joins, or leaves, every other connected user's feed updates immediately.
   - Dynamic filters by target language, proficiency level, and search.

3. **Live Voice Communication (LiveKit + WebRTC)**
   - High-fidelity voice stage with real-time active speaker visualizer rings and SVG soundwave pulses.
   - Microphone controls: Mute, Unmute, and real-time audio input level meter.
   - Push-to-talk & mute keyboard shortcuts (press `M` to toggle mute).
   - Server-side LiveKit JWT token generation (`/api/livekit/token`).
   - Automatic fallback to high-fidelity local voice simulation when testing without LiveKit API keys.

4. **Host Controls & Room Lifecycle**
   - Room creators become the Host with host badge indicator (👑).
   - Hosts can mute themselves, kick participants (which terminates their audio and updates room count), and close the room for everyone.
   - **Automatic Room Deletion**: When the last participant leaves, a 60-second grace period countdown begins. If nobody rejoins, the room is permanently purged from the database and disappears from all Discover feeds.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS (warm modern palette: `#FF5733` warm coral, deep slate `#090D16`, crisp emerald indicators)
- **Icons**: Lucide Icons
- **Database & Realtime**: Supabase PostgreSQL with Row Level Security (RLS) & Realtime Channels
- **Voice Communication**: LiveKit (`livekit-client`, `livekit-server-sdk`) & WebRTC
- **Deployment**: Vercel ready

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm or pnpm

### 2. Installation
```bash
cd d:\my-speaking-room
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your credentials:
```env
# Supabase (Get from https://supabase.com/dashboard/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LiveKit (Get from https://cloud.livekit.io/)
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: The application is built to run smoothly even before remote credentials are provided. If credentials are not yet added, it automatically enables simulated cross-tab WebRTC voice mode and real-time synchronization so you can test all features right out of the box!

### 4. Database Setup (Supabase)
1. Go to your Supabase project dashboard.
2. Open the **SQL Editor**.
3. Copy and run the script located at `supabase/schema.sql`.
   - Creates `profiles`, `rooms`, and `room_participants` tables.
   - Sets up atomic stored procedures: `join_room`, `leave_room`, `kick_participant`, `close_room`, and `purge_expired_rooms`.
   - Configures Row Level Security (RLS) and enables Supabase Realtime publication.

### 5. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Multi-Session Voice & Real-Time Functionality

To test with multiple participants across different browser sessions:
1. Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) in Google Chrome.
2. Open another tab or an Incognito window (or Microsoft Edge / Firefox).
3. In Tab 1: Click the avatar in the top-right corner, choose **"Switch User"**, and select *Elena Rostova (Russian - Learning English)*.
4. Click **"Create Room"**, select **English**, level **B2**, and click **"Create & Enter Stage"**.
5. In Tab 2: You will see the new room appear **instantly without refreshing**!
6. In Tab 2: Switch to *Mateo Garcia (Spanish)* and click **"Join Voice Room"**.
7. Both users are now on stage with live audio level meters and speaking visualizer wave pulses!
8. In Tab 1 (Host): Hover over Mateo's tile to test the **Host Kick** action.
9. When all users leave a room, witness the **60-second grace period countdown** before the room is automatically deleted.

---

## 🚢 Deployment to Vercel

```bash
npx vercel
```
Or connect your GitHub repository directly to Vercel and add your environment variables in the project settings.
