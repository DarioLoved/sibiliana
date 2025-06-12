import React from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { BarChart3, Download, Users, Calculator } from 'lucide-react';
import { BillCalculation, Owner } from '../../types';

interface CalculationsListProps {
  calculations: BillCalculation[];
  owners: Owner[];
  onGenerateReport: (calculation: BillCalculation) => void;
}

export function CalculationsList({ calculations, owners, onGenerateReport }: CalculationsListProps) {
  const sortedCalculations = [...calculations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getOwnerColor = (ownerId: string) => {
    const owner = owners.find(o => o.id === ownerId);
    return owner?.color || '#6B7280';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calcoli e Report</h2>
          <p className="text-gray-600">Visualizza i calcoli automatici delle spese</p>
        </div>
      </div>

      {sortedCalculations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun calcolo disponibile</h3>
            <p className="text-gray-600">I calcoli verranno generati automaticamente quando avrai inserito letture e bollette</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedCalculations.map((calculation) => (
            <Card key={calculation.billId} className="hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Calcolo del {new Date(calculation.date).toLocaleDateString('it-IT')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Periodo: {new Date(calculation.period.from).toLocaleDateString('it-IT')} - {new Date(calculation.period.to).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Totale Bolletta</p>
                      <p className="text-xl font-bold text-gray-900">€{calculation.totalAmount.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="success"
                      size="sm"
                      icon={Download}
                      onClick={() => onGenerateReport(calculation)}
                    >
                      Genera Report
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {calculation.expenses.map((expense) => (
                    <div key={expense.ownerId} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getOwnerColor(expense.ownerId) }}
                        />
                        <h4 className="font-semibold text-gray-900">{expense.ownerName}</h4>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Consumo:</span>
                          <span className="font-medium">{expense.consumption.toFixed(1)} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Percentuale:</span>
                          <span className="font-medium">{expense.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Costo consumo:</span>
                          <span className="font-medium">€{expense.consumptionCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Costi fissi:</span>
                          <span className="font-medium">€{expense.fixedCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 mt-2">
                          <span className="text-gray-900 font-semibold">Totale da pagare:</span>
                          <span className="font-bold text-primary-600">€{expense.totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}