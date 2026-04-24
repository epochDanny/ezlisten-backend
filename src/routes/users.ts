import { Router } from 'express';

import type { AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.put('/filter-preferences', async (req: AuthedRequest, res) => {
  const enabledCategories = req.body?.enabledCategories;
  const filterAction = req.body?.filterAction;
  if (
    typeof enabledCategories !== 'object' ||
    enabledCategories === null ||
    typeof filterAction !== 'string'
  ) {
    res.status(400).json({ message: 'enabledCategories and filterAction required' });
    return;
  }
  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      filterPreferences: {
        enabledCategories,
        filterAction,
      },
    },
    { new: true },
  );
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ filterPreferences: user.filterPreferences });
});
