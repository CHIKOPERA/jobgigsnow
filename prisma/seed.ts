import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const COMPANIES = [
  { name: "Northwind Logistics", domain: "northwindlogistics.example" },
  { name: "Cedar & Finch", domain: "cedarfinch.example" },
  { name: "Brightline Health", domain: "brightlinehealth.example" },
  { name: "Fernhollow Studios", domain: "fernhollowstudios.example" },
  { name: "Ridgeback Robotics", domain: "ridgebackrobotics.example" },
  { name: "Harbor & Main", domain: "harborandmain.example" },
  { name: "Glasswing Financial", domain: "glasswingfinancial.example" },
  { name: "Sable Point Retail", domain: "sablepointretail.example" },
];

const TAGS = [
  "remote-friendly",
  "entry-level",
  "senior",
  "benefits",
  "urgent-hire",
  "union",
  "bilingual",
  "night-shift",
  "weekend",
  "travel",
];

const LOCATIONS = [
  "Austin, TX",
  "Remote — US",
  "Chicago, IL",
  "Portland, OR",
  "Atlanta, GA",
  "Remote — North America",
  "Denver, CO",
  "Columbus, OH",
];

type JobSeed = {
  title: string;
  remoteType: "ONSITE" | "HYBRID" | "REMOTE";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY";
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: "HOURLY" | "YEARLY" | null;
  highlights: string[];
  description: string;
  tags: string[];
};

const JOB_TEMPLATES: JobSeed[] = [
  {
    title: "Warehouse Associate",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 19,
    salaryMax: 23,
    salaryPeriod: "HOURLY",
    highlights: ["Weekly pay", "Health benefits day one"],
    description:
      "Pick, pack and stage outbound orders in a climate-controlled distribution center. Full training provided on powered equipment for candidates without prior warehouse experience.",
    tags: ["entry-level", "benefits"],
  },
  {
    title: "Registered Nurse — Med-Surg",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 78000,
    salaryMax: 96000,
    salaryPeriod: "YEARLY",
    highlights: ["Sign-on bonus", "Tuition reimbursement"],
    description:
      "Provide direct patient care on a 32-bed med-surg unit, coordinating with physicians and specialists on treatment plans. Current state RN license required.",
    tags: ["senior", "benefits", "night-shift"],
  },
  {
    title: "Senior Software Engineer, Platform",
    remoteType: "REMOTE",
    employmentType: "FULL_TIME",
    salaryMin: 145000,
    salaryMax: 185000,
    salaryPeriod: "YEARLY",
    highlights: ["Fully remote", "Equity"],
    description:
      "Own core services powering internal tooling used by every product team. You'll design APIs, review infrastructure changes, and mentor two mid-level engineers.",
    tags: ["remote-friendly", "senior"],
  },
  {
    title: "Product Designer",
    remoteType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 105000,
    salaryMax: 130000,
    salaryPeriod: "YEARLY",
    highlights: ["Hybrid — 2 days onsite", "Design system ownership"],
    description:
      "Partner with product and engineering to ship end-to-end flows, from early concept sketches through shipped, measured features. Portfolio required.",
    tags: ["remote-friendly"],
  },
  {
    title: "Delivery Driver — Local Routes",
    remoteType: "ONSITE",
    employmentType: "PART_TIME",
    salaryMin: 18,
    salaryMax: 21,
    salaryPeriod: "HOURLY",
    highlights: ["Set local routes", "No overnight travel"],
    description:
      "Deliver packages on a fixed local route using a company vehicle. Clean driving record required; routes typically finish by early evening.",
    tags: ["entry-level", "weekend"],
  },
  {
    title: "Customer Success Manager",
    remoteType: "REMOTE",
    employmentType: "FULL_TIME",
    salaryMin: 68000,
    salaryMax: 85000,
    salaryPeriod: "YEARLY",
    highlights: ["Fully remote", "Quarterly bonus"],
    description:
      "Own a book of mid-market accounts from onboarding through renewal, running quarterly business reviews and identifying expansion opportunities.",
    tags: ["remote-friendly", "benefits"],
  },
  {
    title: "DevOps Engineer",
    remoteType: "REMOTE",
    employmentType: "CONTRACT",
    salaryMin: 70,
    salaryMax: 95,
    salaryPeriod: "HOURLY",
    highlights: ["6-month contract", "Remote"],
    description:
      "Harden CI/CD pipelines and migrate remaining services to containerized deploys. Strong Terraform and Kubernetes experience expected.",
    tags: ["remote-friendly", "urgent-hire"],
  },
  {
    title: "Retail Sales Associate",
    remoteType: "ONSITE",
    employmentType: "PART_TIME",
    salaryMin: 16,
    salaryMax: 18,
    salaryPeriod: "HOURLY",
    highlights: ["Employee discount", "Flexible scheduling"],
    description:
      "Greet customers, maintain the sales floor, and process transactions at the register during weekday and weekend shifts.",
    tags: ["entry-level", "weekend"],
  },
  {
    title: "Marketing Specialist",
    remoteType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 58000,
    salaryMax: 72000,
    salaryPeriod: "YEARLY",
    highlights: ["Hybrid schedule", "Growth-stage team"],
    description:
      "Plan and execute campaigns across email, paid social and content, reporting on performance weekly to the growth team.",
    tags: ["benefits"],
  },
  {
    title: "Executive Assistant",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 62000,
    salaryMax: 78000,
    salaryPeriod: "YEARLY",
    highlights: ["Direct exec exposure", "Benefits day one"],
    description:
      "Manage calendars, travel and correspondence for two senior executives, with occasional project-coordination work across departments.",
    tags: ["senior", "benefits"],
  },
  {
    title: "Warehouse Night Shift Lead",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 24,
    salaryMax: 28,
    salaryPeriod: "HOURLY",
    highlights: ["Shift differential", "Union position"],
    description:
      "Lead a team of eight associates on the overnight shift, coordinating throughput targets and safety checks across the floor.",
    tags: ["senior", "union", "night-shift"],
  },
  {
    title: "Data Analyst",
    remoteType: "REMOTE",
    employmentType: "FULL_TIME",
    salaryMin: 82000,
    salaryMax: 100000,
    salaryPeriod: "YEARLY",
    highlights: ["Fully remote", "4-day week pilot"],
    description:
      "Build and maintain dashboards for the revenue team, and partner with stakeholders to scope new reporting requests.",
    tags: ["remote-friendly"],
  },
  {
    title: "Bilingual Patient Coordinator",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 21,
    salaryMax: 25,
    salaryPeriod: "HOURLY",
    highlights: ["Bilingual pay differential", "Benefits day one"],
    description:
      "Schedule appointments and coordinate insurance intake for a busy outpatient clinic. Spanish/English fluency required.",
    tags: ["bilingual", "benefits"],
  },
  {
    title: "Field Sales Executive",
    remoteType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 60000,
    salaryMax: 75000,
    salaryPeriod: "YEARLY",
    highlights: ["Uncapped commission", "Car allowance"],
    description:
      "Prospect and close new mid-market accounts within an assigned territory, traveling roughly one week per month for site visits.",
    tags: ["travel", "urgent-hire"],
  },
  {
    title: "Robotics Test Intern",
    remoteType: "ONSITE",
    employmentType: "INTERNSHIP",
    salaryMin: 24,
    salaryMax: 28,
    salaryPeriod: "HOURLY",
    highlights: ["Paid internship", "Mentorship"],
    description:
      "Support the hardware test team on validation rigs for next-generation warehouse robots. Open to rising juniors/seniors in ME/EE/CS.",
    tags: ["entry-level"],
  },
];

const STATUS_WEIGHTS: Array<{
  status: "PUBLISHED" | "CLOSED" | "ARCHIVED" | "DISCOVERED" | "IMPROVING" | "READY" | "REJECTED";
  weight: number;
}> = [
  { status: "PUBLISHED", weight: 30 },
  { status: "CLOSED", weight: 4 },
  { status: "ARCHIVED", weight: 2 },
  { status: "DISCOVERED", weight: 2 },
  { status: "IMPROVING", weight: 1 },
  { status: "READY", weight: 1 },
];

function pickStatus(index: number) {
  const cumulative: Array<{ status: (typeof STATUS_WEIGHTS)[number]["status"]; upTo: number }> = [];
  let running = 0;
  for (const entry of STATUS_WEIGHTS) {
    running += entry.weight;
    cumulative.push({ status: entry.status, upTo: running });
  }
  const bucket = index % running;
  return cumulative.find((c) => bucket < c.upTo)!.status;
}

async function main() {
  console.log("Seeding tags...");
  const tags = await Promise.all(
    TAGS.map((name) =>
      prisma.tag.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  );
  const tagBySlug = new Map(tags.map((t) => [t.slug, t]));

  console.log("Seeding companies...");
  const companies = await Promise.all(
    COMPANIES.map((c) =>
      prisma.company.upsert({
        where: { slug: slugify(c.name) },
        update: {},
        create: { name: c.name, slug: slugify(c.name), domain: c.domain },
      }),
    ),
  );

  console.log("Seeding jobs...");
  const now = Date.now();
  let jobIndex = 0;

  for (const company of companies) {
    // ~5 jobs per company, cycling through templates so every company gets a mixed slate.
    for (let i = 0; i < 5; i++) {
      const template = JOB_TEMPLATES[(jobIndex + i) % JOB_TEMPLATES.length];
      const status = pickStatus(jobIndex);
      const daysAgo = jobIndex % 21;
      const postedAt = status === "DISCOVERED" || status === "IMPROVING" ? null : new Date(now - daysAgo * 86_400_000);
      const closesAt =
        status === "CLOSED" || status === "ARCHIVED"
          ? new Date(now - Math.max(daysAgo - 5, 1) * 86_400_000)
          : status === "PUBLISHED"
            ? new Date(now + 30 * 86_400_000)
            : null;
      const location = LOCATIONS[jobIndex % LOCATIONS.length];
      const slugBase = `${slugify(template.title)}-${slugify(company.name)}`;
      const slug = `${slugBase}-${jobIndex}`;

      await prisma.job.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          title: template.title,
          companyId: company.id,
          location,
          remoteType: template.remoteType,
          employmentType: template.employmentType,
          salaryMin: template.salaryMin,
          salaryMax: template.salaryMax,
          salaryPeriod: template.salaryPeriod,
          description: template.description,
          highlights: template.highlights,
          applyUrl: `https://${company.domain}/careers/${slugBase}`,
          isNative: false,
          status,
          postedAt,
          closesAt,
          tags: {
            create: template.tags
              .map((t) => tagBySlug.get(slugify(t)))
              .filter((t): t is NonNullable<typeof t> => Boolean(t))
              .map((tag) => ({ tagId: tag.id })),
          },
        },
      });

      jobIndex++;
    }
  }

  console.log(`Seeded ${jobIndex} jobs across ${companies.length} companies.`);

  // A minimal sourcing/improving trail so the full pipeline is visible in the DB,
  // even though the Phase 1 UI only ever reads PUBLISHED Job rows.
  console.log("Seeding a sample Source + RawJob + ImprovementRun...");
  const source = await prisma.source.upsert({
    where: { id: "seed-source-northwind" },
    update: {},
    create: {
      id: "seed-source-northwind",
      name: "Northwind Logistics careers page",
      baseUrl: "https://northwindlogistics.example/careers",
      crawlConfig: { strategy: "listing-then-detail", selector: ".job-card a" },
      cadenceMinutes: 360,
      enabled: true,
    },
  });

  const rawJob = await prisma.rawJob.upsert({
    where: { sourceId_externalId: { sourceId: source.id, externalId: "nw-8842" } },
    update: {},
    create: {
      sourceId: source.id,
      externalId: "nw-8842",
      externalUrl: "https://northwindlogistics.example/careers/forklift-operator",
      rawTitle: "Forklift Operator Needed ASAP",
      rawCompany: "Northwind Logistics",
      rawLocation: "Austin TX",
      payload: { description: "raw scraped description, unedited" },
      contentHash: "seed-hash-nw-8842",
      fetchStatus: "FETCHED",
    },
  });

  await prisma.improvementRun.create({
    data: {
      rawJobId: rawJob.id,
      model: "seed-fixture",
      promptVersion: "v0",
      status: "SUCCEEDED",
      startedAt: new Date(now - 3600_000),
      finishedAt: new Date(now - 3500_000),
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
