import type { CreateSourceInput } from "@/lib/validation/source";

const successFactorsPagination = { nextPageSelector: "ul.pagination li.active + li a", maxPages: 50 };

const ccbaCategories = [
  "Cold_Drinks_Equipment/e60a2eab7b6642209ecf187bd1edaea6",
  "Commercial_%7C_Sales_and_Marketing/2d47ae68a819476f9b2d19b0ed01a678",
  "Finance_and_Procurement/3693d4ef43aa43938ae764f632d8ad34",
  "Information_Technology/7a1d05e8ae054574b06d2f11feb431dd",
  "Legal_and_Public_Affairs_%7C_Communication_and_Sustainability/ca88b6f7aa714a6987c1919788a0db9e",
  "Logistics/02d2160c109b4928b4c17929dbdc17fc",
  "Manufacturing/0eb4e7ad173f4a009ff9ca123b43bdef",
  "People_and_Culture_(HR)/98be1076d63b48da879be02e77307d36",
  "Strategy_and_Performance/49a4dc7df2ec4a9998d8f609f1da1a6a",
  "Graduates_%7C_Internships_%7C_Bursaries/c562012921784cff9deb9db48776c96f",
].map((path) => `https://ccba.erecruit.co/candidateapp/Jobs/Categories/${path}`);

const avbobPages = Array.from({ length: 10 }, (_, index) =>
  `https://avbobjobs.mcidirecthire.com/Vacancy/Vacancies?PageNumber=${index + 1}&GroupID=0`,
);

/** Curated public career feeds requested for the production source catalogue. */
export const careerSources: CreateSourceInput[] = [
  {
    name: "Sasol Careers",
    baseUrl: "https://jobs.sasol.com/search/?createNewAlert=false&q=&optionsFacetsDD_customfield4=&optionsFacetsDD_customfield2=&optionsFacetsDD_customfield3=",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "html",
      listingUrls: ["https://jobs.sasol.com/search/?createNewAlert=false&q=&optionsFacetsDD_customfield4=&optionsFacetsDD_customfield2=&optionsFacetsDD_customfield3="],
      linkSelector: "a.jobTitle-link",
      linkAttr: "href",
    },
  },
  {
    name: "Hollywoodbets Careers",
    baseUrl: "https://iagjme.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1005",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "oracle",
      host: "iagjme.fa.ocs.oraclecloud.com",
      siteNumber: "CX_1005",
      companyName: "Hollywoodbets",
      language: "en",
      pageSize: 100,
      maxPages: 10,
    },
  },
  {
    name: "Woodlands Dairy Careers",
    baseUrl: "https://woodlandsdairy.simplify.hr/",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "html",
      jsRendering: true,
      listingUrls: ["https://woodlandsdairy.simplify.hr/vacancy/vacancies?query=&displayOrder=4"],
      linkSelector: 'a[href^="/Vacancy/"]',
      linkAttr: "href",
    },
  },
  {
    name: "Pick n Pay Careers",
    baseUrl: "https://picknpay.wd3.myworkdayjobs.com/PNP_Careers",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "workday",
      host: "picknpay.wd3.myworkdayjobs.com",
      tenant: "picknpay",
      site: "PNP_Careers",
      pageSize: 20,
      maxPages: 10,
    },
  },
  {
    name: "Anglo American Careers",
    baseUrl: "https://www.angloamerican.com/careers/job-opportunities/apply",
    cadenceMinutes: 360,
    // Disabled: listing page returns HTTP 403 — site blocks automated access.
    enabled: false,
    crawlConfig: {
      provider: "html",
      listingUrls: ["https://www.angloamerican.com/careers/job-opportunities/apply"],
      linkSelector: 'a[href*="/careers/job-opportunities/apply/jobdetail?jobid="]',
      linkAttr: "href",
    },
  },
  {
    name: "FirstRand Careers",
    baseUrl: "https://firstrand.wd3.myworkdayjobs.com/FRB/",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "workday",
      host: "firstrand.wd3.myworkdayjobs.com",
      tenant: "firstrand",
      site: "FRB",
      pageSize: 20,
      maxPages: 10,
    },
  },
  {
    name: "Coca-Cola Beverages Africa Careers",
    baseUrl: "https://ccba.erecruit.co/candidateapp/jobs/browse",
    cadenceMinutes: 360,
    // Disabled: all /candidateapp/ paths are disallowed by robots.txt.
    enabled: false,
    crawlConfig: {
      provider: "html",
      listingUrls: ccbaCategories,
      linkSelector: "tr.item[onclick]",
      linkAttr: "onclick",
      linkRegex: "window\\.location=['\\\"]([^'\\\"]+)",
    },
  },
  {
    name: "Career Wise Bursary Adverts",
    baseUrl: "https://careerwise.co.za/bursary-adverts/",
    cadenceMinutes: 720,
    enabled: true,
    crawlConfig: {
      provider: "html",
      listingUrls: ["https://careerwise.co.za/bursary-adverts/"],
      linkSelector: 'a.elementor-button[href$=".pdf"]',
      linkAttr: "href",
    },
  },
  {
    name: "Implats Careers",
    baseUrl: "https://www.implats.co.za/careers-listings.php",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "html",
      // TODO: verify — this points to the investor-relations subdomain on a /test/ path, which
      // may be a staging environment. Check whether https://www.implats.co.za/careers-listings.php
      // uses the same .job-listing a[href] selector before switching.
      listingUrls: ["https://www.implats-ir.co.za/test/careers-listings.php"],
      linkSelector: ".job-listing a[href]",
      linkAttr: "href",
    },
  },
  {
    name: "Capitec Careers",
    baseUrl: "https://careers.capitecbank.co.za/search/",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "html",
      listingUrls: ["https://careers.capitecbank.co.za/search/"],
      linkSelector: "a.jobTitle-link",
      linkAttr: "href",
      pagination: successFactorsPagination,
    },
  },
  {
    name: "AVBOB Careers",
    baseUrl: "https://avbobjobs.mcidirecthire.com/",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "html",
      jsRendering: true,
      listingUrls: avbobPages,
      linkSelector: '.st-custom-button[data-network="facebook"][data-url]',
      linkAttr: "data-url",
    },
  },
  {
    name: "University of Cape Town Vacancies",
    baseUrl: "https://uct.ac.za/staff/general-vacancies",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "html",
      listingUrls: ["https://uct.ac.za/staff/general-vacancies"],
      linkSelector: 'td.views-field-field-vacancy-av a[title^="Download the advertisement"]',
      linkAttr: "href",
    },
  },
  {
    name: "Gauteng Provincial Government Jobs",
    baseUrl: "https://jobs.gauteng.gov.za/public/jobs.aspx",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "html",
      listingUrls: ["https://jobs.gauteng.gov.za/public/jobs.aspx"],
      linkSelector: 'a[href^="ViewJob.aspx?u="]',
      linkAttr: "href",
    },
  },
  {
    name: "Western Cape Government Opportunities",
    baseUrl: "https://www.westerncape.gov.za/jobs-bursaries-and-tenders",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "html",
      listingUrls: ["https://www.westerncape.gov.za/jobs-bursaries-and-tenders"],
      linkSelector: 'a[href*="candidateapp/Jobs/View/"]',
      linkAttr: "href",
    },
  },
  {
    name: "eThekwini Careers",
    baseUrl: "https://iabzbn.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "oracle",
      host: "iabzbn.fa.ocs.oraclecloud.com",
      siteNumber: "CX_1",
      companyName: "eThekwini Municipality",
      language: "en",
      pageSize: 100,
      maxPages: 10,
    },
  },
  {
    name: "Bidvest Facilities Management Careers",
    baseUrl: "https://bidvestfacilitiesmanagement.simplify.hr/",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "html",
      jsRendering: true,
      listingUrls: ["https://bidvestfacilitiesmanagement.simplify.hr/vacancy/vacancies?query=&displayOrder=0"],
      linkSelector: 'a[href^="/Vacancy/"]',
      linkAttr: "href",
    },
  },
  {
    name: "Eskom Careers",
    baseUrl: "https://eskomcareers.ci.hr/",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "html",
      listingUrls: ["https://eskomcareers.ci.hr/?controller=Listings&method=get&entity=listings&wrap=false&batch=1&batchsize=100&viewid=54e0dd96-197b-4502-b2d0-7afd6f1acd67"],
      linkSelector: '.view-data-row h5 a[href*="controller=Listings"][href*="method=view"][href*="listingid="]',
      linkAttr: "href",
    },
  },
  {
    name: "Transnet Careers",
    baseUrl: "https://transnettalentportal.csod.com/ux/ats/careersite/1/home?c=transnettalentportal",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "cornerstone",
      host: "transnettalentportal.csod.com",
      corp: "transnettalentportal",
      siteId: "1",
      companyName: "Transnet",
      pageSize: 100,
      maxPages: 10,
    },
  },
  {
    name: "City of Johannesburg Internships",
    baseUrl: "https://joburg.org.za/work_/Pages/2026-Vacancies/2026-Internships.aspx",
    cadenceMinutes: 720,
    enabled: true,
    crawlConfig: {
      provider: "html",
      listingUrls: ["https://joburg.org.za/work_/Pages/2026-Vacancies/2026-Internships.aspx"],
      linkSelector: '#DeltaPlaceHolderMain a[href*="/Documents/Vacancies-2026/"][href$=".pdf"]',
      linkAttr: "href",
    },
  },
  {
    name: "Mediclinic Southern Africa Careers",
    baseUrl: "https://careers.mediclinic.com/SouthernAfrica/go/Search-By-Keyword-MCSA/5071601/",
    cadenceMinutes: 360,
    enabled: true,
    crawlConfig: {
      provider: "html",
      listingUrls: ["https://careers.mediclinic.com/SouthernAfrica/go/Search-By-Keyword-MCSA/5071601/"],
      linkSelector: "a.jobTitle-link",
      linkAttr: "href",
      fetchTimeoutMs: 45_000,
      pagination: successFactorsPagination,
    },
  },
];
