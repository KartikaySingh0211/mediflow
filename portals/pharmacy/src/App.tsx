import React from 'react';
import { PortalLayout } from '@shared/components/layout/PortalLayout';
import { PharmacyDashboard } from '@shared/pages/Pharmacy/PharmacyDashboard';

export default function App() {
  return (
    <PortalLayout portalId="pharmacy">
      <PharmacyDashboard />
    </PortalLayout>
  );
}
