// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

/**
 * Load the Firebase service account from env.
 * Supports either:
 * - FIREBASE_SERVICE_ACCOUNT (raw JSON)
 * - FIREBASE_SERVICE_ACCOUNT_BASE64 (base64-encoded JSON)
 */
function loadServiceAccount(): admin.ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (raw && raw.trim().startsWith('{')) {
    return JSON.parse(raw);
  }
  if (b64) {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json);
  }
  throw new Error('Missing FIREBASE_SERVICE_ACCOUNT env var.');
}

// Reuse the same Admin app across hot reloads / lambda invocations
let app: admin.app.App;
try {
  app = admin.app();
} catch {
  const serviceAccount = loadServiceAccount();
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore(app);
