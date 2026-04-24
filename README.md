# p4-spc — Performance4 SPC platform

Multi-tenant Statistical Process Control platforma postavená na AQDEF V6 datovém modelu.

Cílem je přijímat měřené hodnoty z různých zdrojů (manuální formuláře, desktop aplikace přes Custom URL Scheme, bulk API), transformovat je do kanonického AQDEF modelu, vyhodnocovat SPC (Nelson / Western Electric rules, Cp/Cpk/Pp/Ppk) a rozesílat notifikace na abnormality i procesní události (frekvence měření).

Architekturní plán: [`../.claude/plans/https-training-q-das-de-fileadmin-mediam-glowing-glacier.md`](./docs/ARCHITECTURE.md) (zkopírovat do `docs/ARCHITECTURE.md` dle potřeby).

## Předpoklady

- [Node.js 22 LTS](https://nodejs.org/) (viz `.nvmrc`)
- [pnpm 9+](https://pnpm.io/installation) — `npm i -g pnpm@9`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) pro lokální služby
- macOS / Linux / WSL2

## Rychlý start

```bash
# 1) Instalace závislostí
pnpm install

# 2) Nastavení env
cp .env.example .env

# 3) Spuštění lokálních služeb (Postgres, Redis, Mailhog)
pnpm services:up

# 4) Ověření, že služby běží
docker compose ps

# 5) Vývojový běh všech apps (až budou scaffoldnuty)
pnpm dev
```

Mailhog UI: <http://localhost:8025>
Postgres: `postgresql://p4spc:p4spc_dev@localhost:5433/p4spc_control`
Redis: `localhost:6379`

## Struktura monorepa

```
p4-spc/
├── apps/
│   ├── api/              # NestJS backend (REST + event emitters)
│   ├── web/              # React frontend (Vite)
│   ├── worker/           # BullMQ workers (SPC evaluace, notifikace)
│   └── admin-web/        # Vendor-only admin (nebo route ve web)
├── packages/
│   ├── aqdef-core/       # Kanonický AQDEF model, DFQ/DFX parser a serializer
│   ├── spc-engine/       # Nelson / WE pravidla, capability indexy
│   ├── config-sdk/       # TenantConfig typy, sandbox runner (isolated-vm)
│   ├── db-control-plane/ # Prisma schema pro sdílenou control-plane DB
│   ├── db-data-plane/    # Prisma schema pro per-tenant DB
│   ├── shared-types/     # DTO, events
│   └── ui-kit/           # Sdílené React komponenty
├── infra/                # Terraform (Azure resources)
├── docker/               # Dev seed skripty pro Postgres
└── docs/                 # ADR, runbooks, AZURE_SETUP.md
```

## Skripty

| Příkaz | Účel |
|---|---|
| `pnpm build` | Build všech balíčků (Turborepo cache) |
| `pnpm dev` | Dev watch mode pro všechny apps |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript typecheck |
| `pnpm test` | Testy |
| `pnpm services:up` | Spustit lokální Postgres / Redis / Mailhog |
| `pnpm services:down` | Zastavit lokální služby (data zůstávají) |
| `pnpm services:reset` | Zastavit + smazat volumes (ČISTÝ RESET) |

## Cloud setup

Viz [`docs/AZURE_SETUP.md`](./docs/AZURE_SETUP.md) — step-by-step zřízení Azure subscription, OIDC federace pro GitHub Actions, první nasazení přes Terraform.

## Roadmapa (high-level)

**MVP (fáze 1):** control-plane + auth, kanonický AQDEF model + katalogy, ingest REST, dynamické formuláře, SPC engine (I-MR + X-bar/R, Nelson 1–4, Cp/Cpk/Pp/Ppk), email notifikace, desktop CUS integrace.

**Fáze 2:** atributivní charty, kompletní Nelson + Western Electric, měřicí plány, DFQ/DFX export, další notifikační kanály, Keycloak jako IdP volba.

**Fáze 3:** OPC UA / MQTT, MES/ERP integrace, pokročilý SPC (multivariate, EWMA, CUSUM).

## Licence

Proprietární, Performance4 s.r.o.
