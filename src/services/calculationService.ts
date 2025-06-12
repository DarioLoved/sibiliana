import { Owner, MeterReading, Bill, CalculatedExpense, BillCalculation } from '../types';

export class CalculationService {
  static calculateExpenses(
    bill: Bill,
    owners: Owner[],
    readings: MeterReading[]
  ): BillCalculation {
    // Find readings for the bill period
    const periodReadings = this.getReadingsForPeriod(readings, bill.period);
    
    if (periodReadings.length < 2) {
      throw new Error('Servono almeno due letture per calcolare i consumi del periodo');
    }

    // Calculate consumption for each owner
    const consumptions = this.calculateConsumptions(periodReadings, owners);
    const totalConsumption = Object.values(consumptions).reduce((sum, consumption) => sum + consumption, 0);

    // Calculate variable cost per kWh
    const variableCosts = bill.totalAmount - bill.fixedCosts;
    const costPerKwh = totalConsumption > 0 ? variableCosts / totalConsumption : 0;

    // Calculate expenses for each owner
    const expenses: CalculatedExpense[] = owners.map(owner => {
      const consumption = consumptions[owner.id] || 0;
      const consumptionCost = consumption * costPerKwh;
      const fixedCost = bill.fixedCosts / owners.length; // Split fixed costs equally
      const totalCost = consumptionCost + fixedCost;
      const percentage = totalConsumption > 0 ? (consumption / totalConsumption) * 100 : 0;

      return {
        ownerId: owner.id,
        ownerName: owner.name,
        consumption,
        consumptionCost,
        fixedCost,
        totalCost,
        percentage,
      };
    });

    return {
      billId: bill.id,
      date: bill.date,
      totalAmount: bill.totalAmount,
      expenses,
      period: bill.period,
    };
  }

  private static getReadingsForPeriod(readings: MeterReading[], period: { from: string; to: string }): MeterReading[] {
    const fromDate = new Date(period.from);
    const toDate = new Date(period.to);
    
    return readings
      .filter(reading => {
        const readingDate = new Date(reading.date);
        return readingDate >= fromDate && readingDate <= toDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private static calculateConsumptions(readings: MeterReading[], owners: Owner[]): { [ownerId: string]: number } {
    const consumptions: { [ownerId: string]: number } = {};
    
    if (readings.length < 2) return consumptions;

    const firstReading = readings[0];
    const lastReading = readings[readings.length - 1];

    owners.forEach(owner => {
      const firstValue = firstReading.readings[owner.id] || 0;
      const lastValue = lastReading.readings[owner.id] || 0;
      consumptions[owner.id] = Math.max(0, lastValue - firstValue);
    });

    return consumptions;
  }
}