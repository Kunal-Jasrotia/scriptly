import { Router } from 'express';
import { handleGetClips, handleGenerateClips } from '../controllers/clipController';
import { generationRateLimiter } from '../middleware/rateLimiter';

export const clipRouter = Router();

// GET  /api/scripts/:id/clips  — fetch stored clips (null if not yet generated)
clipRouter.get('/:id/clips', handleGetClips);

// POST /api/scripts/:id/clips  — generate (or regenerate) clips via Pexels
clipRouter.post('/:id/clips', generationRateLimiter, handleGenerateClips);
