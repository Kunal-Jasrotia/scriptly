import { Router } from 'express';
import { handleTranscribe, handleGetSubtitles } from '../controllers/transcriptionController';
import { generationRateLimiter } from '../middleware/rateLimiter';

export const transcriptionRouter = Router();

// Transcribe audio via Deepgram and generate SRT
transcriptionRouter.post('/:scriptId/transcribe', generationRateLimiter, handleTranscribe);

// Get SRT subtitles for a script
transcriptionRouter.get('/:scriptId/subtitles', handleGetSubtitles);
