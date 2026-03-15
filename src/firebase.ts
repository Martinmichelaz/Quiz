import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { OperationType, FirestoreErrorInfo } from './types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  if (error?.code === 'permission-denied') {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid || 'unauthenticated',
        email: auth.currentUser?.email || 'none',
        emailVerified: auth.currentUser?.emailVerified || false,
        isAnonymous: auth.currentUser?.isAnonymous || false,
        tenantId: auth.currentUser?.tenantId || 'none',
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName || 'none',
          email: provider.email || 'none',
          photoUrl: provider.photoURL || 'none'
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Permission Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
  throw error;
}

export default app;
