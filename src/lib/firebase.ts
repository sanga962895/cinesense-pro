import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBGRCgrH3CUaCZNp1GQCNg9SrSVh-H__UE",
  authDomain: "cineverse-web.firebaseapp.com",
  projectId: "cineverse-web",
  storageBucket: "cineverse-web.appspot.com",
  messagingSenderId: "677543971674",
  appId: "1:677543971674:web:574c55cc37f133361dc163",
  measurementId: "G-EEXLZIPEYF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
