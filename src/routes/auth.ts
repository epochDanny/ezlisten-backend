import { Router } from 'express';
import bcrypt from 'bcryptjs';

import { signToken } from '../middleware/auth.js';
import { User } from '../models/User.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    if (!email || password.length < 8) {
      res.status(400).json({ message: 'Valid email and password (8+ chars) required' });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = signToken(user._id.toString(), user.email);
    res.status(201).json({ token, email: user.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const token = signToken(user._id.toString(), user.email);
    res.json({ token, email: user.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});
