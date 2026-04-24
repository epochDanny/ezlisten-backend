import mongoose from 'mongoose';

const userPlaybackStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    audiobookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Audiobook',
      required: true,
      index: true,
    },
    currentPositionMs: { type: Number, default: 0 },
    selectedFilters: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

userPlaybackStateSchema.index({ userId: 1, audiobookId: 1 }, { unique: true });

export const UserPlaybackState = mongoose.model(
  'UserPlaybackState',
  userPlaybackStateSchema,
);
