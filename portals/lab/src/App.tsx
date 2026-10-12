import React from 'react';
import { PortalLayout } from '@shared/components/layout/PortalLayout';
import { LabDashboard } from '@shared/pages/Lab/LabDashboard';

export default function App() {
  return (
    <PortalLayout portalId="lab">
      <LabDashboard />
    </PortalLayout>
  );
}
