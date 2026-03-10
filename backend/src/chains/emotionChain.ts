import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const emotionPromptTemplate = PromptTemplate.fromTemplate(`
You are a voice direction specialist for cinematic AI voiceovers using ElevenLabs.

Take the existing SSML script below and enhance it with richer emotional pacing and dynamics.

ORIGINAL SSML:
{ssml_input}

TONE DIRECTION: {tone}

ENHANCEMENT RULES — STRICT ElevenLabs COMPATIBILITY:
1. ONLY use these supported tags:
   - <speak> ... </speak>  (wrapper — required)
   - <break time="Xms"/>  (pause in milliseconds, e.g. 200ms, 500ms, 800ms)
   - <prosody rate="slow|x-slow|fast|x-fast|medium">  (speaking speed)
   - <prosody volume="loud|soft|medium|x-loud|x-soft">  (volume)

2. DO NOT use any of these (ElevenLabs will reject or ignore them):
   - <emphasis>
   - <prosody pitch="...">
   - <say-as>
   - <phoneme>
   - <sub>
   - <lang>

3. Pacing rules:
   - Add <break time="600ms"/> between major sections
   - Add <break time="300ms"/> after impactful statements
   - Add <break time="150ms"/> before important single words
   - Use <prosody rate="slow"> on emotional/climactic lines
   - Use <prosody rate="fast"> on rapid list sections or high-energy parts
   - Use <prosody volume="loud"> on key power words or phrases

4. The output must:
   - Start exactly with <speak>
   - End exactly with </speak>
   - Contain NO text outside the <speak> tags
   - Preserve all original script content

Return ONLY the enhanced SSML. Nothing else.
`);

export async function enhanceWithEmotion(ssml: string, tone: string): Promise<string> {
  const model = new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0.4,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const chain = emotionPromptTemplate.pipe(model).pipe(new StringOutputParser());

  try {
    const enhanced = await chain.invoke({
      ssml_input: ssml,
      tone,
    });

    const trimmed = enhanced.trim();

    // Validate output is valid SSML wrapper
    if (!trimmed.startsWith('<speak>') || !trimmed.endsWith('</speak>')) {
      console.warn('[EmotionChain] Returned malformed SSML — falling back to original');
      return ssml;
    }

    return trimmed;
  } catch (err) {
    console.warn(
      '[EmotionChain] Enhancement failed — using original SSML:',
      (err as Error).message
    );
    return ssml;
  }
}
