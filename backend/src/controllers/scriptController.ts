import { Request, Response, NextFunction } from 'express';
import {
  createScript,
  listScripts,
  getScript,
  updateScript,
  refineScript,
  approveScript,
} from '../services/scriptService';
import { createError } from '../middleware/errorHandler';

export async function handleCreateScript(req: Request, res: Response, next: NextFunction) {
  try {
    const { topic, audience, duration, tone, researchUrls, contextSummary } = req.body;

    if (!topic || !audience || !duration || !tone) {
      return next(createError('topic, audience, duration, and tone are required', 400));
    }

    if (typeof duration !== 'number' || duration < 15 || duration > 600) {
      return next(createError('duration must be a number between 15 and 600 seconds', 400));
    }

    const script = await createScript({
      topic,
      audience,
      duration,
      tone,
      researchUrls: Array.isArray(researchUrls) ? researchUrls : [],
      contextSummary: typeof contextSummary === 'string' ? contextSummary : '',
    });

    return res.status(201).json({ success: true, data: script });
  } catch (err) {
    return next(err);
  }
}

export async function handleListScripts(req: Request, res: Response, next: NextFunction) {
  try {
    const scripts = await listScripts();
    return res.json({ success: true, data: scripts });
  } catch (err) {
    return next(err);
  }
}

export async function handleGetScript(req: Request, res: Response, next: NextFunction) {
  try {
    const script = await getScript(req.params.id);
    return res.json({ success: true, data: script });
  } catch (err) {
    return next(err);
  }
}

export async function handleUpdateScript(req: Request, res: Response, next: NextFunction) {
  try {
    const { script_clean, ssml_voice_script } = req.body;

    if (!script_clean && !ssml_voice_script) {
      return next(createError('Provide script_clean or ssml_voice_script to update', 400));
    }

    const updated = await updateScript(req.params.id, {
      ...(script_clean && { script_clean }),
      ...(ssml_voice_script && { ssml_voice_script }),
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    return next(err);
  }
}

export async function handleRefineScript(req: Request, res: Response, next: NextFunction) {
  try {
    const { feedback } = req.body;

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length < 5) {
      return next(createError('feedback must be a non-empty string', 400));
    }

    const updated = await refineScript(req.params.id, feedback.trim());
    return res.json({ success: true, data: updated });
  } catch (err) {
    return next(err);
  }
}

export async function handleApproveScript(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await approveScript(req.params.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return next(err);
  }
}
