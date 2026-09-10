CREATE TYPE "JobIndustry" AS ENUM (
  'TECHNOLOGY', 'HEALTHCARE', 'FINANCE', 'ENGINEERING', 'EDUCATION', 'GOVERNMENT',
  'RETAIL', 'CONSTRUCTION_PROPERTY', 'MANUFACTURING', 'TRANSPORT_LOGISTICS',
  'HOSPITALITY_TOURISM', 'AGRICULTURE', 'MEDIA_MARKETING', 'LEGAL', 'ENERGY_MINING',
  'SECURITY', 'OTHER'
);

CREATE TYPE "SouthAfricanProvince" AS ENUM (
  'EASTERN_CAPE', 'FREE_STATE', 'GAUTENG', 'KWAZULU_NATAL', 'LIMPOPO', 'MPUMALANGA',
  'NORTH_WEST', 'NORTHERN_CAPE', 'WESTERN_CAPE', 'NATIONWIDE'
);

ALTER TABLE "Job"
ADD COLUMN "industry" "JobIndustry" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "province" "SouthAfricanProvince" NOT NULL DEFAULT 'NATIONWIDE';

UPDATE "Job" SET "province" = CASE
  WHEN "location" ~* '(western cape|cape town|stellenbosch|paarl|george)' THEN 'WESTERN_CAPE'::"SouthAfricanProvince"
  WHEN "location" ~* '(kwazulu.?natal|(^|[^a-z])kzn([^a-z]|$)|durban|pietermaritzburg|richards bay)' THEN 'KWAZULU_NATAL'::"SouthAfricanProvince"
  WHEN "location" ~* '(eastern cape|gqeberha|port elizabeth|east london|mthatha)' THEN 'EASTERN_CAPE'::"SouthAfricanProvince"
  WHEN "location" ~* '(free state|bloemfontein)' THEN 'FREE_STATE'::"SouthAfricanProvince"
  WHEN "location" ~* '(gauteng|johannesburg|pretoria|tshwane|sandton|midrand|centurion|ekurhuleni)' THEN 'GAUTENG'::"SouthAfricanProvince"
  WHEN "location" ~* '(limpopo|polokwane)' THEN 'LIMPOPO'::"SouthAfricanProvince"
  WHEN "location" ~* '(mpumalanga|mbombela|nelspruit)' THEN 'MPUMALANGA'::"SouthAfricanProvince"
  WHEN "location" ~* '(north west|rustenburg|mahikeng|klerksdorp)' THEN 'NORTH_WEST'::"SouthAfricanProvince"
  WHEN "location" ~* '(northern cape|kimberley|upington)' THEN 'NORTHERN_CAPE'::"SouthAfricanProvince"
  ELSE 'NATIONWIDE'::"SouthAfricanProvince"
END;

UPDATE "Job" SET "industry" = CASE
  WHEN ("title" || ' ' || "description") ~* '(software|developer|information technology|(^|[^a-z])it([^a-z]|$)|data analyst|cyber|network|cloud)' THEN 'TECHNOLOGY'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(health|medical|nurs|doctor|clinic|pharmacy|hospital)' THEN 'HEALTHCARE'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(bank|finance|account|audit|insurance|investment|credit)' THEN 'FINANCE'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(engineer|engineering)' THEN 'ENGINEERING'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(teacher|lecturer|education|school|university|training)' THEN 'EDUCATION'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(government|municipal|public service|department of)' THEN 'GOVERNMENT'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(retail|store|merchandis|cashier|sales assistant)' THEN 'RETAIL'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(construction|property|building|quantity survey)' THEN 'CONSTRUCTION_PROPERTY'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(manufactur|production|factory|plant operator)' THEN 'MANUFACTURING'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(logistics|transport|warehouse|driver|supply chain)' THEN 'TRANSPORT_LOGISTICS'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(hotel|hospitality|tourism|chef|restaurant)' THEN 'HOSPITALITY_TOURISM'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(agricultur|farming|farm|agronom)' THEN 'AGRICULTURE'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(marketing|media|communications|journalist|content creator)' THEN 'MEDIA_MARKETING'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(legal|lawyer|attorney|paralegal)' THEN 'LEGAL'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(mining|mine|energy|solar|electricity|petroleum)' THEN 'ENERGY_MINING'::"JobIndustry"
  WHEN ("title" || ' ' || "description") ~* '(security|armed response|guard)' THEN 'SECURITY'::"JobIndustry"
  ELSE 'OTHER'::"JobIndustry"
END;

UPDATE "Job" SET "salaryCurrency" = 'ZAR' WHERE "salaryMin" IS NOT NULL OR "salaryMax" IS NOT NULL;
ALTER TABLE "Job" ALTER COLUMN "salaryCurrency" SET DEFAULT 'ZAR';

CREATE INDEX "Job_status_industry_postedAt_idx" ON "Job"("status", "industry", "postedAt");
CREATE INDEX "Job_status_province_postedAt_idx" ON "Job"("status", "province", "postedAt");
