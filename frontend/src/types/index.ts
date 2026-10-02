export type EmergencyType = 'SNAKE_BITE' | 'INSECT_STING' | 'OTHER';
export interface Resource { emergencyAvailable: boolean; snakeBiteTreatment: boolean; insectStingTreatment: boolean; antivenomAvailable: boolean | null; emergencyEquipmentAvailable: boolean; updatedAt: string }
export interface Facility { id: string; name: string; type: string; address: string; latitude: number; longitude: number; phone: string; open24x7: boolean; currentStatus: string; isDemo: boolean; lastUpdated: string; resource: Resource | null }
export interface RankedFacility { facility: Facility; distanceKm: number; score: number; reasons: string[]; warnings: string[]; dataStale: boolean }
export interface Session { id: string; emergencyType: EmergencyType; status: string; latitude: number; longitude: number; selectedFacilityId: string | null }
export interface Classification { emergencyType: EmergencyType; confidence: number; requiresEmergencyCare: boolean }
