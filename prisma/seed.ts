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
  "bursary",
  "fellowship",
  "scholarship",
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

type OpportunityCategory =
  | "JOB"
  | "INTERNSHIP"
  | "LEARNERSHIP"
  | "APPRENTICESHIP"
  | "GRADUATE_PROGRAMME"
  | "CALL_FOR_APPLICATIONS"
  | "FUNDING";

type JobSeed = {
  title: string;
  category: OpportunityCategory;
  remoteType: "ONSITE" | "HYBRID" | "REMOTE";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY";
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: "HOURLY" | "MONTHLY" | "YEARLY" | null;
  highlights: string[];
  description: string;
  tags: string[];
};

const JOB_TEMPLATES: JobSeed[] = [
  {
    title: "Warehouse Associate",
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "JOB",
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
    category: "INTERNSHIP",
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
  {
    title: "Software Engineering Apprenticeship",
    category: "APPRENTICESHIP",
    remoteType: "HYBRID",
    employmentType: "FULL_TIME",
    salaryMin: 42000,
    salaryMax: 48000,
    salaryPeriod: "YEARLY",
    highlights: ["12-month structured programme", "Mentor assigned from day one"],
    description:
      "A 12-month paid apprenticeship pairing on-the-job engineering work with structured coursework toward a recognized qualification. No degree required — we hire for aptitude and train the rest.",
    tags: ["entry-level"],
  },
  {
    title: "Municipal Services Learnership",
    category: "LEARNERSHIP",
    remoteType: "ONSITE",
    employmentType: "TEMPORARY",
    salaryMin: 4500,
    salaryMax: 6000,
    salaryPeriod: "MONTHLY",
    highlights: ["NQF-aligned qualification", "Stipend paid monthly"],
    description:
      "A 12-month learnership combining classroom-based training with practical workplace experience in municipal services administration. Matric certificate required; no prior experience necessary.",
    tags: ["entry-level"],
  },
  {
    title: "Graduate Rotational Programme — Operations",
    category: "GRADUATE_PROGRAMME",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 55000,
    salaryMax: 65000,
    salaryPeriod: "YEARLY",
    highlights: ["Three 8-month rotations", "Fast-tracked into a permanent role"],
    description:
      "A two-year graduate programme rotating through operations, logistics and strategy. Open to graduates within the last 24 months across any discipline.",
    tags: ["entry-level", "benefits"],
  },
  {
    title: "Community Health Outreach — Call for Applications",
    category: "CALL_FOR_APPLICATIONS",
    remoteType: "ONSITE",
    employmentType: "TEMPORARY",
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: null,
    highlights: ["6-month volunteer placement", "Travel stipend covered"],
    description:
      "Open call for community health volunteers to support a 6-month outreach programme in underserved neighborhoods. Training provided; a travel stipend is covered, this is not a salaried role.",
    tags: [],
  },
  {
    title: "Regional Merit Bursary",
    category: "FUNDING",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: null,
    highlights: ["Full tuition + accommodation", "Renewable each academic year"],
    description:
      "Covers full tuition and accommodation for undergraduate students in STEM fields, renewable annually contingent on academic standing. Open to first-time undergraduates with a strong academic record.",
    tags: ["bursary"],
  },
  {
    title: "Postgraduate Research Fellowship",
    category: "FUNDING",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: null,
    highlights: ["12-month stipend", "Access to lab facilities and a faculty mentor"],
    description:
      "A 12-month research fellowship for postgraduate candidates, providing a living stipend and access to lab facilities and a faculty mentor for an independent research project.",
    tags: ["fellowship"],
  },
  {
    title: "Undergraduate STEM Scholarship",
    category: "FUNDING",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: null,
    highlights: ["Covers tuition fees", "Open to incoming first-year students"],
    description:
      "A merit-based scholarship covering tuition fees for incoming first-year students pursuing engineering, computer science or the physical sciences.",
    tags: ["scholarship"],
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

const ARTICLES = [
  {
    title: "How to write a CV with no work experience",
    category: "HOW_TO" as const,
    summary: "A step-by-step guide to building a strong CV around coursework, projects and volunteering.",
    author: "Hirelane Editorial",
    body: "Start with a clear summary of what you're looking for and why you're a fit. List academic projects, volunteer work and coursework as if they were jobs — describe the task, what you did, and the outcome. Keep it to one page. Proofread it out loud.",
  },
  {
    title: "How to prepare for a panel interview",
    category: "HOW_TO" as const,
    summary: "What panel interviews are looking for and how to keep your answers structured under pressure.",
    author: "Hirelane Editorial",
    body: "Panel interviews test how you think out loud in front of multiple stakeholders. Address whoever asked the question directly, but glance at the rest of the panel when summarizing. Use the STAR method (Situation, Task, Action, Result) to keep answers tight.",
  },
  {
    title: "Turning an internship into a full-time offer",
    category: "CAREER_DEVELOPMENT" as const,
    summary: "What actually gets interns converted, based on what hiring managers say they look for.",
    author: "Hirelane Editorial",
    body: "Ask for feedback early and often, not just at the final review. Volunteer for the unglamorous work nobody wants — it's the fastest way to become someone people rely on. Have the conversion conversation explicitly with your manager at the midpoint, not the last week.",
  },
  {
    title: "Negotiating your first job offer",
    category: "CAREER_DEVELOPMENT" as const,
    summary: "A calm, practical approach to negotiating salary and benefits without burning goodwill.",
    author: "Hirelane Editorial",
    body: "Get the offer in writing before you negotiate anything. Ask for a day or two to consider it — nobody loses an offer for that. If the number is below range, say so plainly and ask if there's flexibility, then stop talking and let them respond.",
  },
];

const COURSES = [
  {
    title: "Intro to SQL for Data Analysis",
    provider: "DataForge Academy",
    priceLabel: "Free",
    durationLabel: "4 weeks, self-paced",
    description: "Covers SELECT/JOIN/GROUP BY through building real dashboards against a sample warehouse dataset. No prior SQL experience assumed.",
    enrollUrl: "https://dataforge.example/courses/intro-sql",
  },
  {
    title: "Warehouse Safety & Powered Equipment Certification",
    provider: "SafeLift Training",
    priceLabel: "R650",
    durationLabel: "2-day in-person",
    description: "OSHA-aligned forklift and powered-equipment certification accepted by most regional distribution employers. Includes a practical exam.",
    enrollUrl: "https://safelift.example/certification",
  },
  {
    title: "Product Design Portfolio Bootcamp",
    provider: "Fernhollow Studios Learning",
    priceLabel: "$199",
    durationLabel: "6 weeks, part-time",
    description: "Build three portfolio-ready case studies with weekly feedback from working product designers. Ends with a live portfolio review.",
    enrollUrl: "https://fernhollowstudios.example/learning/portfolio-bootcamp",
  },
];

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
        update: { domain: c.domain },
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

      const tagIds = template.tags
        .map((t) => tagBySlug.get(slugify(t)))
        .filter((t): t is NonNullable<typeof t> => Boolean(t))
        .map((tag) => tag.id);

      const jobFields = {
        title: template.title,
        category: template.category,
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
      };

      // A full update (not `update: {}`) so re-running the seed after changing a template — e.g.
      // adding `category` — actually refreshes existing rows instead of leaving them frozen at
      // whatever they were on first insert.
      await prisma.job.upsert({
        where: { slug },
        update: {
          ...jobFields,
          tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) },
        },
        create: {
          slug,
          ...jobFields,
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
      });

      jobIndex++;
    }
  }

  console.log(`Seeded ${jobIndex} jobs across ${companies.length} companies.`);

  console.log("Seeding articles...");
  for (const article of ARTICLES) {
    await prisma.article.upsert({
      where: { slug: slugify(article.title) },
      update: {},
      create: {
        slug: slugify(article.title),
        title: article.title,
        category: article.category,
        summary: article.summary,
        author: article.author,
        body: article.body,
        published: true,
        publishedAt: new Date(now - 5 * 86_400_000),
      },
    });
  }

  console.log("Seeding courses...");
  for (const course of COURSES) {
    await prisma.course.upsert({
      where: { slug: slugify(course.title) },
      update: {},
      create: {
        slug: slugify(course.title),
        title: course.title,
        provider: course.provider,
        priceLabel: course.priceLabel,
        durationLabel: course.durationLabel,
        description: course.description,
        enrollUrl: course.enrollUrl,
        published: true,
        publishedAt: new Date(now - 5 * 86_400_000),
      },
    });
  }

  // A minimal sourcing/improving trail so the full pipeline is visible in the DB,
  // even though the Phase 1 UI only ever reads PUBLISHED Job rows.
  console.log("Seeding a sample Source + RawJob + ImprovementRun...");
  // Disabled: this is illustrative demo data (a fake .example domain, and a crawlConfig shape
  // that predates the real crawler's schema) so the pipeline's tables aren't empty in Prisma
  // Studio — not a real target. Enabled, the cron tick would try to crawl it every cadence and
  // fail forever. Flip `enabled: true` only if you replace baseUrl/crawlConfig with something real.
  const sourceFields = {
    name: "Northwind Logistics careers page",
    baseUrl: "https://northwindlogistics.example/careers",
    crawlConfig: { strategy: "listing-then-detail", selector: ".job-card a" },
    cadenceMinutes: 360,
    enabled: false,
  };
  const source = await prisma.source.upsert({
    where: { id: "seed-source-northwind" },
    update: sourceFields,
    create: { id: "seed-source-northwind", ...sourceFields },
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
