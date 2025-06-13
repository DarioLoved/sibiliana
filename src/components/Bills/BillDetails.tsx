import React from 'react';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { Download, Receipt, Calendar, Euro, Zap } from 'lucide-react';
import { Bill, Property, MeterReading } from '../../types';
import { ReportService } from '../../services/reportService';

interface BillDetailsProps {
  bill: Bill;
  property: Property;
  readings: MeterReading[];
  isOpen: boolean;
  onClose: () => void;
}

export function BillDetails({ bill, property, readings, isOpen, onClose }: BillDetailsProps) {
  const startReading = readings.find(r => r.id === bill.startReadingId);
  const endReading = readings.find(r => r.id === bill.endReadingId);

  const handleGenerateReport = async () => {
    if (bill.calculations) {
      try {
        await ReportService.generateReport(bill.calculations, property.owners);
      } catch (error) {
        console.error('Error generating report:', error);
      }
    }
  };

  const getOwnerColor = (ownerId: string) => {
    const owner = property.owners.find(o => o.id === ownerId);
    return owner?.color || '#6B7280';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dettagli Bolletta"
      size="xl"
    >
      <div className="space-y-6">
        {/* Bill Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Receipt className="h-6 w-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Riepilogo Bolletta</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Periodo</p>
                <p className="font-medium text-gray-900">
                  {new Date(bill.periodStart).toLocaleDateString('it-IT')} - {new Date(bill.periodEnd).toLocaleDateString('it-IT')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Euro className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Importo Totale</p>
                <p className="font-medium text-gray-900">€{bill.totalAmount.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Consumo Fatturato</p>
                <p className="font-medium text-gray-900">{bill.totalConsumption} kWh</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">Costi Fissi</p>
              <p className="font-medium text-gray-900">€{bill.fixedCosts.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Costi Variabili</p>
              <p className="font-medium text-gray-900">€{(bill.totalAmount - bill.fixedCosts).toFixed(2)}</p>
            </div>
          </div>

          {bill.calculations && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Costo per kWh</p>
              <p className="text-xl font-bold text-primary-600">€{bill.calculations.costPerKwh.toFixed(4)}/kWh</p>
            </div>
          )}
        </div>

        {/* Reading Details */}
        {startReading && endReading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Lettura Inizio Periodo</h4>
              <p className="text-sm text-gray-600 mb-2">
                {new Date(startReading.date).toLocaleDateString('it-IT')}
              </p>
              <div className="space-y-2">
                {property.owners.map((owner) => (
                  <div key={owner.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: owner.color }}
                      />
                      <span className="text-sm text-gray-700">{owner.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {startReading.readings[owner.id]?.toFixed(1) || 0} kWh
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Lettura Fine Periodo</h4>
              <p className="text-sm text-gray-600 mb-2">
                {new Date(endReading.date).toLocaleDateString('it-IT')}
              </p>
              <div className="space-y-2">
                {property.owners.map((owner) => (
                  <div key={owner.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: owner.color }}
                      />
                      <span className="text-sm text-gray-700">{owner.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {endReading.readings[owner.id]?.toFixed(1) || 0} kWh
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calculations */}
        {bill.calculations && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ripartizione Spese</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bill.calculations.expenses.map((expense) => (
                <div key={expense.ownerId} className="bg-white border border-gray-200 rounded-lg p-4">
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
                      <span className="text-gray-900 font-semibold">Totale:</span>
                      <span className="font-bold text-primary-600">€{expense.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Chiudi
          </Button>
          {bill.calculations && (
            <Button 
              variant="success" 
              icon={Download}
              onClick={handleGenerateReport}
            >
              Genera Report PDF
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}