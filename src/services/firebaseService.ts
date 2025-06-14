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
  static async getProperties(userId?: string): Promise<Property[]> {
    if (userId) {
      // Get properties where user has access
      const querySnapshot = await getDocs(collection(db, 'properties'));
      const allProperties = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      
      return allProperties.filter(property => 
        property.createdBy === userId ||
        property.permissions?.admins?.includes(userId) ||
        property.permissions?.editors?.includes(userId) ||
        property.permissions?.viewers?.includes(userId)
      );
    } else {
      const querySnapshot = await getDocs(collection(db, 'properties'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
    }
  }

  static async getProperty(propertyId: string): Promise<Property | null> {
    const docSnap = await getDoc(doc(db, 'properties', propertyId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Property : null;
  }

  static async createProperty(property: Omit<Property, 'id'>, createdBy: string): Promise<string> {
    const propertyData = {
      ...property,
      createdBy,
      permissions: {
        admins: [createdBy],
        editors: [],
        viewers: []
      }
    };
    
    const docRef = await addDoc(collection(db, 'properties'), propertyData);
    return docRef.id;
  }

  static async updateProperty(propertyId: string, property: Partial<Property>): Promise<void> {
    await updateDoc(doc(db, 'properties', propertyId), property);
  }

  static async deleteProperty(propertyId: string): Promise<void> {
    // Delete all readings
    const readingsQuery = query(collection(db, 'properties', propertyId, 'readings'));
    const readingsSnapshot = await getDocs(readingsQuery);
    const readingDeletePromises = readingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(readingDeletePromises);

    // Delete all bills
    const billsQuery = query(collection(db, 'properties', propertyId, 'bills'));
    const billsSnapshot = await getDocs(billsQuery);
    const billDeletePromises = billsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(billDeletePromises);

    // Delete the property
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

  static async createReading(propertyId: string, reading: Omit<MeterReading, 'id' | 'propertyId'>, createdBy: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'properties', propertyId, 'readings'), {
      ...reading,
      propertyId,
      createdBy,
      createdAt: new Date().toISOString()
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

  static async createBill(propertyId: string, bill: Omit<Bill, 'id' | 'propertyId'>, createdBy: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'properties', propertyId, 'bills'), {
      ...bill,
      propertyId,
      createdBy,
      createdAt: new Date().toISOString()
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