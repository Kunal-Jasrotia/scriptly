import { Router } from 'express';
import { handleGenerateVoice, handleListVoices } from '../controllers/voiceController';
import { generationRateLimiter } from '../middleware/rateLimiter';

export const voiceRouter = Router();

// List available voices for both providers (no rate limit — cheap endpoint)
voiceRouter.get('/voices', handleListVoices);

// Generate voice for an approved script (provider + voice in body)
voiceRouter.post('/:scriptId/voice', generationRateLimiter, handleGenerateVoice);
