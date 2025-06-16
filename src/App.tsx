import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthWrapper } from './components/Auth/AuthWrapper';
import { PropertySelector } from './components/PropertySelector/PropertySelector';
import { PropertyDashboard } from './components/PropertyDashboard/PropertyDashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">Caricamento...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthWrapper />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<PropertySelector />} />
        <Route path="/property/:propertyId/*" element={<PropertyDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;