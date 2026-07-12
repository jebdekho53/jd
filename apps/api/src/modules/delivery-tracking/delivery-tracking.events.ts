export const TRACKING_EVENTS = {
  LOCATION_UPDATED: 'rider.location.updated',
  ORDER_LOCATION_UPDATED: 'order.location.updated',
  ETA_UPDATED: 'delivery.eta.updated',
  STARTED: 'delivery.started',
  ARRIVED: 'delivery.arrived',
  COMPLETED: 'delivery.completed',
  ORDER_STATUS: 'order.status.updated',
} as const;

export const FLEET_UPDATED_EVENT = 'fleet.updated';
