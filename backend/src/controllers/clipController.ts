import { Request, Response, NextFunction } from 'express';
import { generateClips, getClips } from '../services/clipService';

export async function handleGetClips(req: Request, res: Response, next: NextFunction) {
  try {
    const clips = await getClips(req.params.id);
    return res.json({ success: true, data: clips });
  } catch (err) {
    return next(err);
  }
}

export async function handleGenerateClips(req: Request, res: Response, next: NextFunction) {
  try {
    const clips = await generateClips(req.params.id);
    return res.json({ success: true, data: clips });
  } catch (err) {
    return next(err);
  }
}
