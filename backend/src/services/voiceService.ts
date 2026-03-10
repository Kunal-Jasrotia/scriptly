import { ElevenLabsClient } from 'elevenlabs';
import { createClient } from '@deepgram/sdk';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export type VoiceProvider = 'elevenlabs' | 'deepgram';

// ─── Deepgram Aura 2 voices ───────────────────────────────────────────────────
// https://developers.deepgram.com/docs/tts-models
// Using aura-2-* model IDs — Deepgram's current generation
export const DEEPGRAM_VOICES = [
  {
    id: 'aura-2-asteria-en',
    label: 'Asteria',
    gender: 'F',
    style: 'Confident, warm',
  },
  { id: 'aura-2-luna-en', label: 'Luna', gender: 'F', style: 'Soft, expressive' },
  {
    id: 'aura-2-stella-en',
    label: 'Stella',
    gender: 'F',
    style: 'Bright, upbeat',
  },
  {
    id: 'aura-2-athena-en',
    label: 'Athena',
    gender: 'F',
    style: 'Authoritative',
  },
  { id: 'aura-2-hera-en', label: 'Hera', gender: 'F', style: 'Strong, regal' },
  {
    id: 'aura-2-orion-en',
    label: 'Orion',
    gender: 'M',
    style: 'Deep, confident',
  },
  {
    id: 'aura-2-arcas-en',
    label: 'Arcas',
    gender: 'M',
    style: 'Clear, energetic',
  },
  { id: 'aura-2-perseus-en', label: 'Perseus', gender: 'M', style: 'Bold, rich' },
  { id: 'aura-2-angus-en', label: 'Angus', gender: 'M', style: 'Warm, friendly' },
  {
    id: 'aura-2-orpheus-en',
    label: 'Orpheus',
    gender: 'M',
    style: 'Melodic, smooth',
  },
  {
    id: 'aura-2-helios-en',
    label: 'Helios',
    gender: 'M',
    style: 'Bright, clear',
  },
  { id: 'aura-2-zeus-en', label: 'Zeus', gender: 'M', style: 'Powerful, deep' },
] as const;

export type DeepgramVoiceId = (typeof DEEPGRAM_VOICES)[number]['id'];

// ─── ElevenLabs voices (popular presets) ─────────────────────────────────────
export const ELEVENLABS_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel', style: 'Calm, professional' },
  { id: 'AZnzlk1XvdvUeBnXmlld', label: 'Domi', style: 'Strong, confident' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella', style: 'Soft, warm' },
  { id: 'ErXwobaYiN019PkySvjV', label: 'Antoni', style: 'Deep, well-rounded' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', label: 'Elli', style: 'Young, emotional' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh', style: 'Deep, storytelling' },
  {
    id: 'VR6AewLTigWG4xSOukaG',
    label: 'Arnold',
    style: 'Crisp, authoritative',
  },
  { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam', style: 'Deep, narrative' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', label: 'Sam', style: 'Raspy, intense' },
] as const;

export type ElevenLabsVoiceId = (typeof ELEVENLABS_VOICES)[number]['id'];

// ─── Utilities ────────────────────────────────────────────────────────────────

function getStorageDir(): string {
  return path.join(process.cwd(), 'storage', 'audio');
}

/**
 * Strip SSML tags to produce plain text for Deepgram TTS.
 * Deepgram Aura does not support SSML — plain text only.
 */
function stripSSML(ssml: string): string {
  return ssml
    .replace(/<[^>]+>/g, ' ') // remove all XML/HTML tags
    .replace(/\s{2,}/g, ' ') // collapse whitespace
    .trim();
}

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────

async function generateWithElevenLabs(
  ssml: string,
  voiceId: string,
  filePath: string
): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw createError('ELEVENLABS_API_KEY not configured', 500);

  const client = new ElevenLabsClient({ apiKey });

  const audioStream = await client.textToSpeech.convert(voiceId, {
    text: ssml,
    model_id: 'eleven_turbo_v2_5',
    voice_settings: {
      stability: 0.35,
      similarity_boost: 0.8,
      style: 0.7,
      use_speaker_boost: true,
    },
  });

  await new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);

    if (audioStream && typeof (audioStream as NodeJS.ReadableStream).pipe === 'function') {
      (audioStream as NodeJS.ReadableStream).pipe(writeStream);
    } else {
      (async () => {
        try {
          for await (const chunk of audioStream as AsyncIterable<Uint8Array>) {
            writeStream.write(chunk);
          }
          writeStream.end();
        } catch (err) {
          reject(err);
        }
      })();
    }
  });
}

// ─── Deepgram Aura TTS ────────────────────────────────────────────────────────

async function generateWithDeepgram(
  plainText: string,
  voiceModel: string,
  filePath: string
): Promise<void> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw createError('DEEPGRAM_API_KEY not configured', 500);

  const deepgram = createClient(apiKey);

  const response = await deepgram.speak.request(
    { text: plainText },
    // encoding: "mp3" is required — default is audio/l16 (raw PCM) which browsers cannot play
    { model: voiceModel, encoding: 'mp3', speed: 0.85 }
  );

  const stream = await response.getStream();
  if (!stream) throw createError('Deepgram TTS returned no audio stream', 502);

  // Write stream to file
  await new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);

    const reader = stream.getReader();

    function pump(): void {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            writeStream.end();
            return;
          }
          writeStream.write(value);
          pump();
        })
        .catch(reject);
    }

    pump();
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface GenerateVoiceOptions {
  provider?: VoiceProvider;
  /** ElevenLabs voice ID or Deepgram Aura model ID */
  voice?: string;
}

export async function generateVoice(
  scriptId: string,
  options: GenerateVoiceOptions = {}
): Promise<{
  audioUrl: string;
  filePath: string;
  provider: VoiceProvider;
  voice: string;
}> {
  const provider: VoiceProvider = options.provider ?? 'elevenlabs';

  // Verify script exists and is approved
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    include: { audio: true },
  });

  if (!script) throw createError('Script not found', 404);
  if (!script.approved) throw createError('Script must be approved before generating voice', 403);

  // Ensure storage dir exists
  const outputDir = getStorageDir();
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, `${scriptId}.mp3`);

  let resolvedVoice: string;

  if (provider === 'elevenlabs') {
    resolvedVoice = options.voice || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel (default)

    await generateWithElevenLabs(script.ssml_voice_script, resolvedVoice, filePath);
  } else {
    resolvedVoice = options.voice || process.env.DEEPGRAM_VOICE_MODEL || 'aura-2-asteria-en'; // Asteria (default)

    // Deepgram Aura does not support SSML — strip tags to plain text
    const plainText = stripSSML(script.ssml_voice_script);
    await generateWithDeepgram(plainText, resolvedVoice, filePath);
  }

  // Estimate duration from file size (~16kbps mp3 ≈ 2KB/s)
  const stats = fs.statSync(filePath);
  const estimatedDuration = stats.size / 2000;

  // Upsert audio record in DB
  if (script.audio) {
    await prisma.audio.update({
      where: { scriptId },
      data: { filePath, duration: estimatedDuration },
    });
  } else {
    await prisma.audio.create({
      data: { scriptId, filePath, duration: estimatedDuration },
    });
  }

  const audioUrl = `/storage/audio/${scriptId}.mp3`;
  return { audioUrl, filePath, provider, voice: resolvedVoice };
}

/** Helper exports so the frontend can discover available voices */
