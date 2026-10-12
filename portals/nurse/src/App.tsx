import React from 'react';
import { PortalLayout } from '@shared/components/layout/PortalLayout';
import { NurseDashboard } from '@shared/pages/Nurse/NurseDashboard';

export default function App() {
  return (
    <PortalLayout portalId="nurse">
      <NurseDashboard />
    </PortalLayout>
  );
}
