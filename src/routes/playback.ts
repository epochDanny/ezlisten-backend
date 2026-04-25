import { Router } from 'express';
import { isValidObjectId } from 'mongoose';

import type { AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { Audiobook } from '../models/Audiobook.js';
import { UserPlaybackState } from '../models/UserPlaybackState.js';

export const playbackRouter = Router();

playbackRouter.use(requireAuth);

playbackRouter.get('/:audiobookId', async (req: AuthedRequest, res) => {
  if (!isValidObjectId(req.params.audiobookId)) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  const book = await Audiobook.findOne({
    _id: req.params.audiobookId,
    userId: req.userId,
  });
  if (!book) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  const state = await UserPlaybackState.findOne({
    userId: req.userId,
    audiobookId: book._id,
  });
  if (!state) {
    res.json({
      userId: req.userId,
      audiobookId: book._id,
      currentPositionMs: 0,
      selectedFilters: {},
      updatedAt: null,
    });
    return;
  }
  res.json({
    userId: state.userId,
    audiobookId: state.audiobookId,
    currentPositionMs: state.currentPositionMs,
    selectedFilters: state.selectedFilters,
    updatedAt: state.updatedAt,
  });
});

playbackRouter.put('/:audiobookId', async (req: AuthedRequest, res) => {
  if (!isValidObjectId(req.params.audiobookId)) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  const book = await Audiobook.findOne({
    _id: req.params.audiobookId,
    userId: req.userId,
  });
  if (!book) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  const currentPositionMs = Number(req.body?.currentPositionMs ?? 0);
  const selectedFilters = req.body?.selectedFilters ?? {};
  const state = await UserPlaybackState.findOneAndUpdate(
    { userId: req.userId, audiobookId: book._id },
    {
      currentPositionMs,
      selectedFilters,
      updatedAt: new Date(),
    },
    { upsert: true, new: true },
  );
  res.json({
    userId: state.userId,
    audiobookId: state.audiobookId,
    currentPositionMs: state.currentPositionMs,
    selectedFilters: state.selectedFilters,
    updatedAt: state.updatedAt,
  });
});
