ALTER TABLE "Job"
ADD COLUMN "applicationSummary" TEXT,
ADD COLUMN "essentialRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "preferredRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "requiredQualifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "requiredExperience" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "documentsToPrepare" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "licenceRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "applicationMethod" TEXT,
ADD COLUMN "referenceNumber" TEXT,
ADD COLUMN "estimatedApplicationMinutes" INTEGER;
