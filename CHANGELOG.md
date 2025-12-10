# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Bulk Status API** - New `getBulkTrackerStatus()` method
  - Fetch status of multiple trackers in a single HTTP request
  - Returns array of tracker statuses with individual error handling
  - Optimized for dashboard and fleet views

## [0.3.0] - 2024-12-01

### Added

- **Power Diagnostic** - New `powerDiagnostic` field in `TrackerStatusResponse`
  - `powerType`: Connection type (`'permanent'` | `'switched'` | `'unknown'`)
  - `overnightGapCount`: Number of overnight gaps detected
  - `lastOvernightGapAt`: Last overnight gap timestamp
  - `hasPowerIssue`: Flag indicating potential power issues
  - `recommendation`: Action recommendation if issue detected

- **Event Metadata** - Added `metadata` field to stop events
  - `StopStartedEvent.metadata`
  - `StopCompletedEvent.metadata`

### Changed

- Updated to Tripero v0.4.2 compatibility

### Power Type Values

| Value | Description |
|-------|-------------|
| `permanent` | Connected to BAT+ (always powered, no overnight gaps) |
| `switched` | Connected to ACC/ignition (loses power when vehicle off) |
| `unknown` | Not enough data to determine |

## [0.2.0] - 2024-11-28

### Added

- Metadata support for position events (`tenant_id`, `client_id`, `fleet_id`)
- Metadata propagation to trips and stops

## [0.1.0] - 2024-11-28

### Added

- **TriperoClient** - Main client for interacting with Tripero
  - `connect()` / `disconnect()` - Redis connection management
  - `health()` - Connection health check
  - `publishPosition()` - Publish single GPS position
  - `publishPositions()` - Batch publish with Redis pipeline
  - `publishIgnitionEvent()` - Publish ignition state changes
  - `on()` / `off()` - Event handler registration
  - `subscribe()` / `unsubscribe()` - Event subscription management

- **TriperoHttpClient** - HTTP API client for Tripero REST endpoints
  - `getTrackerStatus()` - Get real-time tracker status
  - `setOdometer()` - Configure odometer offset
  - `getTrips()` - Query historical trips
  - `getStops()` - Query historical stops
  - `health()` - HTTP API health check

- **NestJS Integration**
  - `TriperoModule` - NestJS module with `forRoot()` and `forRootAsync()`
  - `TriperoService` - Injectable service extending TriperoClient
  - Event decorators: `@OnTripStarted`, `@OnTripCompleted`, `@OnStopStarted`, `@OnStopCompleted`, `@OnTrackerStateChanged`, `@OnPositionRejected`

- **TypeScript Definitions**
  - Full type definitions for all events and configurations
  - `PositionEvent`, `IgnitionEvent` - Input event types
  - `TripStartedEvent`, `TripCompletedEvent`, `StopStartedEvent`, `StopCompletedEvent`, `TrackerStateChangedEvent`, `PositionRejectedEvent` - Output event types
  - `TriperoClientOptions`, `TriperoRedisOptions`, `TriperoHttpOptions` - Configuration types

- **Configuration**
  - Redis connection options (host, port, db, password, username)
  - Redis key prefix support (default: `tripero:`)
  - HTTP API configuration (baseUrl, timeout, headers)
  - Logging configuration with custom logger support
  - Fire-and-forget mode (default) with optional error throwing

### Compatibility

- Node.js 18+
- Tripero v0.4.0+
- NestJS 10+ (optional)

[Unreleased]: https://github.com/GPE-Sistemas/tripero-node/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/GPE-Sistemas/tripero-node/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/GPE-Sistemas/tripero-node/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/GPE-Sistemas/tripero-node/releases/tag/v0.1.0
