/**
 * Script để create 200 user accounts trên Firebase Authentication
 * Lấy email từ PostgreSQL và tạo Firebase accounts
 * 
 * Usage: npm run firebase:create-users
 */

import * as admin from 'firebase-admin';
import { getConnection } from 'typeorm';
import * as fs from 'fs';

// Initialize Firebase Admin with flexible credential sources:
// 1) If GOOGLE_APPLICATION_CREDENTIALS is set and file exists, use applicationDefault()
// 2) Else if FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL + FIREBASE_PROJECT_ID exist, construct a serviceAccount and use cert()
// 3) Otherwise throw a helpful error

function initFirebase(): void {
  if (admin.apps.length) return;

  const adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (adcPath && fs.existsSync(adcPath)) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('Firebase initialized with GOOGLE_APPLICATION_CREDENTIALS');
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKeyRaw) {
    const serviceAccount = {
      projectId,
      clientEmail,
      privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
    } as admin.ServiceAccount;

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase initialized with FIREBASE_PRIVATE_KEY env var');
    return;
  }

  throw new Error(
    'Firebase credentials not found. Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file path, or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY env vars.',
  );
}

initFirebase();

const auth = admin.auth();

async function createFirebaseUsers() {
  try {
    console.log('🔥 Starting Firebase user creation...\n');

    // Get connection to PostgreSQL
    const connection = getConnection();
    const users = await connection.query(
      'SELECT user_id, email, full_name FROM users LIMIT 200',
    );

    if (!users || users.length === 0) {
      console.log('❌ No users found in PostgreSQL');
      return;
    }

    console.log(`📊 Found ${users.length} users in PostgreSQL\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const { email, full_name, user_id } = user;

      try {
        // Generate a temporary password
        const tempPassword = `Temp${Math.random().toString(36).substring(2, 15)}!123`;

        // Create Firebase user
        const firebaseUser = await auth.createUser({
          uid: user_id, // Use PostgreSQL user_id as Firebase UID
          email: email,
          password: tempPassword,
          displayName: full_name || 'User',
          emailVerified: false,
        });

        console.log(
          `✅ [${i + 1}/${users.length}] Created: ${email} (UID: ${firebaseUser.uid})`,
        );
        successCount++;
      } catch (error: any) {
        // If user already exists, skip
        if (error.code === 'auth/uid-already-exists') {
          console.log(`⏭️  [${i + 1}/${users.length}] Already exists: ${email}`);
          successCount++; // Count as success since user is already there
        } else if (error.code === 'auth/email-already-exists') {
          console.log(`⚠️  [${i + 1}/${users.length}] Email already exists: ${email}`);
          errorCount++;
        } else {
          console.log(`❌ [${i + 1}/${users.length}] Error creating ${email}: ${error.message}`);
          errorCount++;
        }
      }

      // Add small delay to avoid rate limiting
      if ((i + 1) % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`\n🎉 Firebase user creation completed!`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run if this is the main script
if (require.main === module) {
  createFirebaseUsers().catch(console.error);
}

export { createFirebaseUsers };
