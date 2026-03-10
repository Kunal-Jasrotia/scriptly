import { Request, Response, NextFunction } from 'express';
import {
  generateVoice,
  DEEPGRAM_VOICES,
  ELEVENLABS_VOICES,
  VoiceProvider,
} from '../services/voiceService';
import { createError } from '../middleware/errorHandler';

const VALID_PROVIDERS: VoiceProvider[] = ['elevenlabs', 'deepgram'];

export async function handleGenerateVoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { scriptId } = req.params;

    // Optional: provider ('elevenlabs' | 'deepgram'), voice (voice ID / model ID)
    const { provider, voice } = req.body as { provider?: string; voice?: string };

    if (provider && !VALID_PROVIDERS.includes(provider as VoiceProvider)) {
      return next(createError(`Invalid provider. Use: ${VALID_PROVIDERS.join(' | ')}`, 400));
    }

    const result = await generateVoice(scriptId, {
      provider: (provider as VoiceProvider) || 'elevenlabs',
      voice: voice || undefined,
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

/** Return available voices for both providers so the frontend doesn't hard-code them */
export function handleListVoices(_req: Request, res: Response) {
  res.json({
    success: true,
    data: {
      elevenlabs: ELEVENLABS_VOICES,
      deepgram: DEEPGRAM_VOICES,
    },
  });
}
