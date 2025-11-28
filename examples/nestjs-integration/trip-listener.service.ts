/**
 * Trip Listener Service Example
 *
 * Demonstrates subscribing to Tripero events in NestJS
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TriperoService } from '@gpe-sistemas/tripero-node/nestjs';
import type {
  TripStartedEvent,
  TripCompletedEvent,
  StopStartedEvent,
  StopCompletedEvent,
  TrackerStateChangedEvent,
} from '@gpe-sistemas/tripero-node';

@Injectable()
export class TripListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TripListenerService.name);

  constructor(private readonly tripero: TriperoService) {}

  /**
   * Called when the module is initialized
   * Register event handlers and start subscription
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing Tripero event listeners');

    // Register event handlers
    this.tripero.on('trip:started', this.handleTripStarted.bind(this));
    this.tripero.on('trip:completed', this.handleTripCompleted.bind(this));
    this.tripero.on('stop:started', this.handleStopStarted.bind(this));
    this.tripero.on('stop:completed', this.handleStopCompleted.bind(this));
    this.tripero.on('tracker:state:changed', this.handleStateChanged.bind(this));

    // Start listening to events
    await this.tripero.subscribe();
    this.logger.log('Subscribed to Tripero events');
  }

  /**
   * Called when the module is destroyed
   * Cleanup subscriptions
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Cleaning up Tripero event listeners');
    await this.tripero.unsubscribe();
  }

  /**
   * Handle trip started event
   */
  private handleTripStarted(event: TripStartedEvent): void {
    this.logger.log(`Trip started: ${event.tripId}`);
    this.logger.debug(`  Device: ${event.deviceId}`);
    this.logger.debug(`  Start time: ${event.startTime}`);
    this.logger.debug(`  Detection method: ${event.detectionMethod}`);

    // Example: Send push notification
    // this.notificationService.sendTripStarted(event);

    // Example: Update real-time dashboard
    // this.websocketGateway.broadcast('trip:started', event);

    // Example: Log to analytics
    // this.analyticsService.trackTripStart(event);
  }

  /**
   * Handle trip completed event
   */
  private async handleTripCompleted(event: TripCompletedEvent): Promise<void> {
    this.logger.log(`Trip completed: ${event.tripId}`);
    this.logger.debug(`  Duration: ${event.duration}s`);
    this.logger.debug(`  Distance: ${event.distance}m`);
    this.logger.debug(`  Avg speed: ${event.avgSpeed} km/h`);
    this.logger.debug(`  Max speed: ${event.maxSpeed} km/h`);
    this.logger.debug(`  Stops: ${event.stopsCount}`);

    // Example: Generate trip report
    // await this.reportService.generateTripReport(event);

    // Example: Calculate fuel consumption
    // const fuelConsumed = this.fuelService.estimateFuel(event.distance, event.avgSpeed);

    // Example: Update driver statistics
    // await this.driverService.updateStats(event.deviceId, event);

    // Example: Send trip summary email
    // await this.emailService.sendTripSummary(event);
  }

  /**
   * Handle stop started event
   */
  private handleStopStarted(event: StopStartedEvent): void {
    this.logger.log(`Stop started: ${event.stopId}`);
    this.logger.debug(`  Trip: ${event.tripId}`);
    this.logger.debug(`  Reason: ${event.reason}`);
    this.logger.debug(`  Location: ${event.location.coordinates}`);

    // Example: Check if stop is at authorized location
    // const isAuthorized = this.geofenceService.isAuthorizedStop(event.location);
    // if (!isAuthorized) {
    //   this.alertService.sendUnauthorizedStopAlert(event);
    // }
  }

  /**
   * Handle stop completed event
   */
  private handleStopCompleted(event: StopCompletedEvent): void {
    this.logger.log(`Stop completed: ${event.stopId}`);
    this.logger.debug(`  Duration: ${event.duration}s`);

    // Example: Log excessive idle time
    // if (event.duration > 1800) { // 30 minutes
    //   this.alertService.sendExcessiveIdleAlert(event);
    // }
  }

  /**
   * Handle tracker state changed event
   */
  private handleStateChanged(event: TrackerStateChangedEvent): void {
    this.logger.log(
      `State changed: ${event.previousState} → ${event.currentState}`,
    );
    this.logger.debug(`  Device: ${event.deviceId}`);
    this.logger.debug(`  Odometer: ${event.odometer.totalKm} km`);
    this.logger.debug(`  Reason: ${event.reason}`);

    // Example: Update vehicle status in database
    // await this.vehicleService.updateStatus(event.deviceId, event.currentState);

    // Example: Broadcast to real-time dashboard
    // this.websocketGateway.broadcast('vehicle:status', {
    //   deviceId: event.deviceId,
    //   state: event.currentState,
    //   odometer: event.odometer,
    //   lastPosition: event.lastPosition,
    // });
  }
}
