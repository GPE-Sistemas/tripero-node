import 'reflect-metadata';

/**
 * Metadata key para almacenar información de handlers de eventos
 */
export const TRIPERO_EVENT_HANDLER = Symbol('tripero:event:handler');

export interface TriperoEventMetadata {
  eventType: string;
  methodName: string | symbol;
}

/**
 * Decorador para marcar un método como handler de evento trip:started
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class TripListenerService {
 *   @OnTripStarted()
 *   handleTripStarted(event: TripStartedEvent) {
 *     console.log(`Trip iniciado: ${event.tripId}`);
 *   }
 * }
 * ```
 */
export function OnTripStarted(): MethodDecorator {
  return createEventDecorator('trip:started');
}

/**
 * Decorador para marcar un método como handler de evento trip:completed
 */
export function OnTripCompleted(): MethodDecorator {
  return createEventDecorator('trip:completed');
}

/**
 * Decorador para marcar un método como handler de evento stop:started
 */
export function OnStopStarted(): MethodDecorator {
  return createEventDecorator('stop:started');
}

/**
 * Decorador para marcar un método como handler de evento stop:completed
 */
export function OnStopCompleted(): MethodDecorator {
  return createEventDecorator('stop:completed');
}

/**
 * Decorador para marcar un método como handler de evento tracker:state:changed
 */
export function OnTrackerStateChanged(): MethodDecorator {
  return createEventDecorator('tracker:state:changed');
}

/**
 * Decorador para marcar un método como handler de evento position:rejected
 */
export function OnPositionRejected(): MethodDecorator {
  return createEventDecorator('position:rejected');
}

/**
 * Decorador genérico para cualquier evento de Tripero
 */
export function OnTriperoEvent(eventType: string): MethodDecorator {
  return createEventDecorator(eventType);
}

function createEventDecorator(eventType: string): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    // Obtener metadata existente o crear array vacío
    const existingHandlers: TriperoEventMetadata[] =
      Reflect.getMetadata(TRIPERO_EVENT_HANDLER, target.constructor) || [];

    // Agregar este handler
    existingHandlers.push({
      eventType,
      methodName: propertyKey,
    });

    // Guardar metadata actualizado
    Reflect.defineMetadata(
      TRIPERO_EVENT_HANDLER,
      existingHandlers,
      target.constructor,
    );

    return descriptor;
  };
}

/**
 * Obtiene todos los handlers de eventos registrados en una clase
 */
export function getTriperoEventHandlers(
  target: object,
): TriperoEventMetadata[] {
  return Reflect.getMetadata(TRIPERO_EVENT_HANDLER, target.constructor) || [];
}
