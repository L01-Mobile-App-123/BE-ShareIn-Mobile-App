import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const corsConfig: CorsOptions = {
  origin: [
    'http://localhost:3000',      // React/Next.js local
    'http://localhost:3001',      // Backup port
    'http://localhost:8081',      // React Native Expo
    'http://192.168.1.100:8081',  // Expo trên mobile (thay IP thực tế của bạn)
    'exp://192.168.1.100:8081',   // Expo scheme
    /^https:\/\/.*\.vercel\.app$/, // Vercel deployment
    /^https:\/\/.*\.netlify\.app$/, // Netlify deployment
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 3600,
};