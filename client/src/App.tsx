import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HospitalDataProvider } from './context/HospitalDataContext';
import { PatternTraceProvider } from './pattern-tracing/PatternTraceContext';
import { Navbar } from './components/layout/Navbar';
import { LivePatternTraceDrawer } from './components/telemetry/LivePatternTraceDrawer';

import { LoginPage } from './pages/Auth/LoginPage';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { ReceptionDashboard } from './pages/Reception/ReceptionDashboard';
import { DoctorDashboard } from './pages/Doctor/DoctorDashboard';
import { NurseDashboard } from './pages/Nurse/NurseDashboard';
import { LabDashboard } from './pages/Lab/LabDashboard';
import { PharmacyDashboard } from './pages/Pharmacy/PharmacyDashboard';
import { BillingDashboard } from './pages/Billing/BillingDashboard';
import { ArchitectureExplorer } from './pages/Architecture/ArchitectureExplorer';

const MainApplication: React.FC = () => {
  const { isAuthenticated, activeRole } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'architecture'>('dashboard');
  const [highlightedPattern, setHighlightedPattern] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => setCurrentView('dashboard')} />;
  }

  const handleNavigate = (view: string) => {
    if (view === 'architecture') {
      setCurrentView('architecture');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleNavigateToArchitecture = (patternName?: string) => {
    if (patternName) setHighlightedPattern(patternName);
    setCurrentView('architecture');
  };

  const renderActiveDashboard = () => {
    if (currentView === 'architecture') {
      return <ArchitectureExplorer initialSelectedPattern={highlightedPattern} />;
    }

    switch (activeRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'receptionist':
        return <ReceptionDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'nurse':
        return <NurseDashboard />;
      case 'lab_tech':
        return <LabDashboard />;
      case 'pharmacist':
        return <PharmacyDashboard />;
      case 'billing_officer':
        return <BillingDashboard />;
      default:
        return <DoctorDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      <Navbar currentView={currentView} onNavigate={handleNavigate} />
      
      <main className="max-w-7xl w-full p-4 sm:p-6 lg:p-8 flex-1">
        {renderActiveDashboard()}
      </main>

      <LivePatternTraceDrawer onNavigateToArchitecture={handleNavigateToArchitecture} />
    </div>
  );
};

export default function App() {
  return (
    <PatternTraceProvider>
      <AuthProvider>
        <HospitalDataProvider>
          <MainApplication />
        </HospitalDataProvider>
      </AuthProvider>
    </PatternTraceProvider>
  );
}
