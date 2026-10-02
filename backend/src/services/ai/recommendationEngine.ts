import { haversineKm } from '../../utils/geo';
import type { EmergencyType } from './emergencyClassifier';

export interface FacilityInput {
  id: string; name: string; type: string; latitude: number; longitude: number;
  open24x7: boolean; currentStatus: string; lastUpdated: Date;
  resource: null | {
    emergencyAvailable: boolean; snakeBiteTreatment: boolean; insectStingTreatment: boolean;
    antivenomAvailable: boolean | null; emergencyEquipmentAvailable: boolean; updatedAt: Date;
  };
}

export interface RankedFacility {
  facility: FacilityInput;
  distanceKm: number;   // straight-line, not road distance
  score: number;        // ranking aid only, not medical certainty
  reasons: string[];
  warnings: string[];
  dataStale: boolean;
}

const STALE_HOURS = 24;

export function rankFacilities(
  facilities: FacilityInput[], lat: number, lon: number, type: EmergencyType, now = new Date(),
): RankedFacility[] {
  return facilities.map((facility) => {
    const r = facility.resource;
    const distanceKm = haversineKm(lat, lon, facility.latitude, facility.longitude);
    const reasons: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    if (r?.emergencyAvailable) { score += 25; reasons.push('Emergency care'); }
    else warnings.push('Emergency care not confirmed');

    const treats = type === 'SNAKE_BITE' ? r?.snakeBiteTreatment : type === 'INSECT_STING' ? r?.insectStingTreatment : false;
    if (treats) { score += 25; reasons.push(type === 'SNAKE_BITE' ? 'Snake-bite treatment' : 'Insect-sting treatment'); }

    if (type === 'SNAKE_BITE') {
      if (r?.antivenomAvailable === true) { score += 20; reasons.push('Antivenom availability reported'); }
      else warnings.push('Antivenom availability not confirmed');
    }
    if (r?.emergencyEquipmentAvailable) score += 5;
    if (facility.open24x7) { score += 10; reasons.push('Open 24/7'); }
    if (facility.currentStatus !== 'OPEN') { score -= 30; warnings.push(`Status: ${facility.currentStatus}`); }
    score += Math.max(0, 15 - distanceKm * 0.5);

    const updated = r?.updatedAt ?? facility.lastUpdated;
    const dataStale = (now.getTime() - updated.getTime()) / 36e5 > STALE_HOURS;
    if (dataStale) warnings.push('Availability information may be outdated. Please call the facility before travelling when possible.');

    return { facility, distanceKm: Number(distanceKm.toFixed(2)), score: Math.round(score), reasons, warnings, dataStale };
  }).sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);
}
