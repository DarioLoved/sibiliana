import React, { useState } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { Input } from '../Common/Input';
import { Save, Plus, Trash2, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { Property, Owner } from '../../types';

interface PropertySettingsProps {
  property: Property;
  onSave?: (property: Property) => void;
  onDelete?: () => void;
  canManage?: boolean;
}

export function PropertySettings({ property, onSave, onDelete, canManage = true }: PropertySettingsProps) {
  const [formData, setFormData] = useState({
    name: property.name,
    billingCycle: property.billingCycle,
    owners: [...property.owners]
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!onSave) return;
    
    const validOwners = formData.owners.filter(owner => owner.name.trim() !== '');
    if (validOwners.length === 0) {
      alert('Devi avere almeno un proprietario');
      return;
    }

    onSave({
      ...property,
      ...formData,
      owners: validOwners
    });
    setHasChanges(false);
  };

  const addOwner = () => {
    const colors = ['#3b82f6', '#059669', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f59e0b'];
    const newOwner: Owner = {
      id: Date.now().toString(),
      name: '',
      color: colors[formData.owners.length % colors.length]
    };
    handleChange('owners', [...formData.owners, newOwner]);
  };

  const removeOwner = (ownerId: string) => {
    handleChange('owners', formData.owners.filter(owner => owner.id !== ownerId));
  };

  const updateOwner = (ownerId: string, field: keyof Owner, value: string) => {
    const updatedOwners = formData.owners.map(owner => 
      owner.id === ownerId ? { ...owner, [field]: value } : owner
    );
    handleChange('owners', updatedOwners);
  };

  const handleDeleteProperty = () => {
    if (deleteConfirmText === property.name && onDelete) {
      onDelete();
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Impostazioni - {property.name}</h2>
        <p className="text-gray-600">Gestisci le impostazioni della proprietà</p>
      </div>

      {/* Property Details */}
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary-50 rounded-lg">
            <SettingsIcon className="h-5 w-5 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Dettagli Proprietà</h3>
        </div>

        <div className="space-y-6">
          <Input
            label="Nome Proprietà"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Es. Casa al Mare"
            disabled={!canManage}
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
                  onChange={(e) => handleChange('billingCycle', e.target.value)}
                  disabled={!canManage}
                  className="mr-2"
                />
                Mensile
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bimonthly"
                  checked={formData.billingCycle === 'bimonthly'}
                  onChange={(e) => handleChange('billingCycle', e.target.value)}
                  disabled={!canManage}
                  className="mr-2"
                />
                Bimestrale
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Owners Management */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Gestione Proprietari</h3>
          {canManage && (
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={addOwner}
            >
              Aggiungi Proprietario
            </Button>
          )}
        </div>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {formData.owners.map((owner, index) => (
            <div key={owner.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <input
                type="color"
                value={owner.color}
                onChange={(e) => updateOwner(owner.id, 'color', e.target.value)}
                disabled={!canManage}
                className="w-10 h-10 rounded border flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Input
                  value={owner.name}
                  onChange={(e) => updateOwner(owner.id, 'name', e.target.value)}
                  placeholder="Nome proprietario"
                  disabled={!canManage}
                  required
                />
              </div>
              {canManage && formData.owners.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => removeOwner(owner.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                >
                  Rimuovi
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Save Changes */}
      {hasChanges && canManage && onSave && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Modifiche non salvate</h4>
              <p className="text-sm text-blue-700">Hai delle modifiche non salvate. Salvale per applicarle.</p>
            </div>
            <Button
              variant="primary"
              icon={Save}
              onClick={handleSave}
            >
              Salva Modifiche
            </Button>
          </div>
        </Card>
      )}

      {/* Danger Zone */}
      {canManage && onDelete && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900">Zona Pericolosa</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-red-700">
              L'eliminazione della proprietà è un'azione irreversibile. Tutti i dati associati 
              (letture, bollette, calcoli) verranno eliminati definitivamente.
            </p>
            
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Elimina Proprietà
            </Button>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteConfirmText('');
        }}
        title="Conferma Eliminazione Proprietà"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900">Attenzione!</h4>
              <p className="text-red-700 text-sm">
                Questa azione eliminerà definitivamente la proprietà e tutti i dati associati.
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-gray-700 mb-4">
              Per confermare l'eliminazione, digita il nome della proprietà: <strong>{property.name}</strong>
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`Digita "${property.name}" per confermare`}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmText('');
              }}
            >
              Annulla
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteProperty}
              disabled={deleteConfirmText !== property.name}
            >
              Elimina Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}