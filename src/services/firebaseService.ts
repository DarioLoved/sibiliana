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
  Timestamp,
  connectFirestoreEmulator
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
  // Test Firebase connection
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Firebase connection...');
      const testRef = collection(db, 'test');
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
      console.log('📊 Fetching properties...');
      const propertiesRef = collection(db, 'properties');
      const snapshot = await getDocs(propertiesRef);
      const properties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      console.log(`✅ Fetched ${properties.length} properties`);
      return properties;
    } catch (error) {
      console.error('❌ Error getting properties:', error);
      return [];
    }
  }

  static async addProperty(property: Omit<Property, 'id'>): Promise<string> {
    try {
      console.log('🏠 Adding property:', property.name);
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
      console.log('🔄 Updating property:', propertyId);
      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, updates);
      console.log('✅ Property updated successfully');
    } catch (error) {
      console.error('❌ Error updating property:', error);
      throw error;
    }
  }

  static async deleteProperty(propertyId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting property:', propertyId);
      
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
      
      console.log('✅ Property and related data deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting property:', error);
      throw error;
    }
  }

  // Readings
  static async getReadings(propertyId: string): Promise<MeterReading[]> {
    try {
      console.log('📊 Fetching readings for property:', propertyId);
      const readingsRef = collection(db, 'readings');
      const q = query(readingsRef, where('propertyId', '==', propertyId));
      const snapshot = await getDocs(q);
      const readings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MeterReading[];
      
      // Sort in memory
      const sortedReadings = readings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      console.log(`✅ Fetched ${sortedReadings.length} readings`);
      return sortedReadings;
    } catch (error) {
      console.error('❌ Error getting readings:', error);
      return [];
    }
  }

  static async addReading(reading: Omit<MeterReading, 'id'>): Promise<string> {
    try {
      console.log('📊 Adding reading for property:', reading.propertyId);
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
      console.log('🔄 Updating reading:', readingId);
      const readingRef = doc(db, 'readings', readingId);
      await updateDoc(readingRef, updates);
      console.log('✅ Reading updated successfully');
    } catch (error) {
      console.error('❌ Error updating reading:', error);
      throw error;
    }
  }

  static async deleteReading(readingId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting reading:', readingId);
      const readingRef = doc(db, 'readings', readingId);
      await deleteDoc(readingRef);
      console.log('✅ Reading deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting reading:', error);
      throw error;
    }
  }

  // Bills
  static async getBills(propertyId: string): Promise<Bill[]> {
    try {
      console.log('📊 Fetching bills for property:', propertyId);
      const billsRef = collection(db, 'bills');
      const q = query(billsRef, where('propertyId', '==', propertyId));
      const snapshot = await getDocs(q);
      const bills = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bill[];
      
      // Sort in memory
      const sortedBills = bills.sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());
      console.log(`✅ Fetched ${sortedBills.length} bills`);
      return sortedBills;
    } catch (error) {
      console.error('❌ Error getting bills:', error);
      return [];
    }
  }

  static async addBill(bill: Omit<Bill, 'id'>): Promise<string> {
    try {
      console.log('📊 Adding bill for property:', bill.propertyId);
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
      console.log('🔄 Updating bill:', billId);
      const billRef = doc(db, 'bills', billId);
      await updateDoc(billRef, updates);
      console.log('✅ Bill updated successfully');
    } catch (error) {
      console.error('❌ Error updating bill:', error);
      throw error;
    }
  }

  static async deleteBill(billId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting bill:', billId);
      const billRef = doc(db, 'bills', billId);
      await deleteDoc(billRef);
      console.log('✅ Bill deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting bill:', error);
      throw error;
    }
  }

  // Real-time listeners with better error handling
  static subscribeToProperties(callback: (properties: Property[]) => void): () => void {
    console.log('🔄 Setting up properties subscription...');
    const propertiesRef = collection(db, 'properties');
    
    return onSnapshot(propertiesRef, 
      (snapshot) => {
        console.log('📡 Properties subscription update received');
        const properties = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Property[];
        callback(properties);
      }, 
      (error) => {
        console.error('❌ Error in properties subscription:', error);
        // Don't throw, just log the error to prevent infinite loops
      }
    );
  }

  static subscribeToReadings(propertyId: string, callback: (readings: MeterReading[]) => void): () => void {
    console.log('🔄 Setting up readings subscription for property:', propertyId);
    const readingsRef = collection(db, 'readings');
    const q = query(readingsRef, where('propertyId', '==', propertyId));
    
    return onSnapshot(q, 
      (snapshot) => {
        console.log('📡 Readings subscription update received');
        const readings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MeterReading[];
        
        // Sort in memory
        const sortedReadings = readings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(sortedReadings);
      }, 
      (error) => {
        console.error('❌ Error in readings subscription:', error);
        // Don't throw, just log the error to prevent infinite loops
      }
    );
  }

  static subscribeToProperty(propertyId: string, callback: (property: Property | null) => void): () => void {
    console.log('🔄 Setting up property subscription for:', propertyId);
    const propertyRef = doc(db, 'properties', propertyId);
    
    return onSnapshot(propertyRef, 
      (doc) => {
        console.log('📡 Property subscription update received');
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as Property);
        } else {
          console.log('⚠️ Property not found:', propertyId);
          callback(null);
        }
      }, 
      (error) => {
        console.error('❌ Error in property subscription:', error);
        // Don't throw, just log the error to prevent infinite loops
        callback(null);
      }
    );
  }

  static subscribeToBills(propertyId: string, callback: (bills: Bill[]) => void): () => void {
    console.log('🔄 Setting up bills subscription for property:', propertyId);
    const billsRef = collection(db, 'bills');
    const q = query(billsRef, where('propertyId', '==', propertyId));
    
    return onSnapshot(q, 
      (snapshot) => {
        console.log('📡 Bills subscription update received');
        const bills = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bill[];
        
        // Sort in memory
        const sortedBills = bills.sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());
        callback(sortedBills);
      }, 
      (error) => {
        console.error('❌ Error in bills subscription:', error);
        // Don't throw, just log the error to prevent infinite loops
      }
    );
  }
}