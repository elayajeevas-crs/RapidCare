import { describe, it, expect } from 'vitest';
import { classifyWithRules } from '../src/services/ai/emergencyClassifier';
import { haversineKm, isValidCoordinate } from '../src/utils/geo';
import { rankFacilities } from '../src/services/ai/recommendationEngine';

describe('classifier', () => {
  it('detects snake bite', () => expect(classifyWithRules('I think my brother got bitten by a snake').emergencyType).toBe('SNAKE_BITE'));
  it('detects insect sting', () => expect(classifyWithRules('stung by a wasp').emergencyType).toBe('INSECT_STING'));
  it('returns OTHER with zero confidence for unrelated text', () => {
    const r = classifyWithRules('hello there');
    expect(r.emergencyType).toBe('OTHER'); expect(r.confidence).toBe(0);
  });
});
describe('geo', () => {
  it('is ~0 for identical points', () => expect(haversineKm(13, 80, 13, 80)).toBeCloseTo(0));
  it('rejects bad coordinates', () => expect(isValidCoordinate(91, 0)).toBe(false));
});
describe('recommendation', () => {
  it('never marks unknown antivenom as available', () => {
    const f = { id: '1', name: 'A', type: 'PHC', latitude: 13, longitude: 80, open24x7: true, currentStatus: 'OPEN', lastUpdated: new Date(),
      resource: { emergencyAvailable: true, snakeBiteTreatment: true, insectStingTreatment: false, antivenomAvailable: null, emergencyEquipmentAvailable: false, updatedAt: new Date() } };
    const [r] = rankFacilities([f], 13.01, 80.01, 'SNAKE_BITE');
    expect(r.reasons).not.toContain('Antivenom availability reported');
    expect(r.warnings).toContain('Antivenom availability not confirmed');
  });
});
