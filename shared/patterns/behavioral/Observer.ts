import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface HospitalEvent {
  id: string;
  type: 
    | 'APPOINTMENT_CREATED'
    | 'APPOINTMENT_STATE_CHANGED'
    | 'LAB_RESULT_READY'
    | 'CRITICAL_VITALS_ALERT'
    | 'PRESCRIPTION_CREATED'
    | 'PATIENT_ADMITTED'
    | 'PATIENT_DISCHARGED'
    | 'CLAIM_APPROVED'
    | 'TREATMENT_PLAN_UPDATED';
  sourceModule: string;
  actorName: string;
  patientName?: string;
  timestamp: string;
  payload: Record<string, any>;
}

export interface Observer {
  getId(): string;
  update(event: HospitalEvent): void;
}

export interface Subject {
  subscribe(observer: Observer): void;
  unsubscribe(observerId: string): void;
  notify(event: HospitalEvent): void;
}

// 1. Concrete Observer: In-App Notification Dispatcher
export class NotificationObserver implements Observer {
  private notifications: Array<{ id: string; message: string; type: string; timestamp: string }> = [];

  getId(): string { return 'NotificationObserver'; }

  update(event: HospitalEvent): void {
    const msg = `[${event.type}] ${event.actorName} triggered event for ${event.patientName || 'Hospital'}`;
    this.notifications.unshift({
      id: `notif_${Date.now()}`,
      message: msg,
      type: event.type,
      timestamp: event.timestamp
    });

    PatternTraceService.emit({
      pattern: 'Observer',
      category: 'Behavioral',
      module: 'Notifications',
      step: 2,
      message: `NotificationObserver: Pushed in-app toast & alert for "${event.type}"`
    });
  }

  getNotifications() { return [...this.notifications]; }
}

// 2. Concrete Observer: Hospital Compliance Audit Logger
export class AuditObserver implements Observer {
  private logs: Array<{ id: string; eventType: string; actor: string; timestamp: string }> = [];

  getId(): string { return 'AuditObserver'; }

  update(event: HospitalEvent): void {
    this.logs.unshift({
      id: `audit_${Date.now()}`,
      eventType: event.type,
      actor: event.actorName,
      timestamp: event.timestamp
    });

    PatternTraceService.emit({
      pattern: 'Observer',
      category: 'Behavioral',
      module: 'Audit System',
      step: 2,
      message: `AuditObserver: Appended immutable HIPAA compliance log for "${event.type}"`
    });
  }

  getLogs() { return [...this.logs]; }
}

// 3. Concrete Observer: Real-Time Persona Dashboard KPI Syncer
export class DashboardObserver implements Observer {
  private kpiCounters: Record<string, number> = {
    activeAppointments: 3,
    criticalAlerts: 1,
    pendingLabs: 2,
    unclaimedBills: 1
  };

  getId(): string { return 'DashboardObserver'; }

  update(event: HospitalEvent): void {
    if (event.type === 'CRITICAL_VITALS_ALERT') this.kpiCounters.criticalAlerts++;
    if (event.type === 'LAB_RESULT_READY') this.kpiCounters.pendingLabs = Math.max(0, this.kpiCounters.pendingLabs - 1);
    if (event.type === 'APPOINTMENT_CREATED') this.kpiCounters.activeAppointments++;

    PatternTraceService.emit({
      pattern: 'Observer',
      category: 'Behavioral',
      module: 'Dashboard Analytics',
      step: 2,
      message: `DashboardObserver: Re-computed real-time hospital KPI telemetry metrics for "${event.type}"`
    });
  }

  getKpis() { return { ...this.kpiCounters }; }
}

// Subject: Central Hospital Event Bus
export class HospitalEventSubject implements Subject {
  private static instance: HospitalEventSubject;
  private observers: Map<string, Observer> = new Map();

  private constructor() {
    // Register default core observers
    this.subscribe(new NotificationObserver());
    this.subscribe(new AuditObserver());
    this.subscribe(new DashboardObserver());
  }

  public static getInstance(): HospitalEventSubject {
    if (!HospitalEventSubject.instance) {
      HospitalEventSubject.instance = new HospitalEventSubject();
    }
    return HospitalEventSubject.instance;
  }

  public subscribe(observer: Observer): void {
    this.observers.set(observer.getId(), observer);
  }

  public unsubscribe(observerId: string): void {
    this.observers.delete(observerId);
  }

  public notify(event: HospitalEvent): void {
    PatternTraceService.emit({
      pattern: 'Observer',
      category: 'Behavioral',
      module: 'Event Bus',
      step: 1,
      message: `HospitalEventSubject: Broadcasting event "${event.type}" to ${this.observers.size} active subscribers`
    });

    this.observers.forEach(observer => {
      try {
        observer.update(event);
      } catch (err) {
        console.error(`Error in observer ${observer.getId()}:`, err);
      }
    });
  }
}

export const globalEventBus = HospitalEventSubject.getInstance();
