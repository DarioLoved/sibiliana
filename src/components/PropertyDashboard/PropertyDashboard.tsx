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
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { CalculationService } from '../../services/calculationService';

// Types
import { Property, MeterReading, Bill } from '../../types';

export function PropertyDashboard() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [properties] = useLocalStorage<Property[]>('casa-mare-properties', []);
  const [readings, setReadings] = useLocalStorage<MeterReading[]>(`casa-mare-readings-${propertyId}`, []);
  const [bills, setBills] = useLocalStorage<Bill[]>(`casa-mare-bills-${propertyId}`, []);
  
  const [property, setProperty] = useState<Property | null>(null);
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
    if (propertyId) {
      const foundProperty = properties.find(p => p.id === propertyId);
      if (foundProperty) {
        setProperty(foundProperty);
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [propertyId, properties, navigate]);

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

  const handleSaveReading = (readingData: Omit<MeterReading, 'id' | 'propertyId'>) => {
    if (!property || !propertyId) return;

    if (editingReading) {
      setReadings(prev => prev.map(r => 
        r.id === editingReading.id ? { ...r, ...readingData } : r
      ));
      addNotification({ 
        type: 'success', 
        title: 'Lettura Aggiornata', 
        message: `Lettura del ${new Date(readingData.date).toLocaleDateString('it-IT')} aggiornata.` 
      });
    } else {
      const newReading = { 
        id: Date.now().toString(), 
        ...readingData, 
        propertyId 
      };
      setReadings(prev => [newReading, ...prev.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())]);
      addNotification({ 
        type: 'success', 
        title: 'Lettura Salvata', 
        message: `Nuova lettura del ${new Date(readingData.date).toLocaleDateString('it-IT')} salvata.` 
      });
    }
    setEditingReading(undefined);
    setShowReadingForm(false);
  };

  const handleSaveBill = (billData: Omit<Bill, 'id' | 'propertyId'>) => {
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

    // Calculate expenses
    const calculations = CalculationService.calculateBillExpenses(
      { ...billData, id: '', propertyId },
      startReading,
      endReading,
      property.owners
    );

    const billWithCalculations = { ...billData, calculations };

    if (editingBill) {
      setBills(prev => prev.map(b => 
        b.id === editingBill.id ? { ...b, ...billWithCalculations } : b
      ));
      addNotification({ 
        type: 'success', 
        title: 'Bolletta Aggiornata', 
        message: `Bolletta aggiornata con successo.` 
      });
    } else {
      const newBill = { 
        id: Date.now().toString(), 
        ...billWithCalculations, 
        propertyId 
      };
      setBills(prev => [newBill, ...prev.sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())]);
      addNotification({ 
        type: 'success', 
        title: 'Bolletta Salvata', 
        message: `Nuova bolletta salvata e calcoli generati.` 
      });
    }
    setEditingBill(undefined);
    setShowBillForm(false);
  };

  const handleDeleteReading = (reading: MeterReading) => {
    setReadings(prev => prev.filter(r => r.id !== reading.id));
    addNotification({ 
      type: 'success', 
      title: 'Lettura Eliminata', 
      message: 'Lettura eliminata con successo.' 
    });
  };

  const handleDeleteBill = (bill: Bill) => {
    setBills(prev => prev.filter(b => b.id !== bill.id));
    addNotification({ 
      type: 'success', 
      title: 'Bolletta Eliminata', 
      message: 'Bolletta eliminata con successo.' 
    });
  };

  const handleEditReading = (reading: MeterReading) => {
    setEditingReading(reading);
    setShowReadingForm(true);
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setShowBillForm(true);
  };

  const handleSavePropertySettings = (updatedProperty: Property) => {
    const [allProperties, setAllProperties] = useLocalStorage<Property[]>('casa-mare-properties', []);
    setAllProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
    setProperty(updatedProperty);
    addNotification({ 
      type: 'success', 
      title: 'Impostazioni Salvate', 
      message: 'Impostazioni della proprietà aggiornate.' 
    });
  };

  const handleDeleteProperty = () => {
    if (!property || !propertyId) return;

    const [allProperties, setAllProperties] = useLocalStorage<Property[]>('casa-mare-properties', []);
    setAllProperties(prev => prev.filter(p => p.id !== propertyId));
    
    // Clear property data
    localStorage.removeItem(`casa-mare-readings-${propertyId}`);
    localStorage.removeItem(`casa-mare-bills-${propertyId}`);
    
    addNotification({ 
      type: 'success', 
      title: 'Proprietà Eliminata', 
      message: 'Proprietà eliminata con successo.' 
    });
    navigate('/', { replace: true });
  };

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