
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.ts';
import RefreshToken from '../models/RefreshToken.ts';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required (no fallback secrets allowed)');
}
const REFRESH_SECRET = process.env.REFRESH_SECRET;
if (!REFRESH_SECRET) {
  throw new Error('REFRESH_SECRET environment variable is required (no fallback secrets allowed)');
}

const generateTokens = async (user: any) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, countryId: user.countryId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshTokenValue = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await RefreshToken.create({
    userId: user.id,
    token: refreshTokenValue,
    expiresAt
  });

  return { accessToken, refreshToken: refreshTokenValue };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role, countryId, cityId, governorateId } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || 'User',
      countryId,
      cityId,
      governorateId
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, isGov, countryId, country } = req.body;

    // Special handling for Gov Login (simplified for now)
    if (isGov && !email) {
      let targetCountryId = countryId;
      
      // If country name is provided instead of ID
      if (!targetCountryId && country) {
        const Country = (await import('../models/Country.ts')).default;
        const countryRecord = await Country.findOne({ where: { nameEn: country } });
        if (countryRecord) {
          targetCountryId = countryRecord.id;
        }
      }

      if (targetCountryId) {
        const user = await User.findOne({ where: { countryId: targetCountryId, role: 'Government' } });
        if (user && await bcrypt.compare(password, user.password)) {
          const tokens = await generateTokens(user);
          return res.json({
            ...tokens,
            user: {
              id: user.id,
              role: user.role,
              countryId: user.countryId,
              email: user.email,
              country: country || 'Unknown'
            }
          });
        }
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokens = await generateTokens(user);

    res.json({
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        countryId: user.countryId,
        cityId: user.cityId,
        governorateId: user.governorateId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ error: 'Refresh token required' });

  try {
    const refreshTokenRecord = await RefreshToken.findOne({ where: { token } });
    if (!refreshTokenRecord || refreshTokenRecord.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await User.findByPk(refreshTokenRecord.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tokens = await generateTokens(user);
    
    // Delete the old refresh token
    await refreshTokenRecord.destroy();

    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
};
