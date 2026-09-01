import { Appointment } from '../../types';
import { api } from '../../services/api';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface Command {
  execute(): Promise<any>;
  undo?(): Promise<any>;
  getDescription(): string;
  getTimestamp(): string;
}

// 1. Book Appointment Command
export class BookAppointmentCommand implements Command {
  private timestamp: string = new Date().toISOString();
  private executedAppointment?: Appointment;

  constructor(
    private payload: {
      patientId: string;
      patientName: string;
      doctorId: string;
      doctorName: string;
      department: string;
      date: string;
      time: string;
      reason: string;
      schedulingStrategyUsed?: string;
      actorName?: string;
    }
  ) {}

  getDescription(): string {
    return `Book Appointment for ${this.payload.patientName} with ${this.payload.doctorName} on ${this.payload.date} at ${this.payload.time}`;
  }

  getTimestamp(): string {
    return this.timestamp;
  }

  async execute(): Promise<Appointment> {
    PatternTraceService.emit({
      pattern: 'Command',
      category: 'Behavioral',
      module: 'Appointments',
      step: 1,
      message: `BookAppointmentCommand: Encapsulated request executing for ${this.payload.patientName}`
    });

    const appointment = await api.createAppointment(this.payload);
    this.executedAppointment = appointment;
    return appointment;
  }

  async undo(): Promise<any> {
    if (!this.executedAppointment) return;
    PatternTraceService.emit({
      pattern: 'Command',
      category: 'Behavioral',
      module: 'Appointments',
      step: 2,
      message: `BookAppointmentCommand (UNDO): Cancelling appointment #${this.executedAppointment.id}`
    });
    return await api.updateAppointmentStatus(this.executedAppointment.id, 'CANCELLED', 'Command Invoker', 'Undo Book Appointment');
  }
}

// 2. Reschedule Appointment Command
export class RescheduleAppointmentCommand implements Command {
  private timestamp: string = new Date().toISOString();
  private prevDate?: string;
  private prevTime?: string;

  constructor(
    private appointmentId: string,
    private newDate: string,
    private newTime: string,
    private actorName: string = 'Staff'
  ) {}

  getDescription(): string {
    return `Reschedule Appointment #${this.appointmentId} to ${this.newDate} at ${this.newTime}`;
  }

  getTimestamp(): string {
    return this.timestamp;
  }

  async execute(): Promise<Appointment> {
    PatternTraceService.emit({
      pattern: 'Command',
      category: 'Behavioral',
      module: 'Appointments',
      step: 1,
      message: `RescheduleAppointmentCommand: executing reschedule to ${this.newDate} ${this.newTime}`
    });

    return await api.updateAppointmentStatus(
      this.appointmentId,
      'SCHEDULED',
      this.actorName,
      `Rescheduled date/time to ${this.newDate} at ${this.newTime}`
    );
  }

  async undo(): Promise<any> {
    if (!this.prevDate || !this.prevTime) return;
    PatternTraceService.emit({
      pattern: 'Command',
      category: 'Behavioral',
      module: 'Appointments',
      step: 2,
      message: `RescheduleAppointmentCommand (UNDO): Restoring date/time to ${this.prevDate} ${this.prevTime}`
    });
    return await api.updateAppointmentStatus(
      this.appointmentId,
      'SCHEDULED',
      'Command Invoker',
      `Restored previous date/time (${this.prevDate} at ${this.prevTime})`
    );
  }
}

// 3. Cancel Appointment Command
export class CancelAppointmentCommand implements Command {
  private timestamp: string = new Date().toISOString();

  constructor(
    private appointmentId: string,
    private reason: string,
    private actorName: string = 'Staff'
  ) {}

  getDescription(): string {
    return `Cancel Appointment #${this.appointmentId}: "${this.reason}"`;
  }

  getTimestamp(): string {
    return this.timestamp;
  }

  async execute(): Promise<Appointment> {
    PatternTraceService.emit({
      pattern: 'Command',
      category: 'Behavioral',
      module: 'Appointments',
      step: 1,
      message: `CancelAppointmentCommand: Cancelling appointment #${this.appointmentId} (Reason: ${this.reason})`
    });

    return await api.updateAppointmentStatus(
      this.appointmentId,
      'CANCELLED',
      this.actorName,
      `Cancelled: ${this.reason}`
    );
  }

  async undo(): Promise<any> {
    PatternTraceService.emit({
      pattern: 'Command',
      category: 'Behavioral',
      module: 'Appointments',
      step: 2,
      message: `CancelAppointmentCommand (UNDO): Restoring appointment #${this.appointmentId} to SCHEDULED`
    });
    return await api.updateAppointmentStatus(
      this.appointmentId,
      'SCHEDULED',
      'Command Invoker',
      'Restored previously cancelled appointment'
    );
  }
}

// Command Invoker with History Stack
export class AppointmentCommandInvoker {
  private historyStack: Command[] = [];
  private undoStack: Command[] = [];

  async executeCommand<T>(command: Command): Promise<T> {
    PatternTraceService.emit({
      pattern: 'Command',
      category: 'Behavioral',
      module: 'Appointments',
      step: 0,
      message: `AppointmentCommandInvoker: Dispatching command -> "${command.getDescription()}"`
    });

    const result = await command.execute();
    this.historyStack.push(command);
    return result as T;
  }

  async undoLastCommand(): Promise<any> {
    const lastCommand = this.historyStack.pop();
    if (!lastCommand || !lastCommand.undo) {
      throw new Error('No undoable commands in history stack.');
    }

    PatternTraceService.emit({
      pattern: 'Command',
      category: 'Behavioral',
      module: 'Appointments',
      step: 0,
      message: `AppointmentCommandInvoker: Rolling back command -> "${lastCommand.getDescription()}"`
    });

    const undoResult = await lastCommand.undo();
    this.undoStack.push(lastCommand);
    return undoResult;
  }

  getHistory(): Command[] {
    return [...this.historyStack];
  }

  canUndo(): boolean {
    return this.historyStack.length > 0;
  }
}

export const globalAppointmentInvoker = new AppointmentCommandInvoker();
