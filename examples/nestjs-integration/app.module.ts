/**
 * NestJS Integration Example
 *
 * This example shows how to integrate tripero-node with NestJS
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TriperoModule } from '@gpe-sistemas/tripero-node/nestjs';
import { PositionService } from './position.service';
import { TripListenerService } from './trip-listener.service';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configure Tripero module with async factory
    TriperoModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('TRIPERO_REDIS_HOST', 'localhost'),
          port: config.get('TRIPERO_REDIS_PORT', 6379),
          db: config.get('TRIPERO_REDIS_DB', 0),
          password: config.get('TRIPERO_REDIS_PASSWORD'),
          keyPrefix: config.get('TRIPERO_KEY_PREFIX', 'tripero:'),
        },
        http: config.get('TRIPERO_HTTP_URL')
          ? {
              baseUrl: config.get('TRIPERO_HTTP_URL'),
              timeout: config.get('TRIPERO_HTTP_TIMEOUT', 10000),
            }
          : undefined,
        options: {
          logLevel: config.get('TRIPERO_LOG_LEVEL', 'info'),
          throwOnError: false,
        },
      }),
    }),
  ],
  providers: [PositionService, TripListenerService],
})
export class AppModule {}
