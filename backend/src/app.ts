import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from './db';
import { HttpError, errorHandler, optionalAuth, requireAuth, requireRole, signToken } from './middleware';
import { classifyEmergency } from './services/ai/emergencyClassifier';
import { rankFacilities } from './services/ai/recommendationEngine';
import { haversineKm } from './utils/geo';

const h = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);
const lat = z.number().min(-90).max(90);
const lon = z.number().min(-180).max(180);
const audit = (actorId: string | undefined, action: string, entity: string, entityId?: string) =>
  prisma.auditLog.create({ data: { actorId, action, entity, entityId } }).catch(() => undefined);

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '50kb' }));
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, limit: 50 }));
  app.use(optionalAuth);

  // ---- Auth ----
  const cred = z.object({ email: z.string().email(), password: z.string().min(8) });
  app.post('/api/auth/register', h(async (req, res) => {
    const b = cred.extend({ name: z.string().min(1).max(80) }).parse(req.body);
    if (await prisma.user.findUnique({ where: { email: b.email } })) throw new HttpError(409, 'An account with this email already exists.');
    const u = await prisma.user.create({ data: { name: b.name, email: b.email, passwordHash: await bcrypt.hash(b.password, 10), role: 'PATIENT' } });
    res.status(201).json({ token: signToken({ id: u.id, role: u.role }), user: { id: u.id, name: u.name, role: u.role } });
  }));
  app.post('/api/auth/login', h(async (req, res) => {
    const b = cred.parse(req.body);
    const u = await prisma.user.findUnique({ where: { email: b.email } });
    if (!u || !(await bcrypt.compare(b.password, u.passwordHash))) throw new HttpError(401, 'Invalid email or password.');
    res.json({ token: signToken({ id: u.id, role: u.role, facilityId: u.facilityId }), user: { id: u.id, name: u.name, role: u.role, facilityId: u.facilityId } });
  }));

  // ---- AI ----
  app.post('/api/ai/classify-emergency', h(async (req, res) => {
    const { text } = z.object({ text: z.string().min(1).max(500) }).parse(req.body);
    res.json(await classifyEmergency(text));
  }));

  // ---- Facilities ----
  const facilityBody = z.object({
    name: z.string().min(2), type: z.enum(['GOVERNMENT_HOSPITAL', 'PHC', 'PRIVATE_HOSPITAL', 'EMERGENCY_CARE_CENTRE']),
    address: z.string().min(2), latitude: lat, longitude: lon, phone: z.string().min(3),
    open24x7: z.boolean().default(false), currentStatus: z.enum(['OPEN', 'BUSY', 'CLOSED']).default('OPEN'),
  });
  const resourceBody = z.object({
    emergencyAvailable: z.boolean(), snakeBiteTreatment: z.boolean(), insectStingTreatment: z.boolean(),
    antivenomAvailable: z.boolean().nullable(), emergencyEquipmentAvailable: z.boolean(),
  }).partial();

  app.get('/api/facilities/nearby', h(async (req, res) => {
    const q = z.object({ lat: z.coerce.number().min(-90).max(90), lon: z.coerce.number().min(-180).max(180),
      type: z.enum(['SNAKE_BITE', 'INSECT_STING', 'OTHER']).default('SNAKE_BITE'), radiusKm: z.coerce.number().positive().max(500).default(100) }).parse(req.query);
    const all = await prisma.facility.findMany({ include: { resource: true } });
    const ranked = rankFacilities(all, q.lat, q.lon, q.type).filter((r) => r.distanceKm <= q.radiusKm);
    res.json({ count: ranked.length, distanceNote: 'Straight-line distance; road travel time not estimated.', results: ranked });
  }));
  app.get('/api/facilities', h(async (_req, res) => res.json(await prisma.facility.findMany({ include: { resource: true }, orderBy: { name: 'asc' } }))));
  app.get('/api/facilities/:id', h(async (req, res) => {
    const f = await prisma.facility.findUnique({ where: { id: req.params.id }, include: { resource: true } });
    if (!f) throw new HttpError(404, 'Facility not found.');
    res.json(f);
  }));
  app.post('/api/facilities', requireRole('ADMIN'), h(async (req, res) => {
    const b = facilityBody.parse(req.body);
    const f = await prisma.facility.create({ data: { ...b, isDemo: false, resource: { create: { updatedBy: req.user!.id } } }, include: { resource: true } });
    await audit(req.user!.id, 'CREATE', 'Facility', f.id);
    res.status(201).json(f);
  }));
  app.put('/api/facilities/:id', requireRole('ADMIN'), h(async (req, res) => {
    const f = await prisma.facility.update({ where: { id: req.params.id }, data: facilityBody.partial().parse(req.body) }).catch(() => { throw new HttpError(404, 'Facility not found.'); });
    await audit(req.user!.id, 'UPDATE', 'Facility', f.id);
    res.json(f);
  }));
  app.delete('/api/facilities/:id', requireRole('ADMIN'), h(async (req, res) => {
    await prisma.facility.delete({ where: { id: req.params.id } }).catch(() => { throw new HttpError(404, 'Facility not found.'); });
    await audit(req.user!.id, 'DELETE', 'Facility', req.params.id);
    res.status(204).end();
  }));
  app.put('/api/facilities/:id/resources', requireRole('ADMIN', 'FACILITY'), h(async (req, res) => {
    if (req.user!.role === 'FACILITY' && req.user!.facilityId !== req.params.id) throw new HttpError(403, 'You can only update your own facility.');
    const b = resourceBody.parse(req.body);
    const data = { ...b, updatedBy: req.user!.id, ...('antivenomAvailable' in b ? { antivenomLastUpdated: new Date() } : {}) };
    const r = await prisma.facilityResource.upsert({ where: { facilityId: req.params.id }, update: data, create: { facilityId: req.params.id, ...data } })
      .catch(() => { throw new HttpError(404, 'Facility not found.'); });
    await prisma.facility.update({ where: { id: req.params.id }, data: { lastUpdated: new Date() } });
    await audit(req.user!.id, 'UPDATE_RESOURCES', 'Facility', req.params.id);
    res.json(r);
  }));

  // ---- Emergency sessions ----
  const STATUSES = ['ACTIVE', 'FACILITY_SELECTED', 'ROUTE_STARTED', 'FACILITY_NOTIFIED', 'RESOLVED', 'CANCELLED'] as const;
  app.post('/api/emergency', h(async (req, res) => {
    const b = z.object({ emergencyType: z.enum(['SNAKE_BITE', 'INSECT_STING', 'OTHER']).optional(), latitude: lat, longitude: lon,
      voiceInput: z.string().max(500).optional(), notes: z.string().max(500).optional() }).parse(req.body);
    const c = b.voiceInput ? await classifyEmergency(b.voiceInput) : null;
    const emergencyType = b.emergencyType ?? c?.emergencyType ?? 'OTHER';
    const s = await prisma.emergencySession.create({ data: { emergencyType, latitude: b.latitude, longitude: b.longitude, voiceInput: b.voiceInput,
      notes: b.notes, classificationConfidence: c?.confidence, userId: req.user?.id, locations: { create: { latitude: b.latitude, longitude: b.longitude } } } });
    res.status(201).json(s);
  }));
  app.get('/api/emergency/shared/:token', h(async (req, res) => {
    const s = await prisma.emergencySession.findUnique({ where: { shareToken: req.params.token }, include: { selectedFacility: true } });
    if (!s || !s.shareExpiresAt || s.shareExpiresAt < new Date()) throw new HttpError(404, 'This emergency link is invalid or has expired.');
    res.json({ emergencyType: s.emergencyType, status: s.status, approxLatitude: Number(s.latitude.toFixed(2)), approxLongitude: Number(s.longitude.toFixed(2)),
      facility: s.selectedFacility ? { name: s.selectedFacility.name, phone: s.selectedFacility.phone } : null, updatedAt: s.updatedAt });
  }));
  app.get('/api/emergency/:id', h(async (req, res) => {
    const s = await prisma.emergencySession.findUnique({ where: { id: req.params.id }, include: { selectedFacility: true, notifications: true } });
    if (!s) throw new HttpError(404, 'Emergency session not found.');
    res.json(s);
  }));
  app.put('/api/emergency/:id', h(async (req, res) => {
    const b = z.object({ status: z.enum(STATUSES).optional(), notes: z.string().max(500).optional(), latitude: lat.optional(), longitude: lon.optional() }).parse(req.body);
    const s = await prisma.emergencySession.update({ where: { id: req.params.id }, data: b }).catch(() => { throw new HttpError(404, 'Emergency session not found.'); });
    if (b.latitude !== undefined && b.longitude !== undefined) await prisma.locationHistory.create({ data: { sessionId: s.id, latitude: b.latitude, longitude: b.longitude } });
    res.json(s);
  }));
  app.post('/api/emergency/:id/select-facility', h(async (req, res) => {
    const { facilityId } = z.object({ facilityId: z.string() }).parse(req.body);
    const [s, f] = await Promise.all([prisma.emergencySession.findUnique({ where: { id: req.params.id } }), prisma.facility.findUnique({ where: { id: facilityId } })]);
    if (!s || !f) throw new HttpError(404, 'Emergency session or facility not found.');
    const distanceKm = Number(haversineKm(s.latitude, s.longitude, f.latitude, f.longitude).toFixed(2));
    const [updated, notification] = await prisma.$transaction([
      prisma.emergencySession.update({ where: { id: s.id }, data: { selectedFacilityId: f.id, status: 'FACILITY_NOTIFIED' } }),
      prisma.emergencyNotification.create({ data: { sessionId: s.id, facilityId: f.id, distanceKm } }), // etaMinutes left null: no routing data
    ]);
    res.json({ session: updated, notification, label: 'Prototype Emergency Notification (no real dispatch)' });
  }));
  app.post('/api/emergency/:id/share', h(async (req, res) => {
    const token = crypto.randomBytes(24).toString('hex');
    const s = await prisma.emergencySession.update({ where: { id: req.params.id }, data: { shareToken: token, shareExpiresAt: new Date(Date.now() + 2 * 3600_000) } })
      .catch(() => { throw new HttpError(404, 'Emergency session not found.'); });
    res.json({ url: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/emergency/share/${token}`, expiresAt: s.shareExpiresAt });
  }));

  // ---- Notifications ----
  app.get('/api/notifications', requireRole('ADMIN', 'FACILITY'), h(async (req, res) => {
    const where = req.user!.role === 'FACILITY' ? { facilityId: req.user!.facilityId ?? '' } : {};
    res.json(await prisma.emergencyNotification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50,
      include: { session: { select: { emergencyType: true, status: true, latitude: true, longitude: true } } } }));
  }));
  app.put('/api/notifications/:id', requireRole('ADMIN', 'FACILITY'), h(async (req, res) => {
    const { status } = z.object({ status: z.enum(['ACCEPTED', 'REJECTED', 'READY']) }).parse(req.body);
    const n = await prisma.emergencyNotification.findUnique({ where: { id: req.params.id } });
    if (!n) throw new HttpError(404, 'Notification not found.');
    if (req.user!.role === 'FACILITY' && req.user!.facilityId !== n.facilityId) throw new HttpError(403, 'Not your facility.');
    res.json(await prisma.emergencyNotification.update({ where: { id: n.id }, data: { status } }));
  }));

  // ---- Admin ----
  app.get('/api/admin/dashboard', requireRole('ADMIN'), h(async (_req, res) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [totalFacilities, activeEmergencies, emergencyFacilities, unconfirmed, todaySessions, byType, byStatus, recent] = await Promise.all([
      prisma.facility.count(),
      prisma.emergencySession.count({ where: { status: { in: ['ACTIVE', 'FACILITY_SELECTED', 'ROUTE_STARTED', 'FACILITY_NOTIFIED'] } } }),
      prisma.facilityResource.count({ where: { emergencyAvailable: true, facility: { currentStatus: 'OPEN' } } }),
      prisma.facilityResource.count({ where: { antivenomAvailable: null } }),
      prisma.emergencySession.count({ where: { createdAt: { gte: today } } }),
      prisma.emergencySession.groupBy({ by: ['emergencyType'], _count: true }),
      prisma.emergencySession.groupBy({ by: ['status'], _count: true }),
      prisma.emergencySession.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { selectedFacility: { select: { name: true } } } }),
    ]);
    res.json({ totalFacilities, activeEmergencies, emergencyFacilities, unconfirmedResources: unconfirmed, todaySessions, byType, byStatus, recent });
  }));

  app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use(errorHandler);
  return app;
}
