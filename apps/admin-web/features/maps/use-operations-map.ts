'use client';

import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

export type OpsMapData = {
  fleet: {
    riders: Array<{
      id: string;
      name: string;
      status: string;
      location: { lat: number; lng: number } | null;
      currentDelivery: { orderId: string; orderNumber: string } | null;
    }>;
    stats: {
      onlineRiders: number;
      busyRiders: number;
      unassignedOrders: number;
      activeOrders: number;
    };
  };
  stores: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    deliveryRadiusKm: number;
    locality: string | null;
  }>;
  zones: Array<{
    id: string;
    name: string;
    centerLat: number;
    centerLng: number;
    radiusKm: number;
  }>;
  unassignedOrders: Array<{
    id: string;
    orderNumber: string;
    deliveryLat: number;
    deliveryLng: number;
  }>;
  franchiseTerritories?: Array<{
    id: string;
    city: string;
    state: string;
    exclusivityEnabled: boolean;
    color: string;
    franchise: { id: string; businessName: string };
  }>;
  riderClusters?: Array<{
    id: string;
    city: string;
    locality: string;
    demandSupplyRatio: number;
    color: string;
  }>;
  fleetAlerts?: Array<{ id: string; message: string; alertType?: string }>;
  batchRoutes?: Array<{ id: string; riderName: string; status: string; orders: string[] }>;
  activeDeliveries: Array<{
    riderId: string;
    riderName: string;
    lat: number;
    lng: number;
    order: { orderId: string; orderNumber: string };
  }>;
  updatedAt: string;
};

export function useOperationsMapQuery(refetchInterval = 30_000) {
  return useQuery({
    queryKey: ['admin', 'ops-map'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: OpsMapData }>(
        '/api/admin/geo/operations-map',
      );
      return res.data;
    },
    refetchInterval,
  });
}
