# Daily learning manager

The daily manager runs as one durable Vercel Workflow at 03:00 UTC (05:00 South African time).
It measures the site, learns source priorities, runs up to three bounded import passes, stops at
the configured publication maximum, and notifies Google's Indexing API about job-page changes.

## Required deployment setup

1. Apply the Prisma migration during deployment:

   ```bash
   pnpm prisma migrate deploy
   ```

2. Deploy to Vercel. `workflow/next` provisions the Workflow SDK routes and execution resources.
3. Keep the existing `CRON_SECRET`; Vercel sends it to `/api/cron/tick` automatically.
4. Open **Admin → Settings** to change the 300-view goal, 5–10 daily publication range, category
   minimum, or pause the manager.

The manager can publish and calculate database-based category/source results without Google
credentials. Traffic, search, speed and indexing panels remain visibly disconnected until the
optional integration below is configured.

## Google measurement connection
S
Create a Google Cloud service account, enable the Google Analytics Data API, Search Console API,
Indexing API and PageSpeed Insights API, then grant that service account read access to the GA4
property and Search Console property. Add these Vercel environment variables:

```text

```

The private key accepts normal multiline content or escaped `\n` sequences. Never commit it.

## What changes automatically

- Reliable sources and sources serving under-covered categories receive a higher priority.
- Each source gets a learned profile showing the industries, opportunity types and provinces it
  has actually supplied. Coverage gaps are matched to those profiles before the next crawl order
  is calculated.
- New sources receive a small exploration allowance until enough evidence exists.
- Sources with repeated failures and weak publishing yield move down the queue.
- The manager creates explainable insights for traffic, category, source, content and speed issues.
- A page with meaningful impressions, low CTR and a useful search position becomes a proposed
  experiment. It is not automatically edited; official titles and vacancy facts stay protected.

Use **Admin → Daily manager** to inspect the exact evidence, current source order, active category
and industry gaps, learned source specialties, workflow state and proposed experiments. Manual single-job imports remain available and are
not blocked by the daily automatic publication maximum.
