/**
 * tripero-node
 * Node.js/TypeScript SDK for Tripero GPS trip detection service
 *
 * @packageDocumentation
 */

// Cliente principal
export { TriperoClient } from './client/TriperoClient';
export { DefaultLogger } from './client/logger';
export {
  INPUT_CHANNELS,
  OUTPUT_CHANNELS,
  ALL_OUTPUT_CHANNELS,
  DEFAULTS,
} from './client/constants';

// Cliente HTTP
export {
  TriperoHttpClient,
  type TrackerStatusResponse,
  type BulkTrackerStatusResponse,
  type OdometerSetResponse,
  type TripReport,
  type StopReport,
  type ReportQueryOptions,
} from './client/TriperoHttpClient';

// Interfaces y tipos
export type {
  // Configuración
  TriperoClientOptions,
  TriperoRedisOptions,
  TriperoHttpOptions,
  TriperoOptions,
  TriperoLogger,
  LogLevel,
  // Eventos de entrada
  PositionEvent,
  IgnitionEvent,
  PositionMetadata,
  // Eventos de salida
  TrackerStateChangedEvent,
  TripStartedEvent,
  TripCompletedEvent,
  StopStartedEvent,
  StopCompletedEvent,
  PositionRejectedEvent,
  // Tipos auxiliares
  TripState,
  DetectionMethod,
  StopReason,
  GeoPoint,
  PositionData,
  OdometerData,
  CurrentTripData,
  // Tipos para suscripción
  TriperoEventType,
  TriperoEventPayload,
  TriperoEventHandler,
} from './interfaces';
