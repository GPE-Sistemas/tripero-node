/**
 * Position Service Example
 *
 * Demonstrates publishing GPS positions using TriperoService
 */

import { Injectable, Logger } from '@nestjs/common';
import { TriperoService } from 'tripero-node/nestjs';

interface GpsData {
  imei: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  altitude: number;
  acc: boolean; // ignition
  tenantId?: string;
  clientId?: string;
  fleetId?: string;
}

@Injectable()
export class PositionService {
  private readonly logger = new Logger(PositionService.name);

  constructor(private readonly tripero: TriperoService) {}

  /**
   * Handle incoming GPS data from a tracker
   */
  async handleGpsData(data: GpsData): Promise<void> {
    this.logger.debug(`Processing GPS data from ${data.imei}`);

    await this.tripero.publishPosition({
      deviceId: data.imei,
      timestamp: Date.now(),
      latitude: data.lat,
      longitude: data.lon,
      speed: data.speed,
      heading: data.heading,
      altitude: data.altitude,
      ignition: data.acc,
      metadata: {
        tenant_id: data.tenantId,
        client_id: data.clientId,
        fleet_id: data.fleetId,
      },
    });

    this.logger.debug(`Published position for ${data.imei}`);
  }

  /**
   * Handle ignition state change
   */
  async handleIgnitionChange(
    deviceId: string,
    ignition: boolean,
    lat: number,
    lon: number,
  ): Promise<void> {
    this.logger.log(`Ignition ${ignition ? 'ON' : 'OFF'} for ${deviceId}`);

    await this.tripero.publishIgnitionEvent({
      deviceId,
      timestamp: Date.now(),
      ignition,
      latitude: lat,
      longitude: lon,
    });
  }

  /**
   * Get current status of a vehicle
   */
  async getVehicleStatus(deviceId: string) {
    if (!this.tripero.hasHttpClient) {
      throw new Error('HTTP client not configured');
    }

    return this.tripero.getTrackerStatus(deviceId);
  }

  /**
   * Get trip history for a vehicle
   */
  async getVehicleTrips(deviceId: string, fromDate: Date, toDate: Date) {
    if (!this.tripero.hasHttpClient) {
      throw new Error('HTTP client not configured');
    }

    return this.tripero.getTrips({
      deviceId,
      from: fromDate,
      to: toDate,
    });
  }

  /**
   * Sync odometer with vehicle's real odometer
   */
  async syncOdometer(deviceId: string, realOdometerMeters: number) {
    if (!this.tripero.hasHttpClient) {
      throw new Error('HTTP client not configured');
    }

    return this.tripero.setOdometer(
      deviceId,
      realOdometerMeters,
      'dashboard_sync',
    );
  }
}
