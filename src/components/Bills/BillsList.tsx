import React from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Receipt, Plus, Edit3, Euro } from 'lucide-react';
import { Bill } from '../../types';

interface BillsListProps {
  bills: Bill[];
  onAddBill: () => void;
  onEditBill: (bill: Bill) => void;
}

export function BillsList({ bills, onAddBill, onEditBill }: BillsListProps) {
  const sortedBills = [...bills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bollette</h2>
          <p className="text-gray-600">Gestisci le bollette bimestrali dell'energia</p>
        </div>
        <Button onClick={onAddBill} icon={Plus}>
          Nuova Bolletta
        </Button>
      </div>

      {sortedBills.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna bolletta registrata</h3>
            <p className="text-gray-600 mb-6">Inizia aggiungendo la prima bolletta</p>
            <Button onClick={onAddBill} icon={Plus}>
              Aggiungi Prima Bolletta
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedBills.map((bill) => (
            <Card key={bill.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Receipt className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Bolletta del {new Date(bill.date).toLocaleDateString('it-IT')}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Periodo: {new Date(bill.period.from).toLocaleDateString('it-IT')} - {new Date(bill.period.to).toLocaleDateString('it-IT')}
                    </p>
                    <div className="flex items-center space-x-6 mt-2">
                      <div className="flex items-center space-x-1">
                        <Euro className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Totale:</span>
                        <span className="text-sm font-medium text-gray-900">€{bill.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-600">Fissi:</span>
                        <span className="text-sm font-medium text-gray-900">€{bill.fixedCosts.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-600">Consumo:</span>
                        <span className="text-sm font-medium text-gray-900">{bill.totalConsumption} kWh</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit3}
                  onClick={() => onEditBill(bill)}
                >
                  Modifica
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}