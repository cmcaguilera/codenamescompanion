import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirebaseInstances } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Auth functions
export const logoutUser = async () => {
  const { auth } = getFirebaseInstances();
  return signOut(auth);
};

export const signInWithGoogle = async () => {
  const { auth } = getFirebaseInstances();
  
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Firestore functions
export const saveUserData = async (userId: string, data: any) => {
  const { db } = getFirebaseInstances();
  
  try {
    const userDoc = doc(db, 'users', userId);
    await setDoc(userDoc, data, { merge: true });
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

export const getUserData = async (userId: string) => {
  const { db } = getFirebaseInstances();
  
  try {
    const userDoc = doc(db, 'users', userId);
    const docSnap = await getDoc(userDoc);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const { storage } = getFirebaseInstances();
  
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};
