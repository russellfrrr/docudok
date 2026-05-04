import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const createToken = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is missing in .env');
  }

  return jwt.sign({ userId }, jwtSecret, {
    expiresIn: '7d',
  });
}

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } =req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required',
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email is already registered',
      });
    }

    const passwordHash = await bcrypt.hash(password, 13);
    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    const token = createToken(user._id.toString());
    const resObj = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };

    res.status(201).json(resObj);
  } catch (err) {
    res.status(500).json({
      message: 'Register failed',
    });
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password'});
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = createToken(user._id.toString());
    const resObj = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    }

    res.status(200).json(resObj);
  } catch (err) {
    console.error('Login failed', err);
    res.status(500).json({
      message: 'Login failed',
    });
  }
}

export const me = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ user: req.user });
}