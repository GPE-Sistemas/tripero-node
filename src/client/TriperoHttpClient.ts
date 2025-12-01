import type { TriperoHttpOptions, TriperoLogger } from '../interfaces';
import { DEFAULTS } from './constants';

/**
 * Respuesta de status de un tracker
 */
export interface TrackerStatusResponse {
  success: boolean;
  data: {
    trackerId: string;
    deviceId: string;
    odometer: {
      total: number;
      totalKm: number;
      currentTrip?: number;
      currentTripKm?: number;
    };
    currentState: {
      state: 'STOPPED' | 'IDLE' | 'MOVING';
      since: string;
      duration: number;
    };
    lastPosition: {
      timestamp: string;
      latitude: number;
      longitude: number;
      speed: number;
      ignition: boolean;
      heading: number;
      altitude: number;
      age: number;
    };
    currentTrip?: {
      tripId: string;
      startTime: string;
      duration: number;
      distance: number;
      avgSpeed: number;
      maxSpeed: number;
      odometerAtStart: number;
    };
    statistics: {
      totalTrips: number;
      totalDrivingTime: number;
      totalDrivingHours: number;
      totalIdleTime: number;
      totalIdleHours: number;
      totalStops: number;
      firstSeen: string;
      lastSeen: string;
      daysActive: number;
    };
    health: {
      status: 'online' | 'offline' | 'stale';
      lastSeenAgo: number;
    };
    /**
     * Diagnóstico de conexión eléctrica del tracker (v0.4.2+)
     * Inferido del análisis de gaps nocturnos
     */
    powerDiagnostic?: {
      /**
       * Tipo de conexión eléctrica inferido:
       * - 'permanent': Conectado a BAT+ (siempre con energía)
       * - 'switched': Conectado a ACC/contacto (pierde energía al apagar)
       * - 'unknown': Sin datos suficientes para determinar
       */
      powerType: 'permanent' | 'switched' | 'unknown';
      /** Cantidad de gaps nocturnos (>2h) detectados */
      overnightGapCount: number;
      /** Fecha del último gap nocturno detectado */
      lastOvernightGapAt?: string;
      /** true si se detectó conexión switched - puede requerir atención */
      hasPowerIssue: boolean;
      /** Recomendación de acción si hay problema */
      recommendation?: string;
    };
  };
}

/**
 * Respuesta de configuración de odómetro
 */
export interface OdometerSetResponse {
  success: boolean;
  message: string;
  data: {
    trackerId: string;
    previousOdometer: number;
    previousOdometerKm: number;
    newOdometer: number;
    newOdometerKm: number;
    odometerOffset: number;
    odometerOffsetKm: number;
    reason: string;
    updatedAt: string;
  };
}

/**
 * Trip de reporte (formato Traccar-compatible)
 */
export interface TripReport {
  deviceId: string;
  deviceName: string | null;
  maxSpeed: number;
  averageSpeed: number;
  distance: number;
  spentFuel: number | null;
  duration: number;
  startTime: string;
  startAddress: string | null;
  startLat: number;
  startLon: number;
  endTime: string;
  endAddress: string | null;
  endLat: number;
  endLon: number;
  driverUniqueId: string | null;
  driverName: string | null;
}

/**
 * Stop de reporte (formato Traccar-compatible)
 */
export interface StopReport {
  deviceId: string;
  deviceName: string | null;
  duration: number;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  address: string | null;
  engineHours: number | null;
  startOdometer?: number;
  endOdometer?: number;
}

/**
 * Opciones para consulta de reportes
 */
export interface ReportQueryOptions {
  deviceId: string | string[] | 'all';
  from: Date | string;
  to: Date | string;
  tenantId?: string;
  clientId?: string;
  fleetId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cliente HTTP para la API REST de Tripero
 */
export class TriperoHttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly headers: Record<string, string>;
  private readonly logger: TriperoLogger;

  constructor(options: TriperoHttpOptions, logger: TriperoLogger) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = options.timeout ?? DEFAULTS.HTTP_TIMEOUT;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    this.logger = logger;
  }

  /**
   * Obtiene el estado actual de un tracker
   */
  async getTrackerStatus(trackerId: string): Promise<TrackerStatusResponse> {
    const url = `${this.baseUrl}/trackers/${encodeURIComponent(trackerId)}/status`;
    return this.request<TrackerStatusResponse>('GET', url);
  }

  /**
   * Configura el odómetro inicial de un tracker
   */
  async setOdometer(
    trackerId: string,
    initialOdometer: number,
    reason?: string,
  ): Promise<OdometerSetResponse> {
    const url = `${this.baseUrl}/trackers/${encodeURIComponent(trackerId)}/odometer`;
    return this.request<OdometerSetResponse>('POST', url, {
      initialOdometer,
      reason: reason ?? 'sdk_set',
    });
  }

  /**
   * Obtiene reportes de trips
   */
  async getTrips(options: ReportQueryOptions): Promise<TripReport[]> {
    const params = this.buildReportParams(options);
    const url = `${this.baseUrl}/api/reports/trips?${params}`;
    return this.request<TripReport[]>('GET', url);
  }

  /**
   * Obtiene reportes de stops
   */
  async getStops(options: ReportQueryOptions): Promise<StopReport[]> {
    const params = this.buildReportParams(options);
    const url = `${this.baseUrl}/api/reports/stops?${params}`;
    return this.request<StopReport[]>('GET', url);
  }

  /**
   * Verifica la salud de Tripero
   */
  async health(): Promise<{
    status: string;
    timestamp: string;
    services: Record<string, { status: string }>;
  }> {
    const url = `${this.baseUrl}/health`;
    return this.request('GET', url);
  }

  private buildReportParams(options: ReportQueryOptions): string {
    const params = new URLSearchParams();

    // Device ID(s)
    if (Array.isArray(options.deviceId)) {
      params.set('deviceId', options.deviceId.join(','));
    } else {
      params.set('deviceId', options.deviceId);
    }

    // Date range
    const from =
      options.from instanceof Date
        ? options.from.toISOString()
        : options.from;
    const to =
      options.to instanceof Date ? options.to.toISOString() : options.to;
    params.set('from', from);
    params.set('to', to);

    // Optional filters
    if (options.tenantId) params.set('tenantId', options.tenantId);
    if (options.clientId) params.set('clientId', options.clientId);
    if (options.fleetId) params.set('fleetId', options.fleetId);
    if (options.metadata) {
      params.set('metadata', JSON.stringify(options.metadata));
    }

    return params.toString();
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      this.logger.debug(`HTTP ${method} ${url}`);

      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        );
      }

      const data = (await response.json()) as T;
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      this.logger.error(`HTTP error: ${method} ${url}`, error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
