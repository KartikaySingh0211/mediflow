import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export type AppointmentStatusType = 'SCHEDULED' | 'CHECKED_IN' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentState {
  getStatusName(): AppointmentStatusType;
  checkIn(context: AppointmentContext): void;
  startConsultation(context: AppointmentContext): void;
  complete(context: AppointmentContext): void;
  cancel(context: AppointmentContext, reason?: string): void;
}

export class AppointmentContext {
  private state: AppointmentState;

  constructor(
    public readonly appointmentId: string,
    public readonly patientName: string,
    initialStatus: AppointmentStatusType = 'SCHEDULED'
  ) {
    this.state = AppointmentStateFactory.createState(initialStatus);
  }

  public setState(state: AppointmentState): void {
    const prev = this.state.getStatusName();
    this.state = state;
    PatternTraceService.emit({
      pattern: 'State',
      category: 'Behavioral',
      module: 'Appointments',
      step: 2,
      message: `State Transition: ${prev} -> ${state.getStatusName()} for Patient ${this.patientName}`
    });
  }

  public getState(): AppointmentState {
    return this.state;
  }

  public getStatusName(): AppointmentStatusType {
    return this.state.getStatusName();
  }

  public checkIn(): void {
    this.state.checkIn(this);
  }

  public startConsultation(): void {
    this.state.startConsultation(this);
  }

  public complete(): void {
    this.state.complete(this);
  }

  public cancel(reason?: string): void {
    this.state.cancel(this, reason);
  }
}

// State 1: Scheduled
export class ScheduledState implements AppointmentState {
  getStatusName(): AppointmentStatusType { return 'SCHEDULED'; }

  checkIn(context: AppointmentContext): void {
    PatternTraceService.emit({
      pattern: 'State',
      category: 'Behavioral',
      module: 'Appointments',
      step: 1,
      message: 'ScheduledState: Patient arrived at reception desk -> Transitioning to CHECKED_IN'
    });
    context.setState(new CheckedInState());
  }

  startConsultation(): void {
    throw new Error('Invalid Clinical State Transition: Patient must check in at reception before consultation can begin.');
  }

  complete(): void {
    throw new Error('Invalid Clinical State Transition: Cannot complete an appointment that has not taken place.');
  }

  cancel(context: AppointmentContext, reason?: string): void {
    PatternTraceService.emit({
      pattern: 'State',
      category: 'Behavioral',
      module: 'Appointments',
      step: 1,
      message: `ScheduledState: Appointment cancelled (${reason || 'Patient requested'})`
    });
    context.setState(new CancelledState());
  }
}

// State 2: Checked In
export class CheckedInState implements AppointmentState {
  getStatusName(): AppointmentStatusType { return 'CHECKED_IN'; }

  checkIn(): void {
    throw new Error('Patient is already checked in and waiting in the triage lounge.');
  }

  startConsultation(context: AppointmentContext): void {
    PatternTraceService.emit({
      pattern: 'State',
      category: 'Behavioral',
      module: 'Appointments',
      step: 1,
      message: 'CheckedInState: Attending Doctor opened consultation room -> Transitioning to IN_CONSULTATION'
    });
    context.setState(new InConsultationState());
  }

  complete(): void {
    throw new Error('Invalid Clinical State Transition: Consultation must be initiated before completion.');
  }

  cancel(context: AppointmentContext, _reason?: string): void {
    context.setState(new CancelledState());
  }
}

// State 3: In Consultation
export class InConsultationState implements AppointmentState {
  getStatusName(): AppointmentStatusType { return 'IN_CONSULTATION'; }

  checkIn(): void {
    throw new Error('Patient is currently undergoing physician consultation.');
  }

  startConsultation(): void {
    throw new Error('Consultation is already in progress with attending physician.');
  }

  complete(context: AppointmentContext): void {
    PatternTraceService.emit({
      pattern: 'State',
      category: 'Behavioral',
      module: 'Appointments',
      step: 1,
      message: 'InConsultationState: Doctor finalized consultation notes & discharge plan -> Transitioning to COMPLETED'
    });
    context.setState(new CompletedState());
  }

  cancel(context: AppointmentContext, _reason?: string): void {
    context.setState(new CancelledState());
  }
}

// State 4: Completed (Terminal)
export class CompletedState implements AppointmentState {
  getStatusName(): AppointmentStatusType { return 'COMPLETED'; }

  checkIn(): void {
    throw new Error('Invalid Action: Cannot check in an appointment that has already completed.');
  }

  startConsultation(): void {
    throw new Error('Invalid Action: Appointment has already concluded and is closed.');
  }

  complete(): void {
    throw new Error('Appointment is already completed.');
  }

  cancel(): void {
    throw new Error('Cannot cancel an appointment that has already taken place.');
  }
}

// State 5: Cancelled (Terminal)
export class CancelledState implements AppointmentState {
  getStatusName(): AppointmentStatusType { return 'CANCELLED'; }

  checkIn(): void {
    throw new Error('Cannot check in a cancelled appointment.');
  }

  startConsultation(): void {
    throw new Error('Cannot consult on a cancelled appointment.');
  }

  complete(): void {
    throw new Error('Cannot complete a cancelled appointment.');
  }

  cancel(): void {
    throw new Error('Appointment is already cancelled.');
  }
}

export class AppointmentStateFactory {
  static createState(status: AppointmentStatusType): AppointmentState {
    switch (status) {
      case 'CHECKED_IN':
        return new CheckedInState();
      case 'IN_CONSULTATION':
        return new InConsultationState();
      case 'COMPLETED':
        return new CompletedState();
      case 'CANCELLED':
        return new CancelledState();
      case 'SCHEDULED':
      default:
        return new ScheduledState();
    }
  }
}
