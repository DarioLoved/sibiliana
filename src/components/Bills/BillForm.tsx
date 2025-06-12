import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Save } from 'lucide-react';
import { Bill } from '../../types';

interface BillFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bill: Omit<Bill, 'id'>) => void;
  editingBill?: Bill;
}

export function BillForm({ isOpen, onClose, onSave, editingBill }: BillFormProps) {
  const [formData, setFormData] = useState({
    date: '',
    totalAmount: '',
    fixedCosts: '',
    totalConsumption: '',
    periodFrom: '',
    periodTo: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editingBill) {
      setFormData({
        date: editingBill.date,
        totalAmount: editingBill.totalAmount.toString(),
        fixedCosts: editingBill.fixedCosts.toString(),
        totalConsumption: editingBill.totalConsumption.toString(),
        periodFrom: editingBill.period.from,
        periodTo: editingBill.period.to,
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        totalAmount: '',
        fixedCosts: '',
        totalConsumption: '',
        periodFrom: '',
        periodTo: '',
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
    
    if (!formData.date) newErrors.date = 'La data è obbligatoria';
    if (!formData.totalAmount) newErrors.totalAmount = 'L\'importo totale è obbligatorio';
    if (!formData.fixedCosts) newErrors.fixedCosts = 'I costi fissi sono obbligatori';
    if (!formData.totalConsumption) newErrors.totalConsumption = 'Il consumo totale è obbligatorio';
    if (!formData.periodFrom) newErrors.periodFrom = 'La data di inizio periodo è obbligatoria';
    if (!formData.periodTo) newErrors.periodTo = 'La data di fine periodo è obbligatoria';

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

    if (formData.periodFrom && formData.periodTo && 
        new Date(formData.periodFrom) > new Date(formData.periodTo)) {
      newErrors.periodTo = 'La data di fine deve essere successiva alla data di inizio';
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

    onSave({
      date: formData.date,
      totalAmount: Number(formData.totalAmount),
      fixedCosts: Number(formData.fixedCosts),
      totalConsumption: Number(formData.totalConsumption),
      period: {
        from: formData.periodFrom,
        to: formData.periodTo,
      },
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBill ? 'Modifica Bolletta' : 'Nuova Bolletta'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Data Bolletta"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            error={errors.date}
            required
          />
          
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
            label="Consumo Totale (kWh)"
            type="number"
            step="0.1"
            value={formData.totalConsumption}
            onChange={(e) => handleChange('totalConsumption', e.target.value)}
            error={errors.totalConsumption}
            placeholder="Es. 850"
            required
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Periodo di Fatturazione</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Data Inizio"
              type="date"
              value={formData.periodFrom}
              onChange={(e) => handleChange('periodFrom', e.target.value)}
              error={errors.periodFrom}
              required
            />
            
            <Input
              label="Data Fine"
              type="date"
              value={formData.periodTo}
              onChange={(e) => handleChange('periodTo', e.target.value)}
              error={errors.periodTo}
              required
            />
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