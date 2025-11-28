/**
 * Example using both Redis and HTTP API
 *
 * This example shows how to:
 * - Use the HTTP API to query tracker status
 * - Get trip and stop reports
 * - Configure odometer
 */

import { TriperoClient } from '@gpe-sistemas/tripero-node';

async function main() {
  // Create client with both Redis and HTTP configuration
  const tripero = new TriperoClient({
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    http: {
      baseUrl: process.env.TRIPERO_HTTP_URL || 'http://localhost:3001',
      timeout: 10000,
    },
    options: {
      logLevel: 'info',
    },
  });

  await tripero.connect();
  console.log('Connected to Tripero\n');

  const deviceId = 'VEHICLE-001';

  // 1. Check HTTP API health
  console.log('=== HTTP API Health ===');
  try {
    const health = await tripero.healthHttp();
    console.log('Status:', health.status);
    console.log('Services:', health.services);
  } catch (error) {
    console.log('HTTP API not available (this is optional)');
  }

  // 2. Get tracker status
  console.log('\n=== Tracker Status ===');
  try {
    const status = await tripero.getTrackerStatus(deviceId);
    if (status.success) {
      const { data } = status;
      console.log(`Device: ${data.deviceId}`);
      console.log(`State: ${data.currentState.state}`);
      console.log(`Odometer: ${data.odometer.totalKm} km`);
      console.log(`Last seen: ${data.lastPosition.timestamp}`);
      console.log(`Health: ${data.health.status}`);

      if (data.currentTrip) {
        console.log('\nActive Trip:');
        console.log(`  ID: ${data.currentTrip.tripId}`);
        console.log(`  Duration: ${data.currentTrip.duration}s`);
        console.log(`  Distance: ${data.currentTrip.distance}m`);
      }
    }
  } catch (error) {
    console.log(`Tracker ${deviceId} not found or error:`, error);
  }

  // 3. Get trip history
  console.log('\n=== Trip History (Last 7 days) ===');
  try {
    const trips = await tripero.getTrips({
      deviceId,
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      to: new Date(),
    });

    console.log(`Found ${trips.length} trips`);
    trips.slice(0, 5).forEach((trip, i) => {
      console.log(`\nTrip ${i + 1}:`);
      console.log(`  Start: ${trip.startTime}`);
      console.log(`  End: ${trip.endTime}`);
      console.log(`  Distance: ${trip.distance}m`);
      console.log(`  Duration: ${trip.duration}s`);
      console.log(`  Avg Speed: ${trip.averageSpeed} km/h`);
    });
  } catch (error) {
    console.log('Could not fetch trips:', error);
  }

  // 4. Get stop history
  console.log('\n=== Stop History (Last 7 days) ===');
  try {
    const stops = await tripero.getStops({
      deviceId,
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(),
    });

    console.log(`Found ${stops.length} stops`);
    stops.slice(0, 5).forEach((stop, i) => {
      console.log(`\nStop ${i + 1}:`);
      console.log(`  Start: ${stop.startTime}`);
      console.log(`  Duration: ${stop.duration}s`);
      console.log(`  Location: ${stop.latitude}, ${stop.longitude}`);
    });
  } catch (error) {
    console.log('Could not fetch stops:', error);
  }

  // 5. Set odometer (example - commented out to avoid accidental changes)
  // console.log('\n=== Set Odometer ===');
  // const result = await tripero.setOdometer(deviceId, 125000000, 'vehicle_sync');
  // console.log('Odometer set:', result);

  await tripero.disconnect();
  console.log('\nDisconnected');
}

main().catch(console.error);
