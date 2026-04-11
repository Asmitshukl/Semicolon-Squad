-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VICTIM', 'OFFICER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "FIRStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION', 'CHARGESHEET_FILED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ENGLISH', 'HINDI', 'BHOJPURI', 'MARATHI', 'TAMIL', 'TELUGU', 'BENGALI', 'GUJARATI', 'KANNADA', 'MALAYALAM', 'PUNJABI', 'ODIA');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "OfficerVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CrimeCategory" AS ENUM ('VIOLENT', 'PROPERTY', 'CYBERCRIME', 'DOMESTIC_VIOLENCE', 'FINANCIAL_FRAUD', 'SEXUAL_OFFENSE', 'PUBLIC_ORDER', 'DRUG_OFFENSE', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "gender" "Gender",
    "aadhaarLast4" TEXT,
    "preferredLang" "Language" NOT NULL DEFAULT 'ENGLISH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoliceStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stationCode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "jurisdictionArea" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoliceStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Officer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "verificationStatus" "OfficerVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedByAdminId" TEXT,
    "otpSecret" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "cctnsId" TEXT,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BNSSection" (
    "id" TEXT NOT NULL,
    "sectionNumber" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "CrimeCategory" NOT NULL,
    "ipcEquivalent" TEXT,
    "ipcTitle" TEXT,
    "ipcDescription" TEXT,
    "minImprisonmentMonths" INTEGER,
    "maxImprisonmentMonths" INTEGER,
    "isLifeOrDeath" BOOLEAN NOT NULL DEFAULT false,
    "minFine" DOUBLE PRECISION,
    "maxFine" DOUBLE PRECISION,
    "isBailable" BOOLEAN NOT NULL DEFAULT false,
    "isCognizable" BOOLEAN NOT NULL DEFAULT true,
    "isCompoundable" BOOLEAN NOT NULL DEFAULT false,
    "compensationNote" TEXT,
    "victimsRightsNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BNSSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VictimStatement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rawText" TEXT,
    "voiceRecordingId" TEXT,
    "language" "Language" NOT NULL DEFAULT 'ENGLISH',
    "translatedText" TEXT,
    "incidentDate" TIMESTAMP(3),
    "incidentTime" TEXT,
    "incidentLocation" TEXT,
    "witnessDetails" TEXT,
    "isUsedForFIR" BOOLEAN NOT NULL DEFAULT false,
    "firId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VictimStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrimeClassification" (
    "id" TEXT NOT NULL,
    "victimStatementId" TEXT NOT NULL,
    "bnsSectionId" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "alternativeSections" JSONB,
    "urgencyLevel" "UrgencyLevel" NOT NULL,
    "urgencyReason" TEXT,
    "severityScore" DOUBLE PRECISION,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrimeClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FIR" (
    "id" TEXT NOT NULL,
    "firNumber" TEXT,
    "acknowledgmentNo" TEXT,
    "victimId" TEXT NOT NULL,
    "officerId" TEXT,
    "stationId" TEXT NOT NULL,
    "status" "FIRStatus" NOT NULL DEFAULT 'DRAFT',
    "urgencyLevel" "UrgencyLevel" NOT NULL DEFAULT 'MEDIUM',
    "isOnlineFIR" BOOLEAN NOT NULL DEFAULT false,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentTime" TEXT,
    "incidentLocation" TEXT NOT NULL,
    "incidentDescription" TEXT NOT NULL,
    "aiGeneratedSummary" TEXT,
    "officerSignedAt" TIMESTAMP(3),
    "chargeSheetFiledAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FIR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseUpdate" (
    "id" TEXT NOT NULL,
    "firId" TEXT NOT NULL,
    "status" "FIRStatus" NOT NULL,
    "note" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceRecording" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firId" TEXT,
    "language" "Language" NOT NULL DEFAULT 'HINDI',
    "fileUrl" TEXT NOT NULL,
    "durationSecs" INTEGER,
    "transcript" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceRecording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceChecklist" (
    "id" TEXT NOT NULL,
    "bnsSectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "deadline" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "firId" TEXT NOT NULL,
    "checklistItemId" TEXT,
    "label" TEXT NOT NULL,
    "fileUrl" TEXT,
    "notes" TEXT,
    "isCollected" BOOLEAN NOT NULL DEFAULT false,
    "collectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RightsExplainer" (
    "id" TEXT NOT NULL,
    "bnsSectionId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "legalBasis" TEXT,
    "language" "Language" NOT NULL DEFAULT 'ENGLISH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RightsExplainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMSNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firId" TEXT,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SMSNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FIRSections" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FIRSections_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "PoliceStation_stationCode_key" ON "PoliceStation"("stationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Officer_userId_key" ON "Officer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Officer_badgeNumber_key" ON "Officer"("badgeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BNSSection_sectionNumber_key" ON "BNSSection"("sectionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VictimStatement_voiceRecordingId_key" ON "VictimStatement"("voiceRecordingId");

-- CreateIndex
CREATE UNIQUE INDEX "CrimeClassification_victimStatementId_key" ON "CrimeClassification"("victimStatementId");

-- CreateIndex
CREATE UNIQUE INDEX "FIR_firNumber_key" ON "FIR"("firNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FIR_acknowledgmentNo_key" ON "FIR"("acknowledgmentNo");

-- CreateIndex
CREATE INDEX "_FIRSections_B_index" ON "_FIRSections"("B");

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "PoliceStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VictimStatement" ADD CONSTRAINT "VictimStatement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VictimStatement" ADD CONSTRAINT "VictimStatement_voiceRecordingId_fkey" FOREIGN KEY ("voiceRecordingId") REFERENCES "VoiceRecording"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VictimStatement" ADD CONSTRAINT "VictimStatement_firId_fkey" FOREIGN KEY ("firId") REFERENCES "FIR"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrimeClassification" ADD CONSTRAINT "CrimeClassification_victimStatementId_fkey" FOREIGN KEY ("victimStatementId") REFERENCES "VictimStatement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrimeClassification" ADD CONSTRAINT "CrimeClassification_bnsSectionId_fkey" FOREIGN KEY ("bnsSectionId") REFERENCES "BNSSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FIR" ADD CONSTRAINT "FIR_victimId_fkey" FOREIGN KEY ("victimId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FIR" ADD CONSTRAINT "FIR_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FIR" ADD CONSTRAINT "FIR_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "PoliceStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseUpdate" ADD CONSTRAINT "CaseUpdate_firId_fkey" FOREIGN KEY ("firId") REFERENCES "FIR"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceRecording" ADD CONSTRAINT "VoiceRecording_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceRecording" ADD CONSTRAINT "VoiceRecording_firId_fkey" FOREIGN KEY ("firId") REFERENCES "FIR"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceChecklist" ADD CONSTRAINT "EvidenceChecklist_bnsSectionId_fkey" FOREIGN KEY ("bnsSectionId") REFERENCES "BNSSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "EvidenceChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_firId_fkey" FOREIGN KEY ("firId") REFERENCES "FIR"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RightsExplainer" ADD CONSTRAINT "RightsExplainer_bnsSectionId_fkey" FOREIGN KEY ("bnsSectionId") REFERENCES "BNSSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSNotification" ADD CONSTRAINT "SMSNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSNotification" ADD CONSTRAINT "SMSNotification_firId_fkey" FOREIGN KEY ("firId") REFERENCES "FIR"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FIRSections" ADD CONSTRAINT "_FIRSections_A_fkey" FOREIGN KEY ("A") REFERENCES "BNSSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FIRSections" ADD CONSTRAINT "_FIRSections_B_fkey" FOREIGN KEY ("B") REFERENCES "FIR"("id") ON DELETE CASCADE ON UPDATE CASCADE;
