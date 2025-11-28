<p align="center">
  <img src="https://storage.googleapis.com/assets-generales/tripero-node-beta.png" width="200" alt="Tripero Node Logo" />
</p>

<h1 align="center">tripero-node</h1>

<p align="center">
  <strong>Node.js/TypeScript SDK for Tripero GPS Trip Detection Service</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@gpe-sistemas/tripero-node"><img src="https://img.shields.io/npm/v/@gpe-sistemas/tripero-node.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@gpe-sistemas/tripero-node"><img src="https://img.shields.io/npm/dm/@gpe-sistemas/tripero-node.svg" alt="npm downloads"></a>
  <a href="https://github.com/GPE-Sistemas/tripero-node/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-blue.svg" alt="TypeScript"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js"></a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-nestjs-integration">NestJS</a> •
  <a href="#-events">Events</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 📋 Overview

**tripero-node** is the official Node.js/TypeScript SDK for [Tripero](https://github.com/GPE-Sistemas/tripero), an intelligent GPS trip detection and stop analysis microservice. This SDK simplifies integration with Tripero by providing:

- **Type-safe API** - Full TypeScript support with complete type definitions
- **Redis PubSub abstraction** - Simple methods for publishing positions and subscribing to events
- **HTTP client** - Access Tripero's REST API for queries and configuration
- **NestJS integration** - Dedicated module with dependency injection support
- **Fire-and-forget** - Non-blocking async operations by default

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔌 **Easy Integration** | Simple API to publish GPS positions and receive trip events |
| 📡 **Real-time Events** | Subscribe to trip starts, completions, stops, and state changes |
| 🔒 **Type Safety** | Full TypeScript definitions for all events and configurations |
| ⚡ **High Performance** | Fire-and-forget publishing with Redis pipelines for batch operations |
| 🏗️ **NestJS Ready** | First-class NestJS support with module, service, and decorators |
| 🔧 **Configurable** | Flexible configuration with sensible defaults |
| 📊 **HTTP API Access** | Query tracker status, trips, stops, and configure odometers |
| 🏷️ **Metadata Support** | Multi-tenancy support with custom metadata propagation |

## 📦 Installation

```bash
# npm
npm install @gpe-sistemas/tripero-node

# yarn
yarn add @gpe-sistemas/tripero-node

# pnpm
pnpm add @gpe-sistemas/tripero-node
```

### Peer Dependencies

For NestJS integration (optional):
```bash
npm install @nestjs/common @nestjs/core
```

## 🚀 Quick Start

### Basic Usage (Node.js)

```typescript
import { TriperoClient } from '@gpe-sistemas/tripero-node';

// Create client
const tripero = new TriperoClient({
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

// Connect to Redis
await tripero.connect();

// Publish a GPS position
await tripero.publishPosition({
  deviceId: 'VEHICLE-001',
  timestamp: Date.now(),
  latitude: -34.6037,
  longitude: -58.3816,
  speed: 45,
  ignition: true,
});

// Subscribe to trip events
tripero.on('trip:started', (event) => {
  console.log(`🚗 Trip started: ${event.tripId}`);
});

tripero.on('trip:completed', (event) => {
  console.log(`🏁 Trip completed: ${event.tripId}`);
  console.log(`   Distance: ${event.distance}m`);
  console.log(`   Duration: ${event.duration}s`);
});

await tripero.subscribe();

// Cleanup on shutdown
process.on('SIGINT', async () => {
  await tripero.disconnect();
  process.exit(0);
});
```

### With HTTP API

```typescript
const tripero = new TriperoClient({
  redis: {
    host: 'redis-tripero-service',
    port: 6379,
  },
  http: {
    baseUrl: 'http://tripero-service:3001',
  },
});

await tripero.connect();

// Get tracker status
const status = await tripero.getTrackerStatus('VEHICLE-001');
console.log(`State: ${status.data.currentState.state}`);
console.log(`Odometer: ${status.data.odometer.totalKm} km`);

// Get trip history
const trips = await tripero.getTrips({
  deviceId: 'VEHICLE-001',
  from: new Date('2024-01-01'),
  to: new Date(),
});

// Set odometer (sync with vehicle's real odometer)
await tripero.setOdometer('VEHICLE-001', 125000000, 'vehicle_sync');
```

## 📚 API Reference

### TriperoClient

The main class for interacting with Tripero.

#### Constructor

```typescript
new TriperoClient(options: TriperoClientOptions)
```

#### Configuration Options

```typescript
interface TriperoClientOptions {
  redis: {
    host?: string;           // Default: 'localhost'
    port?: number;           // Default: 6379
    db?: number;             // Default: 0
    password?: string;       // Optional
    username?: string;       // Optional (Redis 6+ ACL)
    keyPrefix?: string;      // Default: 'tripero:'
  };
  http?: {
    baseUrl: string;         // Tripero HTTP API URL
    timeout?: number;        // Default: 10000ms
    headers?: Record<string, string>;
  };
  options?: {
    enableRetry?: boolean;        // Default: false
    enableOfflineQueue?: boolean; // Default: false
    throwOnError?: boolean;       // Default: false
    logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  };
}
```

### Connection Methods

| Method | Description |
|--------|-------------|
| `connect()` | Connect to Redis server |
| `disconnect()` | Disconnect from Redis server |
| `health()` | Check Redis connection health |
| `healthHttp()` | Check Tripero HTTP API health (requires `http` config) |

### Publishing Methods

#### `publishPosition(position: PositionEvent): Promise<void>`

Publish a GPS position to Tripero.

```typescript
await tripero.publishPosition({
  deviceId: 'VEHICLE-001',       // Required: unique device identifier
  timestamp: Date.now(),          // Required: Unix timestamp in ms
  latitude: -34.6037,             // Required: -90 to 90
  longitude: -58.3816,            // Required: -180 to 180
  speed: 45,                      // Required: km/h
  ignition: true,                 // Optional: engine state
  heading: 180,                   // Optional: degrees 0-360
  altitude: 25,                   // Optional: meters
  accuracy: 5,                    // Optional: GPS accuracy in meters
  satellites: 12,                 // Optional: number of satellites
  metadata: {                     // Optional: custom data
    tenant_id: 'acme-corp',
    fleet_id: 'delivery',
    driver_id: 'driver-123',
  },
});
```

#### `publishPositions(positions: PositionEvent[]): Promise<void>`

Publish multiple positions in a single batch (uses Redis pipeline for performance).

```typescript
await tripero.publishPositions([
  { deviceId: 'V-001', timestamp: Date.now(), latitude: -34.60, longitude: -58.38, speed: 45 },
  { deviceId: 'V-002', timestamp: Date.now(), latitude: -34.61, longitude: -58.39, speed: 30 },
  { deviceId: 'V-003', timestamp: Date.now(), latitude: -34.62, longitude: -58.40, speed: 55 },
]);
```

#### `publishIgnitionEvent(event: IgnitionEvent): Promise<void>`

Publish an ignition state change.

```typescript
await tripero.publishIgnitionEvent({
  deviceId: 'VEHICLE-001',
  timestamp: Date.now(),
  ignition: true,  // true = ON, false = OFF
  latitude: -34.6037,
  longitude: -58.3816,
});
```

### Subscription Methods

#### `on(eventType, handler): void`

Register an event handler.

```typescript
tripero.on('trip:started', (event: TripStartedEvent) => {
  console.log(`Trip ${event.tripId} started at ${event.startTime}`);
});

tripero.on('trip:completed', (event: TripCompletedEvent) => {
  console.log(`Trip ${event.tripId}: ${event.distance}m in ${event.duration}s`);
});

tripero.on('stop:started', (event: StopStartedEvent) => {
  console.log(`Stop detected: ${event.reason}`);
});

tripero.on('tracker:state:changed', (event: TrackerStateChangedEvent) => {
  console.log(`${event.previousState} → ${event.currentState}`);
});
```

#### `off(eventType, handler): void`

Remove an event handler.

#### `subscribe(): Promise<void>`

Start listening to all registered events.

#### `unsubscribe(): Promise<void>`

Stop listening to events.

### HTTP API Methods

> **Note:** These methods require the `http` configuration option.

#### `getTrackerStatus(trackerId: string): Promise<TrackerStatusResponse>`

Get real-time status of a tracker including state, odometer, position, and statistics.

#### `setOdometer(trackerId: string, meters: number, reason?: string): Promise<OdometerSetResponse>`

Set the odometer offset to sync with the vehicle's real odometer.

#### `getTrips(options: ReportQueryOptions): Promise<TripReport[]>`

Query historical trips.

```typescript
const trips = await tripero.getTrips({
  deviceId: 'VEHICLE-001',           // or ['V-001', 'V-002'] or 'all'
  from: new Date('2024-01-01'),
  to: new Date(),
  tenantId: 'acme-corp',             // Optional: filter by tenant
  fleetId: 'delivery',               // Optional: filter by fleet
});
```

#### `getStops(options: ReportQueryOptions): Promise<StopReport[]>`

Query historical stops with the same options as `getTrips()`.

## 🏗️ NestJS Integration

### Module Setup

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TriperoModule } from '@gpe-sistemas/tripero-node/nestjs';

@Module({
  imports: [
    // Static configuration
    TriperoModule.forRoot({
      redis: {
        host: 'redis-tripero-service',
        port: 6379,
      },
      http: {
        baseUrl: 'http://tripero-service:3001',
      },
    }),
  ],
})
export class AppModule {}
```

### Async Configuration

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TriperoModule } from '@gpe-sistemas/tripero-node/nestjs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TriperoModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('TRIPERO_REDIS_HOST', 'localhost'),
          port: config.get('TRIPERO_REDIS_PORT', 6379),
          keyPrefix: config.get('TRIPERO_KEY_PREFIX', 'tripero:'),
        },
        http: {
          baseUrl: config.get('TRIPERO_HTTP_URL'),
        },
      }),
    }),
  ],
})
export class AppModule {}
```

### Using the Service

```typescript
// position.service.ts
import { Injectable } from '@nestjs/common';
import { TriperoService } from '@gpe-sistemas/tripero-node/nestjs';

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
      },
    });
  }

  async getVehicleStatus(deviceId: string) {
    return this.tripero.getTrackerStatus(deviceId);
  }
}
```

### Event Decorators

```typescript
// trip-listener.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { TriperoService } from '@gpe-sistemas/tripero-node/nestjs';
import type { TripStartedEvent, TripCompletedEvent } from '@gpe-sistemas/tripero-node';

@Injectable()
export class TripListenerService implements OnModuleInit {
  constructor(private readonly tripero: TriperoService) {}

  async onModuleInit() {
    // Register event handlers
    this.tripero.on('trip:started', this.handleTripStarted.bind(this));
    this.tripero.on('trip:completed', this.handleTripCompleted.bind(this));

    // Start listening
    await this.tripero.subscribe();
  }

  private handleTripStarted(event: TripStartedEvent) {
    console.log(`🚗 Trip started: ${event.tripId}`);
    // Send notification, update dashboard, etc.
  }

  private handleTripCompleted(event: TripCompletedEvent) {
    console.log(`🏁 Trip completed: ${event.tripId}`);
    console.log(`   Distance: ${event.distance}m`);
    console.log(`   Duration: ${event.duration}s`);
    // Generate report, calculate fuel, etc.
  }
}
```

## 📡 Events

### Input Events (publish to Tripero)

| Channel | Method | Description |
|---------|--------|-------------|
| `position:new` | `publishPosition()` | GPS position data |
| `ignition:changed` | `publishIgnitionEvent()` | Ignition state changes |

### Output Events (receive from Tripero)

| Event | Description | Key Fields |
|-------|-------------|------------|
| `tracker:state:changed` | Tracker state transition | `previousState`, `currentState`, `odometer` |
| `trip:started` | Trip has started | `tripId`, `deviceId`, `startTime`, `startLocation` |
| `trip:completed` | Trip has ended | `tripId`, `distance`, `duration`, `avgSpeed`, `maxSpeed` |
| `stop:started` | Stop detected during trip | `stopId`, `tripId`, `location`, `reason` |
| `stop:completed` | Stop has ended | `stopId`, `duration` |
| `position:rejected` | Position failed validation | `deviceId`, `reason` |

### Tracker States

```
STOPPED ←→ IDLE ←→ MOVING
```

| State | Description |
|-------|-------------|
| `STOPPED` | Vehicle completely stopped (ignition OFF) |
| `IDLE` | Engine running but not moving (ignition ON, speed ≈ 0) |
| `MOVING` | Vehicle in motion (ignition ON, speed > threshold) |

## 🏷️ Metadata Support

Tripero supports custom metadata that propagates automatically from positions to trips and stops:

```typescript
await tripero.publishPosition({
  deviceId: 'VEHICLE-001',
  timestamp: Date.now(),
  latitude: -34.6037,
  longitude: -58.3816,
  speed: 45,
  metadata: {
    // Optimized fields (B-tree index, ~1-2ms queries)
    tenant_id: 'acme-corp',
    client_id: 'client-123',
    fleet_id: 'delivery-trucks',

    // Custom fields (GIN index, ~5-10ms queries)
    driver_id: 'driver-456',
    route_number: 'R42',
    delivery_id: 'DEL-789',
  },
});
```

Query trips/stops by metadata:

```typescript
const trips = await tripero.getTrips({
  deviceId: 'all',
  from: new Date('2024-01-01'),
  to: new Date(),
  tenantId: 'acme-corp',      // Fast query (~1-2ms)
  fleetId: 'delivery-trucks', // Fast query (~1-2ms)
});
```

## ⚙️ Configuration

### Environment Variables

When using with NestJS ConfigService:

| Variable | Description | Default |
|----------|-------------|---------|
| `TRIPERO_REDIS_HOST` | Redis server host | `localhost` |
| `TRIPERO_REDIS_PORT` | Redis server port | `6379` |
| `TRIPERO_REDIS_DB` | Redis database number | `0` |
| `TRIPERO_REDIS_PASSWORD` | Redis password | - |
| `TRIPERO_KEY_PREFIX` | Redis key/channel prefix | `tripero:` |
| `TRIPERO_HTTP_URL` | Tripero HTTP API URL | - |
| `TRIPERO_LOG_LEVEL` | Log level | `info` |

### Redis Key Prefix

The SDK uses `tripero:` as the default key prefix to match Tripero server defaults. This allows sharing a Redis instance with other applications:

```typescript
const tripero = new TriperoClient({
  redis: {
    host: 'shared-redis',
    keyPrefix: 'myapp:tripero:', // Custom prefix
  },
});
```

> **Important:** The `keyPrefix` must match the `REDIS_KEY_PREFIX` configured in Tripero server.

## 🔧 Advanced Usage

### Custom Logger

```typescript
import { TriperoClient, TriperoLogger } from '@gpe-sistemas/tripero-node';

const customLogger: TriperoLogger = {
  debug: (msg, ...args) => myLogger.debug(msg, ...args),
  info: (msg, ...args) => myLogger.info(msg, ...args),
  warn: (msg, ...args) => myLogger.warn(msg, ...args),
  error: (msg, ...args) => myLogger.error(msg, ...args),
};

const tripero = new TriperoClient({
  redis: { host: 'localhost' },
  options: {
    logger: customLogger,
  },
});
```

### Error Handling

By default, the SDK logs errors but doesn't throw (fire-and-forget). To enable exceptions:

```typescript
const tripero = new TriperoClient({
  redis: { host: 'localhost' },
  options: {
    throwOnError: true,
  },
});

try {
  await tripero.publishPosition(position);
} catch (error) {
  console.error('Failed to publish:', error);
}
```

### Connection Retry

```typescript
const tripero = new TriperoClient({
  redis: {
    host: 'localhost',
    redisOptions: {
      retryStrategy: (times) => Math.min(times * 1000, 30000),
      maxRetriesPerRequest: 3,
    },
  },
  options: {
    enableRetry: true,
    enableOfflineQueue: true,
  },
});
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/GPE-Sistemas/tripero-node.git
cd tripero-node

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Write tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 GPE Sistemas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🔗 Related Projects

- **[Tripero](https://github.com/GPE-Sistemas/tripero)** - GPS trip detection microservice
- **[IRIX](https://github.com/GPE-Sistemas)** - Fleet management platform

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/GPE-Sistemas/tripero-node/issues)
- **Discussions**: [GitHub Discussions](https://github.com/GPE-Sistemas/tripero-node/discussions)

---

<p align="center">
  Made with ❤️ by <a href="https://gpesistemas.com">GPE Sistemas</a>
</p>

<p align="center">
  <sub>If you find this project useful, please consider giving it a ⭐</sub>
</p>
