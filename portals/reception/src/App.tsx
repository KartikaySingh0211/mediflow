import React from 'react';
import { PortalLayout } from '@shared/components/layout/PortalLayout';
import { ReceptionDashboard } from '@shared/pages/Reception/ReceptionDashboard';

export default function App() {
  return (
    <PortalLayout portalId="reception">
      <ReceptionDashboard />
    </PortalLayout>
  );
}
