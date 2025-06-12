export interface Owner {
  id: string;
  name: string;
  color: string;
}

export interface MeterReading {
  id: string;
  date: string;
  readings: {
    [ownerId: string]: number;
  };
}

export interface Bill {
  id: string;
  date: string;
  totalAmount: number;
  fixedCosts: number;
  totalConsumption: number;
  period: {
    from: string;
    to: string;
  };
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
  date: string;
  totalAmount: number;
  expenses: CalculatedExpense[];
  period: {
    from: string;
    to: string;
  };
}