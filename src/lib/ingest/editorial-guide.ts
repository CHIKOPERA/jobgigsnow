/** Shared editorial policy for automatic imports, manual AI rewrites, and the creation checklist. */
export const JOBGIGSNOW_EDITORIAL_GUIDE = `Write a complete, publication-ready JobGigsNow opportunity guide from the authoritative information provided.

PURPOSE
Do more than paraphrase the vacancy. Help an ordinary job seeker decide whether the opportunity fits them, understand the requirements, prepare a stronger application, and apply correctly. Add practical interpretation and guidance while keeping official facts separate from editorial advice.

NON-NEGOTIABLE FACT RULES
- Treat the official vacancy information as the only source of facts.
- Never invent or estimate salary, stipend, funding, benefits, eligibility, experience, qualifications, nationality rules, deadlines, application documents, hiring stages, applicant numbers, acceptance rates, selection chances, or job guarantees.
- When an important detail is absent, say once that the organization has not specified it. Do not repeat missing-information statements merely to fill sections.
- Use cautious language such as "may", "could", or "is likely to" for reasonable career interpretation. Label advice and assessments as "JobGigsNow guidance" where a reader could mistake them for an official claim.
- Preserve the exact official job or opportunity title. Do not add a colon or marketing language to it.
- Direct readers to the official application URL. Include no link that is absent from the authoritative input.

USEFUL STRUCTURE
Use only the sections that are relevant and supported. Omit empty or repetitive sections.
1. Introduction — immediately explain what the opportunity is, who it is for, why it may matter, and what the reader will learn.
2. Opportunity overview — summarize the organization, location, opportunity type, contract or work arrangement, level, deadline, compensation and eligibility when known. Use a concise list rather than a table.
3. Why this opportunity may matter — explain skills, experience, exposure and likely career value based on the stated work. Avoid prestige claims.
4. Who should consider applying — connect stated requirements and duties to likely academic backgrounds, career stages, skills and interests without implying acceptance.
5. Requirements explained — translate education, experience, language, nationality, residence and other restrictions into plain language. Make location or nationality restrictions especially clear.
6. Salary, funding and benefits — state only confirmed amounts and benefits. Never call something fully funded unless every relevant cost is confirmed as covered.
7. What the applicant will actually do — turn formal responsibilities into understandable day-to-day work without adding duties.
8. JobGigsNow application guidance — give specific CV, cover-letter, portfolio, project or interview preparation advice derived from the vacancy. Suggest evidence applicants can use; do not present suggestions as official requirements.
9. Documents and mistakes to check — distinguish officially required documents from sensible preparation, and highlight opportunity-specific mistakes to avoid.
10. How to apply — explain the confirmed steps in order and point to the official application page.
11. Deadline — make the exact date, time and time zone prominent when supplied. Never infer them.
12. What happens next — include only officially stated assessment, interview or communication steps.
13. Frequently asked questions — include only useful questions that can be answered from confirmed information or clearly labelled guidance.
14. JobGigsNow verdict — briefly state who should seriously consider applying, the strongest practical advantage, and the main limitation or eligibility check. Do not promise outcomes.

ORIGINAL VALUE
Where the source supports it, add at least three useful forms of value: requirement interpretation, career-fit analysis, responsibility explanation, application strategy, document preparation, mistake prevention, or deadline planning. Advice must be specific to this opportunity rather than generic filler.

STYLE AND SEO
- Write in clear South African English for job seekers, students and graduates.
- Use short paragraphs, descriptive headings and useful bullet or numbered lists.
- Use the organization, role, location and opportunity type naturally. Avoid keyword stuffing and do not add a visible SEO-keyword dump.
- Avoid generic introductions, repetition, empty motivation, complicated language and copied corporate wording.
- Produce clean HTML using only paragraphs, h2/h3 headings, bullet or numbered lists, strong, em, blockquotes, and supported links.`;

export const JOB_CREATION_CHECKLIST = [
  "Preserve the official title and every confirmed fact.",
  "Explain who should apply and what the requirements mean.",
  "Translate responsibilities into understandable day-to-day work.",
  "Add opportunity-specific application advice and mistakes to avoid.",
  "Make the deadline and official application route easy to find.",
  "Never invent salary, benefits, eligibility, documents or hiring stages.",
] as const;
