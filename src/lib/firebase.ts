import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC_fR_JLDFh8wAoNo6hMcyhg_N8Ra2_oaI',
  authDomain: 'lluvias-18b0b.firebaseapp.com',
  projectId: 'lluvias-18b0b',
  storageBucket: 'lluvias-18b0b.firebasestorage.app',
  messagingSenderId: '925381909831',
  appId: '1:925381909831:web:75e917c153c2f0db9f8062'
};

let app: FirebaseApp;
let dbInstance: Firestore;

export function getDb(): Firestore {
  if (!dbInstance) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}
