// src/firebase/firebase.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  FIREBASE_APP,
  FCM_MESSAGING,
  FIREBASE_AUTH,
} from './firebase.constants';

const firebaseAppProvider = {
  provide: FIREBASE_APP,
  useFactory: (configService: ConfigService) => {
    const serviceAccountPath = configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
    );
    
    const path = require('path');
    const resolvedPath = path.resolve(process.cwd(), serviceAccountPath ?? "");
    const serviceAccount = require(resolvedPath);
    
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    return admin;
  },
  inject: [ConfigService],
};

// ----- PROVIDER CHO MESSAGING -----
const fcmMessagingProvider = {
  provide: FCM_MESSAGING, // Cung cấp dịch vụ messaging
  useFactory: (app: typeof admin) => app.messaging(), // Lấy .messaging() từ app
  inject: [FIREBASE_APP], // Phụ thuộc vào provider FIREBASE_APP
};

// ----- PROVIDER CHO AUTH -----
const firebaseAuthProvider = {
  provide: FIREBASE_AUTH, // Cung cấp dịch vụ auth
  useFactory: (app: typeof admin) => app.auth(), // Lấy .auth() từ app
  inject: [FIREBASE_APP], // Phụ thuộc vào provider FIREBASE_APP
};

@Global() // Vẫn là module Toàn cục
@Module({
  providers: [
    firebaseAppProvider, // 1. Khởi tạo app
    fcmMessagingProvider, // 2. Cung cấp messaging
    firebaseAuthProvider, // 3. Cung cấp auth
  ],
  exports: [
    FCM_MESSAGING,
    FIREBASE_AUTH,
  ],
})
export class FirebaseModule {}