export interface Question {
  id: number;
  question: string;
  type: 'short_answer' | 'open_ended';
  hint: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  score: number;
  progress: number;
  lastActive?: string;
  role?: 'admin' | 'user';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string;
    providerInfo: {
      providerId: string;
      displayName: string;
      email: string;
      photoUrl: string;
    }[];
  }
}
