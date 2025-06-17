import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { Input } from '../Common/Input';
import { Home, Plus, Users, Settings } from 'lucide-react';
import { Property, Owner } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export function PropertySelector() {
  const navigate = useNavigate();
  const [properties, setProperties] = useLocalStorage<Property[]>('casa-mare-properties', []);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateProperty = (propertyData: Omit<Property, 'id' | 'createdBy' | 'permissions'>) => {
    const newProperty: Property = { 
      id: Date.now().toString(),
      ...propertyData, 
      createdBy: 'local-user',
      permissions: {
        admins: ['local-user'],
        editors: [],
        viewers: []
      }
    };
    setProperties(prev => [...prev, newProperty]);
    setShowCreateForm(false);
  };

  const handlePropertySelect = (property: Property) => {
    navigate(`/property/${property.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 pb-20 sm:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="p-3 sm:p-4 bg-primary-600 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4">
            <Home className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Casa Mare</h1>
          <p className="text-gray-600 text-sm sm:text-base">Gestione Spese Energia</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div 
                onClick={() => handlePropertySelect(property)} 
                className="p-4 sm:p-6 text-center"
              >
                <div className="flex flex-col items-center space-y-3 mb-4">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Home className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{property.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {property.billingCycle === 'monthly' ? 'Mensile' : 'Bimestrale'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <p className="text-xs sm:text-sm text-gray-600">Proprietari ({property.owners.length}):</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                    {property.owners.map((owner) => (
                      <div key={owner.id} className="flex items-center space-x-1">
                        <div 
                          className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
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
              className="flex flex-col items-center justify-center p-6 sm:p-8 cursor-pointer text-center"
            >
              <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2" />
              <span className="text-gray-600 font-medium text-sm sm:text-base">Nuova Proprietà</span>
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
  onSave: (property: Omit<Property, 'id' | 'createdBy' | 'permissions'>) => void;
  editingProperty?: Property;
}

function PropertyForm({ isOpen, onClose, onSave, editingProperty }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    billingCycle: 'bimonthly' as 'monthly' | 'bimonthly',
    owners: [] as Owner[]
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
          { id: '1', name: '', color: '#3b82f6' }
        ]
      });
    }
  }, [editingProperty, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all owners have names
    const validOwners = formData.owners.filter(owner => owner.name.trim() !== '');
    if (validOwners.length === 0) {
      alert('Devi aggiungere almeno un proprietario');
      return;
    }

    onSave({
      ...formData,
      owners: validOwners,
      createdAt: new Date().toISOString()
    });
  };

  const addOwner = () => {
    const colors = ['#3b82f6', '#059669', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f59e0b'];
    const newOwner: Owner = {
      id: Date.now().toString(),
      name: '',
      color: colors[formData.owners.length % colors.length]
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
          
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {formData.owners.map((owner, index) => (
              <div key={owner.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <input
                  type="color"
                  value={owner.color}
                  onChange={(e) => updateOwner(owner.id, 'color', e.target.value)}
                  className="w-8 h-8 rounded border flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
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
                    onClick={() => removeOwner(owner.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    ×
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
          <Button type="submit">
            {editingProperty ? 'Aggiorna' : 'Crea'} Proprietà
          </Button>
        </div>
      </form>
    </Modal>
  );
}