import { CareEvent } from '../../types';
import { api } from '../../services/api';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface CareParticipant {
  getName(): string;
  getRole(): string;
  receiveCareRequest(event: CareEvent): void;
}

export interface CareMediator {
  registerParticipant(participant: CareParticipant): void;
  dispatchCareRequest(
    sender: CareParticipant,
    targetDepartment: string,
    eventType: CareEvent['eventType'],
    urgency: CareEvent['urgency'],
    patientId: string,
    patientName: string,
    message: string
  ): Promise<CareEvent>;
}

export class HospitalCareMediator implements CareMediator {
  private static instance: HospitalCareMediator;
  private participants: Map<string, CareParticipant> = new Map();

  private constructor() {}

  public static getInstance(): HospitalCareMediator {
    if (!HospitalCareMediator.instance) {
      HospitalCareMediator.instance = new HospitalCareMediator();
    }
    return HospitalCareMediator.instance;
  }

  public registerParticipant(participant: CareParticipant): void {
    const key = `${participant.getRole()}_${participant.getName()}`;
    this.participants.set(key, participant);
    PatternTraceService.emit({
      pattern: 'Mediator',
      category: 'Behavioral',
      module: 'Care Coordination',
      step: 1,
      message: `HospitalCareMediator: Registered participant ${participant.getName()} [${participant.getRole()}]`
    });
  }

  public async dispatchCareRequest(
    sender: CareParticipant,
    targetDepartment: string,
    eventType: CareEvent['eventType'],
    urgency: CareEvent['urgency'],
    patientId: string,
    patientName: string,
    message: string
  ): Promise<CareEvent> {
    PatternTraceService.emit({
      pattern: 'Mediator',
      category: 'Behavioral',
      module: 'Care Coordination',
      step: 2,
      message: `HospitalCareMediator: Intercepted ${urgency} care event from ${sender.getName()} -> Routing to ${targetDepartment}`
    });

    // Persist care event via backend API
    const careEvent = await api.createCareEvent({
      patientId,
      patientName,
      senderRole: sender.getRole(),
      senderName: sender.getName(),
      targetDepartment,
      eventType,
      urgency,
      message
    });

    // Notify all registered participants matching target department
    this.participants.forEach(p => {
      p.receiveCareRequest(careEvent);
    });

    PatternTraceService.emit({
      pattern: 'Mediator',
      category: 'Behavioral',
      module: 'Care Coordination',
      step: 3,
      message: `HospitalCareMediator: Dispatched care alert #${careEvent.id} to ${targetDepartment} personnel`
    });

    return careEvent;
  }
}
