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
}

export interface MeterReading {
  id: string;
  date: string;
  readings: {
    [ownerId: string]: number;
  };
  propertyId: string;
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