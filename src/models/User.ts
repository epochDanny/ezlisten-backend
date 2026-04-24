import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active'],
      default: 'none',
    },
    filterPreferences: {
      enabledCategories: { type: mongoose.Schema.Types.Mixed, default: {} },
      filterAction: {
        type: String,
        enum: ['mute', 'skip', 'bleep'],
        default: 'skip',
      },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type UserDoc = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model('User', userSchema);
