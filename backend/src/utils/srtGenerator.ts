export interface DeepgramUtterance {
  start: number;
  end: number;
  transcript: string;
  confidence?: number;
  words?: DeepgramWord[];
}

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

/**
 * Format a time in seconds to SRT timecode format: HH:MM:SS,mmm
 */
function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const pad3 = (n: number) => String(n).padStart(3, '0');

  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(ms)}`;
}

/**
 * Generate an SRT subtitle file string from Deepgram utterances.
 * Each utterance becomes one subtitle block.
 */
export function generateSRT(utterances: DeepgramUtterance[]): string {
  if (!utterances || utterances.length === 0) {
    return '1\n00:00:00,000 --> 00:00:01,000\n[No transcription available]\n';
  }

  return utterances
    .map((utt, index) => {
      const startCode = formatTimecode(utt.start);
      const endCode = formatTimecode(utt.end);
      const text = utt.transcript.trim();

      return `${index + 1}\n${startCode} --> ${endCode}\n${text}`;
    })
    .join('\n\n') + '\n';
}

/**
 * Generate word-level SRT (each word is its own subtitle block).
 * Useful for karaoke-style captions.
 */
export function generateWordLevelSRT(words: DeepgramWord[]): string {
  if (!words || words.length === 0) {
    return '1\n00:00:00,000 --> 00:00:01,000\n[No words available]\n';
  }

  return words
    .map((word, index) => {
      const startCode = formatTimecode(word.start);
      const endCode = formatTimecode(word.end);
      const text = (word.punctuated_word || word.word).trim();

      return `${index + 1}\n${startCode} --> ${endCode}\n${text}`;
    })
    .join('\n\n') + '\n';
}
