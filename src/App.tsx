// =======================================================
// NUOVO CODICE PER:  src/App.tsx
// =======================================================
import React, { useState, useEffect, useCallback } from 'react';

// Importiamo il nostro database centralizzato e gli strumenti
import { db } from './firebase'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Componenti e altri import
import { Header } from './components/Layout/Header';
import { Navigation, NavigationTab } from './components/Layout/Navigation';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { ReadingsList } from './components/Readings/ReadingsList';
import { ReadingForm } from './components/Readings/ReadingForm';
import { BillsList } from './components/Bills/BillsList';
import { BillForm } from './components/Bills/BillForm';
import { CalculationsList } from './components/Calculations/CalculationsList';
import { HistoryView } from './components/History/HistoryView';
import { NotificationPanel } from './components/Notifications/NotificationPanel';
import { useNotifications } from './hooks/useNotifications';
import { CalculationService } from './services/calculationService';
import { ReportService } from './services/reportService';
import { Owner, MeterReading, Bill, BillCalculation } from './types';

const dataDocRef = doc(db, 'dati_app', 'casa-al-mare');

function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  
  const [owners] = useState<Owner[]>([
    { id: '1', name: 'Dino', color: '#3b82f6' },
    { id: '2', name: 'Uccio', color: '#059669' },
    { id: '3', name: 'Filippo', color: '#f97316' },
  ]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  
  const [calculations, setCalculations] = useState<BillCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showReadingForm, setShowReadingForm] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editingReading, setEditingReading] = useState<MeterReading | undefined>();
  const [editingBill, setEditingBill] = useState<Bill | undefined>();
  const { notifications, addNotification, markAsRead } = useNotifications();

  const saveDataToFirebase = useCallback(async (newReadings: MeterReading[], newBills: Bill[]) => {
    try {
      await setDoc(dataDocRef, { readings: newReadings, bills: newBills });
      addNotification({ type: 'info', title: 'Sincronizzato', message: 'Dati salvati nel cloud.' });
    } catch (error) {
      console.error("Errore nel salvare i dati su Firebase:", error);
      addNotification({ type: 'error', title: 'Errore di Sincronizzazione', message: 'Impossibile salvare i dati nel cloud.' });
    }
  }, [addNotification]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const docSnap = await getDoc(dataDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setReadings(data.readings || []);
          setBills(data.bills || []);
          console.log("Dati caricati da Firebase!");
        } else {
          console.log("Nessun dato su Firebase, inizio da zero.");
        }
      } catch (error) {
        console.error("Errore critico durante il caricamento da Firebase:", error);
        addNotification({ type: 'error', title: 'Errore di Connessione', message: 'Impossibile caricare i dati dal cloud.' });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [addNotification]);

  useEffect(() => {
    if (isLoading) return; 
    const newCalculations: BillCalculation[] = [];
    bills.forEach(bill => {
      try {
        const calculation = CalculationService.calculateExpenses(bill, owners, readings);
        newCalculations.push(calculation);
      } catch (error) {
        console.warn(`Could not calculate expenses for bill ${bill.id}:`, error);
      }
    });
    setCalculations(newCalculations);
  }, [bills, readings, owners, isLoading]);

  const handleSaveReading = (readingData: Omit<MeterReading, 'id'>) => {
    let updatedReadings;
    const newReading: MeterReading = { ...readingData, id: editingReading?.id || Date.now().toString() };
    if (editingReading) {
      updatedReadings = readings.map(r => r.id === editingReading.id ? newReading : r);
      addNotification({ type: 'success', title: 'Lettura Aggiornata', message: `Lettura del ${new Date(newReading.date).toLocaleDateString('it-IT')} aggiornata.` });
    } else {
      updatedReadings = [...readings, newReading];
      addNotification({ type: 'success', title: 'Lettura Salvata', message: `Nuova lettura del ${new Date(newReading.date).toLocaleDateString('it-IT')} salvata.` });
    }
    setReadings(updatedReadings);
    saveDataToFirebase(updatedReadings, bills);
    setEditingReading(undefined);
  };

  const handleSaveBill = (billData: Omit<Bill, 'id'>) => {
    let updatedBills;
    const newBill: Bill = { ...billData, id: editingBill?.id || Date.now().toString() };
    if (editingBill) {
      updatedBills = bills.map(b => b.id === editingBill.id ? newBill : b);
      addNotification({ type: 'success', title: 'Bolletta Aggiornata', message: `Bolletta del ${new Date(newBill.date).toLocaleDateString('it-IT')} aggiornata.` });
    } else {
      updatedBills = [...bills, newBill];
      addNotification({ type: 'success', title: 'Bolletta Salvata', message: `Nuova bolletta del ${new Date(newBill.date).toLocaleDateString('it-IT')} salvata.` });
    }
    setBills(updatedBills);
    saveDataToFirebase(readings, updatedBills);
    setEditingBill(undefined);
  };

  const handleEditReading = (reading: MeterReading) => {
    setEditingReading(reading);
    setShowReadingForm(true);
  };
  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setShowBillForm(true);
  };
  const handleGenerateReport = async (calculation: BillCalculation) => {
    try {
      await ReportService.generateReport(calculation, owners);
      addNotification({ type: 'success', title: 'Report Generato', message: 'Il report è stato generato e scaricato.' });
    } catch (error) {
      addNotification({ type: 'error', title: 'Errore', message: 'Impossibile generare il report.' });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview owners={owners} readings={readings} bills={bills} />;
      case 'readings':
        return <ReadingsList readings={readings} owners={owners} onAddReading={() => setShowReadingForm(true)} onEditReading={handleEditReading}/>;
      case 'bills':
        return <BillsList bills={bills} onAddBill={() => setShowBillForm(true)} onEditBill={handleEditBill} />;
      case 'calculations':
        return <CalculationsList calculations={calculations} owners={owners} onGenerateReport={handleGenerateReport} />;
      case 'history':
        return <HistoryView readings={readings} bills={bills} calculations={calculations} owners={owners} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">Caricamento dati dal cloud...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNotificationsClick={() => setShowNotifications(true)} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
      <ReadingForm isOpen={showReadingForm} onClose={() => { setShowReadingForm(false); setEditingReading(undefined); }} onSave={handleSaveReading} owners={owners} editingReading={editingReading} />
      <BillForm isOpen={showBillForm} onClose={() => { setShowBillForm(false); setEditingBill(undefined); }} onSave={handleSaveBill} editingBill={editingBill} />
      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} notifications={notifications} onMarkAsRead={markAsRead} />
    </div>
  );
}

export default App;