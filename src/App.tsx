import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PropertySelector } from './components/PropertySelector/PropertySelector';
import { PropertyDashboard } from './components/PropertyDashboard/PropertyDashboard';

function App() {
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