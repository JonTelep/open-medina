# ── Stage 1: Install dependencies ────────────────────────────────────
FROM node:22-slim AS deps

WORKDIR /app

COPY package.json bun.lockb* package-lock.json* ./
RUN npm install --production=false

# ── Stage 2: Build the application ──────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Drizzle migrations + build Next.js (standalone output)
RUN npx next build

# ── Stage 3: Production image ───────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# better-sqlite3 needs these at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy standalone server output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Drizzle migrations + seed/migration scripts needed at runtime
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/src/scrapers ./src/scrapers
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/package.json ./

# Install tsx for running migration/seed scripts, plus runtime deps
COPY --from=deps /app/node_modules ./node_modules

# Create data directory for SQLite (mountable volume)
RUN mkdir -p /app/data

# Entrypoint: run migrations then start the server
COPY <<'EOF' /app/entrypoint.sh
#!/bin/sh
set -e

echo "Running database migrations..."
npx tsx src/db/migrate.ts

# Seed only if the database is empty (no people rows)
ROW_COUNT=$(node -e "
  const Database = require('better-sqlite3');
  const db = new Database('/app/data/accountability.db');
  const row = db.prepare('SELECT count(*) as c FROM people').get();
  console.log(row.c);
  db.close();
" 2>/dev/null || echo "0")

if [ "$ROW_COUNT" = "0" ] && [ "${SEED_SAMPLE_DATA:-0}" = "1" ]; then
  echo "Empty database detected, seeding with sample data..."
  npx tsx src/db/seed.ts
fi

echo "Starting server on port ${PORT}..."
exec node server.js
EOF
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

CMD ["/app/entrypoint.sh"]
