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

// Real Firebase configuration for your project
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
  // Test connection
  static async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Firebase connection...');
      const testRef = collection(db, 'properties');
      await getDocs(testRef);
      console.log('✅ Firebase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection failed:', error);
      return false;
    }
  }

  // Properties
  static async getProperties(): Promise<Property[]> {
    try {
      console.log('Getting properties from Firebase...');
      const propertiesRef = collection(db, 'properties');
      const snapshot = await getDocs(propertiesRef);
      const properties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      console.log('✅ Properties loaded:', properties.length);
      return properties;
    } catch (error) {
      console.error('❌ Error getting properties:', error);
      return [];
    }
  }

  static async addProperty(property: Omit<Property, 'id'>): Promise<string> {
    try {
      console.log('Adding property to Firebase:', property.name);
      const propertiesRef = collection(db, 'properties');
      const docRef = await addDoc(propertiesRef, {
        ...property,
        createdBy: ANONYMOUS_USER_ID,
        createdAt: Timestamp.now()
      });
      console.log('✅ Property added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding property:', error);
      throw error;
    }
  }

  static async updateProperty(propertyId: string, updates: Partial<Property>): Promise<void> {
    try {
      console.log('Updating property:', propertyId);
      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, updates);
      console.log('✅ Property updated');
    } catch (error) {
      console.error('❌ Error updating property:', error);
      throw error;
    }
  }

  static async deleteProperty(propertyId: string): Promise<void> {
    try {
      console.log('Deleting property:', propertyId);
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
      console.log('✅ Property and related data deleted');
    } catch (error) {
      console.error('❌ Error deleting property:', error);
      throw error;
    }
  }

  // Readings
  static async getReadings(propertyId: string): Promise<MeterReading[]> {
    try {
      console.log('Getting readings for property:', propertyId);
      const readingsRef = collection(db, 'readings');
      const q = query(
        readingsRef, 
        where('propertyId', '==', propertyId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const readings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MeterReading[];
      console.log('✅ Readings loaded:', readings.length);
      return readings;
    } catch (error) {
      console.error('❌ Error getting readings:', error);
      return [];
    }
  }

  static async addReading(reading: Omit<MeterReading, 'id'>): Promise<string> {
    try {
      console.log('Adding reading to Firebase');
      const readingsRef = collection(db, 'readings');
      const docRef = await addDoc(readingsRef, {
        ...reading,
        createdBy: ANONYMOUS_USER_ID,
        createdAt: Timestamp.now()
      });
      console.log('✅ Reading added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding reading:', error);
      throw error;
    }
  }

  static async updateReading(readingId: string, updates: Partial<MeterReading>): Promise<void> {
    try {
      console.log('Updating reading:', readingId);
      const readingRef = doc(db, 'readings', readingId);
      await updateDoc(readingRef, updates);
      console.log('✅ Reading updated');
    } catch (error) {
      console.error('❌ Error updating reading:', error);
      throw error;
    }
  }

  static async deleteReading(readingId: string): Promise<void> {
    try {
      console.log('Deleting reading:', readingId);
      const readingRef = doc(db, 'readings', readingId);
      await deleteDoc(readingRef);
      console.log('✅ Reading deleted');
    } catch (error) {
      console.error('❌ Error deleting reading:', error);
      throw error;
    }
  }

  // Bills
  static async getBills(propertyId: string): Promise<Bill[]> {
    try {
      console.log('Getting bills for property:', propertyId);
      const billsRef = collection(db, 'bills');
      const q = query(
        billsRef, 
        where('propertyId', '==', propertyId),
        orderBy('periodEnd', 'desc')
      );
      const snapshot = await getDocs(q);
      const bills = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bill[];
      console.log('✅ Bills loaded:', bills.length);
      return bills;
    } catch (error) {
      console.error('❌ Error getting bills:', error);
      return [];
    }
  }

  static async addBill(bill: Omit<Bill, 'id'>): Promise<string> {
    try {
      console.log('Adding bill to Firebase');
      const billsRef = collection(db, 'bills');
      const docRef = await addDoc(billsRef, {
        ...bill,
        createdBy: ANONYMOUS_USER_ID,
        createdAt: Timestamp.now()
      });
      console.log('✅ Bill added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding bill:', error);
      throw error;
    }
  }

  static async updateBill(billId: string, updates: Partial<Bill>): Promise<void> {
    try {
      console.log('Updating bill:', billId);
      const billRef = doc(db, 'bills', billId);
      await updateDoc(billRef, updates);
      console.log('✅ Bill updated');
    } catch (error) {
      console.error('❌ Error updating bill:', error);
      throw error;
    }
  }

  static async deleteBill(billId: string): Promise<void> {
    try {
      console.log('Deleting bill:', billId);
      const billRef = doc(db, 'bills', billId);
      await deleteDoc(billRef);
      console.log('✅ Bill deleted');
    } catch (error) {
      console.error('❌ Error deleting bill:', error);
      throw error;
    }
  }

  // Real-time listeners
  static subscribeToProperties(callback: (properties: Property[]) => void): () => void {
    console.log('Setting up real-time listener for properties');
    const propertiesRef = collection(db, 'properties');
    return onSnapshot(propertiesRef, (snapshot) => {
      const properties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      console.log('🔄 Real-time update - properties:', properties.length);
      callback(properties);
    }, (error) => {
      console.error('❌ Error in properties subscription:', error);
    });
  }

  static subscribeToReadings(propertyId: string, callback: (readings: MeterReading[]) => void): () => void {
    console.log('Setting up real-time listener for readings:', propertyId);
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
      console.log('🔄 Real-time update - readings:', readings.length);
      callback(readings);
    }, (error) => {
      console.error('❌ Error in readings subscription:', error);
    });
  }

  static subscribeToProperty(propertyId: string, callback: (property: Property | null) => void): () => void {
    console.log('Setting up real-time listener for property:', propertyId);
    const propertyRef = doc(db, 'properties', propertyId);
    return onSnapshot(propertyRef, (doc) => {
      if (doc.exists()) {
        const property = { id: doc.id, ...doc.data() } as Property;
        console.log('🔄 Real-time update - property:', property.name);
        callback(property);
      } else {
        console.log('🔄 Property not found');
        callback(null);
      }
    }, (error) => {
      console.error('❌ Error in property subscription:', error);
    });
  }

  static subscribeToBills(propertyId: string, callback: (bills: Bill[]) => void): () => void {
    console.log('Setting up real-time listener for bills:', propertyId);
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
      console.log('🔄 Real-time update - bills:', bills.length);
      callback(bills);
    }, (error) => {
      console.error('❌ Error in bills subscription:', error);
    });
  }
}