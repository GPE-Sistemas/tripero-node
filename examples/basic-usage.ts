/**
 * Basic usage example for tripero-node
 *
 * This example shows how to:
 * - Connect to Tripero via Redis
 * - Publish GPS positions
 * - Subscribe to trip events
 */

import { TriperoClient } from '@gpe-sistemas/tripero-node';

async function main() {
  // Create client with Redis configuration
  const tripero = new TriperoClient({
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      keyPrefix: 'tripero:', // Must match Tripero server config
    },
    options: {
      logLevel: 'debug',
    },
  });

  // Connect to Redis
  await tripero.connect();
  console.log('Connected to Tripero Redis');

  // Check health
  const health = await tripero.health();
  console.log('Health:', health);

  // Register event handlers BEFORE subscribing
  tripero.on('trip:started', (event) => {
    console.log('\n🚗 TRIP STARTED');
    console.log(`   Trip ID: ${event.tripId}`);
    console.log(`   Device: ${event.deviceId}`);
    console.log(`   Start: ${event.startTime}`);
    console.log(`   Location: ${event.startLocation.coordinates}`);
  });

  tripero.on('trip:completed', (event) => {
    console.log('\n🏁 TRIP COMPLETED');
    console.log(`   Trip ID: ${event.tripId}`);
    console.log(`   Duration: ${event.duration}s`);
    console.log(`   Distance: ${event.distance}m (${(event.distance / 1000).toFixed(2)}km)`);
    console.log(`   Avg Speed: ${event.avgSpeed} km/h`);
    console.log(`   Max Speed: ${event.maxSpeed} km/h`);
    console.log(`   Stops: ${event.stopsCount}`);
  });

  tripero.on('stop:started', (event) => {
    console.log('\n⏸️  STOP STARTED');
    console.log(`   Stop ID: ${event.stopId}`);
    console.log(`   Reason: ${event.reason}`);
    console.log(`   Location: ${event.location.coordinates}`);
  });

  tripero.on('tracker:state:changed', (event) => {
    console.log(`\n🔄 STATE CHANGE: ${event.previousState} → ${event.currentState}`);
    console.log(`   Odometer: ${event.odometer.totalKm} km`);
  });

  // Start listening to events
  await tripero.subscribe();
  console.log('Subscribed to Tripero events');

  // Simulate publishing positions
  console.log('\nPublishing test positions...');

  const deviceId = 'TEST-VEHICLE-001';
  const baseLocation = { lat: -34.6037, lon: -58.3816 };

  // Simulate a vehicle starting to move
  for (let i = 0; i < 10; i++) {
    await tripero.publishPosition({
      deviceId,
      timestamp: Date.now(),
      latitude: baseLocation.lat + i * 0.001,
      longitude: baseLocation.lon + i * 0.001,
      speed: i === 0 ? 0 : 30 + Math.random() * 20,
      ignition: true,
      heading: 45,
      metadata: {
        tenant_id: 'demo-tenant',
        fleet_id: 'demo-fleet',
      },
    });

    console.log(`Published position ${i + 1}/10`);
    await sleep(1000);
  }

  // Keep the process running to receive events
  console.log('\nWaiting for events... Press Ctrl+C to exit');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await tripero.unsubscribe();
    await tripero.disconnect();
    console.log('Disconnected');
    process.exit(0);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
