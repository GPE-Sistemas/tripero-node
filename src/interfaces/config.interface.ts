import type { RedisOptions } from 'ioredis';

/**
 * Opciones de configuración para el cliente Tripero
 */
export interface TriperoClientOptions {
  /**
   * Configuración de conexión a Redis
   */
  redis: TriperoRedisOptions;

  /**
   * Configuración de la API HTTP de Tripero
   * Requerido para: consultar status, configurar odómetro, obtener reportes
   */
  http: TriperoHttpOptions;

  /**
   * Opciones adicionales del cliente
   */
  options?: TriperoOptions;
}

/**
 * Opciones de conexión a Redis
 */
export interface TriperoRedisOptions {
  /**
   * Host del servidor Redis
   * @default 'localhost'
   */
  host?: string;

  /**
   * Puerto del servidor Redis
   * @default 6379
   */
  port?: number;

  /**
   * Base de datos Redis (0-15)
   * @default 0
   */
  db?: number;

  /**
   * Password de autenticación (opcional)
   */
  password?: string;

  /**
   * Username para Redis ACL (opcional, Redis 6+)
   */
  username?: string;

  /**
   * Prefijo para keys y canales Redis
   * Permite compartir un Redis con otras aplicaciones
   * @default 'tripero:' (igual que Tripero servidor)
   */
  keyPrefix?: string;

  /**
   * Opciones adicionales de ioredis
   */
  redisOptions?: Partial<RedisOptions>;
}

/**
 * Opciones de conexión HTTP a la API de Tripero
 */
export interface TriperoHttpOptions {
  /**
   * URL base de la API de Tripero
   * @example 'http://tripero-service:3001'
   */
  baseUrl: string;

  /**
   * Timeout para requests HTTP en milisegundos
   * @default 10000
   */
  timeout?: number;

  /**
   * Headers adicionales para requests HTTP
   */
  headers?: Record<string, string>;
}

/**
 * Opciones de comportamiento del cliente
 */
export interface TriperoOptions {
  /**
   * Habilita reintento automático en caso de error
   * @default false (fire-and-forget)
   */
  enableRetry?: boolean;

  /**
   * Almacena mensajes cuando Redis no está disponible
   * @default false
   */
  enableOfflineQueue?: boolean;

  /**
   * Lanza excepciones en caso de error
   * Si es false, solo loggea el error
   * @default false
   */
  throwOnError?: boolean;

  /**
   * Nivel de logging
   * @default 'info'
   */
  logLevel?: LogLevel;

  /**
   * Número máximo de reintentos por request
   * @default 1
   */
  maxRetriesPerRequest?: number;

  /**
   * Logger personalizado (opcional)
   * Si no se proporciona, usa console
   */
  logger?: TriperoLogger;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface TriperoLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}
