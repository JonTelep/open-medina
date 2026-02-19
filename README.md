# OpenMedina

Government transparency for Medina County, Ohio. Salaries, spending, meeting minutes, campaign finance, and state legislation -- all in one searchable tool.

Built by [Telep IO LLC](https://www.telep.io). Live at [openmedina.org](https://openmedina.org).

Built with Next.js 16, SQLite, Drizzle ORM, and Recharts.

## Features

- **People Directory** -- Search employees, officials, and vendors with entity resolution across data sources
- **Money Flow** -- Interactive spending charts by department, top vendors, and payment timelines
- **Weekly Docket** -- Browse commissioner-approved payment batches
- **Meeting Minutes** -- Searchable meeting text with automatic name extraction and highlighted mentions
- **Campaign Finance** -- Donation timelines, top donors, and per-campaign donor breakdowns
- **State Legislation** -- Track Ohio bills, see how Medina County's representatives vote, browse county resolutions

## Quick Start

```sh
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Container Deployment

Requires [Podman](https://podman.io).

```sh
make build     # Build the container image
make run       # Start the container (port 3000, mounts ./data for SQLite)
make clean     # Stop container and remove image
make rebuild   # clean + build + run in one step
```

Additional targets:

```sh
make logs      # Tail container logs
make seed      # Re-seed the database inside the container
make shell     # Open a shell inside the container
make stop      # Stop and remove the container (keep image)
```

The SQLite database is stored at `./data/accountability.db` and is bind-mounted into the container, so data persists across restarts.

## Project Structure

```
src/
  app/                  # Next.js App Router pages and API routes
    api/                #   REST endpoints (people, money, meetings, donations, legislation, search)
    people/             #   People directory + detail pages
    money/              #   Spending charts, department/vendor detail
    docket/             #   Weekly payment docket browser
    meetings/           #   Meeting minutes list + detail with highlights
    donations/          #   Campaign finance dashboard, campaign + donor pages
    legislation/        #   State bills, legislator profiles, county resolutions
    about/              #   About page
    search/             #   Full-text search across all data types
  db/
    schema.ts           #   Drizzle table definitions (18 tables + FTS5)
    queries/            #   Reusable query functions per domain
    migrate.ts          #   Migration runner
    seed.ts             #   Sample data seeder
  scrapers/
    scrape-salaries.ts  #   Salary data (web scrape + CSV import)
    scrape-docket.ts    #   Docket/vendor payments (CSV import)
    scrape-meetings.ts  #   Meeting minutes (CSV + PDF import)
    scrape-donations.ts #   Campaign donations (CSV import)
    scrape-legislation.ts # State bills via LegiScan API
    scrape-resolutions.ts # County resolutions from medinaco.org
    resolve-entities.ts #   Entity resolution across data sources
    run-all.ts          #   Orchestrator for all scrapers
    import-csv.ts       #   Generic CSV import router
    lib/                #   Shared scraper utilities (HTTP, CSV, PDF, logging)
  lib/
    constants.ts        #   Departments, honorifics, suffixes
    entity-resolution.ts#   Name matching engine
    extract-names.ts    #   Regex name extraction from text
    legiscan.ts         #   LegiScan API client
    name-utils.ts       #   Name parsing and normalization
  components/           #   Shared UI components
data/
  accountability.db     #   SQLite database (gitignored)
drizzle/
  migrations/           #   Generated SQL migrations
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server with Turbopack |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run db:migrate` | Run Drizzle migrations |
| `bun run db:seed` | Seed with sample data |
| `bun run scrape:salaries` | Scrape/import salary data |
| `bun run scrape:docket` | Import docket payment data |
| `bun run scrape:meetings` | Import meeting minutes |
| `bun run scrape:donations` | Import campaign donations |
| `bun run scrape:legislation` | Fetch state bills via LegiScan API |
| `bun run scrape:resolutions` | Scrape county resolutions from medinaco.org |
| `bun run scrape:all` | Run all scrapers + entity resolution |
| `bun run resolve` | Run entity resolution |
| `bun run import:csv` | Generic CSV import (`--type salary\|docket\|meeting\|donation`) |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `LEGISCAN_API_KEY` | No | LegiScan API key for state legislation tracking (free tier: 30K queries/month) |

## Importing Data

### CSV Import

```sh
bun run import:csv --type salary --file path/to/salaries.csv
bun run import:csv --type docket --file path/to/docket.csv
bun run import:csv --type meeting --file path/to/meetings.csv
bun run import:csv --type donation --file path/to/donations.csv
```

### PDF Import (Meetings)

```sh
bun run scrape:meetings --pdf path/to/minutes.pdf --date 2025-01-14 --title "Regular Session"
```

### Run All Scrapers

```sh
bun run scrape:all \
  --salaries-csv data/salaries.csv \
  --docket-csv data/docket.csv \
  --meetings-csv data/meetings.csv \
  --donations-csv data/donations.csv
```

## Tech Stack

- [Next.js 16](https://nextjs.org) -- App Router, TypeScript, Tailwind CSS v4
- [SQLite](https://sqlite.org) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team)
- [Recharts](https://recharts.org) -- Interactive charts
- [Cheerio](https://cheerio.js.org) -- HTML scraping
- [LegiScan](https://legiscan.com) -- State legislation API
