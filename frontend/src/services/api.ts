import type { Classification, EmergencyType, Facility, RankedFacility, Session } from '../types';

export class ApiError extends Error {}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) } });
  } catch {
    throw new ApiError('Cannot reach RapidCare servers. Check your connection, or call emergency services directly.');
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(body?.error ?? 'Request failed. Please try again.');
  return body as T;
}
const json = (method: string, data?: unknown): RequestInit => ({ method, body: data ? JSON.stringify(data) : undefined });

export const api = {
  classify: (text: string) => request<Classification>('/ai/classify-emergency', json('POST', { text })),
  nearby: (lat: number, lon: number, type: EmergencyType) => request<{ results: RankedFacility[]; distanceNote: string }>(`/facilities/nearby?lat=${lat}&lon=${lon}&type=${type}`),
  createEmergency: (d: { emergencyType: EmergencyType; latitude: number; longitude: number; voiceInput?: string }) => request<Session>('/emergency', json('POST', d)),
  selectFacility: (id: string, facilityId: string) => request<{ session: Session; label: string }>(`/emergency/${id}/select-facility`, json('POST', { facilityId })),
  updateEmergency: (id: string, status: string) => request<Session>(`/emergency/${id}`, json('PUT', { status })),
  share: (id: string) => request<{ url: string }>(`/emergency/${id}/share`, json('POST')),
  login: (email: string, password: string) => request<{ token: string; user: AuthUser }>('/auth/login', json('POST', { email, password })),
  register: (name: string, email: string, password: string) => request<{ token: string; user: AuthUser }>('/auth/register', json('POST', { name, email, password })),
  shared: (token: string) => request<{ emergencyType: string; status: string; approxLatitude: number; approxLongitude: number; facility: { name: string; phone: string } | null; updatedAt: string }>(`/emergency/shared/${token}`),
  facilities: () => request<Facility[]>('/facilities'),
  createFacility: (d: Record<string, unknown>) => request<Facility>('/facilities', json('POST', d)),
  deleteFacility: (id: string) => request<null>(`/facilities/${id}`, json('DELETE')),
  updateResources: (id: string, d: Record<string, unknown>) => request<unknown>(`/facilities/${id}/resources`, json('PUT', d)),
  dashboard: () => request<Dashboard>('/admin/dashboard'),
  notifications: () => request<Notification[]>('/notifications'),
  updateNotification: (id: string, status: string) => request<unknown>(`/notifications/${id}`, json('PUT', { status })),
};
export interface AuthUser { id: string; name: string; role: 'PATIENT' | 'FACILITY' | 'ADMIN'; facilityId?: string | null }
export interface Notification { id: string; status: string; distanceKm: number | null; createdAt: string; session: { emergencyType: string; status: string; latitude: number; longitude: number } }
export interface Dashboard { totalFacilities: number; activeEmergencies: number; emergencyFacilities: number; unconfirmedResources: number; todaySessions: number; byType: { emergencyType: string; _count: number }[]; byStatus: { status: string; _count: number }[]; recent: { id: string; emergencyType: string; status: string; createdAt: string; selectedFacility: { name: string } | null }[] }
