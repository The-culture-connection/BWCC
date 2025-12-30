import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as path from 'path';
import * as fs from 'fs';

// Server-side Firebase Admin SDK initialization
let adminApp: App | undefined;

if (typeof window === 'undefined') {
  // Only initialize on server-side
  try {
    if (getApps().length === 0) {
      const projectId = process.env.FIREBASE_PROJECT_ID || 'bwccworkspace';
      
      let credentials: ServiceAccount | undefined;
      
      // Option 1: Use individual environment variables (preferred - no file needed)
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const projectIdEnv = process.env.FIREBASE_PROJECT_ID;
      
      if (clientEmail && privateKey && projectIdEnv) {
        try {
          // Strip quotes if present (env files might add them)
          let cleanedPrivateKey = privateKey.trim();
          if ((cleanedPrivateKey.startsWith('"') && cleanedPrivateKey.endsWith('"')) ||
              (cleanedPrivateKey.startsWith("'") && cleanedPrivateKey.endsWith("'"))) {
            cleanedPrivateKey = cleanedPrivateKey.slice(1, -1);
          }
          
          // Replace \n with actual newlines
          cleanedPrivateKey = cleanedPrivateKey.replace(/\\n/g, '\n');
          
          credentials = {
            type: 'service_account',
            projectId: projectIdEnv.trim(),
            privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID?.trim(),
            privateKey: cleanedPrivateKey,
            clientEmail: clientEmail.trim(),
            clientId: process.env.FIREBASE_CLIENT_ID?.trim(),
            authUri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
            tokenUri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
            authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
            clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL?.trim(),
          };
          
          // Validate required fields
          if (!credentials.privateKey || !credentials.clientEmail || !credentials.projectId) {
            throw new Error('Missing required credential fields');
          }
          
          console.log('Firebase Admin: Using credentials from individual environment variables');
          console.log(`Firebase Admin: Project ID: ${credentials.projectId}`);
          console.log(`Firebase Admin: Client Email: ${credentials.clientEmail}`);
        } catch (error) {
          console.error('Firebase Admin: Error setting up credentials from env vars:', error);
          credentials = undefined;
        }
      }
      // Option 2: Use service account JSON from environment variable
      if (!credentials && process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
          console.log('Firebase Admin: Using credentials from FIREBASE_SERVICE_ACCOUNT env var');
        } catch (error) {
          console.error('Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', error);
        }
      }
      // Option 3: Use service account key file path from environment variable
      if (!credentials && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
          const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
          // Resolve path relative to project root if it's a relative path
          const resolvedPath = path.isAbsolute(serviceAccountPath) 
            ? serviceAccountPath 
            : path.join(process.cwd(), serviceAccountPath);
            
          if (fs.existsSync(resolvedPath)) {
            const serviceAccountFile = fs.readFileSync(resolvedPath, 'utf8');
            credentials = JSON.parse(serviceAccountFile) as ServiceAccount;
            console.log(`Firebase Admin: Using credentials from ${resolvedPath}`);
          } else {
            console.error(`Firebase Admin: Service account file not found at ${resolvedPath}`);
          }
        } catch (error) {
          console.error('Error reading service account file:', error);
        }
      }
      
      // Initialize with credentials if available
      if (credentials) {
        try {
          adminApp = initializeApp({
            credential: cert(credentials),
            projectId: credentials.projectId || projectId,
          });
          console.log('Firebase Admin initialized successfully with credentials');
        } catch (initError) {
          console.error('Firebase Admin: Error initializing with credentials:', initError);
          throw initError;
        }
      } else {
        console.error('Firebase Admin: No credentials found! Please set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_PROJECT_ID in .env.local');
        // Don't initialize without credentials - this will cause the error
        throw new Error('Firebase Admin credentials not configured. Please set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_PROJECT_ID in .env.local');
      }
    } else {
      adminApp = getApps()[0];
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

export const adminAuth = adminApp ? getAuth(adminApp) : undefined;
export const adminDb = adminApp ? getFirestore(adminApp) : undefined;
export const adminStorage = adminApp ? getStorage(adminApp) : undefined;
export { adminApp };

