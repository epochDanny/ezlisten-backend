import mongoose from 'mongoose';

import { Audiobook } from '../models/Audiobook.js';
import { FilterTag } from '../models/FilterTag.js';
import { TranscriptSegment } from '../models/TranscriptSegment.js';

/** MVP stand-in for Whisper + classifier: seeds transcript + filter tags. */
export async function runMockPipeline(audiobookId: string): Promise<void> {
  const id = new mongoose.Types.ObjectId(audiobookId);
  await TranscriptSegment.deleteMany({ audiobookId: id });
  await FilterTag.deleteMany({ audiobookId: id });

  await TranscriptSegment.insertMany([
    {
      audiobookId: id,
      startMs: 0,
      endMs: 1200,
      text: '[Test profanity cue]',
    },
    {
      audiobookId: id,
      startMs: 1200,
      endMs: 8000,
      text: '[Body — illustrative transcript segment]',
    },
    {
      audiobookId: id,
      startMs: 8000,
      endMs: 15_000,
      text: '[Outro — illustrative transcript segment]',
    },
  ]);

  await FilterTag.insertMany([
    {
      audiobookId: id,
      category: 'profanity',
      action: 'bleep',
      severity: 2,
      startMs: 0,
      endMs: 1200,
      originalText: 'damn',
    },
    {
      audiobookId: id,
      category: 'violence',
      action: 'mute',
      severity: 1,
      startMs: 8000,
      endMs: 10_000,
      originalText: '[illustrative]',
    },
    {
      audiobookId: id,
      category: 'sexual_content',
      action: 'bleep',
      severity: 3,
      startMs: 11_000,
      endMs: 12_500,
      originalText: '[illustrative]',
    },
  ]);

  await Audiobook.findByIdAndUpdate(id, {
    status: 'ready',
    durationMs: 15_000,
  });
}
