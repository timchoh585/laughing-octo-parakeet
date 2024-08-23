import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FIREBASE_CREDENTIALS } from '$env/static/private';

const firebaseConfig = JSON.parse(Buffer.from(FIREBASE_CREDENTIALS, 'base64').toString('utf-8'));

let app;
if (!getApps().length) {
    app = initializeApp({
        credential: cert(firebaseConfig),
        projectId: 'laughing-octo-parakeet',
    });
} else {
    app = getApp();
}

export const db = getFirestore(app);
console.log(db.databaseId);
console.log('Firebase project ID:', firebaseConfig.project_id);
console.log('Service account email:', firebaseConfig.client_email);
