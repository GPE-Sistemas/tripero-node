import Redis from 'ioredis';
import type {
  TriperoClientOptions,
  TriperoRedisOptions,
  TriperoHttpOptions,
  TriperoLogger,
  LogLevel,
  PositionEvent,
  IgnitionEvent,
  TriperoEventType,
  TriperoEventHandler,
} from '../interfaces';

/**
 * Opciones internas del cliente con valores requeridos
 */
interface InternalRedisOptions {
  host: string;
  port: number;
  db: number;
  password?: string;
  username?: string;
  keyPrefix: string;
  redisOptions?: TriperoRedisOptions['redisOptions'];
}

interface InternalOptions {
  redis: InternalRedisOptions;
  http: TriperoHttpOptions;
  options: {
    enableRetry: boolean;
    enableOfflineQueue: boolean;
    throwOnError: boolean;
    logLevel: LogLevel;
    maxRetriesPerRequest: number;
    logger?: TriperoLogger;
  };
}
import { DefaultLogger } from './logger';
import { DEFAULTS, INPUT_CHANNELS } from './constants';
import {
  TriperoHttpClient,
  type TrackerStatusResponse,
  type OdometerSetResponse,
  type TripReport,
  type StopReport,
  type ReportQueryOptions,
} from './TriperoHttpClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (event: any) => void | Promise<void>;
type EventHandlers = Map<TriperoEventType, Set<AnyHandler>>;

/**
 * Cliente principal para interactuar con Tripero
 *
 * @example
 * ```typescript
 * const tripero = new TriperoClient({
 *   redis: { host: 'redis-tripero-service', port: 6379 },
 *   http: { baseUrl: 'http://tripero-service:3001' }
 * });
 *
 * await tripero.connect();
 *
 * // Publicar posición
 * await tripero.publishPosition({
 *   deviceId: 'VEHICLE-001',
 *   timestamp: Date.now(),
 *   latitude: -34.6037,
 *   longitude: -58.3816,
 *   speed: 45
 * });
 *
 * // Suscribirse a eventos
 * tripero.on('trip:completed', (event) => {
 *   console.log(`Trip completado: ${event.tripId}`);
 * });
 *
 * await tripero.subscribe();
 * ```
 */
export class TriperoClient {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private httpClient: TriperoHttpClient | null = null;
  private readonly options: InternalOptions;
  private readonly logger: TriperoLogger;
  private readonly keyPrefix: string;
  private readonly handlers: EventHandlers = new Map();
  private isConnected = false;
  private isSubscribed = false;

  constructor(options: TriperoClientOptions) {
    // Merge con defaults
    this.options = {
      redis: {
        host: options.redis.host ?? DEFAULTS.REDIS_HOST,
        port: options.redis.port ?? DEFAULTS.REDIS_PORT,
        db: options.redis.db ?? DEFAULTS.REDIS_DB,
        password: options.redis.password,
        username: options.redis.username,
        keyPrefix: options.redis.keyPrefix ?? DEFAULTS.REDIS_KEY_PREFIX,
        redisOptions: options.redis.redisOptions,
      },
      http: options.http,
      options: {
        enableRetry: options.options?.enableRetry ?? DEFAULTS.ENABLE_RETRY,
        enableOfflineQueue:
          options.options?.enableOfflineQueue ?? DEFAULTS.ENABLE_OFFLINE_QUEUE,
        throwOnError:
          options.options?.throwOnError ?? DEFAULTS.THROW_ON_ERROR,
        logLevel: options.options?.logLevel ?? DEFAULTS.LOG_LEVEL,
        maxRetriesPerRequest:
          options.options?.maxRetriesPerRequest ??
          DEFAULTS.MAX_RETRIES_PER_REQUEST,
        logger: options.options?.logger,
      },
    };

    this.keyPrefix = this.options.redis.keyPrefix ?? DEFAULTS.REDIS_KEY_PREFIX;
    this.logger =
      this.options.options.logger ??
      new DefaultLogger(this.options.options.logLevel);

    // Inicializar cliente HTTP
    this.httpClient = new TriperoHttpClient(this.options.http, this.logger);
  }

  /**
   * Conecta al servidor Redis
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      this.logger.warn('Ya conectado a Redis');
      return;
    }

    const redisConfig = {
      host: this.options.redis.host,
      port: this.options.redis.port,
      db: this.options.redis.db,
      password: this.options.redis.password,
      username: this.options.redis.username,
      maxRetriesPerRequest: this.options.options.enableRetry
        ? this.options.options.maxRetriesPerRequest
        : null,
      enableOfflineQueue: this.options.options.enableOfflineQueue,
      lazyConnect: true,
      ...this.options.redis.redisOptions,
    };

    try {
      // Cliente para publicar
      this.publisher = new Redis(redisConfig);
      await this.publisher.connect();

      // Cliente para suscribir (Redis requiere conexiones separadas)
      this.subscriber = new Redis(redisConfig);
      await this.subscriber.connect();

      this.isConnected = true;
      this.logger.info(
        `Conectado a Redis ${this.options.redis.host}:${this.options.redis.port} db ${this.options.redis.db}`,
      );
    } catch (error) {
      this.handleError('Error conectando a Redis', error);
      throw error;
    }
  }

  /**
   * Desconecta del servidor Redis
   */
  async disconnect(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }
    if (this.publisher) {
      await this.publisher.quit();
      this.publisher = null;
    }
    this.isConnected = false;
    this.isSubscribed = false;
    this.logger.info('Desconectado de Redis');
  }

  /**
   * Verifica el estado de la conexión
   */
  async health(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    redis: { host: string; port: number; db: number };
    uptime?: number;
    error?: string;
  }> {
    if (!this.publisher || !this.isConnected) {
      return {
        status: 'disconnected',
        redis: {
          host: this.options.redis.host!,
          port: this.options.redis.port!,
          db: this.options.redis.db!,
        },
      };
    }

    try {
      await this.publisher.ping();
      return {
        status: 'connected',
        redis: {
          host: this.options.redis.host!,
          port: this.options.redis.port!,
          db: this.options.redis.db!,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        redis: {
          host: this.options.redis.host!,
          port: this.options.redis.port!,
          db: this.options.redis.db!,
        },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ============================================================================
  // PUBLICACIÓN DE EVENTOS
  // ============================================================================

  /**
   * Publica una posición GPS a Tripero
   * Fire-and-forget por defecto
   */
  async publishPosition(position: PositionEvent): Promise<void> {
    const channel = this.prefixChannel(INPUT_CHANNELS.POSITION_NEW);
    await this.publish(channel, position);
    this.logger.debug(`Posición publicada para ${position.deviceId}`);
  }

  /**
   * Publica múltiples posiciones GPS (optimizado con pipeline)
   */
  async publishPositions(positions: PositionEvent[]): Promise<void> {
    if (!this.publisher || !this.isConnected) {
      this.handleError('No conectado a Redis', new Error('Not connected'));
      return;
    }

    const channel = this.prefixChannel(INPUT_CHANNELS.POSITION_NEW);
    const pipeline = this.publisher.pipeline();

    for (const position of positions) {
      pipeline.publish(channel, JSON.stringify(position));
    }

    try {
      await pipeline.exec();
      this.logger.debug(`${positions.length} posiciones publicadas en batch`);
    } catch (error) {
      this.handleError('Error publicando posiciones en batch', error);
    }
  }

  /**
   * Publica un evento de cambio de ignición
   */
  async publishIgnitionEvent(event: IgnitionEvent): Promise<void> {
    const channel = this.prefixChannel(INPUT_CHANNELS.IGNITION_CHANGED);
    await this.publish(channel, event);
    this.logger.debug(
      `Ignición ${event.ignition ? 'ON' : 'OFF'} publicada para ${event.deviceId}`,
    );
  }

  // ============================================================================
  // SUSCRIPCIÓN A EVENTOS
  // ============================================================================

  /**
   * Registra un handler para un tipo de evento
   */
  on<T extends TriperoEventType>(
    eventType: T,
    handler: TriperoEventHandler<T>,
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as AnyHandler);
    this.logger.debug(`Handler registrado para ${eventType}`);
  }

  /**
   * Remueve un handler para un tipo de evento
   */
  off<T extends TriperoEventType>(
    eventType: T,
    handler: TriperoEventHandler<T>,
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as AnyHandler);
    }
  }

  /**
   * Inicia la suscripción a todos los canales de eventos registrados
   */
  async subscribe(): Promise<void> {
    if (!this.subscriber || !this.isConnected) {
      throw new Error('No conectado a Redis');
    }

    if (this.isSubscribed) {
      this.logger.warn('Ya suscrito a eventos');
      return;
    }

    // Obtener canales únicos de los handlers registrados
    const channels = Array.from(this.handlers.keys());

    if (channels.length === 0) {
      this.logger.warn('No hay handlers registrados para suscribirse');
      return;
    }

    // Configurar handler de mensajes
    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message);
    });

    // Suscribirse a los canales con prefijo
    const prefixedChannels = channels.map((ch) => this.prefixChannel(ch));
    await this.subscriber.subscribe(...prefixedChannels);

    this.isSubscribed = true;
    this.logger.info(`Suscrito a ${channels.length} canales: ${channels.join(', ')}`);
  }

  /**
   * Cancela todas las suscripciones
   */
  async unsubscribe(): Promise<void> {
    if (this.subscriber && this.isSubscribed) {
      await this.subscriber.unsubscribe();
      this.isSubscribed = false;
      this.logger.info('Desuscrito de todos los canales');
    }
  }

  // ============================================================================
  // API HTTP (requiere configuración http)
  // ============================================================================

  /**
   * Verifica si el cliente HTTP está disponible
   */
  get hasHttpClient(): boolean {
    return this.httpClient !== null;
  }

  /**
   * Obtiene el estado actual de un tracker
   * Requiere configuración http
   */
  async getTrackerStatus(trackerId: string): Promise<TrackerStatusResponse> {
    this.ensureHttpClient();
    return this.httpClient!.getTrackerStatus(trackerId);
  }

  /**
   * Configura el odómetro inicial de un tracker
   * Requiere configuración http
   * @param trackerId ID del tracker
   * @param initialOdometer Odómetro inicial en metros
   * @param reason Razón del ajuste (opcional)
   */
  async setOdometer(
    trackerId: string,
    initialOdometer: number,
    reason?: string,
  ): Promise<OdometerSetResponse> {
    this.ensureHttpClient();
    return this.httpClient!.setOdometer(trackerId, initialOdometer, reason);
  }

  /**
   * Obtiene reportes de trips
   * Requiere configuración http
   */
  async getTrips(options: ReportQueryOptions): Promise<TripReport[]> {
    this.ensureHttpClient();
    return this.httpClient!.getTrips(options);
  }

  /**
   * Obtiene reportes de stops
   * Requiere configuración http
   */
  async getStops(options: ReportQueryOptions): Promise<StopReport[]> {
    this.ensureHttpClient();
    return this.httpClient!.getStops(options);
  }

  /**
   * Verifica la salud de Tripero vía HTTP
   * Requiere configuración http
   */
  async healthHttp(): Promise<{
    status: string;
    timestamp: string;
    services: Record<string, { status: string }>;
  }> {
    this.ensureHttpClient();
    return this.httpClient!.health();
  }

  private ensureHttpClient(): void {
    if (!this.httpClient) {
      throw new Error(
        'HTTP client not configured. Provide http.baseUrl in TriperoClientOptions.',
      );
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private prefixChannel(channel: string): string {
    return `${this.keyPrefix}${channel}`;
  }

  private unprefixChannel(channel: string): string {
    if (this.keyPrefix && channel.startsWith(this.keyPrefix)) {
      return channel.slice(this.keyPrefix.length);
    }
    return channel;
  }

  private async publish(channel: string, data: unknown): Promise<void> {
    if (!this.publisher || !this.isConnected) {
      this.handleError('No conectado a Redis', new Error('Not connected'));
      return;
    }

    try {
      await this.publisher.publish(channel, JSON.stringify(data));
    } catch (error) {
      this.handleError(`Error publicando en ${channel}`, error);
    }
  }

  private handleMessage(prefixedChannel: string, message: string): void {
    const channel = this.unprefixChannel(prefixedChannel) as TriperoEventType;
    const handlers = this.handlers.get(channel);

    if (!handlers || handlers.size === 0) {
      return;
    }

    try {
      const event = JSON.parse(message);

      for (const handler of handlers) {
        try {
          const result = handler(event);
          // Si el handler retorna una promesa, manejar errores
          if (result instanceof Promise) {
            result.catch((err) => {
              this.logger.error(`Error en handler async de ${channel}:`, err);
            });
          }
        } catch (error) {
          this.logger.error(`Error en handler de ${channel}:`, error);
        }
      }
    } catch (error) {
      this.logger.error(`Error parseando mensaje de ${channel}:`, error);
    }
  }

  private handleError(message: string, error: unknown): void {
    this.logger.error(message, error);
    if (this.options.options.throwOnError) {
      throw error;
    }
  }
}
