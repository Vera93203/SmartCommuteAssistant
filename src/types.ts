/**
 * Smart Commute Assistant - Core Data Types
 */

export type TransitPreference = 'ANY' | 'BUS' | 'RAIL' | 'SUBWAY' | 'TRAIN' | 'LIGHT_RAIL';

export type TransportMode = 'driving' | 'transit' | 'bicycling' | 'walking';

export type TrafficStatus = 'clear' | 'moderate' | 'heavy' | 'blocked' | 'unknown';

export type EventCategory = 'work' | 'personal' | 'health' | 'flight' | 'social';

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  mode: TransportMode;
  transitVehicle?: string;
  transitVehicleCode?: string;
  lineName?: string;
  vehicleType?: 'bus' | 'train' | 'subway' | 'walk' | 'car' | 'bike';
  departureStop?: string;
  arrivalStop?: string;
  departureTime?: string;
  arrivalTime?: string;
}

export interface RouteOption {
  transitPreference?: TransitPreference;
  dataSource?: string;
  encodedPolyline?: string;
  mode: TransportMode;
  durationMinutes: number;
  distanceKm: number;
  costEstimate: string;
  co2Kg: number;
  trafficDelayMinutes: number;
  trafficStatus: TrafficStatus;
  leaveByTime: string; // ISO string
  etaTime: string; // ISO string
  bufferMinutes: number;
  steps: RouteStep[];
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  location: string;
  parsedDestination: string;
  lat?: number;
  lng?: number;
  startTime: string; // ISO string
  endTime: string; // ISO string
  category: EventCategory;
  color?: string;
  notes?: string;
  isSynced?: boolean;
  selectedMode?: TransportMode;
  routeOptions?: Record<TransportMode, RouteOption>;
  recommendedMode?: TransportMode;
  aiSummary?: string;
}

export interface UserPreferences {
  originAddress: string;
  originUsesCoordinates?: boolean;
  originLat: number;
  originLng: number;
  modePreferences: TransportMode[];
  buffers: Record<TransportMode, number>; // minutes
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
  notificationThresholds: {
    headsUpMinutes: number;
    leaveByDeltaMinutes: number;
  };
  calendarSyncEnabled: boolean;
  googleCalendarConnected: boolean;
  trafficPollIntervalMinutes: number;
}

export interface CommuteNotification {
  id: string;
  eventId: string;
  eventTitle: string;
  type: 'heads_up' | 'leave_now' | 'live_update' | 'delay_warning';
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  mode: TransportMode;
  leaveByTime: string;
  deltaMinutes?: number;
}

export interface AICommuteAdvice {
  source?: string;
  eventTitle: string;
  recommendedMode: TransportMode;
  leaveByTime: string;
  reasoning: string;
  trafficWarning?: string;
  weatherImpact?: string;
  alternativeOption?: string;
}

export interface LocationSuggestion {
  displayName: string;
  address: string;
  city?: string;
  postcode?: string;
  country?: string;
  lat: number;
  lng: number;
  type?: 'postcode' | 'landmark' | 'address' | 'city';
}

export interface SystemSchema {
  tables: Array<{
    name: string;
    description: string;
    sql: string;
  }>;
  architecture: {
    syncEngine: string;
    routeEngine: string;
    notificationEngine: string;
  };
}
