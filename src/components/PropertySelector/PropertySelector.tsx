import React, { useState, useEffect } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { Input } from '../Common/Input';
import { Home, Plus, Settings, Trash2 } from 'lucide-react';
import { Property, Owner } from '../../types';
import { FirebaseService } from '../../services/firebaseService';

interface PropertySelectorProps {
  onPropertySelect: (property: Property) => void;
}

export function PropertySelector({ onPropertySelect }: PropertySelectorProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const props = await FirebaseService.getProperties();
      setProperties(props);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = async (propertyData: Omit<Property, 'id'>) => {
    try {
      const id = await FirebaseService.createProperty(propertyData);
      const newProperty = { id, ...propertyData };
      setProperties(prev => [...prev, newProperty]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating property:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">Caricamento proprietà...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="p-4 bg-primary-600 rounded-full w-16 h-16 mx-auto mb-4">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Spese Energia</h1>
          <p className="text-gray-600">Seleziona una proprietà da gestire o creane una nuova</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div onClick={() => onPropertySelect(property)} className="p-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Home className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{property.name}</h3>
                    <p className="text-sm text-gray-600">
                      {property.billingCycle === 'monthly' ? 'Mensile' : 'Bimestrale'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Proprietari:</p>
                  <div className="flex flex-wrap gap-2">
                    {property.owners.map((owner) => (
                      <div key={owner.id} className="flex items-center space-x-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: owner.color }}
                        />
                        <span className="text-xs text-gray-700">{owner.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          <Card className="border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors">
            <div 
              onClick={() => setShowCreateForm(true)}
              className="flex flex-col items-center justify-center p-8 cursor-pointer"
            >
              <Plus className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-gray-600 font-medium">Nuova Proprietà</span>
            </div>
          </Card>
        </div>

        <PropertyForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSave={handleCreateProperty}
        />
      </div>
    </div>
  );
}

interface PropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Omit<Property, 'id'>) => void;
  editingProperty?: Property;
}

function PropertyForm({ isOpen, onClose, onSave, editingProperty }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    billingCycle: 'bimonthly' as 'monthly' | 'bimonthly',
    owners: [
      { id: '1', name: 'Dino', color: '#3b82f6' },
      { id: '2', name: 'Uccio', color: '#059669' },
      { id: '3', name: 'Filippo', color: '#f97316' },
    ] as Owner[]
  });

  useEffect(() => {
    if (editingProperty) {
      setFormData({
        name: editingProperty.name,
        billingCycle: editingProperty.billingCycle,
        owners: [...editingProperty.owners]
      });
    } else {
      setFormData({
        name: '',
        billingCycle: 'bimonthly',
        owners: [
          { id: '1', name: 'Dino', color: '#3b82f6' },
          { id: '2', name: 'Uccio', color: '#059669' },
          { id: '3', name: 'Filippo', color: '#f97316' },
        ]
      });
    }
  }, [editingProperty, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      createdAt: new Date().toISOString()
    });
  };

  const updateOwner = (index: number, field: keyof Owner, value: string) => {
    setFormData(prev => ({
      ...prev,
      owners: prev.owners.map((owner, i) => 
        i === index ? { ...owner, [field]: value } : owner
      )
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProperty ? 'Modifica Proprietà' : 'Nuova Proprietà'}
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Proprietari</h3>
          <div className="space-y-4">
            {formData.owners.map((owner, index) => (
              <div key={owner.id} className="flex items-center space-x-4">
                <input
                  type="color"
                  value={owner.color}
                  onChange={(e) => updateOwner(index, 'color', e.target.value)}
                  className="w-8 h-8 rounded border"
                />
                <Input
                  value={owner.name}
                  onChange={(e) => updateOwner(index, 'name', e.target.value)}
                  placeholder="Nome proprietario"
                  required
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit">
            {editingProperty ? 'Aggiorna' : 'Crea'} Proprietà
          </Button>
        </div>
      </form>
    </Modal>
  );
}