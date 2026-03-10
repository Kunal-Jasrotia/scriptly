# 🎬 Scriptly — AI Short Script Studio

> Turn any topic into a production-ready short-form video script, voice-over, captions, and B-roll suggestions — end to end.

---

## ✨ What It Does

Scriptly is a full-stack AI pipeline for short-form video creators. Give it a topic, choose your audience and tone, and it produces:

| Step                          | What you get                                                           |
| ----------------------------- | ---------------------------------------------------------------------- |
| **Script Generation**         | Structured hook → body sections → CTA with SSML emotional pacing       |
| **Research**                  | Auto-scrapes URLs you provide + accepts freeform notes as context      |
| **Script Refinement**         | Iterate with plain-English feedback; full version history kept         |
| **Voice-Over**                | TTS via ElevenLabs (SSML-expressive) or Deepgram Aura 2 (fast)         |
| **Transcription & Subtitles** | Deepgram nova-2 produces word-level timestamps + SRT file              |
| **B-Roll Clips**              | GPT-4o-mini extracts per-section visual keywords → Pexels video search |
| **YouTube Metadata**          | Title, description, captions, and hashtags auto-generated              |

---

## 🛠 Tech Stack

### Backend (`/backend`)

- **Runtime:** Node.js + TypeScript (`tsx` dev, `tsc` build)
- **Framework:** Express.js with Helmet, CORS, rate limiting
- **AI / LLM:** LangChain + OpenAI GPT-4o (script & refinement), GPT-4o-mini (keywords)
- **TTS:** [ElevenLabs](https://elevenlabs.io/) (`eleven_turbo_v2_5`) + [Deepgram Aura 2](https://deepgram.com/)
- **Transcription:** Deepgram `nova-2` (word-level timestamps → SRT)
- **B-Roll:** [Pexels Videos API](https://www.pexels.com/api/)
- **Database:** PostgreSQL via [Prisma ORM](https://www.prisma.io/)
- **Web Scraping:** Cheerio (research URL ingestion)

### Frontend (`/frontend`)

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL database

### 1. Clone & install

```bash
git clone https://github.com/your-username/scriptly.git
cd scriptly

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure environment

**Backend** — copy `.env.example` and fill in your keys:

```bash
cd backend
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/scriptly"
OPENAI_API_KEY="sk-..."

# ElevenLabs TTS (expressive SSML voices)
ELEVENLABS_API_KEY="..."
ELEVENLABS_VOICE_ID="21m00Tcm4TlvDq8ikWAM"   # Rachel (default)

# Deepgram — transcription (nova-2) + TTS (Aura 2)
DEEPGRAM_API_KEY="..."
DEEPGRAM_VOICE_MODEL="aura-2-asteria-en"       # Asteria (default)

# Pexels — free B-roll stock clips
PEXELS_API_KEY="..."

FRONTEND_URL="http://localhost:3000"
PORT=3001
```

**Frontend** — copy `.env.local.example`:

```bash
cd ../frontend
cp .env.local.example .env.local
```

### 3. Set up the database

```bash
cd backend
npm run db:generate   # generate Prisma client
npm run db:migrate    # apply migrations
```

### 4. Run in development

```bash
# Terminal 1 — backend (port 3001)
cd backend && npm run dev

# Terminal 2 — frontend (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🗂 Project Structure

```
scriptly/
├── backend/
│   ├── server.ts               # Express entry point
│   ├── prisma/
│   │   └── schema.prisma       # DB models (Script, Audio, Transcription, ScriptVersion)
│   ├── src/
│   │   ├── chains/             # LangChain pipelines (scriptChain, emotionChain)
│   │   ├── controllers/        # Route handlers
│   │   ├── services/
│   │   │   ├── scriptService.ts    # Create / refine / approve scripts
│   │   │   ├── voiceService.ts     # ElevenLabs + Deepgram TTS
│   │   │   ├── deepgramService.ts  # Transcription → SRT
│   │   │   ├── clipService.ts      # B-roll keyword extraction + Pexels search
│   │   │   └── researchService.ts  # URL scraping via Cheerio
│   │   ├── routes/             # Express routers
│   │   ├── middleware/         # Error handler, rate limiter
│   │   └── utils/
│   └── storage/                # Generated audio (MP3) + subtitles (SRT)
└── frontend/
    ├── app/                    # Next.js App Router pages
    └── components/             # React UI components
```

---

## 🔌 API Endpoints

| Method  | Path                          | Description                            |
| ------- | ----------------------------- | -------------------------------------- |
| `POST`  | `/api/scripts`                | Generate a new script                  |
| `GET`   | `/api/scripts`                | List all scripts                       |
| `GET`   | `/api/scripts/:id`            | Get script + versions + audio          |
| `PATCH` | `/api/scripts/:id`            | Edit script content                    |
| `POST`  | `/api/scripts/:id/refine`     | Refine script with feedback            |
| `POST`  | `/api/scripts/:id/approve`    | Approve script for voice generation    |
| `GET`   | `/api/scripts/voices`         | List available voices (both providers) |
| `POST`  | `/api/scripts/:id/voice`      | Generate voice-over (MP3)              |
| `POST`  | `/api/scripts/:id/transcribe` | Transcribe audio → SRT subtitles       |
| `GET`   | `/api/scripts/:id/subtitles`  | Download SRT file                      |
| `POST`  | `/api/scripts/:id/clips`      | Generate B-roll clip suggestions       |
| `GET`   | `/api/scripts/:id/clips`      | Retrieve saved clip suggestions        |
| `GET`   | `/health`                     | Health check                           |

---

## 🗄 Database Schema

```
Script          — core record with topic, tone, SSML, captions, hashtags, YT metadata
ScriptVersion   — snapshot history per refinement iteration
Audio           — generated MP3 file path + estimated duration
Transcription   — raw Deepgram JSON + SRT file path
```

---

## 🔑 API Keys You Need

| Service    | Free tier?          | Link                                                 |
| ---------- | ------------------- | ---------------------------------------------------- |
| OpenAI     | Pay-as-you-go       | [platform.openai.com](https://platform.openai.com)   |
| ElevenLabs | ✅ Free tier        | [elevenlabs.io](https://elevenlabs.io)               |
| Deepgram   | ✅ Free $200 credit | [console.deepgram.com](https://console.deepgram.com) |
| Pexels     | ✅ Fully free       | [pexels.com/api](https://www.pexels.com/api/)        |

---

## 🔭 Future Scope

The roadmap below outlines high-impact features planned for upcoming versions of Scriptly.

### 🎥 AI Video Generation

- Automatically assemble B-roll clips, captions, and voice-over into a **finished MP4** using FFmpeg or a cloud render pipeline (e.g. Remotion, RunwayML).
- Support multiple aspect ratios out of the box — vertical (9:16 Reels/Shorts), square (1:1), and landscape (16:9 YouTube).
- Per-section scene transitions, animated lower thirds, and branded outro cards.

### 🧑‍💻 AI Avatar Presenter

- Integrate **talking-head avatar** APIs (e.g. HeyGen, D-ID, Synthesia) so a virtual on-screen host lip-syncs to the generated voice-over — no camera required.
- Let users pick from a library of stock avatars or upload their own likeness.
- Avatar video is composited over B-roll background automatically.

### ✂️ In-App Video / Timeline Editor

- A **browser-based editor** (think CapCut-lite) where every element — script segments, B-roll clips, avatar track, subtitle timing, background music — lives on a single drag-and-drop timeline.
- Inline text editor lets you tweak captions frame-by-frame without re-rendering the whole video.
- One-click re-generate for individual sections; swap a B-roll clip or voice line without touching the rest.

### 🌐 Direct Platform Publishing

- OAuth connections to **YouTube, Instagram, TikTok, and LinkedIn** so you can schedule or publish finished videos directly from Scriptly.
- Auto-fill title, description, hashtags, and thumbnail from the already-generated YouTube metadata.

### 🖼 AI Thumbnail Generator

- Generate click-worthy thumbnails using DALL·E / Stable Diffusion with the video title and hook text baked in.
- A/B thumbnail variants let you pick the best performer before publishing.

### 🎵 Background Music & Sound Effects

- AI-curated royalty-free background tracks matched to the script's emotional tone (energetic, calm, dramatic).
- Auto-ducking so music fades under the voice-over and swells at B-roll moments.

### 🌍 Multi-Language Support

- Translate the script and regenerate voice-over in a target language with a single click.
- Subtitle files exported in the correct language for each platform.

### 📊 Analytics Dashboard

- Track views, watch-time, and engagement per published video across platforms in one unified dashboard.
- Surface AI insights — e.g. "Hooks under 5 seconds get 30 % higher retention on this channel".

### 🤝 Team Collaboration

- Role-based workspace (Creator, Editor, Reviewer) with real-time co-editing and approval workflows.
- Comment threads pinned to specific script sections or timeline timestamps.

---

## 📜 License

MIT
