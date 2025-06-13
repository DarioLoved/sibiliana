import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Save } from 'lucide-react';
import { MeterReading, Property } from '../../types';

interface ReadingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reading: Omit<MeterReading, 'id' | 'propertyId'>) => void;
  property: Property;
  editingReading?: MeterReading;
}

export function ReadingForm({ isOpen, onClose, onSave, property, editingReading }: ReadingFormProps) {
  const [date, setDate] = useState('');
  const [readings, setReadings] = useState<{ [ownerId: string]: string }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editingReading) {
      setDate(editingReading.date);
      const readingsStr: { [ownerId: string]: string } = {};
      Object.entries(editingReading.readings).forEach(([ownerId, value]) => {
        readingsStr[ownerId] = value.toString();
      });
      setReadings(readingsStr);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      const initialReadings: { [ownerId: string]: string } = {};
      property.owners.forEach(owner => {
        initialReadings[owner.id] = '';
      });
      setReadings(initialReadings);
    }
    setErrors({});
  }, [editingReading, property.owners, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    
    if (!date) {
      newErrors.date = 'La data è obbligatoria';
    }
    
    property.owners.forEach(owner => {
      if (!readings[owner.id] || readings[owner.id].trim() === '') {
        newErrors[owner.id] = `Lettura per ${owner.name} è obbligatoria`;
      } else if (isNaN(Number(readings[owner.id]))) {
        newErrors[owner.id] = `Lettura per ${owner.name} deve essere un numero`;
      } else if (Number(readings[owner.id]) < 0) {
        newErrors[owner.id] = `Lettura per ${owner.name} non può essere negativa`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const readingData: { [ownerId: string]: number } = {};
    Object.entries(readings).forEach(([ownerId, value]) => {
      readingData[ownerId] = Number(value);
    });

    onSave({
      date,
      readings: readingData,
    });

    onClose();
  };

  const handleReadingChange = (ownerId: string, value: string) => {
    setReadings(prev => ({
      ...prev,
      [ownerId]: value
    }));
    if (errors[ownerId]) {
      setErrors(prev => ({
        ...prev,
        [ownerId]: ''
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingReading ? 'Modifica Lettura' : 'Nuova Lettura'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Data Lettura"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          required
        />

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Letture Contascatti</h3>
          {property.owners.map((owner) => (
            <div key={owner.id} className="flex items-center space-x-4">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: owner.color }}
              />
              <div className="flex-1">
                <Input
                  label={owner.name}
                  type="number"
                  step="0.1"
                  value={readings[owner.id] || ''}
                  onChange={(e) => handleReadingChange(owner.id, e.target.value)}
                  error={errors[owner.id]}
                  placeholder="Es. 1234.5"
                  helper="Inserisci la lettura in kWh"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" icon={Save}>
            {editingReading ? 'Aggiorna' : 'Salva'} Lettura
          </Button>
        </div>
      </form>
    </Modal>
  );
}