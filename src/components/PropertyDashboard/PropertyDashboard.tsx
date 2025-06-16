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
import { UserManagementPanel } from '../UserManagement/UserManagementPanel';

// Hooks and services
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { FirebaseService } from '../../services/firebaseService';
import { CalculationService } from '../../services/calculationService';
import { PermissionService } from '../../services/permissionService';

// Types
import { Property, MeterReading, Bill } from '../../types';

export function PropertyDashboard() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const [showReadingForm, setShowReadingForm] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const [showPropertySettings, setShowPropertySettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  
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
    if (propertyId && user) {
      loadProperty(propertyId);
    }
  }, [propertyId, user]);

  const loadProperty = async (id: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const propertyData = await FirebaseService.getProperty(id);
      if (!propertyData) {
        navigate('/', { replace: true });
        return;
      }

      // Check if user has access to this property
      const canAccess = propertyData.createdBy === user.id || 
                       PermissionService.canUserPerformAction(propertyData, user.id, 'read');
      
      if (!canAccess) {
        addNotification({ 
          type: 'error', 
          title: 'Accesso Negato', 
          message: 'Non hai i permessi per accedere a questa proprietà.' 
        });
        navigate('/', { replace: true });
        return;
      }
      
      setProperty(propertyData);
      setHasAccess(true);
      await loadPropertyData(id);
      
      addNotification({ 
        type: 'info', 
        title: 'Dati Caricati', 
        message: `Dati di ${propertyData.name} caricati con successo.` 
      });
    } catch (error) {
      console.error('Error loading property:', error);
      addNotification({ 
        type: 'error', 
        title: 'Errore di Caricamento', 
        message: 'Impossibile caricare i dati della proprietà.' 
      });
      navigate('/', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPropertyData = async (id: string) => {
    try {
      const [readingsData, billsData] = await Promise.all([
        FirebaseService.getReadings(id),
        FirebaseService.getBills(id)
      ]);
      
      // Calculate bill expenses for each bill
      const billsWithCalculations = billsData.map(bill => {
        const startReading = readingsData.find(r => r.id === bill.startReadingId);
        const endReading = readingsData.find(r => r.id === bill.endReadingId);
        
        if (startReading && endReading && property) {
          const calculations = CalculationService.calculateBillExpenses(
            bill, 
            startReading, 
            endReading, 
            property.owners
          );
          return { ...bill, calculations };
        }
        return bill;
      });
      
      setReadings(readingsData);
      setBills(billsWithCalculations);
    } catch (error) {
      console.error('Error loading property data:', error);
      addNotification({ 
        type: 'error', 
        title: 'Errore di Caricamento', 
        message: 'Impossibile caricare i dati della proprietà.' 
      });
    }
  };

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

  const canWrite = user && property && PermissionService.canUserPerformAction(property, user.id, 'write');
  const canDelete = user && property && PermissionService.canUserPerformAction(property, user.id, 'delete');
  const canManage = user && property && PermissionService.canUserPerformAction(property, user.id, 'manage');

  const handleSaveReading = async (readingData: Omit<MeterReading, 'id' | 'propertyId'>) => {
    if (!property || !propertyId || !user || !canWrite) return;

    try {
      if (editingReading) {
        await FirebaseService.updateReading(propertyId, editingReading.id, readingData);
        setReadings(prev => prev.map(r => 
          r.id === editingReading.id ? { ...r, ...readingData } : r
        ));
        addNotification({ 
          type: 'success', 
          title: 'Lettura Aggiornata', 
          message: `Lettura del ${new Date(readingData.date).toLocaleDateString('it-IT')} aggiornata.` 
        });
      } else {
        const id = await FirebaseService.createReading(propertyId, readingData, user.id);
        const newReading = { id, ...readingData, propertyId };
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
    if (!property || !propertyId || !user || !canWrite) return;

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
        { ...billData, id: '', propertyId },
        startReading,
        endReading,
        property.owners
      );

      const billWithCalculations = { ...billData, calculations };

      if (editingBill) {
        await FirebaseService.updateBill(propertyId, editingBill.id, billWithCalculations);
        setBills(prev => prev.map(b => 
          b.id === editingBill.id ? { ...b, ...billWithCalculations } : b
        ));
        addNotification({ 
          type: 'success', 
          title: 'Bolletta Aggiornata', 
          message: `Bolletta aggiornata con successo.` 
        });
      } else {
        const id = await FirebaseService.createBill(propertyId, billWithCalculations, user.id);
        const newBill = { id, ...billWithCalculations, propertyId };
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
    if (!propertyId || !canDelete) return;

    try {
      await FirebaseService.deleteReading(propertyId, reading.id);
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
    if (!propertyId || !canDelete) return;

    try {
      await FirebaseService.deleteBill(propertyId, bill.id);
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
    if (!canWrite) return;
    setEditingReading(reading);
    setShowReadingForm(true);
  };

  const handleEditBill = (bill: Bill) => {
    if (!canWrite) return;
    setEditingBill(bill);
    setShowBillForm(true);
  };

  const handleSavePropertySettings = async (updatedProperty: Property) => {
    if (!canManage) return;
    
    try {
      await FirebaseService.updateProperty(updatedProperty.id, updatedProperty);
      setProperty(updatedProperty);
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

  const handleDeleteProperty = async () => {
    if (!property || !propertyId || !canManage) return;

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
        message: 'Impossibile eliminare la proprietà.' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">Caricamento dati...</div>
      </div>
    );
  }

  if (!property || !hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">Proprietà non trovata o accesso negato</div>
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
        onUserManagementClick={canManage ? () => setShowUserManagement(true) : undefined}
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
                onAddReading={canWrite ? () => setShowReadingForm(true) : undefined} 
                onEditReading={canWrite ? handleEditReading : undefined}
                onDeleteReading={canDelete ? handleDeleteReading : undefined}
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
                onAddBill={canWrite ? () => setShowBillForm(true) : undefined} 
                onEditBill={canWrite ? handleEditBill : undefined}
                onDeleteBill={canDelete ? handleDeleteBill : undefined}
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
                onSave={canManage ? handleSavePropertySettings : undefined}
                onDelete={canManage ? handleDeleteProperty : undefined}
                canManage={canManage}
              />
            } 
          />
        </Routes>
      </main>

      {/* Modals */}
      {canWrite && (
        <>
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
        </>
      )}
      
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        notifications={notifications} 
        onMarkAsRead={markAsRead} 
      />

      {canManage && (
        <UserManagementPanel
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
          property={property}
          onPropertyUpdate={setProperty}
        />
      )}
    </div>
  );
}