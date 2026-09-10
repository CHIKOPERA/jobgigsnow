export const jobIndustryValues = [
  "TECHNOLOGY",
  "HEALTHCARE",
  "FINANCE",
  "ENGINEERING",
  "EDUCATION",
  "GOVERNMENT",
  "RETAIL",
  "CONSTRUCTION_PROPERTY",
  "MANUFACTURING",
  "TRANSPORT_LOGISTICS",
  "HOSPITALITY_TOURISM",
  "AGRICULTURE",
  "MEDIA_MARKETING",
  "LEGAL",
  "ENERGY_MINING",
  "SECURITY",
  "OTHER",
] as const;

export type JobIndustryValue = (typeof jobIndustryValues)[number];

export const jobIndustries: Record<JobIndustryValue, string> = {
  TECHNOLOGY: "IT & Technology",
  HEALTHCARE: "Healthcare",
  FINANCE: "Banking & Finance",
  ENGINEERING: "Engineering",
  EDUCATION: "Education",
  GOVERNMENT: "Government & Public Service",
  RETAIL: "Retail & Consumer",
  CONSTRUCTION_PROPERTY: "Construction & Property",
  MANUFACTURING: "Manufacturing",
  TRANSPORT_LOGISTICS: "Transport & Logistics",
  HOSPITALITY_TOURISM: "Hospitality & Tourism",
  AGRICULTURE: "Agriculture",
  MEDIA_MARKETING: "Media & Marketing",
  LEGAL: "Legal",
  ENERGY_MINING: "Energy & Mining",
  SECURITY: "Security",
  OTHER: "Other",
};

export const provinceValues = [
  "EASTERN_CAPE",
  "FREE_STATE",
  "GAUTENG",
  "KWAZULU_NATAL",
  "LIMPOPO",
  "MPUMALANGA",
  "NORTH_WEST",
  "NORTHERN_CAPE",
  "WESTERN_CAPE",
  "NATIONWIDE",
] as const;

export type ProvinceValue = (typeof provinceValues)[number];

export const provinces: Record<ProvinceValue, string> = {
  EASTERN_CAPE: "Eastern Cape",
  FREE_STATE: "Free State",
  GAUTENG: "Gauteng",
  KWAZULU_NATAL: "KwaZulu-Natal",
  LIMPOPO: "Limpopo",
  MPUMALANGA: "Mpumalanga",
  NORTH_WEST: "North West",
  NORTHERN_CAPE: "Northern Cape",
  WESTERN_CAPE: "Western Cape",
  NATIONWIDE: "Nationwide",
};

export const salaryFilter = {
  currency: "ZAR",
  minMonthly: 0,
  maxMonthly: 150_000,
  step: 5_000,
} as const;
