import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';

import { authRouter } from './routes/auth.js';
import { audiobooksRouter } from './routes/audiobooks.js';
import { playbackRouter } from './routes/playback.js';
import { usersRouter } from './routes/users.js';

const PORT = Number(process.env.PORT ?? 3000);
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const MONGODB_URI =
  process.env.MONGO_URL ??
  process.env.MONGODB_URL ??
  process.env.MONGODB_URI ??
  (NODE_ENV === 'production' ? undefined : 'mongodb://localhost:27017/ezlisten');

async function main() {
  if (!MONGODB_URI) {
    throw new Error(
      'MongoDB connection string not found. Please set MONGO_URL, MONGODB_URL, or MONGODB_URI.',
    );
  }

  await mongoose.connect(MONGODB_URI);

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  const filesDir = path.join(process.cwd(), 'uploads', 'files');
  app.use('/files', express.static(filesDir));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/auth', authRouter);
  app.use('/audiobooks', audiobooksRouter);
  app.use('/playback', playbackRouter);
  app.use('/users', usersRouter);

  app.listen(PORT, () => {
    console.log(`ezlisten-backend listening on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
