import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Property, Owner } from '../../types';

interface PropertySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Property) => void;
  property: Property;
}

export function PropertySettings({ isOpen, onClose, onSave, property }: PropertySettingsProps) {
  const [formData, setFormData] = useState({
    name: '',
    billingCycle: 'bimonthly' as 'monthly' | 'bimonthly',
    owners: [] as Owner[]
  });

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name,
        billingCycle: property.billingCycle,
        owners: [...property.owners]
      });
    }
  }, [property, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...property,
      ...formData
    });
    onClose();
  };

  const addOwner = () => {
    const newOwner: Owner = {
      id: Date.now().toString(),
      name: '',
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setFormData(prev => ({
      ...prev,
      owners: [...prev.owners, newOwner]
    }));
  };

  const removeOwner = (ownerId: string) => {
    setFormData(prev => ({
      ...prev,
      owners: prev.owners.filter(owner => owner.id !== ownerId)
    }));
  };

  const updateOwner = (ownerId: string, field: keyof Owner, value: string) => {
    setFormData(prev => ({
      ...prev,
      owners: prev.owners.map(owner => 
        owner.id === ownerId ? { ...owner, [field]: value } : owner
      )
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Impostazioni Proprietà"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nome Proprietà"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Es. Casa al Mare"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciclo di Fatturazione
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="monthly"
                checked={formData.billingCycle === 'monthly'}
                onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value as 'monthly' | 'bimonthly' }))}
                className="mr-2"
              />
              Mensile
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="bimonthly"
                checked={formData.billingCycle === 'bimonthly'}
                onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value as 'monthly' | 'bimonthly' }))}
                className="mr-2"
              />
              Bimestrale
            </label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Proprietari</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={addOwner}
            >
              Aggiungi
            </Button>
          </div>
          
          <div className="space-y-4">
            {formData.owners.map((owner, index) => (
              <div key={owner.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <input
                  type="color"
                  value={owner.color}
                  onChange={(e) => updateOwner(owner.id, 'color', e.target.value)}
                  className="w-8 h-8 rounded border"
                />
                <div className="flex-1">
                  <Input
                    value={owner.name}
                    onChange={(e) => updateOwner(owner.id, 'name', e.target.value)}
                    placeholder="Nome proprietario"
                    required
                  />
                </div>
                {formData.owners.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => removeOwner(owner.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Rimuovi
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" icon={Save}>
            Salva Modifiche
          </Button>
        </div>
      </form>
    </Modal>
  );
}