import React from 'react';
import { PortalLayout } from '@shared/components/layout/PortalLayout';
import { AdminDashboard } from '@shared/pages/Admin/AdminDashboard';

export default function App() {
  return (
    <PortalLayout portalId="admin">
      <AdminDashboard />
    </PortalLayout>
  );
}
