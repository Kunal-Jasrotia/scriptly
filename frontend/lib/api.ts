const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}/api${path}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json = await res.json().catch(() => ({ error: 'Invalid JSON response' }));

  if (!res.ok) {
    throw new ApiError(res.status, json.error || `Request failed: ${res.status}`);
  }

  return json.data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScriptClean {
  hook: string;
  body: { section: string; text: string }[];
  cta: string;
}

export interface ScriptVersion {
  id: string;
  scriptId: string;
  versionNumber: number;
  script_clean: ScriptClean;
  ssml_voice_script: string;
  createdAt: string;
}

export interface Audio {
  id: string;
  scriptId: string;
  filePath: string;
  duration: number | null;
  createdAt: string;
}

export interface Transcription {
  id: string;
  scriptId: string;
  raw_json: object;
  srt_path: string;
  createdAt: string;
}

export interface Script {
  id: string;
  topic: string;
  audience: string;
  duration: number;
  tone: string;
  researchUrls: string[];
  research_summary: string | null;
  script_clean: ScriptClean;
  ssml_voice_script: string;
  caption: string | null;
  hashtags: string[];
  yt_title: string | null;
  yt_description: string | null;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  versions?: ScriptVersion[];
  audio?: Audio | null;
  transcription?: Transcription | null;
}

export interface ScriptListItem {
  id: string;
  topic: string;
  audience: string;
  duration: number;
  tone: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { versions: number };
}

// ─── Clips types ─────────────────────────────────────────────────────────────

export interface PexelsClip {
  id: number;
  thumbnail: string;
  duration: number;
  hdUrl: string;
  sdUrl: string;
  pexelsUrl: string;
  photographer: string;
  width: number;
  height: number;
}

export interface ClipSection {
  sectionIndex: number;
  sectionLabel: string;
  sectionText: string;
  keyword: string;
  clips: PexelsClip[];
}

// ─── Voice provider types ────────────────────────────────────────────────────

export type VoiceProvider = 'elevenlabs' | 'deepgram';

export interface VoiceOption {
  id: string;
  label: string;
  gender?: string;
  style: string;
}

export interface VoicesResponse {
  elevenlabs: VoiceOption[];
  deepgram: VoiceOption[];
}

export interface VoiceGenerateResult {
  audioUrl: string;
  filePath: string;
  provider: VoiceProvider;
  voice: string;
}

// ─── API methods ─────────────────────────────────────────────────────────────

export const api = {
  scripts: {
    list: () => request<ScriptListItem[]>('/scripts'),

    get: (id: string) => request<Script>(`/scripts/${id}`),

    create: (data: {
      topic: string;
      audience: string;
      duration: number;
      tone: string;
      researchUrls?: string[];
      contextSummary?: string;
    }) =>
      request<Script>('/scripts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: { script_clean?: ScriptClean; ssml_voice_script?: string }) =>
      request<Script>(`/scripts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    refine: (id: string, feedback: string) =>
      request<Script>(`/scripts/${id}/refine`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
      }),

    approve: (id: string) =>
      request<Script>(`/scripts/${id}/approve`, { method: 'PATCH' }),
  },

  voice: {
    /** Fetch all available voices for both providers */
    listVoices: () => request<VoicesResponse>('/scripts/voices'),

    /**
     * Generate voice audio for a script.
     * @param provider - 'elevenlabs' (SSML-based) or 'deepgram' (Aura, plain text)
     * @param voice    - Voice ID / model string (optional — uses server default if omitted)
     */
    generate: (scriptId: string, provider: VoiceProvider = 'elevenlabs', voice?: string) =>
      request<VoiceGenerateResult>(`/scripts/${scriptId}/voice`, {
        method: 'POST',
        body: JSON.stringify({ provider, ...(voice ? { voice } : {}) }),
      }),
  },

  transcription: {
    transcribe: (scriptId: string) =>
      request<{ srtPath: string; utteranceCount: number; wordCount: number }>(
        `/scripts/${scriptId}/transcribe`,
        { method: 'POST' }
      ),

    getSRT: (scriptId: string) =>
      request<{ srt: string }>(`/scripts/${scriptId}/subtitles`),
  },

  clips: {
    /** Fetch previously generated clips (returns null if not yet generated) */
    get: (scriptId: string) =>
      request<ClipSection[] | null>(`/scripts/${scriptId}/clips`),

    /** Generate (or regenerate) B-roll clips via Pexels for each script section */
    generate: (scriptId: string) =>
      request<ClipSection[]>(`/scripts/${scriptId}/clips`, { method: 'POST' }),
  },
};

export { ApiError };
