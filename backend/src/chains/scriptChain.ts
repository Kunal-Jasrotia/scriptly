import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

const BodySectionSchema = z.object({
  section: z.string().describe('Section label, e.g. "Problem", "Solution", "Proof"'),
  text: z.string().describe('Punchy script text for this section, max 2-3 short sentences'),
});

/**
 * Flat schema — all fields at the same level.
 * The LLM reliably nests ssml_voice_script / caption / hashtags inside
 * script_clean when they live at the top level, so we co-locate everything
 * under script_clean and keep research_summary separate.
 */
const ScriptOutputSchema = z.object({
  research_summary: z
    .string()
    .describe(
      'Brief factual summary used during generation. Empty string if no research URLs were provided.'
    ),
  script_clean: z.object({
    hook: z
      .string()
      .describe('Opening 1-2 sentences that grab attention within the first 3 seconds'),
    body: z
      .array(BodySectionSchema)
      .min(2)
      .max(10)
      .describe('Ordered body sections that build toward the CTA'),
    cta: z.string().describe('Strong call-to-action closing line'),
    ssml_voice_script: z
      .string()
      .describe(
        'Full SSML markup for the ENTIRE script. Must start with <speak> and end with </speak>. ' +
          'ElevenLabs-compatible tags ONLY: <break time="Xms"/>, ' +
          '<prosody rate="slow|fast|x-slow|x-fast">, <prosody volume="loud|soft">. ' +
          'Do NOT use <emphasis>, <prosody pitch>, <say-as>, or <phoneme>.'
      ),
    caption: z.string().describe('Social media caption for the video, under 150 characters'),
    hashtags: z
      .array(z.string())
      .min(3)
      .max(10)
      .describe('Relevant hashtags including the # symbol'),
    yt_title: z
      .string()
      .describe(
        'Catchy YouTube video title. Must be under 70 characters. ' +
          'Use proven title formulas: curiosity gaps ("The REAL Reason..."), ' +
          'numbers ("5 Things Nobody Tells You About..."), power words (SHOCKING, SECRET, WARNING), ' +
          'brackets for context ("[Must Watch]", "(Honest Review)"), ' +
          'or challenge/result framing ("I Did X for 30 Days — Here\'s What Happened"). ' +
          'NEVER use a plain, generic title. Make it irresistible to click.'
      ),
    yt_description: z
      .string()
      .describe(
        'Full YouTube video description. Structure: ' +
          '1) Hook sentence (first 2 lines visible before "Show more" — make them compelling), ' +
          '2) 2-3 sentence video overview, ' +
          '3) Timestamps section placeholder (e.g. 00:00 Intro\\n00:15 [topic]...), ' +
          '4) Subscribe + like CTA line, ' +
          '5) Relevant hashtags (3-5). ' +
          'Total length: 150-300 words. Write for the target audience.'
      ),
  }),
});

export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;

const scriptPromptTemplate = PromptTemplate.fromTemplate(`
You are an expert short-form video scriptwriter who specializes in high-retention, viral content.

TASK: Generate a complete short-form video script with emotional pacing.

PARAMETERS:
- Topic: {topic}
- Target Audience: {audience}
- Duration: {duration} seconds
- Tone: {tone}
- Research Context: {research_summary}

SCRIPT WRITING RULES:
1. The hook must create immediate curiosity, shock, or relatability within the first 3 seconds
2. Write SHORT, punchy sentences — no sentence longer than 15 words
3. Maintain the "{tone}" tone throughout
4. Target word count: ~{wordCount} words total (based on 150 words/minute speaking pace)
5. NEVER hallucinate statistics — only reference facts that appear in the Research Context above
6. If Research Context is empty, use only reliable general knowledge
7. Include 2-8 tight body sections (max 8), each building toward the CTA. List-style scripts may use more sections; narrative scripts fewer.
8. End with a strong, specific call-to-action

OUTPUT STRUCTURE — return a single JSON object exactly like this:
{{
  "research_summary": "...",
  "script_clean": {{
    "hook": "...",
    "body": [{{"section": "...", "text": "..."}}],
    "cta": "...",
    "ssml_voice_script": "<speak>...</speak>",
    "caption": "...",
    "hashtags": ["#..."],
    "yt_title": "...",
    "yt_description": "..."
  }}
}}

YOUTUBE TITLE RULES (script_clean.yt_title):
- Under 70 characters
- Use ONE of these formulas:
  · Curiosity gap: "The REAL Reason [topic] Is Changing Everything"
  · Number list: "7 [topic] Secrets Nobody Talks About"
  · Challenge/result: "I Tried [topic] for 30 Days — Here's What Happened"
  · Warning/shock: "Stop Doing This With [topic] (You're Wasting Money)"
  · Brackets: "[topic] Explained in 60 Seconds [MIND-BLOWING]"
- Match the "{tone}" tone of the script

YOUTUBE DESCRIPTION RULES (script_clean.yt_description):
- First 2 lines (before "Show more"): compelling hook — tease the value, spark curiosity
- Brief overview paragraph (2-3 sentences)
- Timestamps block (use placeholder times matching the script sections)
- "Like & Subscribe" CTA sentence
- 3-5 hashtags at the bottom
- Total: 150-300 words

SSML RULES (ElevenLabs-compatible only — inside script_clean.ssml_voice_script):
- Wrap the ENTIRE script in <speak> tags
- Add <break time="500ms"/> between major sections
- Add <break time="200ms"/> after power words
- Use <prosody rate="fast"> for high-energy or listing sections
- Use <prosody rate="slow"> for emotional or climactic moments
- Use <prosody volume="loud"> for emphasis on key points
- Do NOT use <emphasis>, <prosody pitch>, <say-as>, or <phoneme> tags

Generate the complete script now.
`);

export async function generateScript(params: {
  topic: string;
  audience: string;
  duration: number;
  tone: string;
  research_summary: string;
}): Promise<ScriptOutput> {
  const model = new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const structuredModel = model.withStructuredOutput(ScriptOutputSchema, {
    name: 'generate_script',
  });

  const chain = scriptPromptTemplate.pipe(structuredModel);

  const wordCount = Math.round((params.duration / 60) * 150);

  try {
    const result = await chain.invoke({
      topic: params.topic,
      audience: params.audience,
      duration: params.duration.toString(),
      tone: params.tone,
      research_summary:
        params.research_summary || 'No external research provided. Use reliable general knowledge.',
      wordCount: wordCount.toString(),
    });

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Script generation failed: ${message}`);
  }
}
