import React, { useState } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { Calendar, Plus, Edit3, Trash2 } from 'lucide-react';
import { MeterReading, Property } from '../../types';

interface ReadingsListProps {
  readings: MeterReading[];
  property: Property;
  onAddReading: () => void;
  onEditReading: (reading: MeterReading) => void;
  onDeleteReading: (reading: MeterReading) => void;
}

export function ReadingsList({ readings, property, onAddReading, onEditReading, onDeleteReading }: ReadingsListProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<MeterReading | null>(null);

  const sortedReadings = [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = (reading: MeterReading) => {
    onDeleteReading(reading);
    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Letture Contascatti - {property.name}</h2>
          <p className="text-gray-600">Gestisci le letture dei contatori</p>
        </div>
        <Button onClick={onAddReading} icon={Plus}>
          Nuova Lettura
        </Button>
      </div>

      {sortedReadings.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna lettura registrata</h3>
            <p className="text-gray-600 mb-6">Inizia aggiungendo la prima lettura dei contascatti</p>
            <Button onClick={onAddReading} icon={Plus}>
              Aggiungi Prima Lettura
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedReadings.map((reading) => (
            <Card key={reading.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-energy-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-energy-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {new Date(reading.date).toLocaleDateString('it-IT', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <div className="flex items-center space-x-6 mt-2">
                      {property.owners.map((owner) => (
                        <div key={owner.id} className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: owner.color }}
                          />
                          <span className="text-sm text-gray-600">{owner.name}:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {reading.readings[owner.id]?.toLocaleString() || 0} kWh
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit3}
                    onClick={() => onEditReading(reading)}
                  >
                    Modifica
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setShowDeleteConfirm(reading)}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Conferma Eliminazione"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Sei sicuro di voler eliminare questa lettura? Questa azione non può essere annullata.
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