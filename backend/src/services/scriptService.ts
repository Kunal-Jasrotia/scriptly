import { PrismaClient } from '@prisma/client';
import { researchUrls } from './researchService';
import { generateScript } from '../chains/scriptChain';
import { enhanceWithEmotion } from '../chains/emotionChain';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface CreateScriptInput {
  topic: string;
  audience: string;
  duration: number;
  tone: string;
  researchUrls?: string[];
  /** Optional free-form context the user pastes directly (notes, article summaries, bullet points, etc.) */
  contextSummary?: string;
}

export async function createScript(input: CreateScriptInput) {
  const { topic, audience, duration, tone, researchUrls: urls = [], contextSummary = '' } = input;

  // Step 1: Research phase
  // a) Scrape any provided URLs
  const urlResearch = urls.length > 0 ? await researchUrls(urls) : '';
  // b) Merge user-pasted context + scraped content (user context goes first — it's most specific)
  const research_summary = [contextSummary.trim(), urlResearch.trim()]
    .filter(Boolean)
    .join('\n\n---\n\n');

  // Step 2: Generate script via LangChain structured output
  const generated = await generateScript({
    topic,
    audience,
    duration,
    tone,
    research_summary,
  });

  // Step 3: Enhance SSML with emotional pacing
  // ssml_voice_script now lives inside script_clean (matches LLM's natural output)
  const enhanced_ssml = await enhanceWithEmotion(generated.script_clean.ssml_voice_script, tone);

  // Step 4: Persist to database
  // Store only hook/body/cta in script_clean — all other generated fields go to top-level columns
  const {
    ssml_voice_script: _ssml,
    caption,
    hashtags,
    yt_title,
    yt_description,
    ...cleanOnly
  } = generated.script_clean;

  const script = await prisma.script.create({
    data: {
      topic,
      audience,
      duration,
      tone,
      researchUrls: urls,
      research_summary: generated.research_summary || research_summary || null,
      script_clean: cleanOnly as object,
      ssml_voice_script: enhanced_ssml,
      caption: caption || null,
      hashtags: hashtags || [],
      yt_title: yt_title || null,
      yt_description: yt_description || null,
      approved: false,
    },
  });

  return script;
}

export async function listScripts() {
  return prisma.script.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      topic: true,
      audience: true,
      duration: true,
      tone: true,
      approved: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { versions: true } },
    },
  });
}

export async function getScript(id: string) {
  const script = await prisma.script.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { versionNumber: 'desc' } },
      audio: true,
      transcription: true,
    },
  });

  if (!script) {
    throw createError('Script not found', 404);
  }

  return script;
}

export async function updateScript(
  id: string,
  data: { script_clean?: object; ssml_voice_script?: string }
) {
  const script = await prisma.script.findUnique({ where: { id } });
  if (!script) throw createError('Script not found', 404);

  return prisma.script.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function refineScript(id: string, feedback: string) {
  const script = await prisma.script.findUnique({ where: { id } });
  if (!script) throw createError('Script not found', 404);

  // Get current version count for incrementing
  const versionCount = await prisma.scriptVersion.count({ where: { scriptId: id } });

  // Save current version before overwriting
  await prisma.scriptVersion.create({
    data: {
      scriptId: id,
      versionNumber: versionCount + 1,
      script_clean: script.script_clean as object,
      ssml_voice_script: script.ssml_voice_script,
    },
  });

  // Re-generate with feedback incorporated
  const currentClean = script.script_clean as {
    hook: string;
    body: { section: string; text: string }[];
    cta: string;
  };

  const currentScriptText = [
    `HOOK: ${currentClean.hook}`,
    ...currentClean.body.map((b) => `${b.section}: ${b.text}`),
    `CTA: ${currentClean.cta}`,
  ].join('\n');

  const { ChatOpenAI } = await import('@langchain/openai');
  const { HumanMessage, SystemMessage } = await import('@langchain/core/messages');

  const model = new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const response = await model.invoke([
    new SystemMessage(
      'You are an expert script editor. The user wants to refine their short-form video script. ' +
        'Apply the feedback to improve the script. Keep the same structure (hook, body sections, cta). ' +
        'Maintain the tone and target audience. Return ONLY a JSON object with keys: ' +
        '"hook" (string), "body" (array of {section, text}), "cta" (string). No markdown, no explanation.'
    ),
    new HumanMessage(
      `Current script:\n${currentScriptText}\n\nFeedback to apply:\n${feedback}\n\nTone: ${script.tone}\nAudience: ${script.audience}`
    ),
  ]);

  let refined_clean: typeof currentClean;
  try {
    const jsonText = (response.content as string)
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    refined_clean = JSON.parse(jsonText);
  } catch {
    throw createError('Failed to parse refined script. Please try again.', 422);
  }

  // Re-enhance SSML
  const { generateScript } = await import('../chains/scriptChain');
  const regenerated = await generateScript({
    topic: script.topic,
    audience: script.audience,
    duration: script.duration,
    tone: script.tone,
    research_summary: script.research_summary || '',
  });

  const enhanced_ssml = await enhanceWithEmotion(
    regenerated.script_clean.ssml_voice_script,
    script.tone
  );

  // Update script with refined content
  const updated = await prisma.script.update({
    where: { id },
    data: {
      script_clean: refined_clean as object,
      ssml_voice_script: enhanced_ssml,
      updatedAt: new Date(),
    },
    include: {
      versions: { orderBy: { versionNumber: 'desc' } },
    },
  });

  return updated;
}

export async function approveScript(id: string) {
  const script = await prisma.script.findUnique({ where: { id } });
  if (!script) throw createError('Script not found', 404);

  return prisma.script.update({
    where: { id },
    data: { approved: true },
  });
}
