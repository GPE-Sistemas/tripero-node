/**
 * Interfaces para eventos publicados y recibidos de Tripero
 * Basado en Tripero v0.4.2
 */

// ============================================================================
// Tipos comunes
// ============================================================================

export type TripState = 'STOPPED' | 'IDLE' | 'MOVING';
export type DetectionMethod = 'ignition' | 'motion';
export type StopReason = 'ignition_off' | 'no_movement' | 'parking';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface PositionData {
  timestamp: string; // ISO 8601
  latitude: number;
  longitude: number;
  speed: number; // km/h
  ignition: boolean;
  heading: number; // degrees 0-360
  altitude: number; // meters
  age: number; // seconds since last position
}

export interface OdometerData {
  /** Odómetro total en metros (incluye offset) */
  total: number;
  /** Odómetro total en kilómetros */
  totalKm: number;
  /** Distancia del trip actual en metros (solo si hay trip activo) */
  currentTrip?: number;
  /** Distancia del trip actual en km (solo si hay trip activo) */
  currentTripKm?: number;
}

export interface CurrentTripData {
  tripId: string;
  startTime: string; // ISO 8601
  duration: number; // seconds
  distance: number; // meters
  avgSpeed: number; // km/h
  maxSpeed: number; // km/h
  odometerAtStart: number; // meters
}

/**
 * Metadata personalizado que puede incluirse en posiciones
 * Se propaga automáticamente a trips y stops
 */
export interface PositionMetadata {
  /** ID del tenant (índice optimizado) */
  tenant_id?: string;
  /** ID del cliente (índice optimizado) */
  client_id?: string;
  /** ID de la flota (índice optimizado) */
  fleet_id?: string;
  /** Campos personalizados adicionales */
  [key: string]: unknown;
}

// ============================================================================
// Eventos de ENTRADA (publicar a Tripero)
// ============================================================================

/**
 * Evento de posición GPS para publicar a Tripero
 * Canal: position:new
 */
export interface PositionEvent {
  /** ID único del dispositivo (IMEI, UUID, etc.) */
  deviceId: string;
  /** Timestamp Unix en milisegundos */
  timestamp: number;
  /** Latitud (-90 a 90) */
  latitude: number;
  /** Longitud (-180 a 180) */
  longitude: number;
  /** Velocidad en km/h */
  speed: number;
  /** Estado de ignición (opcional, default: false) */
  ignition?: boolean;
  /** Altitud en metros (opcional) */
  altitude?: number;
  /** Rumbo en grados 0-360 (opcional) */
  heading?: number;
  /** Precisión GPS en metros (opcional) */
  accuracy?: number;
  /** Número de satélites (opcional) */
  satellites?: number;
  /** Metadata personalizado (opcional) */
  metadata?: PositionMetadata;
}

/**
 * Evento de cambio de ignición
 * Canal: ignition:changed
 */
export interface IgnitionEvent {
  /** ID del dispositivo */
  deviceId: string;
  /** Timestamp Unix en milisegundos */
  timestamp: number;
  /** Nuevo estado de ignición */
  ignition: boolean;
  /** Latitud actual */
  latitude: number;
  /** Longitud actual */
  longitude: number;
}

// ============================================================================
// Eventos de SALIDA (recibir de Tripero)
// ============================================================================

/**
 * Evento de cambio de estado del tracker
 * Canal: tracker:state:changed
 */
export interface TrackerStateChangedEvent {
  trackerId: string;
  deviceId: string;
  previousState: TripState;
  currentState: TripState;
  timestamp: string; // ISO 8601
  reason: string;
  odometer: OdometerData;
  lastPosition: PositionData;
  currentTrip?: CurrentTripData;
}

/**
 * Evento de inicio de trip
 * Canal: trip:started
 */
export interface TripStartedEvent {
  tripId: string;
  deviceId: string;
  startTime: string; // ISO 8601
  startLocation: GeoPoint;
  detectionMethod: DetectionMethod;
  currentState: 'MOVING';
  odometer: number; // meters
  metadata?: PositionMetadata;
}

/**
 * Evento de trip completado
 * Canal: trip:completed
 */
export interface TripCompletedEvent {
  tripId: string;
  deviceId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // seconds
  distance: number; // meters
  avgSpeed: number; // km/h
  maxSpeed: number; // km/h
  stopsCount: number;
  startLocation: GeoPoint;
  endLocation: GeoPoint;
  detectionMethod: DetectionMethod;
  currentState: TripState;
  odometer: number; // meters
  metadata?: PositionMetadata;
}

/**
 * Evento de inicio de stop
 * Canal: stop:started
 */
export interface StopStartedEvent {
  stopId: string;
  tripId: string;
  deviceId: string;
  startTime: string; // ISO 8601
  location: GeoPoint;
  reason: StopReason;
  currentState: 'IDLE';
  odometer: number; // meters
  metadata?: PositionMetadata;
}

/**
 * Evento de stop completado
 * Canal: stop:completed
 */
export interface StopCompletedEvent {
  stopId: string;
  tripId: string;
  deviceId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // seconds
  location: GeoPoint;
  reason: StopReason;
  currentState: TripState;
  odometer: number; // meters
  metadata?: PositionMetadata;
}

/**
 * Evento de posición rechazada
 * Canal: position:rejected
 */
export interface PositionRejectedEvent {
  deviceId: string;
  timestamp: number;
  reason: string;
  position: Partial<PositionEvent>;
}

// ============================================================================
// Tipos para suscripción
// ============================================================================

export type TriperoEventType =
  | 'tracker:state:changed'
  | 'trip:started'
  | 'trip:completed'
  | 'stop:started'
  | 'stop:completed'
  | 'position:rejected';

export type TriperoEventPayload = {
  'tracker:state:changed': TrackerStateChangedEvent;
  'trip:started': TripStartedEvent;
  'trip:completed': TripCompletedEvent;
  'stop:started': StopStartedEvent;
  'stop:completed': StopCompletedEvent;
  'position:rejected': PositionRejectedEvent;
};

export type TriperoEventHandler<T extends TriperoEventType> = (
  event: TriperoEventPayload[T],
) => void | Promise<void>;
