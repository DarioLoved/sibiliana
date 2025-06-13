import React, { useState } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { Receipt, Plus, Edit3, Euro, Trash2, Eye, Download } from 'lucide-react';
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
    <div className="space-y-6">
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
                      Bolletta {getReadingDate(bill.startReadingId)} - {getReadingDate(bill.endReadingId)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Periodo: {new Date(bill.periodStart).toLocaleDateString('it-IT')} - {new Date(bill.periodEnd).toLocaleDateString('it-IT')}
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
                      {bill.calculations && (
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-600">€/kWh:</span>
                          <span className="text-sm font-medium text-primary-600">
                            {bill.calculations.costPerKwh.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    onClick={() => setSelectedBill(bill)}
                  >
                    Dettagli
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit3}
                    onClick={() => onEditBill(bill)}
                  >
                    Modifica
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setShowDeleteConfirm(bill)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Elimina
                  </Button>
                </div>
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