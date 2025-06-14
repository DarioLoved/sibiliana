import React, { useState, useEffect, useCallback } from 'react';

// Components and services
import { PropertySelector } from './components/PropertySelector/PropertySelector';
import { Header } from './components/Layout/Header';
import { Navigation, NavigationTab } from './components/Layout/Navigation';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { ReadingsList } from './components/Readings/ReadingsList';
import { ReadingForm } from './components/Readings/ReadingForm';
import { BillsList } from './components/Bills/BillsList';
import { BillForm } from './components/Bills/BillForm';
import { HistoryView } from './components/History/HistoryView';
import { PropertySettings } from './components/PropertySettings/PropertySettings';
import { NotificationPanel } from './components/Notifications/NotificationPanel';

// Hooks and services
import { useNotifications } from './hooks/useNotifications';
import { useAppState } from './hooks/useAppState';
import { FirebaseService } from './services/firebaseService';
import { CalculationService } from './services/calculationService';

// Types
import { Property, MeterReading, Bill } from './types';

function App() {
  const { appState, updateAppState, clearAppState } = useAppState();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showReadingForm, setShowReadingForm] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const [showPropertySettings, setShowPropertySettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [editingReading, setEditingReading] = useState<MeterReading | undefined>();
  const [editingBill, setEditingBill] = useState<Bill | undefined>();
  
  const { notifications, addNotification, markAsRead } = useNotifications();

  // Restore app state on load
  useEffect(() => {
    const restoreAppState = async () => {
      if (appState.selectedPropertyId) {
        try {
          const property = await FirebaseService.getProperty(appState.selectedPropertyId);
          if (property) {
            setSelectedProperty(property);
            if (appState.activeTab) {
              setActiveTab(appState.activeTab as NavigationTab);
            }
          } else {
            // Property no longer exists, clear state
            clearAppState();
          }
        } catch (error) {
          console.error('Error restoring app state:', error);
          clearAppState();
        }
      }
    };

    restoreAppState();
  }, [appState.selectedPropertyId, appState.activeTab, clearAppState]);

  // Load property data when property is selected
  useEffect(() => {
    if (selectedProperty) {
      loadPropertyData(selectedProperty.id);
      updateAppState({ selectedPropertyId: selectedProperty.id });
    }
  }, [selectedProperty, updateAppState]);

  // Update active tab in app state
  useEffect(() => {
    if (selectedProperty) {
      updateAppState({ activeTab });
    }
  }, [activeTab, selectedProperty, updateAppState]);

  const loadPropertyData = async (propertyId: string) => {
    setIsLoading(true);
    try {
      const [readingsData, billsData] = await Promise.all([
        FirebaseService.getReadings(propertyId),
        FirebaseService.getBills(propertyId)
      ]);
      
      // Calculate bill expenses for each bill
      const billsWithCalculations = billsData.map(bill => {
        const startReading = readingsData.find(r => r.id === bill.startReadingId);
        const endReading = readingsData.find(r => r.id === bill.endReadingId);
        
        if (startReading && endReading && selectedProperty) {
          const calculations = CalculationService.calculateBillExpenses(
            bill, 
            startReading, 
            endReading, 
            selectedProperty.owners
          );
          return { ...bill, calculations };
        }
        return bill;
      });
      
      setReadings(readingsData);
      setBills(billsWithCalculations);
      
      addNotification({ 
        type: 'info', 
        title: 'Dati Caricati', 
        message: `Dati di ${selectedProperty?.name} caricati con successo.` 
      });
    } catch (error) {
      console.error('Error loading property data:', error);
      addNotification({ 
        type: 'error', 
        title: 'Errore di Caricamento', 
        message: 'Impossibile caricare i dati della proprietà.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setActiveTab('dashboard');
    setIsMobileMenuOpen(false);
  };

  const handleBackToProperties = () => {
    setSelectedProperty(null);
    clearAppState();
    setActiveTab('dashboard');
    setIsMobileMenuOpen(false);
  };

  const handleTabChange = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleSaveReading = async (readingData: Omit<MeterReading, 'id' | 'propertyId'>) => {
    if (!selectedProperty) return;

    try {
      if (editingReading) {
        await FirebaseService.updateReading(selectedProperty.id, editingReading.id, readingData);
        setReadings(prev => prev.map(r => 
          r.id === editingReading.id ? { ...r, ...readingData } : r
        ));
        addNotification({ 
          type: 'success', 
          title: 'Lettura Aggiornata', 
          message: `Lettura del ${new Date(readingData.date).toLocaleDateString('it-IT')} aggiornata.` 
        });
      } else {
        const id = await FirebaseService.createReading(selectedProperty.id, readingData);
        const newReading = { id, ...readingData, propertyId: selectedProperty.id };
        setReadings(prev => [newReading, ...prev]);
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
        message: 'Impossibile salvare la lettura.' 
      });
    }
  };

  const handleSaveBill = async (billData: Omit<Bill, 'id' | 'propertyId'>) => {
    if (!selectedProperty) return;

    try {
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

      // Calculate expenses
      const calculations = CalculationService.calculateBillExpenses(
        { ...billData, id: '', propertyId: selectedProperty.id },
        startReading,
        endReading,
        selectedProperty.owners
      );

      const billWithCalculations = { ...billData, calculations };

      if (editingBill) {
        await FirebaseService.updateBill(selectedProperty.id, editingBill.id, billWithCalculations);
        setBills(prev => prev.map(b => 
          b.id === editingBill.id ? { ...b, ...billWithCalculations } : b
        ));
        addNotification({ 
          type: 'success', 
          title: 'Bolletta Aggiornata', 
          message: `Bolletta aggiornata con successo.` 
        });
      } else {
        const id = await FirebaseService.createBill(selectedProperty.id, billWithCalculations);
        const newBill = { id, ...billWithCalculations, propertyId: selectedProperty.id };
        setBills(prev => [newBill, ...prev]);
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
        message: 'Impossibile salvare la bolletta.' 
      });
    }
  };

  const handleDeleteReading = async (reading: MeterReading) => {
    if (!selectedProperty) return;

    try {
      await FirebaseService.deleteReading(selectedProperty.id, reading.id);
      setReadings(prev => prev.filter(r => r.id !== reading.id));
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
        message: 'Impossibile eliminare la lettura.' 
      });
    }
  };

  const handleDeleteBill = async (bill: Bill) => {
    if (!selectedProperty) return;

    try {
      await FirebaseService.deleteBill(selectedProperty.id, bill.id);
      setBills(prev => prev.filter(b => b.id !== bill.id));
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
        message: 'Impossibile eliminare la bolletta.' 
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
      setSelectedProperty(updatedProperty);
      setShowPropertySettings(false);
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
        message: 'Impossibile aggiornare le impostazioni.' 
      });
    }
  };

  const renderContent = () => {
    if (!selectedProperty) return null;

    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview property={selectedProperty} readings={readings} bills={bills} />;
      case 'readings':
        return (
          <ReadingsList 
            readings={readings} 
            property={selectedProperty}
            onAddReading={() => setShowReadingForm(true)} 
            onEditReading={handleEditReading}
            onDeleteReading={handleDeleteReading}
          />
        );
      case 'bills':
        return (
          <BillsList 
            bills={bills} 
            property={selectedProperty}
            readings={readings}
            onAddBill={() => setShowBillForm(true)} 
            onEditBill={handleEditBill}
            onDeleteBill={handleDeleteBill}
          />
        );
      case 'history':
        return (
          <HistoryView 
            readings={readings} 
            bills={bills} 
            property={selectedProperty}
          />
        );
      default:
        return null;
    }
  };

  if (!selectedProperty) {
    return <PropertySelector onPropertySelect={handlePropertySelect} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">Caricamento dati...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <Header 
        property={selectedProperty}
        onNotificationsClick={() => setShowNotifications(true)}
        onSettingsClick={() => setShowPropertySettings(true)}
        onBackToProperties={handleBackToProperties}
        onMenuClick={() => setIsMobileMenuOpen(true)}
      />
      <Navigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {renderContent()}
      </main>

      {/* Modals */}
      <ReadingForm 
        isOpen={showReadingForm} 
        onClose={() => { setShowReadingForm(false); setEditingReading(undefined); }} 
        onSave={handleSaveReading} 
        property={selectedProperty}
        editingReading={editingReading} 
      />
      
      <BillForm 
        isOpen={showBillForm} 
        onClose={() => { setShowBillForm(false); setEditingBill(undefined); }} 
        onSave={handleSaveBill} 
        editingBill={editingBill}
        readings={readings}
      />
      
      <PropertySettings
        isOpen={showPropertySettings}
        onClose={() => setShowPropertySettings(false)}
        onSave={handleSavePropertySettings}
        property={selectedProperty}
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

export default App;