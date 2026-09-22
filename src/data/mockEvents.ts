import { CalendarEvent, UserPreferences, CommuteNotification, TransportMode } from '../types';

export const defaultPreferences: UserPreferences = {
  originAddress: "King's Cross St. Pancras Station, Euston Rd, London N1 9AL, UK",
  originLat: 51.5309,
  originLng: -0.1233,
  modePreferences: ['transit', 'driving', 'bicycling', 'walking'],
  buffers: {
    driving: 10,    // 10 min buffer for London congestion & parking
    transit: 8,     // 8 min buffer for TfL Tube/Bus interchange
    bicycling: 5,   // 5 min buffer for Santander Cycles locking
    walking: 2,     // 2 min buffer
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '07:00',
  },
  notificationThresholds: {
    headsUpMinutes: 60,
    leaveByDeltaMinutes: 2,
  },
  calendarSyncEnabled: true,
  googleCalendarConnected: true,
  trafficPollIntervalMinutes: 5,
};

export const LONDON_SAMPLE_EVENTS = (now: Date = new Date()): CalendarEvent[] => {
  const event1Start = new Date(now.getTime() + 90 * 60 * 1000);
  const event1End = new Date(event1Start.getTime() + 60 * 60 * 1000);

  const event2Start = new Date(now.getTime() + 270 * 60 * 1000);
  const event2End = new Date(event2Start.getTime() + 90 * 60 * 1000);

  const event3Start = new Date(now);
  event3Start.setDate(event3Start.getDate() + 1);
  event3Start.setHours(10, 0, 0, 0);
  const event3End = new Date(event3Start);
  event3End.setHours(11, 30, 0, 0);

  const event4Start = new Date(now);
  event4Start.setDate(event4Start.getDate() + 1);
  event4Start.setHours(14, 30, 0, 0);
  const event4End = new Date(event4Start);
  event4End.setHours(15, 30, 0, 0);

  return [
    {
      id: 'lon-1',
      title: 'Q3 Executive Review @ Canary Wharf',
      location: 'One Canada Square, Canary Wharf, London E14 5AB, UK',
      parsedDestination: 'One Canada Square, London',
      lat: 51.5049,
      lng: -0.0195,
      startTime: event1Start.toISOString(),
      endTime: event1End.toISOString(),
      category: 'work',
      color: '#0284c7',
      notes: 'Meeting on 28th floor. Remember visitor pass QR code.',
      isSynced: true,
      selectedMode: 'transit',
      recommendedMode: 'transit',
      aiSummary: 'Elizabeth Line from King’s Cross / Farringdon is 14 mins fast transit. Avoid Congestion Charge (£15).',
    },
    {
      id: 'lon-2',
      title: 'Client Lunch @ The Shard',
      location: 'Hutong, The Shard, 31 St Thomas St, London SE1 9RY, UK',
      parsedDestination: 'The Shard, London Bridge',
      lat: 51.5045,
      lng: -0.0865,
      startTime: event2Start.toISOString(),
      endTime: event2End.toISOString(),
      category: 'social',
      color: '#10b981',
      notes: 'Table reserved under Tech Commute Team.',
      isSynced: true,
      selectedMode: 'transit',
      recommendedMode: 'transit',
      aiSummary: 'Direct Northern Line southbound to London Bridge (11 mins). 2 min walk from station.',
    },
    {
      id: 'lon-3',
      title: 'NHS Specialist Consultation',
      location: "St Thomas' Hospital, Westminster Bridge Rd, London SE1 7EH, UK",
      parsedDestination: "St Thomas' Hospital, Westminster",
      lat: 51.4988,
      lng: -0.1186,
      startTime: event3Start.toISOString(),
      endTime: event3End.toISOString(),
      category: 'health',
      color: '#ec4899',
      notes: 'Bring NHS medical records & appointment letter.',
      isSynced: true,
      selectedMode: 'transit',
      recommendedMode: 'transit',
      aiSummary: 'Victoria Line to Green Park then Jubilee Line to Westminster. Scenic walk across Westminster Bridge.',
    },
    {
      id: 'lon-4',
      title: 'Global Tech Summit @ O2 Arena',
      location: 'The O2 Arena, Peninsula Square, London SE10 0DX, UK',
      parsedDestination: 'The O2 Arena, Greenwich',
      lat: 51.503,
      lng: 0.0032,
      startTime: event4Start.toISOString(),
      endTime: event4End.toISOString(),
      category: 'work',
      color: '#8b5cf6',
      notes: 'Keynote presentation starts at 2:45 PM in Main Auditorium.',
      isSynced: false,
      selectedMode: 'transit',
      recommendedMode: 'transit',
      aiSummary: 'Jubilee Line directly to North Greenwich station (3 min walk to entrance).',
    },
  ];
};

export const SF_SAMPLE_EVENTS = (now: Date = new Date()): CalendarEvent[] => {
  const event1Start = new Date(now.getTime() + 90 * 60 * 1000);
  const event1End = new Date(event1Start.getTime() + 60 * 60 * 1000);

  const event2Start = new Date(now.getTime() + 270 * 60 * 1000);
  const event2End = new Date(event2Start.getTime() + 90 * 60 * 1000);

  const event3Start = new Date(now);
  event3Start.setDate(event3Start.getDate() + 1);
  event3Start.setHours(10, 0, 0, 0);

  const event4Start = new Date(now);
  event4Start.setDate(event4Start.getDate() + 1);
  event4Start.setHours(14, 30, 0, 0);

  return [
    {
      id: 'evt-1',
      title: 'Q3 Product Strategy Sync',
      location: 'Salesforce Tower, 415 Mission St, San Francisco, CA',
      parsedDestination: '415 Mission St, San Francisco',
      lat: 37.7897,
      lng: -122.3972,
      startTime: event1Start.toISOString(),
      endTime: event1End.toISOString(),
      category: 'work',
      color: '#3b82f6',
      notes: 'Bring slide deck and updated roadmap KPIs.',
      isSynced: true,
      selectedMode: 'transit',
      recommendedMode: 'transit',
      aiSummary: 'Transit is fastest & avoids $42 parking fees near Mission St. Express Bus 38R departs in 12 mins.',
    },
    {
      id: 'evt-2',
      title: 'Client Lunch @ Waterbar',
      location: '399 The Embarcadero, San Francisco, CA 94105',
      parsedDestination: '399 The Embarcadero, San Francisco',
      lat: 37.7905,
      lng: -122.3892,
      startTime: event2Start.toISOString(),
      endTime: event2End.toISOString(),
      category: 'social',
      color: '#10b981',
      notes: 'Table booked under Commute Team.',
      isSynced: true,
      selectedMode: 'walking',
      recommendedMode: 'walking',
      aiSummary: 'Short 12-minute scenic walk along the Embarcadero waterfront. No traffic risks.',
    },
  ];
};

export function getSampleEvents(): CalendarEvent[] {
  return [];
}

export const initialNotifications: CommuteNotification[] = [];

