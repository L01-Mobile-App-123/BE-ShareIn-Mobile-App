import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // Restrict to specific origins in production
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8081',
        'http://192.168.1.100:8081',
        'exp://192.168.1.100:8081',
      ];
      if (!origin || allowedOrigins.includes(origin) || /^https:\/\/(.*\.vercel\.app|.*\.netlify\.app)$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
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