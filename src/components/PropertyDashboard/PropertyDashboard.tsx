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
import { Loader2 } from 'lucide-react';

export function PropertyDashboard() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  // Load property data
  useEffect(() => {
    if (!propertyId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load initial data
        const [propertyData, readingsData, billsData] = await Promise.all([
          FirebaseService.getProperties().then(props => props.find(p => p.id === propertyId)),
          FirebaseService.getReadings(propertyId),
          FirebaseService.getBills(propertyId)
        ]);

        if (!propertyData) {
          navigate('/', { replace: true });
          return;
        }

        setProperty(propertyData);
        setReadings(readingsData);
        setBills(billsData);
      } catch (error) {
        console.error('Error loading data:', error);
        addNotification({
          type: 'error',
          title: 'Errore di Caricamento',
          message: 'Errore nel caricamento dei dati. Riprova.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribeProperty = FirebaseService.subscribeToProperty(propertyId, (propertyData) => {
      if (propertyData) {
        setProperty(propertyData);
      } else {
        navigate('/', { replace: true });
      }
    });

    const unsubscribeReadings = FirebaseService.subscribeToReadings(propertyId, (readingsData) => {
      setReadings(readingsData);
    });

    const unsubscribeBills = FirebaseService.subscribeToBills(propertyId, (billsData) => {
      setBills(billsData);
    });

    return () => {
      unsubscribeProperty();
      unsubscribeReadings();
      unsubscribeBills();
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
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <div className="text-xl font-semibold text-gray-700">Caricamento dati...</div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">Proprietà non trovata</div>
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