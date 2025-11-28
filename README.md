# tripero-node

Node.js/TypeScript SDK for [Tripero](https://github.com/GPE-Sistemas/tripero) GPS trip detection service.

[![npm version](https://img.shields.io/npm/v/tripero-node.svg)](https://www.npmjs.com/package/tripero-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

## Features

- **Type-safe** - Full TypeScript support with IntelliSense
- **NestJS compatible** - Dedicated module with dependency injection
- **Node.js vanilla** - Works without any framework
- **Fire-and-forget** - Non-blocking async operations by default
- **Event-driven** - Subscribe to trip/stop events in real-time
- **Prefixed channels** - Support for shared Redis instances

## Installation

```bash
npm install tripero-node
```

## Quick Start

### Node.js Vanilla

```typescript
import { TriperoClient } from 'tripero-node';

const tripero = new TriperoClient({
  redis: {
    host: 'redis-tripero-service',
    port: 6379,
  },
});

await tripero.connect();

// Publish GPS position
await tripero.publishPosition({
  deviceId: 'VEHICLE-001',
  timestamp: Date.now(),
  latitude: -34.6037,
  longitude: -58.3816,
  speed: 45,
  ignition: true,
});

// Subscribe to events
tripero.on('trip:completed', (event) => {
  console.log(`Trip completed: ${event.tripId}`);
  console.log(`  Distance: ${event.distance}m`);
  console.log(`  Duration: ${event.duration}s`);
});

await tripero.subscribe();
```

### NestJS

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TriperoModule } from 'tripero-node/nestjs';

@Module({
  imports: [
    TriperoModule.forRoot({
      redis: {
        host: 'redis-tripero-service',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

```typescript
// position.service.ts
import { Injectable } from '@nestjs/common';
import { TriperoService } from 'tripero-node/nestjs';

@Injectable()
export class PositionService {
  constructor(private readonly tripero: TriperoService) {}

  async handleGpsData(data: GpsData) {
    await this.tripero.publishPosition({
      deviceId: data.imei,
      timestamp: Date.now(),
      latitude: data.lat,
      longitude: data.lon,
      speed: data.speed,
      ignition: data.acc,
      metadata: {
        tenant_id: data.tenantId,
        client_id: data.clientId,
      },
    });
  }
}
```

## API Reference

### TriperoClient

Main class for interacting with Tripero.

#### Constructor

```typescript
const tripero = new TriperoClient(options: TriperoClientOptions);
```

**Options:**

```typescript
interface TriperoClientOptions {
  redis: {
    host?: string;        // Default: 'localhost'
    port?: number;        // Default: 6379
    db?: number;          // Default: 0
    password?: string;
    username?: string;
    keyPrefix?: string;   // Prefix for all keys/channels
  };
  options?: {
    enableRetry?: boolean;        // Default: false
    enableOfflineQueue?: boolean; // Default: false
    throwOnError?: boolean;       // Default: false
    logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  };
}
```

#### Methods

##### `connect(): Promise<void>`

Connect to Redis server.

##### `disconnect(): Promise<void>`

Disconnect from Redis server.

##### `health(): Promise<HealthStatus>`

Check connection health.

##### `publishPosition(position: PositionEvent): Promise<void>`

Publish a GPS position to Tripero.

```typescript
await tripero.publishPosition({
  deviceId: 'VEHICLE-001',
  timestamp: Date.now(),
  latitude: -34.6037,
  longitude: -58.3816,
  speed: 45,
  heading: 180,
  altitude: 25,
  ignition: true,
  metadata: {
    tenant_id: 'acme-corp',
    fleet_id: 'delivery',
  },
});
```

##### `publishPositions(positions: PositionEvent[]): Promise<void>`

Publish multiple positions in batch (optimized with Redis pipeline).

##### `publishIgnitionEvent(event: IgnitionEvent): Promise<void>`

Publish an ignition change event.

```typescript
await tripero.publishIgnitionEvent({
  deviceId: 'VEHICLE-001',
  timestamp: Date.now(),
  ignition: true,
  latitude: -34.6037,
  longitude: -58.3816,
});
```

##### `on(eventType, handler): void`

Register an event handler.

```typescript
tripero.on('trip:started', (event) => {
  console.log(`Trip started: ${event.tripId}`);
});

tripero.on('trip:completed', (event) => {
  console.log(`Trip completed: ${event.tripId}`);
  console.log(`  Distance: ${event.distance}m`);
  console.log(`  Duration: ${event.duration}s`);
});

tripero.on('tracker:state:changed', (event) => {
  console.log(`State: ${event.previousState} → ${event.currentState}`);
});
```

##### `subscribe(): Promise<void>`

Start listening to registered events.

##### `unsubscribe(): Promise<void>`

Stop listening to all events.

## Events

### Input Events (publish to Tripero)

| Channel | Description |
|---------|-------------|
| `position:new` | GPS positions |
| `ignition:changed` | Ignition state changes |

### Output Events (receive from Tripero)

| Event | Description |
|-------|-------------|
| `tracker:state:changed` | Tracker state transitions (STOPPED ↔ IDLE ↔ MOVING) |
| `trip:started` | Trip has started |
| `trip:completed` | Trip has ended |
| `stop:started` | Stop detected during trip |
| `stop:completed` | Stop has ended |
| `position:rejected` | Position rejected by validation |

## NestJS Integration

### Async Configuration

```typescript
TriperoModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    redis: {
      host: config.get('TRIPERO_REDIS_HOST'),
      port: config.get('TRIPERO_REDIS_PORT'),
      keyPrefix: config.get('TRIPERO_KEY_PREFIX', ''),
    },
  }),
});
```

### Event Decorators

```typescript
import { Injectable } from '@nestjs/common';
import {
  OnTripStarted,
  OnTripCompleted,
  OnTrackerStateChanged,
} from 'tripero-node/nestjs';

@Injectable()
export class TripListenerService {
  @OnTripStarted()
  handleTripStarted(event: TripStartedEvent) {
    console.log(`Trip started: ${event.tripId}`);
  }

  @OnTripCompleted()
  handleTripCompleted(event: TripCompletedEvent) {
    console.log(`Trip completed: ${event.tripId}`);
  }

  @OnTrackerStateChanged()
  handleStateChanged(event: TrackerStateChangedEvent) {
    console.log(`State: ${event.previousState} → ${event.currentState}`);
  }
}
```

## Metadata Support

Tripero supports custom metadata that propagates to trips and stops:

```typescript
await tripero.publishPosition({
  deviceId: 'VEHICLE-001',
  timestamp: Date.now(),
  latitude: -34.6037,
  longitude: -58.3816,
  speed: 45,
  metadata: {
    // Optimized fields (indexed, ~1-2ms queries)
    tenant_id: 'acme-corp',
    client_id: 'client-123',
    fleet_id: 'delivery-trucks',
    // Custom fields (GIN index, ~5-10ms queries)
    driver_id: 'driver-456',
    route_number: 'R42',
  },
});
```

## Redis Key Prefix

For shared Redis instances, use `keyPrefix`:

```typescript
const tripero = new TriperoClient({
  redis: {
    host: 'shared-redis',
    port: 6379,
    keyPrefix: 'tripero:', // All channels will be prefixed
  },
});
```

## Compatibility

- **Tripero**: v0.4.0+
- **Node.js**: 18+
- **NestJS**: 10+ (optional)

## License

MIT © [GPE Sistemas](https://gpesistemas.com)
