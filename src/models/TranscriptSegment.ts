import mongoose from 'mongoose';

const transcriptSegmentSchema = new mongoose.Schema(
  {
    audiobookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Audiobook',
      required: true,
      index: true,
    },
    startMs: { type: Number, required: true },
    endMs: { type: Number, required: true },
    text: { type: String, required: true },
  },
  { versionKey: false },
);

export const TranscriptSegment = mongoose.model(
  'TranscriptSegment',
  transcriptSegmentSchema,
);
