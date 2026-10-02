import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, FacilityType } from '@prisma/client';
const prisma = new PrismaClient();
const ago = (h: number) => new Date(Date.now() - h * 3600_000);

// FICTIONAL DEMO DATA - not real or verified facilities. antivenom: true / false / null (unknown)
const F: [string, FacilityType, number, number, boolean, boolean, boolean, boolean | null, boolean, string, number][] = [
  // name, type, lat, lon, emergency, snake, insect, antivenom, open24x7, status, hoursSinceUpdate
  ['Demo District Government Hospital', 'GOVERNMENT_HOSPITAL', 13.0827, 80.2707, true, true, true, true, true, 'OPEN', 0.2],
  ['Demo Taluk Government Hospital', 'GOVERNMENT_HOSPITAL', 12.9716, 80.0450, true, true, true, null, true, 'OPEN', 5],
  ['Demo Village PHC - Alpha', 'PHC', 13.1500, 80.1100, false, false, true, false, false, 'OPEN', 30],
  ['Demo Village PHC - Beta', 'PHC', 12.8800, 80.2200, true, true, true, true, true, 'OPEN', 1],
  ['Demo Rural PHC - Gamma', 'PHC', 13.2400, 80.3300, false, false, false, null, false, 'CLOSED', 72],
  ['Demo City Private Hospital', 'PRIVATE_HOSPITAL', 13.0600, 80.2500, true, true, true, null, true, 'OPEN', 8],
  ['Demo Green Valley Private Hospital', 'PRIVATE_HOSPITAL', 12.9200, 80.1500, true, false, true, false, true, 'BUSY', 2],
  ['Demo Highway Emergency Care Centre', 'EMERGENCY_CARE_CENTRE', 13.0100, 80.0800, true, true, true, true, true, 'OPEN', 0.5],
  ['Demo Riverside Emergency Care Centre', 'EMERGENCY_CARE_CENTRE', 13.1900, 80.2000, true, true, false, null, false, 'OPEN', 26],
  ['Demo Hillside Community PHC', 'PHC', 12.8300, 80.0700, true, false, true, false, false, 'OPEN', 12],
];

async function main() {
  const pw = await bcrypt.hash(process.env.DEMO_PASSWORD ?? 'Demo@12345', 10);
  await prisma.emergencyNotification.deleteMany(); await prisma.locationHistory.deleteMany();
  await prisma.emergencySession.deleteMany(); await prisma.user.deleteMany(); await prisma.facility.deleteMany();
  const created = [];
  for (const [name, type, latitude, longitude, em, snake, insect, av, open24x7, currentStatus, hrs] of F) {
    created.push(await prisma.facility.create({ data: { name, type, address: `${name}, demo address`, latitude, longitude, phone: '+91-00000-00000', open24x7, currentStatus, isDemo: true, lastUpdated: ago(hrs),
      resource: { create: { emergencyAvailable: em, snakeBiteTreatment: snake, insectStingTreatment: insect, antivenomAvailable: av, antivenomLastUpdated: av === null ? null : ago(hrs), emergencyEquipmentAvailable: em, updatedBy: 'seed' } } } }));
  }
  await prisma.user.createMany({ data: [
    { name: 'Demo Admin', email: 'admin@rapidcare.demo', passwordHash: pw, role: 'ADMIN' },
    { name: 'Demo Patient', email: 'patient@rapidcare.demo', passwordHash: pw, role: 'PATIENT' },
    { name: 'Demo Facility Staff', email: 'facility@rapidcare.demo', passwordHash: pw, role: 'FACILITY', facilityId: created[0].id },
  ] });
  const types = ['SNAKE_BITE', 'INSECT_STING'] as const;
  const statuses = ['RESOLVED', 'RESOLVED', 'ACTIVE', 'CANCELLED'] as const;
  for (let i = 0; i < 6; i++) {
    await prisma.emergencySession.create({ data: { emergencyType: types[i % 2], latitude: 13.0 + i * 0.02, longitude: 80.1 + i * 0.02, status: statuses[i % 4],
      selectedFacilityId: created[i].id, notes: 'DEMO SESSION', createdAt: ago(i * 20) } });
  }
  console.log('Seeded 10 DEMO facilities, 3 demo users, 6 demo sessions.');
}
main().finally(() => prisma.$disconnect());
