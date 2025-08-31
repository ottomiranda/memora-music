import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  console.log('🔍 Test endpoint called');
  console.log('🔍 Method:', req.method);
  console.log('🔍 Headers:', req.headers);
  console.log('🔍 Environment variables available:', {
    NODE_ENV: process.env.NODE_ENV,
    // VERCEL: process.env.VERCEL, (removed)
  // VERCEL_ENV: process.env.VERCEL_ENV (removed)
  });
  
  res.status(200).json({ 
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      // VERCEL: process.env.VERCEL, (removed)
  // VERCEL_ENV: process.env.VERCEL_ENV (removed)
    }
  });
}