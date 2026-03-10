import { Request, Response, NextFunction } from 'express';
import { transcribeAudio, getSRT } from '../services/deepgramService';

export async function handleTranscribe(req: Request, res: Response, next: NextFunction) {
  try {
    const { scriptId } = req.params;
    const result = await transcribeAudio(scriptId);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

export async function handleGetSubtitles(req: Request, res: Response, next: NextFunction) {
  try {
    const { scriptId } = req.params;
    const srt = await getSRT(scriptId);

    // Return as plain text (SRT format) or JSON based on Accept header
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/plain')) {
      res.setHeader('Content-Type', 'text/plain');
      return res.send(srt);
    }

    return res.json({ success: true, data: { srt } });
  } catch (err) {
    return next(err);
  }
}
