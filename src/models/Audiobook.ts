import mongoose from 'mongoose';

const audiobookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    author: { type: String, required: true },
    audioFileUrl: { type: String, required: true },
    durationMs: { type: Number, required: true },
    coverImageUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'ready', 'failed'],
      default: 'processing',
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type AudiobookDoc = mongoose.InferSchemaType<typeof audiobookSchema>;
export const Audiobook = mongoose.model('Audiobook', audiobookSchema);
