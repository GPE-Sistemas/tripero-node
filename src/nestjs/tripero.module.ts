import type { DynamicModule, Provider, OnModuleDestroy } from '@nestjs/common';
import { Module, Global, Inject, Injectable } from '@nestjs/common';
import { TriperoClient } from '../client/TriperoClient';
import type { TriperoClientOptions } from '../interfaces';

export const TRIPERO_OPTIONS = Symbol('TRIPERO_OPTIONS');
export const TRIPERO_CLIENT = Symbol('TRIPERO_CLIENT');

/**
 * Opciones para configuración asíncrona del módulo
 */
export interface TriperoModuleAsyncOptions {
  imports?: any[];
  inject?: any[];
  useFactory: (
    ...args: any[]
  ) => TriperoClientOptions | Promise<TriperoClientOptions>;
}

/**
 * Servicio inyectable de Tripero para NestJS
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class PositionService {
 *   constructor(private readonly tripero: TriperoService) {}
 *
 *   async handleGpsData(data: any) {
 *     await this.tripero.publishPosition({
 *       deviceId: data.imei,
 *       timestamp: Date.now(),
 *       latitude: data.lat,
 *       longitude: data.lon,
 *       speed: data.speed
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class TriperoService extends TriperoClient implements OnModuleDestroy {
  constructor(@Inject(TRIPERO_OPTIONS) options: TriperoClientOptions) {
    super(options);
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }
}

/**
 * Módulo NestJS para Tripero
 *
 * @example Configuración estática
 * ```typescript
 * @Module({
 *   imports: [
 *     TriperoModule.forRoot({
 *       redis: { host: 'redis-tripero-service', port: 6379 },
 *       http: { baseUrl: 'http://tripero-service:3001' },
 *       options: { throwOnError: false }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 *
 * @example Configuración asíncrona con ConfigService
 * ```typescript
 * @Module({
 *   imports: [
 *     TriperoModule.forRootAsync({
 *       imports: [ConfigModule],
 *       inject: [ConfigService],
 *       useFactory: (config: ConfigService) => ({
 *         redis: {
 *           host: config.get('TRIPERO_REDIS_HOST'),
 *           port: config.get('TRIPERO_REDIS_PORT'),
 *         },
 *         http: {
 *           baseUrl: config.get('TRIPERO_HTTP_URL'),
 *         }
 *       })
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class TriperoModule {
  /**
   * Configura el módulo con opciones estáticas
   */
  static forRoot(options: TriperoClientOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: TRIPERO_OPTIONS,
      useValue: options,
    };

    const clientProvider: Provider = {
      provide: TriperoService,
      useFactory: async (opts: TriperoClientOptions) => {
        const service = new TriperoService(opts);
        await service.connect();
        return service;
      },
      inject: [TRIPERO_OPTIONS],
    };

    return {
      module: TriperoModule,
      providers: [optionsProvider, clientProvider],
      exports: [TriperoService],
    };
  }

  /**
   * Configura el módulo con opciones asíncronas
   */
  static forRootAsync(asyncOptions: TriperoModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: TRIPERO_OPTIONS,
      useFactory: asyncOptions.useFactory,
      inject: asyncOptions.inject || [],
    };

    const clientProvider: Provider = {
      provide: TriperoService,
      useFactory: async (opts: TriperoClientOptions) => {
        const service = new TriperoService(opts);
        await service.connect();
        return service;
      },
      inject: [TRIPERO_OPTIONS],
    };

    return {
      module: TriperoModule,
      imports: asyncOptions.imports || [],
      providers: [optionsProvider, clientProvider],
      exports: [TriperoService],
    };
  }
}
