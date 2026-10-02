-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATIENT', 'FACILITY', 'ADMIN');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('GOVERNMENT_HOSPITAL', 'PHC', 'PRIVATE_HOSPITAL', 'EMERGENCY_CARE_CENTRE');

-- CreateEnum
CREATE TYPE "EmergencyType" AS ENUM ('SNAKE_BITE', 'INSECT_STING', 'OTHER');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'FACILITY_SELECTED', 'ROUTE_STARTED', 'FACILITY_NOTIFIED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'READY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PATIENT',
    "facilityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FacilityType" NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "open24x7" BOOLEAN NOT NULL DEFAULT false,
    "currentStatus" TEXT NOT NULL DEFAULT 'OPEN',
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityResource" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "emergencyAvailable" BOOLEAN NOT NULL DEFAULT false,
    "snakeBiteTreatment" BOOLEAN NOT NULL DEFAULT false,
    "insectStingTreatment" BOOLEAN NOT NULL DEFAULT false,
    "antivenomAvailable" BOOLEAN,
    "antivenomLastUpdated" TIMESTAMP(3),
    "emergencyEquipmentAvailable" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "FacilityResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "emergencyType" "EmergencyType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "selectedFacilityId" TEXT,
    "voiceInput" TEXT,
    "classificationConfidence" DOUBLE PRECISION,
    "shareToken" TEXT,
    "shareExpiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyNotification" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "distanceKm" DOUBLE PRECISION,
    "etaMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationHistory" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Facility_type_idx" ON "Facility"("type");

-- CreateIndex
CREATE INDEX "Facility_latitude_longitude_idx" ON "Facility"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityResource_facilityId_key" ON "FacilityResource"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencySession_shareToken_key" ON "EmergencySession"("shareToken");

-- CreateIndex
CREATE INDEX "EmergencySession_status_idx" ON "EmergencySession"("status");

-- CreateIndex
CREATE INDEX "EmergencySession_emergencyType_idx" ON "EmergencySession"("emergencyType");

-- CreateIndex
CREATE INDEX "EmergencySession_latitude_longitude_idx" ON "EmergencySession"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "EmergencyNotification_facilityId_status_idx" ON "EmergencyNotification"("facilityId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityResource" ADD CONSTRAINT "FacilityResource_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencySession" ADD CONSTRAINT "EmergencySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencySession" ADD CONSTRAINT "EmergencySession_selectedFacilityId_fkey" FOREIGN KEY ("selectedFacilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyNotification" ADD CONSTRAINT "EmergencyNotification_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EmergencySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyNotification" ADD CONSTRAINT "EmergencyNotification_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EmergencySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
