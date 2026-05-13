import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const generateTokens = (user: { id: string; email: string; name: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
  const refreshToken = jwt.sign(
    { id: user.id, tokenId: uuidv4() },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );
  return { accessToken, refreshToken };
};

export const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ success: false, error: { message: 'Email already registered' } });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });

    // Create a default personal workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        description: 'Your personal workspace',
        slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        ownerId: user.id,
      },
    });
    await prisma.workspaceMember.create({
      data: { userId: user.id, workspaceId: workspace.id, role: 'ADMIN' },
    });

    const { accessToken, refreshToken } = generateTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    logger.info(`New user registered: ${email}`);
    res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ success: false, error: { message: 'Registration failed' } });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, avatar: true, password: true, createdAt: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
      return;
    }

    const { password: _, ...safeUser } = user;
    const { accessToken, refreshToken } = generateTokens(safeUser);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    logger.info(`User logged in: ${email}`);
    res.json({ success: true, data: { user: safeUser, accessToken, refreshToken } });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, error: { message: 'Login failed' } });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Logout failed' } });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(401).json({ success: false, error: { message: 'Refresh token required' } });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.refreshSecret) as { id: string };
    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.status(401).json({ success: false, error: { message: 'Invalid or expired refresh token' } });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: { message: 'User not found' } });
      return;
    }

    await prisma.refreshToken.delete({ where: { token } });
    const tokens = generateTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: tokens.refreshToken, userId: user.id, expiresAt } });

    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(401).json({ success: false, error: { message: 'Token refresh failed' } });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch user' } });
  }
};
