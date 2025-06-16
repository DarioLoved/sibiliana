export interface Owner {
  id: string;
  name: string;
  color: string;
}

export interface Property {
  id: string;
  name: string;
  owners: Owner[];
  billingCycle: 'monthly' | 'bimonthly';
  createdAt: string;
  createdBy: string;
  permissions?: PropertyPermissions;
}

export interface PropertyPermissions {
  admins: string[]; // User IDs with full access
  editors: string[]; // User IDs with edit access but can't delete
  viewers: string[]; // User IDs with read-only access
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLoginAt?: string;
}

export interface Invitation {
  id: string;
  propertyId: string;
  userEmail: string;
  permission: 'admin' | 'editor' | 'viewer';
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
}

export interface MeterReading {
  id: string;
  date: string;
  readings: {
    [ownerId: string]: number;
  };
  propertyId: string;
  createdBy?: string;
  createdAt?: string;
}

export interface Bill {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  fixedCosts: number;
  totalConsumption: number;
  startReadingId: string;
  endReadingId: string;
  propertyId: string;
  calculations?: BillCalculation;
  createdBy?: string;
  createdAt?: string;
}

export interface CalculatedExpense {
  ownerId: string;
  ownerName: string;
  consumption: number;
  consumptionCost: number;
  fixedCost: number;
  totalCost: number;
  percentage: number;
}

export interface BillCalculation {
  billId: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  costPerKwh: number;
  expenses: CalculatedExpense[];
}

export interface PropertyStats {
  totalSpent: number;
  averageMonthlySpent: number;
  totalConsumption: number;
  lastBillDate?: string;
  lastReadingDate?: string;
}

export interface AppState {
  selectedPropertyId?: string;
  activeTab?: string;
}