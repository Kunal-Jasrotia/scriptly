import { Router } from 'express';
import {
  handleCreateScript,
  handleListScripts,
  handleGetScript,
  handleUpdateScript,
  handleRefineScript,
  handleApproveScript,
} from '../controllers/scriptController';
import { generationRateLimiter } from '../middleware/rateLimiter';

export const scriptRouter = Router();

// List all scripts
scriptRouter.get('/', handleListScripts);

// Get a single script
scriptRouter.get('/:id', handleGetScript);

// Create a new script (AI generation — use tighter rate limit)
scriptRouter.post('/', generationRateLimiter, handleCreateScript);

// Direct edit (no AI)
scriptRouter.patch('/:id', handleUpdateScript);

// AI-powered feedback refinement
scriptRouter.post('/:id/refine', generationRateLimiter, handleRefineScript);

// Approve script
scriptRouter.patch('/:id/approve', handleApproveScript);
