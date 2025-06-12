import React, { useState } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { History, Calendar, Receipt, Activity, Filter } from 'lucide-react';
import { MeterReading, Bill, Owner, BillCalculation } from '../../types';

interface HistoryViewProps {
  readings: MeterReading[];
  bills: Bill[];
  calculations: BillCalculation[];
  owners: Owner[];
}

type FilterType = 'all' | 'readings' | 'bills' | 'calculations';

export function HistoryView({ readings, bills, calculations, owners }: HistoryViewProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const allItems = [
    ...readings.map(r => ({ ...r, type: 'reading' as const })),
    ...bills.map(b => ({ ...b, type: 'bill' as const })),
    ...calculations.map(c => ({ ...c, type: 'calculation' as const, date: c.date })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredItems = allItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'readings') return item.type === 'reading';
    if (filter === 'bills') return item.type === 'bill';
    if (filter === 'calculations') return item.type === 'calculation';
    return true;
  });

  const getOwnerColor = (ownerId: string) => {
    const owner = owners.find(o => o.id === ownerId);
    return owner?.color || '#6B7280';
  };

  const renderItem = (item: any) => {
    const date = new Date(item.date).toLocaleDateString('it-IT');
    
    if (item.type === 'reading') {
      return (
        <Card key={`reading-${item.id}`} className="hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-energy-50 rounded-lg">
              <Activity className="h-5 w-5 text-energy-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Lettura del {date}</h3>
              <div className="flex items-center space-x-6 mt-2">
                {owners.map((owner) => (
                  <div key={owner.id} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: owner.color }}
                    />
                    <span className="text-sm text-gray-600">{owner.name}:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.readings[owner.id]?.toLocaleString() || 0} kWh
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      );
    }
    
    if (item.type === 'bill') {
      return (
        <Card key={`bill-${item.id}`} className="hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Receipt className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Bolletta del {date}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Periodo: {new Date(item.period.from).toLocaleDateString('it-IT')} - {new Date(item.period.to).toLocaleDateString('it-IT')}
              </p>
              <div className="flex items-center space-x-6 mt-2">
                <span className="text-sm text-gray-600">Totale: <span className="font-medium text-gray-900">€{item.totalAmount.toFixed(2)}</span></span>
                <span className="text-sm text-gray-600">Fissi: <span className="font-medium text-gray-900">€{item.fixedCosts.toFixed(2)}</span></span>
                <span className="text-sm text-gray-600">Consumo: <span className="font-medium text-gray-900">{item.totalConsumption} kWh</span></span>
              </div>
            </div>
          </div>
        </Card>
      );
    }
    
    if (item.type === 'calculation') {
      return (
        <Card key={`calculation-${item.billId}`} className="hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-accent-50 rounded-lg">
              <History className="h-5 w-5 text-accent-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Calcolo del {date}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Totale bolletta: €{item.totalAmount.toFixed(2)}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                {item.expenses.map((expense: any) => (
                  <div key={expense.ownerId} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getOwnerColor(expense.ownerId) }}
                    />
                    <span className="text-sm text-gray-600">{expense.ownerName}:</span>
                    <span className="text-sm font-medium text-primary-600">€{expense.totalCost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Storico</h2>
          <p className="text-gray-600">Cronologia completa di tutte le operazioni</p>
        </div>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtra per:</span>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'Tutto' },
                { key: 'readings', label: 'Letture' },
                { key: 'bills', label: 'Bollette' },
                { key: 'calculations', label: 'Calcoli' },
              ].map((option) => (
                <Button
                  key={option.key}
                  variant={filter === option.key ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(option.key as FilterType)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {filteredItems.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun elemento nello storico</h3>
            <p className="text-gray-600">Inizia inserendo letture e bollette per vedere lo storico</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(renderItem)}
        </div>
      )}
    </div>
  );
}