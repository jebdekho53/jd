export interface LiveTrackingData {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  deliveryStatus: string;
  store: { lat: number; lng: number; name: string };
  customer: { lat: number; lng: number; address: Record<string, unknown> };
  rider: {
    id: string;
    name: string;
    lat: number | null;
    lng: number | null;
    vehicleType: string | null;
  } | null;
  route: Array<{ lat: number; lng: number; recordedAt: string }>;
  eta: {
    estimatedMins: number | null;
    estimatedArrivalAt: string | null;
    etaAvailable: boolean;
    distanceKm: number | null;
    riderDistanceFromStoreKm: number | null;
    riderDistanceToCustomerKm: number | null;
  };
  trackingActive: boolean;
  progressStage: string;
  updatedAt: string;
}
