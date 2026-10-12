const API_BASE = 'http://localhost:5001/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; system: string; port: number }>('/health'),

  // Auth
  login: (email: string, role?: string) => 
    request<{ success: boolean; user: any; token: string; session: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, role })
    }),

  // Users & Config
  getUsers: () => request<any[]>('/users'),
  getConfig: () => request<any>('/config'),
  updateConfig: (data: any) => request<any>('/config', { method: 'PUT', body: JSON.stringify(data) }),
  getDoctors: () => request<any[]>('/doctors'),

  // Patients
  getPatients: () => request<any[]>('/patients'),
  getPatientById: (id: string) => request<any>(`/patients/${id}`),
  createPatient: (data: any) => request<any>('/patients', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (id: string, data: any) => request<any>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Appointments
  getAppointments: () => request<any[]>('/appointments'),
  createAppointment: (data: any) => request<any>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id: string, status: string, actorName?: string, actionNote?: string) => 
    request<any>(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, actorName, actionNote })
    }),

  // Admissions
  getAdmissions: () => request<any[]>('/admissions'),
  createAdmission: (data: any) => request<any>('/admissions', { method: 'POST', body: JSON.stringify(data) }),
  updateAdmission: (id: string, data: any) => request<any>(`/admissions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Lab Orders
  getLabOrders: () => request<any[]>('/lab-orders'),
  createLabOrder: (data: any) => request<any>('/lab-orders', { method: 'POST', body: JSON.stringify(data) }),
  processLabOrder: (id: string) => request<any>(`/lab-orders/${id}/process`, { method: 'PUT' }),
  completeLabResults: (id: string, data: any) => request<any>(`/lab-orders/${id}/results`, { method: 'PUT', body: JSON.stringify(data) }),

  // Prescriptions
  getPrescriptions: () => request<any[]>('/prescriptions'),
  createPrescription: (data: any) => request<any>('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
  dispensePrescription: (id: string, actorName?: string) => 
    request<any>(`/prescriptions/${id}/dispense`, { method: 'PUT', body: JSON.stringify({ actorName }) }),

  // Treatment Plans
  getTreatmentPlans: () => request<any[]>('/treatment-plans'),
  getPatientTreatmentPlans: (patientId: string) => request<any[]>(`/treatment-plans/patient/${patientId}`),
  createTreatmentPlan: (data: any) => request<any>('/treatment-plans', { method: 'POST', body: JSON.stringify(data) }),
  saveTreatmentPlanVersion: (id: string, data: any) => request<any>(`/treatment-plans/${id}/version`, { method: 'PUT', body: JSON.stringify(data) }),
  restoreTreatmentPlanVersion: (id: string, targetVersion: number, actorName?: string) => 
    request<any>(`/treatment-plans/${id}/restore`, { method: 'PUT', body: JSON.stringify({ targetVersion, actorName }) }),

  // Bills & Insurance
  getBills: () => request<any[]>('/bills'),
  createBill: (data: any) => request<any>('/bills', { method: 'POST', body: JSON.stringify(data) }),
  submitInsuranceClaim: (id: string, data: any) => request<any>(`/bills/${id}/claim`, { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: (id: string, data: any) => request<any>(`/bills/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),

  // Vitals & Clinical Rules
  getVitals: () => request<any[]>('/vitals'),
  recordVitals: (data: any) => request<any>('/vitals', { method: 'POST', body: JSON.stringify(data) }),
  getClinicalRules: () => request<any[]>('/clinical-rules'),
  createClinicalRule: (data: any) => request<any>('/clinical-rules', { method: 'POST', body: JSON.stringify(data) }),
  updateClinicalRule: (id: string, data: any) => request<any>(`/clinical-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Care Events
  getCareEvents: () => request<any[]>('/care-events'),
  createCareEvent: (data: any) => request<any>('/care-events', { method: 'POST', body: JSON.stringify(data) }),
  updateCareEventStatus: (id: string, status: string) => request<any>(`/care-events/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Audit Logs
  getAuditLogs: () => request<any[]>('/audit-logs'),

  // AI Intelligence (Stored in MongoDB Atlas)
  analyzePatient: (id: string, analyzedBy?: string) => 
    request<AiAnalysisRecord>(`/ai/analyze/patient/${id}`, { method: 'POST', body: JSON.stringify({ analyzedBy }) }),
  analyzeBill: (id: string, analyzedBy?: string) => 
    request<AiAnalysisRecord>(`/ai/analyze/bill/${id}`, { method: 'POST', body: JSON.stringify({ analyzedBy }) }),
  analyzeOperations: () => 
    request<AiAnalysisRecord>('/ai/analyze/operations'),
  getAiAnalyses: (targetType?: string) => 
    request<AiAnalysisRecord[]>(`/ai/analyses${targetType ? `?targetType=${targetType}` : ''}`),
  getAiAnalysesForTarget: (targetId: string) => 
    request<AiAnalysisRecord[]>(`/ai/analyses/target/${targetId}`),

  // Reset
  resetData: () => request<{ success: boolean; message: string }>('/reset-data', { method: 'POST' })
};

export interface AiAnalysisRecord {
  id: string;
  targetType: 'PATIENT' | 'BILL' | 'HOSPITAL';
  targetId: string;
  targetName: string;
  portalSource: string;
  analysisType: 'CLINICAL_DECISION_SUPPORT' | 'DETERIORATION_RISK' | 'DRUG_SAFETY' | 'CLAIM_DENIAL_AUDIT' | 'RESOURCE_BOTTLENECK';
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  contraindications?: string[];
  evidenceFactors: Array<{ factor: string; impact: 'ELEVATED' | 'PROTECTIVE' | 'CRITICAL'; weight: number }>;
  doctorActionPlan?: string;
  timestamp: string;
  analyzedBy: string;
}

