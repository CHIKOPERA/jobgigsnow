import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: ".env.local" });
loadEnv();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // This script is deliberately idempotent. It fills only default taxonomy values and JOB
  // categories, so rerunning it after db:push will not overwrite reviewed classifications.
  const [provinces, industries, currencies, categories] = await prisma.$transaction([
    prisma.$executeRaw`
      UPDATE "Job"
      SET "province" = CASE
        WHEN "location" ~* '(western cape|cape town|stellenbosch|paarl|george)' THEN 'WESTERN_CAPE'::"SouthAfricanProvince"
        WHEN "location" ~* '(kwazulu.?natal|(^|[^[:alnum:]_])kzn([^[:alnum:]_]|$)|durban|pietermaritzburg|richards bay)' THEN 'KWAZULU_NATAL'::"SouthAfricanProvince"
        WHEN "location" ~* '(eastern cape|gqeberha|port elizabeth|east london|mthatha)' THEN 'EASTERN_CAPE'::"SouthAfricanProvince"
        WHEN "location" ~* '(free state|bloemfontein)' THEN 'FREE_STATE'::"SouthAfricanProvince"
        WHEN "location" ~* '(gauteng|johannesburg|pretoria|tshwane|sandton|midrand|centurion|ekurhuleni)' THEN 'GAUTENG'::"SouthAfricanProvince"
        WHEN "location" ~* '(limpopo|polokwane)' THEN 'LIMPOPO'::"SouthAfricanProvince"
        WHEN "location" ~* '(mpumalanga|mbombela|nelspruit)' THEN 'MPUMALANGA'::"SouthAfricanProvince"
        WHEN "location" ~* '(north west|rustenburg|mahikeng|klerksdorp)' THEN 'NORTH_WEST'::"SouthAfricanProvince"
        WHEN "location" ~* '(northern cape|kimberley|upington)' THEN 'NORTHERN_CAPE'::"SouthAfricanProvince"
        ELSE "province"
      END
      WHERE "province" = 'NATIONWIDE'::"SouthAfricanProvince"
        AND "location" ~* '(western cape|cape town|stellenbosch|paarl|george|kwazulu.?natal|(^|[^[:alnum:]_])kzn([^[:alnum:]_]|$)|durban|pietermaritzburg|richards bay|eastern cape|gqeberha|port elizabeth|east london|mthatha|free state|bloemfontein|gauteng|johannesburg|pretoria|tshwane|sandton|midrand|centurion|ekurhuleni|limpopo|polokwane|mpumalanga|mbombela|nelspruit|north west|rustenburg|mahikeng|klerksdorp|northern cape|kimberley|upington)'
    `,
    prisma.$executeRaw`
      UPDATE "Job"
      SET "industry" = CASE
        WHEN ("title" || ' ' || "description") ~* '(software|developer|information technology|(^|[^[:alnum:]_])it([^[:alnum:]_]|$)|data analyst|cyber|network|cloud)' THEN 'TECHNOLOGY'::"JobIndustry"
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
        ELSE "industry"
      END
      WHERE "industry" = 'OTHER'::"JobIndustry"
        AND ("title" || ' ' || "description") ~* '(software|developer|information technology|(^|[^[:alnum:]_])it([^[:alnum:]_]|$)|data analyst|cyber|network|cloud|health|medical|nurs|doctor|clinic|pharmacy|hospital|bank|finance|account|audit|insurance|investment|credit|engineer|engineering|teacher|lecturer|education|school|university|training|government|municipal|public service|department of|retail|store|merchandis|cashier|sales assistant|construction|property|building|quantity survey|manufactur|production|factory|plant operator|logistics|transport|warehouse|driver|supply chain|hotel|hospitality|tourism|chef|restaurant|agricultur|farming|farm|agronom|marketing|media|communications|journalist|content creator|legal|lawyer|attorney|paralegal|mining|mine|energy|solar|electricity|petroleum|security|armed response|guard)'
    `,
    prisma.$executeRaw`
      UPDATE "Job"
      SET "salaryCurrency" = 'ZAR'
      WHERE ("salaryMin" IS NOT NULL OR "salaryMax" IS NOT NULL)
        AND "salaryCurrency" IS DISTINCT FROM 'ZAR'
    `,
    prisma.$executeRaw`
      UPDATE "Job"
      SET "category" = CASE
        WHEN "title" ~* '(bursary|bursaries|scholarship|scholarships|student funding|study grants?|research grants?|funding opportunit(y|ies)|financial aid)' THEN 'FUNDING'::"OpportunityCategory"
        WHEN "title" ~* 'learnerships?' THEN 'LEARNERSHIP'::"OpportunityCategory"
        WHEN "title" ~* 'apprenticeships?' THEN 'APPRENTICESHIP'::"OpportunityCategory"
        WHEN "title" ~* '(internships?|intern programme|intern program|student intern)' OR "employmentType" = 'INTERNSHIP'::"EmploymentType" THEN 'INTERNSHIP'::"OpportunityCategory"
        WHEN "title" ~* '(graduate|graduates|young professional|management trainee)[[:space:]]+(development[[:space:]]+)?(programme|program|scheme|opportunit(y|ies))' THEN 'GRADUATE_PROGRAMME'::"OpportunityCategory"
        WHEN "title" ~* 'call[[:space:]]+for[[:space:]]+(applications?|proposals?|submissions?|nominations?)' THEN 'CALL_FOR_APPLICATIONS'::"OpportunityCategory"
        WHEN "description" ~* '(this|the|an|our|paid|unpaid)[[:space:]]+internship' THEN 'INTERNSHIP'::"OpportunityCategory"
        WHEN "description" ~* '(this|the|a|our)[[:space:]]+learnership' THEN 'LEARNERSHIP'::"OpportunityCategory"
        WHEN "description" ~* '(this|the|an|our)[[:space:]]+apprenticeship' THEN 'APPRENTICESHIP'::"OpportunityCategory"
        WHEN "description" ~* 'call[[:space:]]+for[[:space:]]+(applications?|proposals?|submissions?|nominations?)' THEN 'CALL_FOR_APPLICATIONS'::"OpportunityCategory"
        ELSE "category"
      END
      WHERE "category" = 'JOB'::"OpportunityCategory"
        AND (
          "title" ~* '(bursary|bursaries|scholarship|scholarships|student funding|study grants?|research grants?|funding opportunit(y|ies)|financial aid|learnerships?|apprenticeships?|internships?|intern programme|intern program|student intern)'
          OR "title" ~* '(graduate|graduates|young professional|management trainee)[[:space:]]+(development[[:space:]]+)?(programme|program|scheme|opportunit(y|ies))'
          OR "title" ~* 'call[[:space:]]+for[[:space:]]+(applications?|proposals?|submissions?|nominations?)'
          OR "employmentType" = 'INTERNSHIP'::"EmploymentType"
          OR "description" ~* '(this|the|an|a|our|paid|unpaid)[[:space:]]+(internship|learnership|apprenticeship)'
          OR "description" ~* 'call[[:space:]]+for[[:space:]]+(applications?|proposals?|submissions?|nominations?)'
        )
    `,
  ]);

  console.log(
    `Job backfill complete: ${provinces} provinces, ${industries} industries, ${currencies} currencies, ${categories} opportunity categories updated.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
