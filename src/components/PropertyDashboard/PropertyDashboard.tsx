import React, { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';

// Components and services
import { Header } from '../Layout/Header';
import { Navigation, NavigationTab } from '../Layout/Navigation';
import { DashboardOverview } from '../Dashboard/DashboardOverview';
import { ReadingsList } from '../Readings/ReadingsList';
import { ReadingForm } from '../Readings/ReadingForm';
import { BillsList } from '../Bills/BillsList';
import { BillForm } from '../Bills/BillForm';
import { HistoryView } from '../History/HistoryView';
import { PropertySettings } from '../PropertySettings/PropertySettings';
import { NotificationPanel } from '../Notifications/NotificationPanel';

// Hooks and services
import { useNotifications } from '../../hooks/useNotifications';
import { CalculationService } from '../../services/calculationService';
import { FirebaseService } from '../../services/firebaseService';

// Types
import { Property, MeterReading, Bill } from '../../types';
import { Loader2, AlertCircle, WifiOff, Settings } from 'lucide-react';
import { Button } from '../Common/Button';

export function PropertyDashboard() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [editingReading, setEditingReading] = useState<MeterReading | undefined>();
  const [editingBill, setEditingBill] = useState<Bill | undefined>();
  
  const { notifications, addNotification, markAsRead } = useNotifications();

  // Set active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/readings')) {
      setActiveTab('readings');
    } else if (path.includes('/bills')) {
      setActiveTab('bills');
    } else if (path.includes('/history')) {
      setActiveTab('history');
    } else if (path.includes('/settings')) {
      setActiveTab('settings');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  // Loading timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ Loading timeout reached');
        setLoadingTimeout(true);
        setError('Timeout di caricamento. Verifica la configurazione Firebase.');
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Load property data
  useEffect(() => {
    if (!propertyId) {
      console.log('❌ No propertyId provided');
      navigate('/', { replace: true });
      return;
    }

    console.log('🚀 PropertyDashboard: Starting data load for property:', propertyId);

    let mounted = true;
    let unsubscribeFunctions: (() => void)[] = [];

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setLoadingTimeout(false);
        
        console.log('🔍 Testing Firebase connection...');
        const isConnected = await FirebaseService.testConnection();
        
        if (!mounted) return;
        
        if (!isConnected) {
          throw new Error('Firebase non configurato correttamente. Controlla le credenziali nel file firebaseService.ts');
        }
        
        console.log('📊 Loading initial data...');
        // Load initial data with shorter timeout
        const loadPromise = Promise.all([
          FirebaseService.getProperties().then(props => {
            const found = props.find(p => p.id === propertyId);
            console.log('🏠 Property found:', found ? found.name : 'NOT FOUND');
            return found;
          }),
          FirebaseService.getReadings(propertyId),
          FirebaseService.getBills(propertyId)
        ]);

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Data loading timeout')), 8000);
        });

        const [propertyData, readingsData, billsData] = await Promise.race([loadPromise, timeoutPromise]);

        if (!mounted) return;

        if (!propertyData) {
          console.log('❌ Property not found, redirecting to home');
          navigate('/', { replace: true });
          return;
        }

        console.log('✅ Initial data loaded successfully');
        setProperty(propertyData);
        setReadings(readingsData);
        setBills(billsData);
        setLoading(false);
        
        // Subscribe to real-time updates only after initial load
        console.log('🔄 Setting up real-time subscriptions...');
        
        const unsubscribeProperty = FirebaseService.subscribeToProperty(propertyId, (propertyData) => {
          if (!mounted) return;
          console.log('📡 Property update received:', propertyData ? propertyData.name : 'NULL');
          if (propertyData) {
            setProperty(propertyData);
            setError(null);
          } else {
            console.log('❌ Property subscription returned null, redirecting');
            navigate('/', { replace: true });
          }
        });

        const unsubscribeReadings = FirebaseService.subscribeToReadings(propertyId, (readingsData) => {
          if (!mounted) return;
          console.log('📡 Readings update received:', readingsData.length, 'readings');
          setReadings(readingsData);
        });

        const unsubscribeBills = FirebaseService.subscribeToBills(propertyId, (billsData) => {
          if (!mounted) return;
          console.log('📡 Bills update received:', billsData.length, 'bills');
          setBills(billsData);
        });

        unsubscribeFunctions = [unsubscribeProperty, unsubscribeReadings, unsubscribeBills];
        
      } catch (error) {
        if (!mounted) return;
        console.error('💥 Error loading data:', error);
        setError(error instanceof Error ? error.message : 'Errore di caricamento');
        setLoading(false);
        addNotification({
          type: 'error',
          title: 'Errore di Caricamento',
          message: 'Errore nel caricamento dei dati. Riprova.'
        });
      }
    };

    loadData();

    return () => {
      mounted = false;
      console.log('🔌 Cleaning up subscriptions for property:', propertyId);
      unsubscribeFunctions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
    };
  }, [propertyId, navigate, addNotification]);

  const handleTabChange = (tab: NavigationTab) => {
    if (!propertyId) return;
    
    setIsMobileMenuOpen(false);
    
    switch (tab) {
      case 'dashboard':
        navigate(`/property/${propertyId}`);
        break;
      case 'readings':
        navigate(`/property/${propertyId}/readings`);
        break;
      case 'bills':
        navigate(`/property/${propertyId}/bills`);
        break;
      case 'history':
        navigate(`/property/${propertyId}/history`);
        break;
      case 'settings':
        navigate(`/property/${propertyId}/settings`);
        break;
    }
  };

  const handleBackToProperties = () => {
    navigate('/', { replace: true });
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleSaveReading = async (readingData: Omit<MeterReading, 'id' | 'propertyId'>) => {
    if (!property || !propertyId) return;

    try {
      if (editingReading) {
        await FirebaseService.updateReading(editingReading.id, readingData);
        addNotification({ 
          type: 'success', 
          title: 'Lettura Aggiornata', 
          message: `Lettura del ${new Date(readingData.date).toLocaleDateString('it-IT')} aggiornata.` 
        });
      } else {
        await FirebaseService.addReading({ ...readingData, propertyId });
        addNotification({ 
          type: 'success', 
          title: 'Lettura Salvata', 
          message: `Nuova lettura del ${new Date(readingData.date).toLocaleDateString('it-IT')} salvata.` 
        });
      }
      setEditingReading(undefined);
      setShowReadingForm(false);
    } catch (error) {
      console.error('Error saving reading:', error);
      addNotification({ 
        type: 'error', 
        title: 'Errore', 
        message: 'Errore nel salvataggio della lettura.' 
      });
    }
  };

  const handleSaveBill = async (billData: Omit<Bill, 'id' | 'propertyId'>) => {
    if (!property || !propertyId) return;

    const startReading = readings.find(r => r.id === billData.startReadingId);
    const endReading = readings.find(r => r.id === billData.endReadingId);
    
    if (!startReading || !endReading) {
      addNotification({ 
        type: 'error', 
        title: 'Errore', 
        message: 'Letture di riferimento non trovate.' 
      });
      return;
    }

    try {
      // Calculate expenses
      const calculations = CalculationService.calculateBillExpenses(
        { ...billData, id: '', propertyId },
        startReading,
        endReading,
        property.owners
      );

      const billWithCalculations = { ...billData, calculations };

      if (editingBill) {
        await FirebaseService.updateBill(editingBill.id, billWithCalculations);
        addNotification({ 
          type: 'success', 
          title: 'Bolletta Aggiornata', 
          message: `Bolletta aggiornata con successo.` 
        });
      } else {
        await FirebaseService.addBill({ ...billWithCalculations, propertyId });
        addNotification({ 
          type: 'success', 
          title: 'Bolletta Salvata', 
          message: `Nuova bolletta salvata e calcoli generati.` 
        });
      }
      setEditingBill(undefined);
      setShowBillForm(false);
    } catch (error) {
      console.error('Error saving bill:', error);
      addNotification({ 
        type: 'error', 
        title: 'Errore', 
        message: 'Errore nel salvataggio della bolletta.' 
      });
    }
  };

  const handleDeleteReading = async (reading: MeterReading) => {
    try {
      await FirebaseService.deleteReading(reading.id);
      addNotification({ 
        type: 'success', 
        title: 'Lettura Eliminata', 
        message: 'Lettura eliminata con successo.' 
      });
    } catch (error) {
      console.error('Error deleting reading:', error);
      addNotification({ 
        type: 'error', 
        title: 'Errore', 
        message: 'Errore nell\'eliminazione della lettura.' 
      });
    }
  };

  const handleDeleteBill = async (bill: Bill) => {
    try {
      await FirebaseService.deleteBill(bill.id);
      addNotification({ 
        type: 'success', 
        title: 'Bolletta Eliminata', 
        message: 'Bolletta eliminata con successo.' 
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      addNotification({ 
        type: 'error', 
        title: 'Errore', 
        message: 'Errore nell\'eliminazione della bolletta.' 
      });
    }
  };

  const handleEditReading = (reading: MeterReading) => {
    setEditingReading(reading);
    setShowReadingForm(true);
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setShowBillForm(true);
  };

  const handleSavePropertySettings = async (updatedProperty: Property) => {
    try {
      await FirebaseService.updateProperty(updatedProperty.id, updatedProperty);
      addNotification({ 
        type: 'success', 
        title: 'Impostazioni Salvate', 
        message: 'Impostazioni della proprietà aggiornate.' 
      });
    } catch (error) {
      console.error('Error updating property:', error);
      addNotification({ 
        type: 'error', 
        title: 'Errore', 
        message: 'Errore nell\'aggiornamento delle impostazioni.' 
      });
    }
  };

  const handleDeleteProperty = async () => {
    if (!property || !propertyId) return;

    try {
      await FirebaseService.deleteProperty(propertyId);
      addNotification({ 
        type: 'success', 
        title: 'Proprietà Eliminata', 
        message: 'Proprietà eliminata con successo.' 
      });
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error deleting property:', error);
      addNotification({ 
        type: 'error', 
        title: 'Errore', 
        message: 'Errore nell\'eliminazione della proprietà.' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <div className="text-xl font-semibold text-gray-700 mb-2">Caricamento dati...</div>
          <div className="text-sm text-gray-500 mb-4">Connessione a Firebase in corso...</div>
          <div className="mt-4 flex items-center justify-center space-x-2 mb-6">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          {loadingTimeout && (
            <div className="space-y-3">
              <p className="text-sm text-yellow-600">
                Il caricamento sta richiedendo più tempo del previsto...
              </p>
              <Button onClick={handleRetry} variant="secondary" className="w-full">
                🔄 Riprova
              </Button>
              <Button onClick={handleBackToProperties} variant="ghost" className="w-full">
                ← Torna alle Proprietà
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            {error.includes('Firebase') ? (
              <Settings className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            ) : (
              <WifiOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error.includes('Firebase') ? 'Configurazione Firebase' : 'Errore di Connessione'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
            {error.includes('Firebase') && (
              <>
                <br /><br />
                <strong>Per risolvere:</strong>
                <br />1. Vai su Firebase Console
                <br />2. Copia le credenziali del progetto
                <br />3. Aggiorna firebaseService.ts
              </>
            )}
          </p>
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full">
              🔄 Riprova Connessione
            </Button>
            <Button onClick={handleBackToProperties} variant="secondary" className="w-full">
              ← Torna alle Proprietà
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proprietà non trovata</h2>
          <p className="text-gray-600 mb-6">
            La proprietà richiesta non esiste o non è più disponibile.
          </p>
          <Button onClick={handleBackToProperties} className="w-full">
            ← Torna alle Proprietà
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <Header 
        property={property}
        onNotificationsClick={() => setShowNotifications(true)}
        onBackToProperties={handleBackToProperties}
        onMenuClick={() => setIsMobileMenuOpen(true)}
      />
      <Navigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
        <Routes>
          <Route 
            path="/" 
            element={
              <DashboardOverview 
                property={property} 
                readings={readings} 
                bills={bills} 
              />
            } 
          />
          <Route 
            path="/readings" 
            element={
              <ReadingsList 
                readings={readings} 
                property={property}
                onAddReading={() => setShowReadingForm(true)} 
                onEditReading={handleEditReading}
                onDeleteReading={handleDeleteReading}
              />
            } 
          />
          <Route 
            path="/bills" 
            element={
              <BillsList 
                bills={bills} 
                property={property}
                readings={readings}
                onAddBill={() => setShowBillForm(true)} 
                onEditBill={handleEditBill}
                onDeleteBill={handleDeleteBill}
              />
            } 
          />
          <Route 
            path="/history" 
            element={
              <HistoryView 
                readings={readings} 
                bills={bills} 
                property={property}
              />
            } 
          />
          <Route 
            path="/settings" 
            element={
              <PropertySettings
                property={property}
                onSave={handleSavePropertySettings}
                onDelete={handleDeleteProperty}
                canManage={true}
              />
            } 
          />
        </Routes>
      </main>

      {/* Modals */}
      <ReadingForm 
        isOpen={showReadingForm} 
        onClose={() => { setShowReadingForm(false); setEditingReading(undefined); }} 
        onSave={handleSaveReading} 
        property={property}
        editingReading={editingReading} 
      />
      
      <BillForm 
        isOpen={showBillForm} 
        onClose={() => { setShowBillForm(false); setEditingBill(undefined); }} 
        onSave={handleSaveBill} 
        editingBill={editingBill}
        readings={readings}
      />
      
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        notifications={notifications} 
        onMarkAsRead={markAsRead} 
      />
    </div>
  );
}