import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Save, Calendar } from 'lucide-react';
import { Bill, MeterReading } from '../../types';

interface BillFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bill: Omit<Bill, 'id' | 'propertyId'>) => void;
  editingBill?: Bill;
  readings: MeterReading[];
}

export function BillForm({ isOpen, onClose, onSave, editingBill, readings }: BillFormProps) {
  const [formData, setFormData] = useState({
    totalAmount: '',
    fixedCosts: '',
    totalConsumption: '',
    startReadingId: '',
    endReadingId: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const sortedReadings = [...readings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    if (editingBill) {
      setFormData({
        totalAmount: editingBill.totalAmount.toString(),
        fixedCosts: editingBill.fixedCosts.toString(),
        totalConsumption: editingBill.totalConsumption.toString(),
        startReadingId: editingBill.startReadingId,
        endReadingId: editingBill.endReadingId,
      });
    } else {
      setFormData({
        totalAmount: '',
        fixedCosts: '',
        totalConsumption: '',
        startReadingId: '',
        endReadingId: '',
      });
    }
    setErrors({});
  }, [editingBill, isOpen]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.totalAmount) newErrors.totalAmount = 'L\'importo totale è obbligatorio';
    if (!formData.fixedCosts) newErrors.fixedCosts = 'I costi fissi sono obbligatori';
    if (!formData.totalConsumption) newErrors.totalConsumption = 'Il consumo totale è obbligatorio';
    if (!formData.startReadingId) newErrors.startReadingId = 'Seleziona la lettura di inizio periodo';
    if (!formData.endReadingId) newErrors.endReadingId = 'Seleziona la lettura di fine periodo';

    if (formData.totalAmount && isNaN(Number(formData.totalAmount))) {
      newErrors.totalAmount = 'L\'importo deve essere un numero';
    }
    if (formData.fixedCosts && isNaN(Number(formData.fixedCosts))) {
      newErrors.fixedCosts = 'I costi fissi devono essere un numero';
    }
    if (formData.totalConsumption && isNaN(Number(formData.totalConsumption))) {
      newErrors.totalConsumption = 'Il consumo deve essere un numero';
    }

    if (formData.fixedCosts && formData.totalAmount && 
        Number(formData.fixedCosts) > Number(formData.totalAmount)) {
      newErrors.fixedCosts = 'I costi fissi non possono essere maggiori dell\'importo totale';
    }

    if (formData.startReadingId && formData.endReadingId && formData.startReadingId === formData.endReadingId) {
      newErrors.endReadingId = 'Le letture di inizio e fine devono essere diverse';
    }

    // Check date order
    if (formData.startReadingId && formData.endReadingId) {
      const startReading = readings.find(r => r.id === formData.startReadingId);
      const endReading = readings.find(r => r.id === formData.endReadingId);
      
      if (startReading && endReading && new Date(startReading.date) >= new Date(endReading.date)) {
        newErrors.endReadingId = 'La lettura di fine deve essere successiva a quella di inizio';
      }
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const startReading = readings.find(r => r.id === formData.startReadingId);
    const endReading = readings.find(r => r.id === formData.endReadingId);

    if (!startReading || !endReading) {
      setErrors({ general: 'Errore nel recupero delle letture selezionate' });
      return;
    }

    onSave({
      periodStart: startReading.date,
      periodEnd: endReading.date,
      totalAmount: Number(formData.totalAmount),
      fixedCosts: Number(formData.fixedCosts),
      totalConsumption: Number(formData.totalConsumption),
      startReadingId: formData.startReadingId,
      endReadingId: formData.endReadingId,
    });

    onClose();
  };

  const getReadingLabel = (reading: MeterReading) => {
    const date = new Date(reading.date).toLocaleDateString('it-IT');
    const totalReading = Object.values(reading.readings).reduce((sum, val) => sum + val, 0);
    return `${date} (Tot: ${totalReading.toFixed(0)} kWh)`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBill ? 'Modifica Bolletta' : 'Nuova Bolletta'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Importo Totale (€)"
            type="number"
            step="0.01"
            value={formData.totalAmount}
            onChange={(e) => handleChange('totalAmount', e.target.value)}
            error={errors.totalAmount}
            placeholder="Es. 245.67"
            required
          />
          
          <Input
            label="Costi Fissi (€)"
            type="number"
            step="0.01"
            value={formData.fixedCosts}
            onChange={(e) => handleChange('fixedCosts', e.target.value)}
            error={errors.fixedCosts}
            placeholder="Es. 45.20"
            helper="Spese fisse che verranno divise equamente"
            required
          />
          
          <Input
            label="Consumo Totale Fatturato (kWh)"
            type="number"
            step="0.1"
            value={formData.totalConsumption}
            onChange={(e) => handleChange('totalConsumption', e.target.value)}
            error={errors.totalConsumption}
            placeholder="Es. 850"
            helper="Consumo indicato sulla bolletta"
            required
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-medium text-gray-900">Periodo di Fatturazione</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lettura Inizio Periodo
              </label>
              <select
                value={formData.startReadingId}
                onChange={(e) => handleChange('startReadingId', e.target.value)}
                className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.startReadingId ? 'border-red-300' : ''
                }`}
                required
              >
                <option value="">Seleziona lettura di inizio</option>
                {sortedReadings.map((reading) => (
                  <option key={reading.id} value={reading.id}>
                    {getReadingLabel(reading)}
                  </option>
                ))}
              </select>
              {errors.startReadingId && (
                <p className="text-sm text-red-600 mt-1">{errors.startReadingId}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lettura Fine Periodo
              </label>
              <select
                value={formData.endReadingId}
                onChange={(e) => handleChange('endReadingId', e.target.value)}
                className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.endReadingId ? 'border-red-300' : ''
                }`}
                required
              >
                <option value="">Seleziona lettura di fine</option>
                {sortedReadings.map((reading) => (
                  <option key={reading.id} value={reading.id}>
                    {getReadingLabel(reading)}
                  </option>
                ))}
              </select>
              {errors.endReadingId && (
                <p className="text-sm text-red-600 mt-1">{errors.endReadingId}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" icon={Save}>
            {editingBill ? 'Aggiorna' : 'Salva'} Bolletta
          </Button>
        </div>
      </form>
    </Modal>
  );
}