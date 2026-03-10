/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import axios from 'axios';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PexelsClip {
  id: number;
  thumbnail: string; // preview image URL
  duration: number; // seconds
  hdUrl: string; // HD MP4 download link
  sdUrl: string; // SD MP4 download link (smaller, faster)
  pexelsUrl: string; // attribution link (required by Pexels license)
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

// ─── Keyword extraction ───────────────────────────────────────────────────────

async function extractKeywords(
  sections: { label: string; text: string }[],
  topic: string
): Promise<string[]> {
  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const sectionList = sections
    .map((s, i) => `${i}. [${s.label}]: "${s.text.slice(0, 120)}"`)
    .join('\n');

  const response = await model.invoke([
    new SystemMessage(
      'You extract Pexels stock video search keywords. ' +
        'For each script section, return a 2-3 word visual search query that would find relevant B-roll footage. ' +
        'Rules: use concrete visual nouns, avoid brand names, prefer action-oriented terms. ' +
        'Return ONLY a JSON array of strings, exactly one per section, no explanation.'
    ),
    new HumanMessage(
      `Video topic: "${topic}"\n\nScript sections:\n${sectionList}\n\n` +
        'Return a JSON array with one search keyword string per section.'
    ),
  ]);

  try {
    const text = (response.content as string)
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const keywords = JSON.parse(text);
    if (Array.isArray(keywords) && keywords.length === sections.length) {
      return keywords.map(String);
    }
  } catch {
    // fall through to default
  }

  // Fallback: derive keywords from section labels + topic
  return sections.map((s) =>
    s.label === 'Hook' || s.label === 'Call to Action' ? topic : `${s.label.toLowerCase()} concept`
  );
}

// ─── Pexels video search ──────────────────────────────────────────────────────

async function searchPexels(query: string, count = 3): Promise<PexelsClip[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey)
    throw createError('PEXELS_API_KEY not configured. Get a free key at pexels.com/api', 500);

  const response = await axios.get('https://api.pexels.com/videos/search', {
    headers: { Authorization: apiKey },
    params: {
      query,
      per_page: count,
      orientation: 'portrait', // vertical — ideal for short-form video
      size: 'small', // max duration ~30s per clip
    },
    timeout: 10_000,
  });

  const videos: any[] = response.data.videos || [];

  return videos.map((v): PexelsClip => {
    const files: any[] = v.video_files || [];

    // Pick best portrait file per quality level
    const findBest = (quality: string) =>
      files.find((f) => f.quality === quality && f.width <= f.height) ||
      files.find((f) => f.quality === quality) ||
      null;

    const hd = findBest('hd') || findBest('sd') || files[0] || {};
    const sd = findBest('sd') || hd;

    return {
      id: v.id,
      thumbnail: v.image,
      duration: v.duration,
      hdUrl: hd.link || '',
      sdUrl: sd.link || hd.link || '',
      pexelsUrl: v.url,
      photographer: v.user?.name || 'Pexels',
      width: hd.width || v.width || 0,
      height: hd.height || v.height || 0,
    };
  });
}

// ─── Main exports ─────────────────────────────────────────────────────────────

export async function generateClips(scriptId: string): Promise<ClipSection[]> {
  const script = await prisma.script.findUnique({ where: { id: scriptId } });
  if (!script) throw createError('Script not found', 404);

  const clean = script.script_clean as {
    hook: string;
    body: { section: string; text: string }[];
    cta: string;
  };

  // Build section list: hook + body sections + CTA
  const sections: { label: string; text: string }[] = [
    { label: 'Hook', text: clean.hook },
    ...clean.body.map((b) => ({ label: b.section, text: b.text })),
    { label: 'Call to Action', text: clean.cta },
  ];

  // Step 1 — extract Pexels keywords for all sections in one GPT call
  const keywords = await extractKeywords(sections, script.topic);

  // Step 2 — search Pexels for each section in parallel (tolerant of per-section failures)
  const clipSections: ClipSection[] = await Promise.all(
    sections.map(async (section, i): Promise<ClipSection> => {
      const keyword = keywords[i] || script.topic;
      let clips: PexelsClip[] = [];

      try {
        clips = await searchPexels(keyword, 3);
      } catch (err) {
        // One section failing won't break the rest — clips will be empty for that section
        console.error(`[clips] Pexels search failed for "${keyword}":`, err);
      }

      return {
        sectionIndex: i,
        sectionLabel: section.label,
        sectionText: section.text,
        keyword,
        clips,
      };
    })
  );

  // Step 3 — persist to DB
  await prisma.script.update({
    where: { id: scriptId },
    data: { video_clips: clipSections as object[] },
  });

  return clipSections;
}

export async function getClips(scriptId: string): Promise<ClipSection[] | null> {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    select: { id: true, video_clips: true },
  });
  if (!script) throw createError('Script not found', 404);

  return (script.video_clips as ClipSection[] | null) ?? null;
}
