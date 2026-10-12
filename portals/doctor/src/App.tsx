import React from 'react';
import { PortalLayout } from '@shared/components/layout/PortalLayout';
import { DoctorDashboard } from '@shared/pages/Doctor/DoctorDashboard';

export default function App() {
  return (
    <PortalLayout portalId="doctor">
      <DoctorDashboard />
    </PortalLayout>
  );
}
