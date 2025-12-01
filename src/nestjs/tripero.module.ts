import type { DynamicModule, Provider, OnModuleDestroy } from '@nestjs/common';
import { Module, Global, Inject } from '@nestjs/common';
import { TriperoClient } from '../client/TriperoClient';
import type { TriperoClientOptions } from '../interfaces';

export const TRIPERO_OPTIONS = Symbol('TRIPERO_OPTIONS');

/**
 * Token de inyección para TriperoClient
 * @example
 * ```typescript
 * constructor(@Inject(TRIPERO_CLIENT) private tripero: TriperoClient) {}
 * ```
 */
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
 * Wrapper interno para manejar lifecycle del cliente
 * @internal
 */
class TriperoClientWrapper implements OnModuleDestroy {
  constructor(public readonly client: TriperoClient) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.disconnect();
  }
}

/**
 * Módulo NestJS para Tripero
 *
 * Provee TriperoClient como inyectable usando el token TRIPERO_CLIENT.
 *
 * @example Configuración estática
 * ```typescript
 * import { TriperoModule, TRIPERO_CLIENT, TriperoClient } from '@gpe-sistemas/tripero-node/nestjs';
 *
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
 *
 * // En tu servicio:
 * @Injectable()
 * export class MyService {
 *   constructor(@Inject(TRIPERO_CLIENT) private tripero: TriperoClient) {}
 *
 *   async getTrips() {
 *     return this.tripero.getTrips({ deviceId: 'xxx', from: '...', to: '...' });
 *   }
 * }
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

    const wrapperProvider: Provider = {
      provide: TriperoClientWrapper,
      useFactory: async (opts: TriperoClientOptions) => {
        const client = new TriperoClient(opts);
        await client.connect();
        return new TriperoClientWrapper(client);
      },
      inject: [TRIPERO_OPTIONS],
    };

    const clientProvider: Provider = {
      provide: TRIPERO_CLIENT,
      useFactory: (wrapper: TriperoClientWrapper) => wrapper.client,
      inject: [TriperoClientWrapper],
    };

    return {
      module: TriperoModule,
      providers: [optionsProvider, wrapperProvider, clientProvider],
      exports: [TRIPERO_CLIENT],
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

    const wrapperProvider: Provider = {
      provide: TriperoClientWrapper,
      useFactory: async (opts: TriperoClientOptions) => {
        const client = new TriperoClient(opts);
        await client.connect();
        return new TriperoClientWrapper(client);
      },
      inject: [TRIPERO_OPTIONS],
    };

    const clientProvider: Provider = {
      provide: TRIPERO_CLIENT,
      useFactory: (wrapper: TriperoClientWrapper) => wrapper.client,
      inject: [TriperoClientWrapper],
    };

    return {
      module: TriperoModule,
      imports: asyncOptions.imports || [],
      providers: [optionsProvider, wrapperProvider, clientProvider],
      exports: [TRIPERO_CLIENT],
    };
  }
}
