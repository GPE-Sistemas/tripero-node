import type { LogLevel } from '../interfaces';

/**
 * Canales Redis de Tripero
 * Basado en Tripero v0.4.1
 */

/**
 * Canales de entrada (publicar a Tripero)
 */
export const INPUT_CHANNELS = {
  /** Canal para publicar nuevas posiciones GPS */
  POSITION_NEW: 'position:new',
  /** Canal para publicar cambios de ignición */
  IGNITION_CHANGED: 'ignition:changed',
} as const;

/**
 * Canales de salida (recibir de Tripero)
 */
export const OUTPUT_CHANNELS = {
  /** Cambios de estado del tracker (STOPPED ↔ IDLE ↔ MOVING) */
  TRACKER_STATE_CHANGED: 'tracker:state:changed',
  /** Inicio de trip */
  TRIP_STARTED: 'trip:started',
  /** Trip completado */
  TRIP_COMPLETED: 'trip:completed',
  /** Inicio de stop */
  STOP_STARTED: 'stop:started',
  /** Stop completado */
  STOP_COMPLETED: 'stop:completed',
  /** Posición rechazada por validación */
  POSITION_REJECTED: 'position:rejected',
} as const;

/**
 * Todos los canales de eventos
 */
export const ALL_OUTPUT_CHANNELS = Object.values(OUTPUT_CHANNELS);

/**
 * Valores por defecto de configuración
 */
export const DEFAULTS: {
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_DB: number;
  REDIS_KEY_PREFIX: string;
  HTTP_TIMEOUT: number;
  LOG_LEVEL: LogLevel;
  ENABLE_RETRY: boolean;
  ENABLE_OFFLINE_QUEUE: boolean;
  THROW_ON_ERROR: boolean;
  MAX_RETRIES_PER_REQUEST: number;
} = {
  REDIS_HOST: 'localhost',
  REDIS_PORT: 6379,
  REDIS_DB: 0,
  REDIS_KEY_PREFIX: 'tripero:', // Mismo default que Tripero servidor
  HTTP_TIMEOUT: 10000,
  LOG_LEVEL: 'info',
  ENABLE_RETRY: false,
  ENABLE_OFFLINE_QUEUE: false,
  THROW_ON_ERROR: false,
  MAX_RETRIES_PER_REQUEST: 1,
};
