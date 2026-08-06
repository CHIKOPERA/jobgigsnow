import type { ContentCategory, OpportunityCategory } from "@/generated/prisma/client";

// No secrets here — this is the single typed source of truth for every category the site
// supports, read by the nav, the /jobs filters, ingest validation, and the seed script. To add a
// new category: add a case to the matching Prisma enum (+ migration), then add one entry below —
// the nav, filters, and ingest validation all pick it up from here automatically.

interface Subcategory {
  /** Tag slug this sub-item filters by, scoped to the parent category. */
  tagSlug: string;
  label: string;
}

export interface OpportunityCategoryDef {
  value: OpportunityCategory;
  label: string;
  /** Dropdown sub-items, backed by tags scoped to this category (e.g. Funding → Bursaries). */
  subcategories?: Subcategory[];
}

export const opportunityCategories: Record<OpportunityCategory, OpportunityCategoryDef> = {
  APPRENTICESHIP: { value: "APPRENTICESHIP", label: "Apprenticeships" },
  CALL_FOR_APPLICATIONS: { value: "CALL_FOR_APPLICATIONS", label: "Call for Applications" },
  FUNDING: {
    value: "FUNDING",
    label: "Funding Your Studies",
    subcategories: [
      { tagSlug: "bursary", label: "Bursaries" },
      { tagSlug: "fellowship", label: "Fellowships" },
      { tagSlug: "scholarship", label: "Scholarships" },
    ],
  },
  GRADUATE_PROGRAMME: { value: "GRADUATE_PROGRAMME", label: "Graduate Programmes" },
  INTERNSHIP: { value: "INTERNSHIP", label: "Internships" },
  LEARNERSHIP: { value: "LEARNERSHIP", label: "Learnerships" },
  JOB: { value: "JOB", label: "Jobs" },
};

export interface ContentCategoryDef {
  value: ContentCategory;
  label: string;
}

export const contentCategories: Record<ContentCategory, ContentCategoryDef> = {
  HOW_TO: { value: "HOW_TO", label: "How To" },
  CAREER_DEVELOPMENT: { value: "CAREER_DEVELOPMENT", label: "Career Development" },
};

export type NavItem =
  | { kind: "home"; label: string; href: string }
  | { kind: "opportunity"; label: string; href: string; category: OpportunityCategoryDef }
  | { kind: "content"; label: string; href: string; category: ContentCategoryDef }
  | { kind: "courses"; label: string; href: string };

function opportunityHref(category: OpportunityCategory) {
  return `/jobs?category=${category}`;
}

function contentHref(category: ContentCategory) {
  return `/articles?category=${category}`;
}

// Explicit display order, matching the reference nav exactly.
export const navItems: NavItem[] = [
  { kind: "home", label: "Home", href: "/" },
  {
    kind: "opportunity",
    label: opportunityCategories.APPRENTICESHIP.label,
    href: opportunityHref("APPRENTICESHIP"),
    category: opportunityCategories.APPRENTICESHIP,
  },
  {
    kind: "opportunity",
    label: opportunityCategories.CALL_FOR_APPLICATIONS.label,
    href: opportunityHref("CALL_FOR_APPLICATIONS"),
    category: opportunityCategories.CALL_FOR_APPLICATIONS,
  },
  {
    kind: "content",
    label: contentCategories.CAREER_DEVELOPMENT.label,
    href: contentHref("CAREER_DEVELOPMENT"),
    category: contentCategories.CAREER_DEVELOPMENT,
  },
  {
    kind: "opportunity",
    label: opportunityCategories.FUNDING.label,
    href: opportunityHref("FUNDING"),
    category: opportunityCategories.FUNDING,
  },
  {
    kind: "opportunity",
    label: opportunityCategories.GRADUATE_PROGRAMME.label,
    href: opportunityHref("GRADUATE_PROGRAMME"),
    category: opportunityCategories.GRADUATE_PROGRAMME,
  },
  {
    kind: "content",
    label: contentCategories.HOW_TO.label,
    href: contentHref("HOW_TO"),
    category: contentCategories.HOW_TO,
  },
  {
    kind: "opportunity",
    label: opportunityCategories.INTERNSHIP.label,
    href: opportunityHref("INTERNSHIP"),
    category: opportunityCategories.INTERNSHIP,
  },
  {
    kind: "opportunity",
    label: opportunityCategories.LEARNERSHIP.label,
    href: opportunityHref("LEARNERSHIP"),
    category: opportunityCategories.LEARNERSHIP,
  },
  { kind: "courses", label: "Online Courses", href: "/courses" },
  {
    kind: "opportunity",
    label: opportunityCategories.JOB.label,
    href: opportunityHref("JOB"),
    category: opportunityCategories.JOB,
  },
];
