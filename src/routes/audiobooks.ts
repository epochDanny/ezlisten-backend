import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { isValidObjectId } from 'mongoose';

import type { AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { Audiobook } from '../models/Audiobook.js';
import { FilterTag } from '../models/FilterTag.js';
import { TranscriptSegment } from '../models/TranscriptSegment.js';
import { UserPlaybackState } from '../models/UserPlaybackState.js';
import { runMockPipeline } from '../services/mockPipeline.js';

const CONFIGURED_PUBLIC_BASE = process.env.PUBLIC_BASE_URL?.replace(/\/$/, '');

const uploadRoot = path.join(process.cwd(), 'uploads');
const incomingDir = path.join(uploadRoot, 'incoming');
const filesDir = path.join(uploadRoot, 'files');

function ensureDirs() {
  for (const d of [uploadRoot, incomingDir, filesDir]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function getPublicBaseUrl(req: AuthedRequest): string {
  if (CONFIGURED_PUBLIC_BASE) return CONFIGURED_PUBLIC_BASE;
  const host = req.get('host') ?? 'localhost:3000';
  return `${req.protocol}://${host}`;
}

ensureDirs();

const upload = multer({ dest: incomingDir });

function rejectInvalidAudiobookId(id: string, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (isValidObjectId(id)) return false;
  res.status(404).json({ message: 'Not found' });
  return true;
}

export const audiobooksRouter = Router();

audiobooksRouter.use(requireAuth);

audiobooksRouter.get('/', async (req: AuthedRequest, res) => {
  const books = await Audiobook.find({ userId: req.userId }).sort({
    createdAt: -1,
  });
  res.json(
    books.map((b) => ({
      _id: b._id,
      title: b.title,
      author: b.author,
      audioFileUrl: b.audioFileUrl,
      durationMs: b.durationMs,
      coverImageUrl: b.coverImageUrl,
      status: b.status,
      createdAt: b.createdAt,
    })),
  );
});

audiobooksRouter.post(
  '/upload',
  upload.single('audio'),
  async (req: AuthedRequest, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'Missing audio file (field: audio)' });
        return;
      }
      const title = String(req.body?.title ?? 'Untitled').trim();
      const author = String(req.body?.author ?? 'Unknown').trim();
      const ext = path.extname(req.file.originalname) || '.mp3';
      const localName = `${randomUUID()}${ext}`;
      const dest = path.join(filesDir, localName);
      fs.renameSync(req.file.path, dest);
      const audioFileUrl = `${getPublicBaseUrl(req)}/files/${localName}`;
      const book = await Audiobook.create({
        userId: req.userId,
        title,
        author,
        audioFileUrl,
        durationMs: 15_000,
        coverImageUrl: '',
        status: 'processing',
      });
      await runMockPipeline(book._id.toString());
      const fresh = await Audiobook.findById(book._id);
      res.status(201).json({
        _id: fresh?._id,
        title: fresh?.title,
        author: fresh?.author,
        audioFileUrl: fresh?.audioFileUrl,
        durationMs: fresh?.durationMs,
        coverImageUrl: fresh?.coverImageUrl,
        status: fresh?.status,
        createdAt: fresh?.createdAt,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Upload failed' });
    }
  },
);

audiobooksRouter.get('/:id', async (req: AuthedRequest, res) => {
  if (rejectInvalidAudiobookId(req.params.id, res)) return;

  const book = await Audiobook.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!book) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  res.json({
    _id: book._id,
    title: book.title,
    author: book.author,
    audioFileUrl: book.audioFileUrl,
    durationMs: book.durationMs,
    coverImageUrl: book.coverImageUrl,
    status: book.status,
    createdAt: book.createdAt,
  });
});

audiobooksRouter.delete('/:id', async (req: AuthedRequest, res) => {
  if (rejectInvalidAudiobookId(req.params.id, res)) return;

  const book = await Audiobook.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!book) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  const url = book.audioFileUrl;
  const filename = url.split('/files/')[1];
  if (filename) {
    const fp = path.join(filesDir, path.basename(filename));
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  await TranscriptSegment.deleteMany({ audiobookId: book._id });
  await FilterTag.deleteMany({ audiobookId: book._id });
  await UserPlaybackState.deleteMany({ audiobookId: book._id });
  await book.deleteOne();
  res.status(204).send();
});

audiobooksRouter.get('/:id/transcript', async (req: AuthedRequest, res) => {
  if (rejectInvalidAudiobookId(req.params.id, res)) return;

  const book = await Audiobook.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!book) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  const segments = await TranscriptSegment.find({ audiobookId: book._id }).sort(
    { startMs: 1 },
  );
  res.json(
    segments.map((s) => ({
      _id: s._id,
      audiobookId: s.audiobookId,
      startMs: s.startMs,
      endMs: s.endMs,
      text: s.text,
    })),
  );
});

audiobooksRouter.get('/:id/filter-tags', async (req: AuthedRequest, res) => {
  if (rejectInvalidAudiobookId(req.params.id, res)) return;

  const book = await Audiobook.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!book) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  const tags = await FilterTag.find({ audiobookId: book._id }).sort({
    startMs: 1,
  });
  res.json(
    tags.map((t) => ({
      _id: t._id,
      audiobookId: t.audiobookId.toString(),
      category: t.category,
      action: t.action,
      severity: t.severity,
      startMs: t.startMs,
      endMs: t.endMs,
      originalText: t.originalText,
      replacementText: t.replacementText,
    })),
  );
});
