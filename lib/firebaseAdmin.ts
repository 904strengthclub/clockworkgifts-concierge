// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

try {
  // Reuse existing app during hot reloads/dev
  app = admin.app();
} catch {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT env var.');
  }
  const serviceAccount = JSON.parse(key);

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore(app);
