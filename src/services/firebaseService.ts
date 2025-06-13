import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Property, MeterReading, Bill } from '../types';

export class FirebaseService {
  // Properties
  static async getProperties(): Promise<Property[]> {
    const querySnapshot = await getDocs(collection(db, 'properties'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
  }

  static async getProperty(propertyId: string): Promise<Property | null> {
    const docSnap = await getDoc(doc(db, 'properties', propertyId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Property : null;
  }

  static async createProperty(property: Omit<Property, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'properties'), property);
    return docRef.id;
  }

  static async updateProperty(propertyId: string, property: Partial<Property>): Promise<void> {
    await updateDoc(doc(db, 'properties', propertyId), property);
  }

  static async deleteProperty(propertyId: string): Promise<void> {
    await deleteDoc(doc(db, 'properties', propertyId));
  }

  // Readings
  static async getReadings(propertyId: string): Promise<MeterReading[]> {
    const q = query(
      collection(db, 'properties', propertyId, 'readings'),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MeterReading));
  }

  static async createReading(propertyId: string, reading: Omit<MeterReading, 'id' | 'propertyId'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'properties', propertyId, 'readings'), {
      ...reading,
      propertyId
    });
    return docRef.id;
  }

  static async updateReading(propertyId: string, readingId: string, reading: Partial<MeterReading>): Promise<void> {
    await updateDoc(doc(db, 'properties', propertyId, 'readings', readingId), reading);
  }

  static async deleteReading(propertyId: string, readingId: string): Promise<void> {
    await deleteDoc(doc(db, 'properties', propertyId, 'readings', readingId));
  }

  // Bills
  static async getBills(propertyId: string): Promise<Bill[]> {
    const q = query(
      collection(db, 'properties', propertyId, 'bills'),
      orderBy('periodEnd', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
  }

  static async createBill(propertyId: string, bill: Omit<Bill, 'id' | 'propertyId'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'properties', propertyId, 'bills'), {
      ...bill,
      propertyId
    });
    return docRef.id;
  }

  static async updateBill(propertyId: string, billId: string, bill: Partial<Bill>): Promise<void> {
    await updateDoc(doc(db, 'properties', propertyId, 'bills', billId), bill);
  }

  static async deleteBill(propertyId: string, billId: string): Promise<void> {
    await deleteDoc(doc(db, 'properties', propertyId, 'bills', billId));
  }
}