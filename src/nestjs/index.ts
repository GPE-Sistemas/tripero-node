// Módulo NestJS
export {
  TriperoModule,
  TriperoModuleAsyncOptions,
  TRIPERO_OPTIONS,
  TRIPERO_CLIENT,
} from './tripero.module';

// Re-exportar TriperoClient para conveniencia
export { TriperoClient } from '../client/TriperoClient';

// Decoradores para suscripción a eventos
export {
  OnTripStarted,
  OnTripCompleted,
  OnStopStarted,
  OnStopCompleted,
  OnTrackerStateChanged,
  OnPositionRejected,
  OnTriperoEvent,
  getTriperoEventHandlers,
  TRIPERO_EVENT_HANDLER,
} from './decorators';
