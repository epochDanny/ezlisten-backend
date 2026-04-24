import mongoose from 'mongoose';

const filterTagSchema = new mongoose.Schema(
  {
    audiobookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Audiobook',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'profanity',
        'sexual_content',
        'violence',
        'substance_use',
        'religious_profanity',
      ],
      required: true,
    },
    action: {
      type: String,
      enum: ['mute', 'skip', 'bleep'],
      required: true,
    },
    severity: { type: Number, enum: [1, 2, 3], required: true },
    startMs: { type: Number, required: true },
    endMs: { type: Number, required: true },
    originalText: { type: String, required: true },
    replacementText: { type: String },
  },
  { versionKey: false },
);

export const FilterTag = mongoose.model('FilterTag', filterTagSchema);
