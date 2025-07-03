import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { Property, MeterReading, Bill } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBvOsXGVZ0X9X9X9X9X9X9X9X9X9X9X9X9",
  authDomain: "contascatti-sibiliana-village.firebaseapp.com",
  projectId: "contascatti-sibiliana-village",
  storageBucket: "contascatti-sibiliana-village.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnopqrstuvwxyz"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple user ID for anonymous usage
const ANONYMOUS_USER_ID = 'anonymous-user';

export class FirebaseService {
  // Properties
  static async getProperties(): Promise<Property[]> {
    try {
      const propertiesRef = collection(db, 'properties');
      const snapshot = await getDocs(propertiesRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
    } catch (error) {
      console.error('Error getting properties:', error);
      return [];
    }
  }

  static async addProperty(property: Omit<Property, 'id'>): Promise<string> {
    try {
      const propertiesRef = collection(db, 'properties');
      const docRef = await addDoc(propertiesRef, {
        ...property,
        createdBy: ANONYMOUS_USER_ID,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding property:', error);
      throw error;
    }
  }

  static async updateProperty(propertyId: string, updates: Partial<Property>): Promise<void> {
    try {
      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, updates);
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }

  static async deleteProperty(propertyId: string): Promise<void> {
    try {
      // Delete property
      const propertyRef = doc(db, 'properties', propertyId);
      await deleteDoc(propertyRef);

      // Delete all readings for this property
      const readingsRef = collection(db, 'readings');
      const readingsQuery = query(readingsRef, where('propertyId', '==', propertyId));
      const readingsSnapshot = await getDocs(readingsQuery);
      
      for (const readingDoc of readingsSnapshot.docs) {
        await deleteDoc(readingDoc.ref);
      }

      // Delete all bills for this property
      const billsRef = collection(db, 'bills');
      const billsQuery = query(billsRef, where('propertyId', '==', propertyId));
      const billsSnapshot = await getDocs(billsQuery);
      
      for (const billDoc of billsSnapshot.docs) {
        await deleteDoc(billDoc.ref);
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }

  // Readings
  static async getReadings(propertyId: string): Promise<MeterReading[]> {
    try {
      const readingsRef = collection(db, 'readings');
      const q = query(
        readingsRef, 
        where('propertyId', '==', propertyId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MeterReading[];
    } catch (error) {
      console.error('Error getting readings:', error);
      return [];
    }
  }

  static async addReading(reading: Omit<MeterReading, 'id'>): Promise<string> {
    try {
      const readingsRef = collection(db, 'readings');
      const docRef = await addDoc(readingsRef, {
        ...reading,
        createdBy: ANONYMOUS_USER_ID,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding reading:', error);
      throw error;
    }
  }

  static async updateReading(readingId: string, updates: Partial<MeterReading>): Promise<void> {
    try {
      const readingRef = doc(db, 'readings', readingId);
      await updateDoc(readingRef, updates);
    } catch (error) {
      console.error('Error updating reading:', error);
      throw error;
    }
  }

  static async deleteReading(readingId: string): Promise<void> {
    try {
      const readingRef = doc(db, 'readings', readingId);
      await deleteDoc(readingRef);
    } catch (error) {
      console.error('Error deleting reading:', error);
      throw error;
    }
  }

  // Bills
  static async getBills(propertyId: string): Promise<Bill[]> {
    try {
      const billsRef = collection(db, 'bills');
      const q = query(
        billsRef, 
        where('propertyId', '==', propertyId),
        orderBy('periodEnd', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bill[];
    } catch (error) {
      console.error('Error getting bills:', error);
      return [];
    }
  }

  static async addBill(bill: Omit<Bill, 'id'>): Promise<string> {
    try {
      const billsRef = collection(db, 'bills');
      const docRef = await addDoc(billsRef, {
        ...bill,
        createdBy: ANONYMOUS_USER_ID,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding bill:', error);
      throw error;
    }
  }

  static async updateBill(billId: string, updates: Partial<Bill>): Promise<void> {
    try {
      const billRef = doc(db, 'bills', billId);
      await updateDoc(billRef, updates);
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  static async deleteBill(billId: string): Promise<void> {
    try {
      const billRef = doc(db, 'bills', billId);
      await deleteDoc(billRef);
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  }

  // Real-time listeners
  static subscribeToProperties(callback: (properties: Property[]) => void): () => void {
    const propertiesRef = collection(db, 'properties');
    return onSnapshot(propertiesRef, (snapshot) => {
      const properties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      callback(properties);
    }, (error) => {
      console.error('Error in properties subscription:', error);
    });
  }

  static subscribeToReadings(propertyId: string, callback: (readings: MeterReading[]) => void): () => void {
    const readingsRef = collection(db, 'readings');
    const q = query(
      readingsRef, 
      where('propertyId', '==', propertyId),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const readings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MeterReading[];
      callback(readings);
    }, (error) => {
      console.error('Error in readings subscription:', error);
    });
  }

  static subscribeToProperty(propertyId: string, callback: (property: Property | null) => void): () => void {
    const propertyRef = doc(db, 'properties', propertyId);
    return onSnapshot(propertyRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Property);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in property subscription:', error);
    });
  }

  static subscribeToBills(propertyId: string, callback: (bills: Bill[]) => void): () => void {
    const billsRef = collection(db, 'bills');
    const q = query(
      billsRef, 
      where('propertyId', '==', propertyId),
      orderBy('periodEnd', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const bills = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bill[];
      callback(bills);
    }, (error) => {
      console.error('Error in bills subscription:', error);
    });
  }

  // Test connection
  static async testConnection(): Promise<boolean> {
    try {
      const testRef = collection(db, 'test');
      await getDocs(testRef);
      console.log('Firebase connection successful');
      return true;
    } catch (error) {
      console.error('Firebase connection failed:', error);
      return false;
    }
  }
}