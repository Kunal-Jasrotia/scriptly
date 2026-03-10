import { createClient } from '@deepgram/sdk';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { generateSRT } from '../utils/srtGenerator';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

function getSubtitlesDir(): string {
  return path.join(process.cwd(), 'storage', 'subtitles');
}

export async function transcribeAudio(scriptId: string) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw createError('Deepgram API key not configured', 500);

  // Verify audio file exists
  const audio = await prisma.audio.findUnique({ where: { scriptId } });
  if (!audio) throw createError('No audio found. Generate voice first.', 404);

  if (!fs.existsSync(audio.filePath)) {
    throw createError('Audio file missing from disk. Regenerate voice.', 404);
  }

  const deepgram = createClient(apiKey);

  // Read audio file as buffer
  const audioBuffer = fs.readFileSync(audio.filePath);

  // Transcribe with Deepgram nova-2
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
    model: 'nova-2',
    smart_format: true,
    punctuate: true,
    utterances: true,
    words: true,
    mimetype: 'audio/mpeg',
  });

  if (error) {
    throw createError(`Deepgram transcription failed: ${error.message}`, 502);
  }

  if (!result || !result.results) {
    throw createError('Deepgram returned empty results', 502);
  }

  // Generate SRT from utterances (sentence-level timestamps)
  const utterances = result.results.utterances || [];
  const srtContent = generateSRT(utterances);

  // Write SRT file to disk
  const subtitlesDir = getSubtitlesDir();
  if (!fs.existsSync(subtitlesDir)) {
    fs.mkdirSync(subtitlesDir, { recursive: true });
  }

  const srtPath = path.join(subtitlesDir, `${scriptId}.srt`);
  fs.writeFileSync(srtPath, srtContent, 'utf-8');

  // Upsert transcription record in DB
  const existing = await prisma.transcription.findUnique({ where: { scriptId } });

  if (existing) {
    await prisma.transcription.update({
      where: { scriptId },
      data: {
        raw_json: result as object,
        srt_path: srtPath,
      },
    });
  } else {
    await prisma.transcription.create({
      data: {
        scriptId,
        raw_json: result as object,
        srt_path: srtPath,
      },
    });
  }

  return {
    srtPath: `/storage/subtitles/${scriptId}.srt`,
    utteranceCount: utterances.length,
    wordCount: result.results.channels?.[0]?.alternatives?.[0]?.words?.length || 0,
    transcription: result,
  };
}

export async function getSRT(scriptId: string): Promise<string> {
  const transcription = await prisma.transcription.findUnique({ where: { scriptId } });
  if (!transcription) throw createError('No transcription found. Transcribe audio first.', 404);

  if (!fs.existsSync(transcription.srt_path)) {
    throw createError('SRT file missing from disk.', 404);
  }

  return fs.readFileSync(transcription.srt_path, 'utf-8');
}
