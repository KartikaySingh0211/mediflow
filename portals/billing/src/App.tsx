import React from 'react';
import { PortalLayout } from '@shared/components/layout/PortalLayout';
import { BillingDashboard } from '@shared/pages/Billing/BillingDashboard';

export default function App() {
  return (
    <PortalLayout portalId="billing">
      <BillingDashboard />
    </PortalLayout>
  );
}
