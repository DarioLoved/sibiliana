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

// REAL Firebase configuration for contascatti-sibiliana-village
// These are the REAL credentials from your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyB9Bc_qg8MVxmQ9HWDKz1yHk2Qsyk5OVTg",
  authDomain: "contascatti-sibiliana-village.firebaseapp.com",
  projectId: "contascatti-sibiliana-village",
  storageBucket: "contascatti-sibiliana-village.firebasestorage.app",
  messagingSenderId: "865795737084",
  appId: "1:865795737084:web:a2b4aac044118cebaede79"
};

// Initialize Firebase
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('🔥 Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Create a mock database to prevent crashes
  db = null;
}

// Simple user ID for anonymous usage
const ANONYMOUS_USER_ID = 'anonymous-user';

// Connection state management
let connectionState = {
  isConnected: false,
  lastTestTime: 0,
  testInProgress: false
};

export class FirebaseService {
  // Test Firebase connection with better error handling
  static async testConnection(): Promise<boolean> {
    // If Firebase wasn't initialized, return false immediately
    if (!db) {
      console.log('❌ Firebase not initialized');
      return false;
    }

    const now = Date.now();
    
    // If we tested recently and it was successful, return cached result
    if (connectionState.isConnected && (now - connectionState.lastTestTime) < 30000) {
      return true;
    }
    
    // If a test is already in progress, wait for it
    if (connectionState.testInProgress) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!connectionState.testInProgress) {
            clearInterval(checkInterval);
            resolve(connectionState.isConnected);
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(false);
        }, 5000);
      });
    }
    
    connectionState.testInProgress = true;
    
    try {
      console.log('🔍 Testing Firebase connection...');
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
      
      // Test connection with a simple document reference check
      // This tests the connection without requiring any existing data
      const testDocRef = doc(db, 'properties', 'firebase_connection_test_doc');
      const testPromise = getDoc(testDocRef);
      
      await Promise.race([testPromise, timeoutPromise]);
      
      console.log('✅ Firebase connection successful');
      connectionState.isConnected = true;
      connectionState.lastTestTime = now;
      return true;
    } catch (error) {
      console.error('❌ Firebase connection failed:', error);
      connectionState.isConnected = false;
      return false;
    } finally {
      connectionState.testInProgress = false;
    }
  }

  // Properties
  static async getProperties(): Promise<Property[]> {
    if (!db) {
      console.log('❌ Firebase not initialized, returning empty array');
      return [];
    }

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
    if (!db) {
      throw new Error('Firebase not initialized');
    }

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
    if (!db) {
      throw new Error('Firebase not initialized');
    }

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
    if (!db) {
      throw new Error('Firebase not initialized');
    }

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
    if (!db) {
      console.log('❌ Firebase not initialized, returning empty array');
      return [];
    }

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
    if (!db) {
      throw new Error('Firebase not initialized');
    }

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
    if (!db) {
      throw new Error('Firebase not initialized');
    }

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
    if (!db) {
      throw new Error('Firebase not initialized');
    }

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
    if (!db) {
      console.log('❌ Firebase not initialized, returning empty array');
      return [];
    }

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
    if (!db) {
      throw new Error('Firebase not initialized');
    }

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
    if (!db) {
      throw new Error('Firebase not initialized');
    }

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
    if (!db) {
      throw new Error('Firebase not initialized');
    }

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

  // Real-time listeners - disabled if Firebase not initialized
  static subscribeToProperties(callback: (properties: Property[]) => void): () => void {
    if (!db) {
      console.log('❌ Firebase not initialized, returning empty subscription');
      callback([]);
      return () => {};
    }

    console.log('🔄 Setting up properties subscription...');
    
    try {
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
          // Return empty array to prevent infinite loading
          callback([]);
        }
      );
    } catch (error) {
      console.error('❌ Error setting up properties subscription:', error);
      callback([]);
      return () => {};
    }
  }

  static subscribeToReadings(propertyId: string, callback: (readings: MeterReading[]) => void): () => void {
    if (!db) {
      console.log('❌ Firebase not initialized, returning empty subscription');
      callback([]);
      return () => {};
    }

    console.log('🔄 Setting up readings subscription for property:', propertyId);
    
    try {
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
          // Return empty array to prevent infinite loading
          callback([]);
        }
      );
    } catch (error) {
      console.error('❌ Error setting up readings subscription:', error);
      callback([]);
      return () => {};
    }
  }

  static subscribeToProperty(propertyId: string, callback: (property: Property | null) => void): () => void {
    if (!db) {
      console.log('❌ Firebase not initialized, returning null');
      callback(null);
      return () => {};
    }

    console.log('🔄 Setting up property subscription for:', propertyId);
    
    try {
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
          // Return null to prevent infinite loading
          callback(null);
        }
      );
    } catch (error) {
      console.error('❌ Error setting up property subscription:', error);
      callback(null);
      return () => {};
    }
  }

  static subscribeToBills(propertyId: string, callback: (bills: Bill[]) => void): () => void {
    if (!db) {
      console.log('❌ Firebase not initialized, returning empty subscription');
      callback([]);
      return () => {};
    }

    console.log('🔄 Setting up bills subscription for property:', propertyId);
    
    try {
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
          // Return empty array to prevent infinite loading
          callback([]);
        }
      );
    } catch (error) {
      console.error('❌ Error setting up bills subscription:', error);
      callback([]);
      return () => {};
    }
  }
}