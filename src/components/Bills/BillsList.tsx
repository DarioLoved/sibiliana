import React, { useState } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { Receipt, Plus, Edit3, Euro, Trash2, Eye } from 'lucide-react';
import { Bill, Property, MeterReading } from '../../types';
import { BillDetails } from './BillDetails';

interface BillsListProps {
  bills: Bill[];
  property: Property;
  readings: MeterReading[];
  onAddBill: () => void;
  onEditBill: (bill: Bill) => void;
  onDeleteBill: (bill: Bill) => void;
}

export function BillsList({ bills, property, readings, onAddBill, onEditBill, onDeleteBill }: BillsListProps) {
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Bill | null>(null);

  const sortedBills = [...bills].sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());

  const handleDelete = (bill: Bill) => {
    onDeleteBill(bill);
    setShowDeleteConfirm(null);
  };

  const getReadingDate = (readingId: string) => {
    const reading = readings.find(r => r.id === readingId);
    return reading ? new Date(reading.date).toLocaleDateString('it-IT') : 'N/A';
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bollette - {property.name}</h2>
          <p className="text-gray-600">Gestisci le bollette dell'energia</p>
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
        <div className="space-y-4 w-full">
          {sortedBills.map((bill) => (
            <Card key={bill.id} className="hover:shadow-md transition-shadow w-full">
              <div className="w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="p-2 bg-primary-50 rounded-lg flex-shrink-0">
                      <Receipt className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        Bolletta {getReadingDate(bill.startReadingId)} - {getReadingDate(bill.endReadingId)}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        Periodo: {new Date(bill.periodStart).toLocaleDateString('it-IT')} - {new Date(bill.periodEnd).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => setSelectedBill(bill)}
                    >
                      <span className="hidden sm:inline">Dettagli</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit3}
                      onClick={() => onEditBill(bill)}
                    >
                      <span className="hidden sm:inline">Modifica</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => setShowDeleteConfirm(bill)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <span className="hidden sm:inline">Elimina</span>
                    </Button>
                  </div>
                </div>

                {/* Bill Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded">
                    <Euro className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs text-gray-600 block">Totale:</span>
                      <span className="text-sm font-medium text-gray-900 truncate block">€{bill.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded">
                    <div className="min-w-0">
                      <span className="text-xs text-gray-600 block">Fissi:</span>
                      <span className="text-sm font-medium text-gray-900 truncate block">€{bill.fixedCosts.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded">
                    <div className="min-w-0">
                      <span className="text-xs text-gray-600 block">Consumo:</span>
                      <span className="text-sm font-medium text-gray-900 truncate block">{bill.totalConsumption} kWh</span>
                    </div>
                  </div>
                  {bill.calculations && (
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded">
                      <div className="min-w-0">
                        <span className="text-xs text-gray-600 block">€/kWh:</span>
                        <span className="text-sm font-medium text-primary-600 truncate block">
                          {bill.calculations.costPerKwh.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expenses Summary */}
                {bill.calculations && (
                  <div className="border-t pt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {bill.calculations.expenses.map((expense) => (
                        <div key={expense.ownerId} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: property.owners.find(o => o.id === expense.ownerId)?.color || '#6B7280' }}
                            />
                            <span className="text-gray-600 truncate">{expense.ownerName}:</span>
                          </div>
                          <span className="font-medium text-primary-600 flex-shrink-0 ml-2">€{expense.totalCost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Bill Details Modal */}
      {selectedBill && (
        <BillDetails
          bill={selectedBill}
          property={property}
          readings={readings}
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Conferma Eliminazione"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Sei sicuro di voler eliminare questa bolletta? Questa azione non può essere annullata.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
              Annulla
            </Button>
            <Button 
              variant="danger" 
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
            >
              Elimina
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}