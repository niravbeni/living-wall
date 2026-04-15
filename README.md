# Living Wall

Fullscreen carousel display app with a built-in CMS. Upload images and videos, configure transitions and timing, then display them on any screen.

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run the database setup

Open the SQL Editor in your Supabase dashboard and paste the contents of `supabase-setup.sql`. Run it to create the tables and policies.

### 3. Create the storage bucket

In your Supabase dashboard go to **Storage** and create a new bucket named `media`. Set it to **public**. Then under the bucket's **Policies**, add policies allowing public access for SELECT, INSERT, and DELETE.

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_CMS_PIN=        # optional, leave empty for open access
```

### 5. Install and run

```bash
npm install
npm run dev
```

## Usage

| Route | Purpose |
|-------|---------|
| `/` | Playback screen — fullscreen carousel display |
| `/cms` | Content management — upload, reorder, configure |

### Playback controls

| Key | Action |
|-----|--------|
| Space / Right Arrow | Next item |
| Left Arrow | Previous item |
| F | Toggle fullscreen |
| Click | Next item (manual mode only) |

### CMS features

- Drag-and-drop media upload (images and videos)
- Drag-to-reorder items
- Per-item duration and video loop settings
- Global settings: auto-loop, transition type, transition speed, progress bar

### Transition types

- **Crossfade** — smooth opacity blend
- **Slide** — horizontal carousel motion
- **Zoom Fade** — cinematic scale + fade
- **Card Stack** — 3D card deck effect

## Deploy to Vercel

Push to GitHub and import into [Vercel](https://vercel.com). Add the environment variables in the Vercel project settings.
