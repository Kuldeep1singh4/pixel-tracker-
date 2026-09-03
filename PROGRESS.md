/* PROGRESS.md */ 
# Pixel Tracker - Build Progress

## Phase 1: Database & Client Setup (Complete)
- Created Supabase tables: `charts`, `tasks`, `entries`, `time_sessions`.
- Added public RLS policies for no-auth personal SPA access.
- Installed `@supabase/supabase-js` and configured `src/lib/supabase.js`.
- Configured `.env.local` for Vite environment variables.

## Phase 2: Core Matrix UI & Static Data (Complete)
- Implemented `dateUtils.js` for strict IST calculations.
- Applied Retro 90s / Canva element CSS theme (chunky border, monospace, spec colour).
- Built `Matrix.jsx` scaffold mapping 30 days as columns and tasks as rows.

## Phase 3: Timer Flow UI (Complete)
- Created `Timer.jsx` component for active task tracking.
- Implemented Play/Pause/End and Note-saving logic.
- Wired task name clicks in `Matrix.jsx` to trigger the floating retro timer.

## Phase 4: Supabase Data Integration (Complete)
- Build `db.js` helper to interact with supabase tables.
- Implemented auto-generation logic for new 30-day chart on initialization.
- Replaced mock data in `Matrix.jsx` with live data fetching (`charts`, `tasks`, `entries`).
- Wired the `Timer` save function to upsert real entries to the database .
- Added a basic Add Task input to allow testing with an database.

## Phase 5: Edit Mode & Detail Views (Complete) 
- Added Edit Mode toggle to isolae Add/Delete functionality form regular tracking.
- Created `DetailModal.jsx` to parse and display logged timer notes.
- Wired Day Header clicks (e.g. , "DAY 1") to show al notes and total time for that specific calendar date. 
- Wired Task Total clicks (e.g., "7/30") to show a chronological history of that specific task across the chart.
- Added daily completion reatio tracking to the bottom of the matrix.

## Phase 6: Cat Mascot & Streak Logic (Complete)
- Placed `cat-sprite.jpg` into `src/assets`.
- Added CSS animation logic utilizing `background-position` to cycle through 4 sprite frames.
- Implemented `mix-blend-mode: multipy` to seamlessly integrate the white-background JPG.
-Build `Mascot.jsx` to calculate a 3-day rolling consistency ratio and adjust animations (Active, Idle, Lazy) based on a 60% threshold.

## next Phase

