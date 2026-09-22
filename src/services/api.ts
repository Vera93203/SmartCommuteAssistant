import {
  CalendarEvent,
  UserPreferences,
  CommuteNotification,
  AICommuteAdvice,
  SystemSchema,
  TransportMode,
  TransitPreference,
  RouteOption,
} from '../types';

export async function calculateCommuteRoute(
  origin: string,
  destination: string,
  mode: TransportMode,
  departureTime?: string,
  transitPreference: TransitPreference = 'ANY',
  originCoordinates?: {lat:number;lng:number}
): Promise<RouteOption> {
  const res = await fetch('/api/route/calculate', {
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({origin,destination,mode,departureTime,transitPreference,originCoordinates})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Route calculation unavailable. Please retry.');
  return data;
}

export async function fetchEvents(): Promise<CalendarEvent[]> {
  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error('Failed to fetch events');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching events:', err);
    return [];
  }
}

export async function createEvent(eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return await res.json();
}

export async function updateEvent(id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const res = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) throw new Error('Failed to update event');
  return await res.json();
}

export async function deleteEvent(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/events/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete event');
  return await res.json();
}

export async function syncGoogleCalendar(): Promise<{ count: number; events: CalendarEvent[] }> {
  const res = await fetch('/api/events/sync', { method: 'POST' });
  if (!res.ok) throw new Error('Calendar sync failed');
  return await res.json();
}

export async function fetchPreferences(): Promise<UserPreferences> {
  try {
    const res = await fetch('/api/preferences');
    if (!res.ok) throw new Error('Failed to fetch preferences');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching preferences:', err);
    throw err;
  }
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const res = await fetch('/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Failed to update preferences');
  return await res.json();
}

export async function fetchNotifications(): Promise<CommuteNotification[]> {
  try {
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return await res.json();
  } catch (err) {
    console.warn('API error fetching notifications:', err);
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch('/api/notifications/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

export async function triggerTestNotification(): Promise<CommuteNotification> {
  const res = await fetch('/api/notifications/trigger-test', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger test alert');
  const data = await res.json();
  return data.notification;
}

export async function getAIRecommendation(eventId: string, mode?: TransportMode): Promise<AICommuteAdvice> {
  const res = await fetch('/api/ai/recommendation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, mode }),
  });
  if (!res.ok) throw new Error('Failed to fetch AI recommendation');
  return await res.json();
}

export async function askAIChat(userMessage: string, eventId?: string): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userMessage, eventId }),
  });
  if (!res.ok) throw new Error('Failed to chat with AI');
  const data = await res.json();
  return data.reply;
}

export async function fetchDatabaseSchema(): Promise<SystemSchema> {
  const res = await fetch('/api/schema');
  if (!res.ok) throw new Error('Failed to fetch schema');
  return await res.json();
}
