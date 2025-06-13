import { Owner, MeterReading, Bill, CalculatedExpense, BillCalculation } from '../types';

export class CalculationService {
  static calculateBillExpenses(
    bill: Bill,
    startReading: MeterReading,
    endReading: MeterReading,
    owners: Owner[]
  ): BillCalculation {
    // Calculate consumption for each owner
    const consumptions: { [ownerId: string]: number } = {};
    let totalConsumption = 0;

    owners.forEach(owner => {
      const startValue = startReading.readings[owner.id] || 0;
      const endValue = endReading.readings[owner.id] || 0;
      const consumption = Math.max(0, endValue - startValue);
      consumptions[owner.id] = consumption;
      totalConsumption += consumption;
    });

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
      periodStart: bill.periodStart,
      periodEnd: bill.periodEnd,
      totalAmount: bill.totalAmount,
      costPerKwh,
      expenses,
    };
  }

  static calculatePeriodConsumption(readings: MeterReading[], owners: Owner[]): number {
    if (readings.length < 2) return 0;

    const sortedReadings = [...readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstReading = sortedReadings[0];
    const lastReading = sortedReadings[sortedReadings.length - 1];

    let totalConsumption = 0;
    owners.forEach(owner => {
      const startValue = firstReading.readings[owner.id] || 0;
      const endValue = lastReading.readings[owner.id] || 0;
      totalConsumption += Math.max(0, endValue - startValue);
    });

    return totalConsumption;
  }

  static getMonthlyStats(bills: Bill[], months: number = 12): { month: string; [ownerName: string]: number }[] {
    const now = new Date();
    const monthsData: { month: string; [ownerName: string]: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
      
      const monthData: { month: string; [ownerName: string]: number } = { month: monthKey };
      
      // Find bills for this month
      const monthBills = bills.filter(bill => {
        const billDate = new Date(bill.periodEnd);
        return billDate.getMonth() === date.getMonth() && billDate.getFullYear() === date.getFullYear();
      });

      // Sum expenses for each owner
      monthBills.forEach(bill => {
        if (bill.calculations) {
          bill.calculations.expenses.forEach(expense => {
            monthData[expense.ownerName] = (monthData[expense.ownerName] || 0) + expense.totalCost;
          });
        }
      });

      monthsData.push(monthData);
    }

    return monthsData;
  }

  static getOwnerConsumptionStats(bills: Bill[]): { name: string; value: number; color: string }[] {
    const ownerStats: { [ownerName: string]: { total: number; color: string } } = {};

    bills.forEach(bill => {
      if (bill.calculations) {
        bill.calculations.expenses.forEach(expense => {
          if (!ownerStats[expense.ownerName]) {
            ownerStats[expense.ownerName] = { total: 0, color: '#6B7280' };
          }
          ownerStats[expense.ownerName].total += expense.consumption;
        });
      }
    });

    return Object.entries(ownerStats).map(([name, stats]) => ({
      name,
      value: stats.total,
      color: stats.color
    }));
  }
}