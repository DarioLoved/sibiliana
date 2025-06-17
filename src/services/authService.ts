import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';

export class AuthService {
  static async signInWithEmail(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await this.getOrCreateUserProfile(userCredential.user);
  }

  static async signUpWithEmail(email: string, password: string, name: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user: User = {
      id: userCredential.user.uid,
      email: userCredential.user.email!,
      name,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', user.id), user);
    return user;
  }

  static async signOut(): Promise<void> {
    await signOut(auth);
  }

  static async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await this.getOrCreateUserProfile(firebaseUser);
          callback(user);
        } catch (error) {
          console.error('Error getting user profile:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  private static async getOrCreateUserProfile(firebaseUser: FirebaseUser): Promise<User> {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    } else {
      // Create new user profile
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.id), user);
      return user;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', userId), updates);
  }

  static async getUserById(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() as User : null;
  }
}