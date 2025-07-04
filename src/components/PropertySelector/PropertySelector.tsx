import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Modal } from '../Common/Modal';
import { Input } from '../Common/Input';
import { Home, Plus, Users, Settings, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Property, Owner } from '../../types';
import { FirebaseService } from '../../services/firebaseService';

export function PropertySelector() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProperties = async () => {
      try {
        setLoading(true);
        setConnectionError(false);
        
        console.log('🚀 Starting Firebase connection test...');
        
        // Test Firebase connection first
        const isConnected = await FirebaseService.testConnection();
        
        if (!mounted) return;
        
        setIsConnected(isConnected);
        
        if (!isConnected) {
          console.log('❌ Firebase connection failed');
          setConnectionError(true);
          setLoading(false);
          return;
        }

        console.log('✅ Firebase connected, loading properties...');
        const propertiesData = await FirebaseService.getProperties();
        
        if (!mounted) return;
        
        console.log('📊 Properties loaded:', propertiesData);
        setProperties(propertiesData);
        
      } catch (error) {
        if (!mounted) return;
        console.error('💥 Error loading properties:', error);
        setConnectionError(true);
        setIsConnected(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProperties();

    // Subscribe to real-time updates
    console.log('🔄 Setting up real-time subscription...');
    const unsubscribe = FirebaseService.subscribeToProperties((propertiesData) => {
      if (!mounted) return;
      console.log('📡 Real-time update received:', propertiesData);
      setProperties(propertiesData);
      setConnectionError(false);
      setIsConnected(true);
    });

    return () => {
      mounted = false;
      console.log('🔌 Cleaning up subscription');
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    };
  }, []);

  const handleCreateProperty = async (propertyData: Omit<Property, 'id' | 'createdBy' | 'permissions'>) => {
    try {
      console.log('🏠 Creating new property:', propertyData.name);
      const propertyId = await FirebaseService.addProperty({
        ...propertyData,
        createdAt: new Date().toISOString()
      });
      console.log('✅ Property created successfully with ID:', propertyId);
      setShowCreateForm(false);
    } catch (error) {
      console.error('💥 Error creating property:', error);
      alert('Errore durante la creazione della proprietà. Controlla la connessione internet e riprova.');
    }
  };

  const handlePropertySelect = (property: Property) => {
    console.log('🏠 Selecting property:', property.name);
    navigate(`/property/${property.id}`);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Caricamento proprietà...</p>
          <p className="text-sm text-gray-500 mt-2">Connessione a Firebase in corso...</p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <WifiOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Errore di Connessione</h2>
          <p className="text-gray-600 mb-6">
            Non riesco a connettermi al database Firebase. 
            <br />
            Controlla la tua connessione internet e riprova.
          </p>
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full">
              🔄 Riprova Connessione
            </Button>
            <p className="text-xs text-gray-500">
              Se il problema persiste, potrebbe essere un problema di configurazione Firebase
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          
          {/* Connection Status */}
          <div className="mt-3 flex items-center justify-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600 font-medium">
                  Sincronizzazione attiva • {properties.length} {properties.length === 1 ? 'proprietà' : 'proprietà'}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-600 font-medium">Connessione non disponibile</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {properties.map((property) => (
            <Card 
              key={property.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
            >
              <div 
                onClick={() => handlePropertySelect(property)} 
                className="p-4 sm:p-6 text-center"
              >
                <div className="flex flex-col items-center space-y-3 mb-4">
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <Home className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{property.name}</h3>
                    <p className="text-sm text-gray-600">
                      {property.billingCycle === 'monthly' ? 'Mensile' : 'Bimestrale'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-600">Proprietari ({property.owners.length}):</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {property.owners.map((owner) => (
                      <div key={owner.id} className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-full">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: owner.color }}
                        />
                        <span className="text-xs text-gray-700 font-medium">{owner.name}</span>
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
              className="flex flex-col items-center justify-center p-6 sm:p-8 cursor-pointer text-center hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-8 w-8 text-gray-400 mb-3" />
              <span className="text-gray-600 font-medium">Nuova Proprietà</span>
              <span className="text-xs text-gray-500 mt-1">Clicca per aggiungere</span>
            </div>
          </Card>
        </div>

        {/* Debug Info - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
            <p><strong>Debug Info:</strong></p>
            <p>Firebase Connected: {isConnected ? '✅' : '❌'}</p>
            <p>Properties Count: {properties.length}</p>
            <p>Connection Error: {connectionError ? '❌' : '✅'}</p>
          </div>
        )}

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

    console.log('📝 Submitting property form:', formData);

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