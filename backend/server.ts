import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { scriptRouter } from './src/routes/scriptRoutes';
import { voiceRouter } from './src/routes/voiceRoutes';
import { transcriptionRouter } from './src/routes/transcriptionRoutes';
import { clipRouter } from './src/routes/clipRoutes';
import { errorHandler } from './src/middleware/errorHandler';
import { apiRateLimiter } from './src/middleware/rateLimiter';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security middleware ─────────────────────────────────────────────────────
app.use(
  helmet({
    // Allow audio streaming from same origin
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Request parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ─── Static file serving (audio + subtitles) ─────────────────────────────────
// express.static handles HTTP Range requests automatically — required for <audio> seeking
app.use(
  '/storage',
  express.static(path.join(process.cwd(), 'storage'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
      }
      if (filePath.endsWith('.srt')) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }
    },
  })
);

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRateLimiter);
// voiceRouter and transcriptionRouter first — their named routes (/voices, /:id/voice,
// /:id/transcribe, /:id/subtitles) must be registered before scriptRouter's /:id wildcard,
// otherwise Express matches "voices" as a script ID and returns 404.
app.use('/api/scripts', voiceRouter);
app.use('/api/scripts', transcriptionRouter);
app.use('/api/scripts', clipRouter);   // /:id/clips — before scriptRouter's /:id wildcard
app.use('/api/scripts', scriptRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 AI Short Script Studio backend running at http://localhost:${PORT}`);
});

export default app;
